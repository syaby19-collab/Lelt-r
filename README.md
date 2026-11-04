# Bolti leltár — egyszerű, Python nélküli változat

## Letöltés és indítás Windows 10-en

1. A GitHubon kattints a **Code → Download ZIP** gombra, majd a ZIP-en jobb kattintás → **Az összes kibontása**.
2. A kibontott mappában kattints duplán a **Leltar.html** fájlra. Chrome vagy Edge böngészőben nyisd meg. Nem kell Python, parancsablak vagy helyi webszerver.
3. Kattints a vonalkódmezőbe és csippants. Enter nélkül is ment, ha fél másodpercig nem érkezik új karakter. A következő beolvasás előtt várd meg a „Mentve” jelzést. Enteres olvasó is működik, dupla számolás nélkül.
4. Az azonos vonalkódok egy sorban jelennek meg, minden csippantás +1 darab. A nevet és mennyiséget a sor Mentés gombjával javíthatod. Kézi gépeléshez kapcsold ki az automatikus mentést.
5. A sor végén az **EAN Search** link a vonalkóddal keres új lapon. A terméknevet kézzel másold vissza; automatikus adatletöltés nincs.

## Adatok és biztonsági mentés

Az automatikus mentés a böngésző helyi tárolóját használja. Mindig ugyanazt a fájlt, ugyanarról a helyről, ugyanabban a normál (nem inkognitó) böngészőben nyisd meg. Ne töröld a böngésző adatait. A helyi fájlok tárolási viselkedése böngészőfüggő: az adatmegőrzéshez az első próba után zárd be és nyisd újra ugyanazt a fájlt. A fájl átnevezése, áthelyezése vagy egy másik böngésző új tárolóhoz vezethet.

**Nap végén tölts le JSON-biztonsági mentést a Biztonsági mentés gombbal**, és tarts külön másolatot. A HTML-fájl önmagában nem tartalmazza a készletedet! A JSON a visszatöltéshez kell; a CSV az Excelhez. CSV-import nincs. Excelben a vonalkód oszlopot szövegként importáld, hogy a kezdő nullák megmaradjanak.

A „Biztonsági mentés visszatöltése” részben a korábbi JSON-mentés kiválasztható. A visszatöltés a fájlban szereplő mennyiségeket állítja be, nem adja hozzá őket a meglévőkhöz; a többi sor megmarad. Előtte készíts mentést az aktuális állapotról. Egy böngészőablakot használj a leltározáshoz.

A korábbi Pythonos változat `data` mappáját őrizd meg. Az új HTML-változat nem olvassa annak SQLite-adatbázisát, a korábbi adatok automatikusan nem kerülnek át. A Pythonos változat fájljait a tárolóban megtartottuk.

## Fejlesztés és ellenőrzés

A `Leltar.html` önálló fájl, futtatásához nincs telepítési lépés vagy induló szolgáltatás. A meglévő checkoutot használd, külön Git worktree nem szükséges. A böngészős teszt fejlesztői környezetben Playwrightot és Chromiumot igényel: `node tests/test_standalone.js` (Chromium útvonalához `CHROMIUM_PATH` adható meg). A teszt ideiglenes böngészőprofilon fut; nem módosítja a valódi készletet.

Ellenőrzött: Enter nélküli beolvasás, összevonás, Enterrel dupla számolás elkerülése, név és mennyiség javítása, újratöltés utáni adatmegőrzés, EAN-keresőlink, JSON/CSV export, JSON-visszatöltés, hibás import és sikertelen tárolás kezelése. Chromiumon, Linuxon, ideiglenes helyi tesztkiszolgálóval ellenőrizve. A felhős böngésző házirendje tiltja a file: címeket, ezért a közvetlen helyi fájlmegnyitás és a Windowsos fizikai olvasós próba még helyben szükséges.

---

# Korábbi, Pythonos változat

Egygépes, magyar nyelvű alapváltozat. Minden beolvasás 1 darabbal növeli a vonalkódhoz tartozó mennyiséget. Az azonos kódok egy sorba kerülnek. A kezdő nullák megmaradnak. Terméknév és darabszám kézzel módosítható; CSV export rendelkezésre áll.

## Windows 10

Letöltés GitHubról: a tároló oldalán **Code → Download ZIP**, majd a letöltött ZIP-en jobb kattintás → **Az összes kibontása**. Ne a ZIP-en belül nyisd meg a programot. Frissítésnél állítsd le a régi programot, másold a programfájlokat a meglévő mappába, a `data` mappát őrizd meg, és újraindítás után a böngészőben nyomj Ctrl+F5-öt.

1. Telepíts Python 3.12-t a https://www.python.org/downloads/windows/ oldalról (a Windows telepítőt válaszd). Engedélyezd az „Add python.exe to PATH” lehetőséget. Nincs további csomagfüggőség.
2. Csomagold ki a programot egy írható mappába, például a Dokumentumok közé.
3. Kattints duplán az `Inditas.bat` fájlra. A program megnyílik az alapértelmezett böngészőben. A parancsablakot használat közben hagyd nyitva.
4. Kattints a vonalkód mezőbe, és olvass be. Enter nélkül is ment: a beírás végétől fél másodperc után automatikusan hozzáad 1 darabot, kiüríti a mezőt és várja a következő kódot. Várd meg a „Mentve” visszajelzést a következő csippantás előtt. Az Enter/CR lezárású olvasók is használhatók. Kézi gépeléshez kapcsold ki az „Automatikus mentés” jelölést, és Enterrel vagy a „+ 1 darab” gombbal ments.
5. Minden fizikai darabot egyszer olvass be. Három azonos termék három csippantás után egy sorban, 3 darabbal szerepel. Téves beolvasásnál javítsd a mennyiséget, majd nyomj Mentést.

Leállítás: a parancsablakban Ctrl+C. Újraindításkor a korábbi készlet folytatódik; nem indul új leltár. Mentés helye: `data/leltar.sqlite3`. Biztonsági másolathoz állítsd le a programot, majd másold a teljes `data` mappát külön meghajtóra. A CSV export nem visszaállítható adatbázismentés. Excelben az Adatok → Szövegből/CSV importálással a vonalkód oszlopot **szövegként** töltsd be, így megmaradnak a kezdő nullák.

## Termékkeresés az EAN Search oldalon

Az alapértelmezett külső kereső a https://www.ean-search.org/. Minden terméksor végén az „EAN Search ↗” link a sor vonalkódjával nyit keresést új böngészőlapon. Példa: https://www.ean-search.org/?q=3165143609255. Ez a keresés nem változtat a készleten. A találatból a terméknevet másold a névmezőbe, majd nyomj Mentést. A kereső használatához internet kell; az oldal hozzáférési és használati feltételei érvényesek. A program nem nyit új lapot automatikusan minden csippantásra.

Ez a változat nem tölti le automatikusan a külső találatokat, nem importál számlát, nem kezeli az eladásokat, és nem egyesít különböző vonalkódokat. A leltár csak a saját gépen érhető el; a helyi készlet rögzítéséhez nem kell internet. A Windowsos indítót és a fizikai olvasót ezen a Linux fejlesztőkörnyezeten nem lehet ténylegesen kipróbálni.

## Fejlesztés

Python 3.12+, külső függőségek nélkül. Az adott feladat meglévő checkoutját használd; külön Git worktree nem szükséges.

```sh
python3 -m unittest discover -s tests -v
python3 app.py --no-browser
```

A `--port` kapcsolóval másik helyi port választható. Tesztadatbázishoz: `LELTAR_DB=/tmp/proba.sqlite3 python3 app.py --no-browser` (Linux). A készletet az első tényleges leltár előtt csak üres vagy megfelelő saját adatbázissal kezdd el rögzíteni.
