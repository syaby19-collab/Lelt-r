import concurrent.futures
import tempfile
import unittest
from pathlib import Path
import app


class InventoryTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.previous = app.DB
        app.DB = Path(self.tmp.name) / 'inventory.sqlite3'
        app.connect().close()

    def tearDown(self):
        app.DB = self.previous
        self.tmp.cleanup()

    def test_identical_scans_merge_and_leading_zero_survives(self):
        for _ in range(3):
            app.update({'barcode': '001234'}, scan=True)
        app.update({'barcode': '987654'}, scan=True)
        self.assertEqual(app.products(), [dict(barcode='001234', name='', quantity=3), dict(barcode='987654', name='', quantity=1)])

    def test_parallel_scans_do_not_lose_counts(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
            list(pool.map(lambda _: app.update({'barcode': '001'}, scan=True), range(25)))
        self.assertEqual(app.products()[0]['quantity'], 25)

    def test_correction_persists_and_scan_preserves_name(self):
        app.update({'barcode': '001'}, scan=True)
        app.update({'barcode': '001', 'name': 'Olajszűrő', 'quantity': 8})
        result = app.update({'barcode': '001'}, scan=True)
        self.assertEqual(result, dict(barcode='001', name='Olajszűrő', quantity=9))
        self.assertEqual(app.products(), [result])

    def test_invalid_inputs_do_not_change_stock(self):
        app.update({'barcode': '001'}, scan=True)
        for quantity in [-1, 1.5, True, '2']:
            with self.assertRaises(ValueError):
                app.update({'barcode': '001', 'quantity': quantity})
        with self.assertRaises(ValueError):
            app.update({'barcode': ''}, scan=True)
        self.assertEqual(app.products()[0]['quantity'], 1)


if __name__ == '__main__':
    unittest.main()
