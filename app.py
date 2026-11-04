"""Helyi, egygépes vonalkódos leltár. Csak a Python alapkönyvtárát használja."""
import argparse
import csv
import io
import json
import os
from pathlib import Path
import sqlite3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import webbrowser

ROOT = Path(__file__).resolve().parent
DB = Path(os.environ.get('LELTAR_DB', ROOT / 'data' / 'leltar.sqlite3'))


def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB, timeout=20)
    db.row_factory = sqlite3.Row
    db.execute('CREATE TABLE IF NOT EXISTS products (barcode TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT \'\', quantity INTEGER NOT NULL CHECK(quantity >= 0))')
    return db


def products():
    with connect() as db:
        return [dict(row) for row in db.execute('SELECT * FROM products ORDER BY barcode')]


def inventory_page():
    """Both launch methods show the same UI; keep old SQLite stock recoverable."""
    page = (ROOT / 'Leltar.html').read_text(encoding='utf-8')
    # Names are user input; escape markup before embedding inert JSON in HTML.
    seed = json.dumps(products(), ensure_ascii=True).replace('<', r'\u003c').replace('&', r'\u0026')
    bridge = '<script id="legacyInventory" type="application/json">' + seed + '</script>'
    return page.replace('</main><script>', '</main>' + bridge + '<script>', 1).encode('utf-8')


def update(data, scan=False):
    barcode = data.get('barcode')
    if not isinstance(barcode, str) or not barcode.strip() or len(barcode.strip()) > 128 or any(ord(c) < 32 for c in barcode):
        raise ValueError('Érvényes vonalkód szükséges (legfeljebb 128 karakter).')
    barcode = barcode.strip()
    with connect() as db:
        if scan:
            db.execute('INSERT INTO products(barcode, quantity) VALUES (?, 1) ON CONFLICT(barcode) DO UPDATE SET quantity = quantity + 1', (barcode,))
        else:
            quantity, name = data.get('quantity'), data.get('name', '')
            if type(quantity) is not int or not 0 <= quantity <= 1000000000:
                raise ValueError('A mennyiség nemnegatív egész szám legyen.')
            if not isinstance(name, str) or len(name) > 300:
                raise ValueError('A név legfeljebb 300 karakter lehet.')
            cursor = db.execute('UPDATE products SET name=?, quantity=? WHERE barcode=?', (name.strip(), quantity, barcode))
            if not cursor.rowcount:
                raise ValueError('A termék nem található. Olvasd be először a vonalkódját.')
        return dict(db.execute('SELECT * FROM products WHERE barcode=?', (barcode,)).fetchone())


class Handler(BaseHTTPRequestHandler):
    def reply(self, content, mime='application/json; charset=utf-8', status=200):
        if not isinstance(content, bytes):
            content = json.dumps(content, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(content)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        if self.path == '/':
            self.reply(inventory_page(), 'text/html; charset=utf-8')
        elif self.path == '/api/products':
            self.reply(products())
        elif self.path == '/export.csv':
            output = io.StringIO(newline='')
            writer = csv.writer(output, delimiter=';')
            writer.writerow(['Vonalkód', 'Terméknév', 'Darabszám'])
            for row in products():
                # Szöveges mezők ne váljanak Excel-képletté.
                safe = lambda s: "'" + s if s.startswith(('=', '+', '-', '@', '\t', '\r')) else s
                writer.writerow([safe(row['barcode']), safe(row['name']), row['quantity']])
            self.reply(output.getvalue().encode('utf-8-sig'), 'text/csv; charset=utf-8')
        else:
            self.reply({'error': 'Nem található.'}, status=404)

    def do_POST(self):
        if self.path not in ('/api/scan', '/api/update'):
            return self.reply({'error': 'Nem található.'}, status=404)
        if self.headers.get('Content-Type') != 'application/json':
            return self.reply({'error': 'JSON szükséges.'}, status=415)
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + self.headers.get('Host', ''):
            return self.reply({'error': 'Tiltott eredet.'}, status=403)
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 8192:
                raise ValueError('Érvénytelen kérésméret.')
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError('Érvénytelen kérés.')
            self.reply(update(data, scan=self.path == '/api/scan'))
        except (ValueError, UnicodeError) as error:
            self.reply({'error': str(error)}, status=400)
        except sqlite3.Error:
            self.reply({'error': 'A mentés nem sikerült. Próbáld újra; ellenőrizd a szabad tárhelyet.'}, status=500)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    connect().close()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'Leltár elindult: http://127.0.0.1:{args.port} — leállítás: Ctrl+C', flush=True)
    if not args.no_browser:
        webbrowser.open(f'http://127.0.0.1:{args.port}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
