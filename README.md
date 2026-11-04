# Bolti leltár — egyszerű, Python nélküli változat

## Letöltés és indítás Windows 10-en

1. A GitHubon kattints a **Code → Download ZIP** gombra, majd a ZIP-en jobb kattintás → **Az összes kibontása**.
2. A kibontott mappában kattints duplán a **Leltar.html** fájlra. Chrome vagy Edge böngészőben nyisd meg. Nem kell Python, parancsablak vagy helyi webszerver.
3. A **Bolt polctérképe** rajzon kattints a kívánt polcra, vagy a **Válassz helyet a bolt polclistájából** mezőben válassz helyet: ez azonnal aktiválja a helyet és a vonalkódmezőbe lép. Egyéni névhez töltsd ki az alatta lévő mezőt, majd kattints a **Polchely használata** gombra. Ezután kattints a vonalkódmezőbe és csippants. Enter nélkül is ment, ha fél másodpercig nem érkezik új karakter. A következő beolvasás előtt várd meg a „Mentve” jelzést. Enteres olvasó is működik, dupla számolás nélkül.
4. Az azonos vonalkódok **ugyanazon a polcon** egy sorban jelennek meg, minden csippantás +1 darab. Másik polcon külön sor keletkezik. A nevet, polchelyet és mennyiséget a sor Mentés gombjával javíthatod. Kézi gépeléshez kapcsold ki az automatikus mentést.
5. A sor végén az **EAN Search** link a vonalkóddal keres új lapon. A terméknevet kézzel is visszamásolhatod; az opcionális automatikus névlekérés beállítását alább találod.

## Polchelyek és leltározás

A frissített változat tetején **AUTÓSBOLT · POLCTÉRKÉPES VÁLTOZAT** felirat és a **Bolt polctérképe** rajz látható. A rajz a feltöltött bolti elrendezést követő vázlat, nem méretarányos építészeti terv. A bal/jobb oldali polcok, pultok, a 01–16 középső állványok és a hátsó raktárrész a rajzon kattinthatók; a további helyek jobb oldali gombokként jelennek meg. Kattintáskor a polc zöldre vált, a beolvasómező fókuszt kap. A térkép kis számai az adott helyen rögzített összes darabot mutatják. Billentyűzettel Tab és Enter/Space is használható. Ha már van beírt, még nem mentett vonalkód, a helyváltás nem történik meg: előbb mentsd vagy töröld a kódot. Keskeny kijelzőn a rajz oldalra görgethető.

Minden megnyitáskor válassz polchelyet, utána kezdj csippantani. A bolt feltöltött elrendezéséből előre bekerültek a polcnevek a csoportos választóba: bal oldali polcok, pultok, jobb oldali polcok, középső számozott állványok, hátsó rész és raktár, további tárolóhelyek. Példák: **bf polc 01**, **jf polc 02**, **h rakt 01**, **motul**, **visszáru**, valamint **01–16**. A kezdő nullák megmaradnak. A listából választva azonnal lehet csippantani. A névlista üres készlet mellett is rendelkezésre áll; a polcok előzetes felvétele nem hoz létre termékeket vagy mennyiségeket. Egyéni polchely továbbra is megadható. A program szándékosan nem választja ki automatikusan az előző helyet. Az aktív polchely neve a beolvasómező felett látható; minden további csippantás ehhez ad 1 darabot. Az előre felvett polcok, a korábban használt egyéni polcok és az aktív új hely a választóból, illetve a névmezőben felajánlott listából is elérhetők. A polchelyszűrőben üres, előre felvett hely is kiválasztható. Új polc nevét egyszerűen írd be. A kis- és nagybetű eltérése nem hoz létre új polcot, a szélső és ismételt szóközöket egységesítjük.

Példa: ugyanabból a vonalkódból A1-en három, B2-n két csippantás két sort eredményez, 3 és 2 darabbal. A fejléc 1 különböző vonalkódot és összesen 5 darabot mutat. A polchelyszűrő a látható sorokat szűri, a felső összesítés mindig az egész bolté. Szövegesen vonalkódra, névre és polchelyre is lehet keresni.

A polchely a sorban utólag javítható. Ha ugyanaz a vonalkód már szerepel a célpolcon, a program rákérdez a két sor mennyiségének összeadására. A terméknév kézi mentése az azonos vonalkód többi polchelyén is frissíti a nevet. Az API egyetlen kérésből kitölti ugyanazon vonalkód névtelen polchelyeit, a mennyiségekhez nem nyúl.

**Frissítés előtt készíts JSON-biztonsági mentést.** A korábbi HTML-verzió készlete és v1-es mentése továbbra is olvasható: a régi sorok „Nincs polchely” jelöléssel maradnak meg, mennyiségük nem változik. Ezeket a sor polchelymezőjével rendeld helyhez. Egy új polcon történő csippantás újabb darabot jelent, a régi polchely nélküli készletet nem osztja szét automatikusan. A régi leltározott darabokat ne csippantsd újra pusztán a polchely megadásához, mert az növelné a készletet.

Az új CSV a polchelyet is tartalmazza. A JSON-mentés formátuma v2-es: a vonalkód és polchely együtt azonosítja a sort. Visszatöltéskor csak az azonos vonalkódú **és** polchelyű sor értékei cserélődnek, a többi sor megmarad. Ugyanazon mentés ismételt visszatöltése nem duplázza a mennyiségeket. A v2-es mentéshez ezt az új programverziót használd; a régi program nem kezeli a több polchelyes adatokat.

Böngészős regressziós teszt: `node tests/test_shelves.js`. Ellenőrzi a látható alaprajzot, a polcgombok teljességét, az átfedésmentes polcpozíciókat, a rajzról választás utáni számlálást és a billentyűzetes használatot, továbbá a régi adatok megőrzését, a kötelező polcválasztást, az azonos kód több polcon való számolását, a szűrést, a polcok közötti áthelyezést/összevonást és a régi/új mentések visszatöltését.

## Automatikus terméknév az EAN Search API-val

A `Leltar.html` **Automatikus terméknév — EAN Search API** részét nyisd le. Írd be a saját Premium-fiókod API-kulcsát, majd kattints a **Névlekérés bekapcsolása** gombra. A kulcsmező ezután kiürül; a kulcs csak a lap memóriájában marad. Újratöltés vagy bezárás után ismét meg kell adni. Ne küldj kulcsot chatben vagy képernyőképen, és ne írd a forráskódba. A korábban megosztott kulcsot a szolgáltatónál cseréld le.

Bekapcsolva a program az újonnan beolvasott, név nélküli 12/13 jegyű kódokat sorban lekérdezi. A korábban felvitt névtelen termékekhez használd a **Hiányzó nevek lekérése** gombot. Minden ilyen kérés fogyaszthatja az előfizetési keretet. A már tárolt neveket nem írjuk felül, ugyanarra a folyamatban lévő kódra nem indítunk több kérést, és másodpercenként legfeljebb egy kérést küldünk. A sikertelen vagy nem található termék kézzel elnevezhető; egy új beolvasás vagy a hiányzó nevek gomb újra megpróbálhatja a keresést. Az API-hívások nem módosítják a darabszámot. Kézzel már elmentett név elsőbbséget élvez a később érkező válasszal szemben.

A név az **EAN Search adatbázisából** származik, nem az Autodoc oldaláról. Magyar nevet kérünk (`language=7`), de a szolgáltató más nyelvet is visszaadhat; találat nem garantált. Csak HTTPS-en, közvetlenül az `api.ean-search.org` szolgáltatónak küldünk kulcsot, a dokumentáció szerinti `barcode-lookup` hívással. A kulcs nem kerül a böngészős készletmentésbe, a JSON-ba vagy a CSV-be. A „Kikapcsolás és kulcs törlése” gomb törli a lapban tartott példányt és leállítja a várakozó kéréseket. A már elküldött kérés a szolgáltatónál ettől még beleszámíthat a keretbe.

Internet, aktív előfizetési keret és a szolgáltató által engedélyezett böngészős hozzáférés szükséges. A helyi HTML-fájl eredete `null`; ha a szolgáltató ezt nem engedi CORS-szal, a böngésző nem tudja átvenni a választ. Nem használunk nyilvános proxyt, és nem kapcsoljuk ki a böngésző védelmét. Hálózati, formátum-, jogosultsági vagy kerethibánál az automatikus névlekérés megáll, de a leltározás működik tovább. A felület a hibát külön jelzi. A bekapcsolás önmagában nem igazolja a kulcs érvényességét, az első tényleges válasz ad visszajelzést.

**Ellenőrzés:** `node tests/test_ean_api.js` Playwright és Chromium mellett. A teszt csak mesterséges API-válaszokat és tesztkulcsot használ; nem fogyaszt előfizetési keretet. Ellenőrzött a névkitöltés, összevont beolvasás, másodpercenkénti korlát, titok kizárása a tárolóból/exportból, kézi névvel ütköző késői válasz, keret/jogosultság/hálózati hiba és utólagos kitöltés. **Élő API-kapcsolatot és a helyi Windows-fájlból engedélyezett CORS-hozzáférést itt nem tudtunk igazolni.** Ha a lekérés nálad hibát ír, a hiba szövegét küldd el, a kulcsot takard ki.

## Adatok és biztonsági mentés

Az automatikus mentés a böngésző helyi tárolóját használja. Mindig ugyanazt a fájlt, ugyanarról a helyről, ugyanabban a normál (nem inkognitó) böngészőben nyisd meg. Ne töröld a böngésző adatait. A helyi fájlok tárolási viselkedése böngészőfüggő: az adatmegőrzéshez az első próba után zárd be és nyisd újra ugyanazt a fájlt. A fájl átnevezése, áthelyezése vagy egy másik böngésző új tárolóhoz vezethet.

**Nap végén tölts le JSON-biztonsági mentést a Biztonsági mentés gombbal**, és tarts külön másolatot. A HTML-fájl önmagában nem tartalmazza a készletedet! A JSON a visszatöltéshez kell; a CSV az Excelhez. CSV-import nincs. Excelben a vonalkód oszlopot szövegként importáld, hogy a kezdő nullák megmaradjanak.

A „Biztonsági mentés visszatöltése” részben a korábbi JSON-mentés kiválasztható. A visszatöltés a fájlban szereplő mennyiségeket állítja be az azonos vonalkódú és polchelyű sorokhoz, nem adja hozzá őket a meglévőkhöz; a többi sor megmarad. Előtte készíts mentést az aktuális állapotról. Egy böngészőablakot használj a leltározáshoz.

A korábbi Pythonos változat `data` mappáját őrizd meg. Az önálló, dupla kattintással megnyitott HTML-fájl nem fér hozzá a régi SQLite-adatbázishoz. A frissített Pythonos indító által megnyitott új felület viszont az első használatkor átveszi a régi termékeket, ha ezen a böngészőcímen még nincs elmentett modern készlet. A régi SQLite-fájlt nem módosítja. Meglévő böngészős készletet nem ír felül; a polchely nélküli régi készlet másolata az eredeti adatbázisban megmarad. Az új műveletek a böngésző helyi tárolójába kerülnek, ezért ezekhez a `data` mappa másolása helyett a felület **Biztonsági mentés** gombját használd. Az önálló `file:` és a Pythonos `http:` megnyitás külön böngészős tároló: a JSON-mentéssel vihető át közöttük a készlet.

## Fejlesztés és ellenőrzés

A `Leltar.html` önálló fájl, futtatásához nincs telepítési lépés vagy induló szolgáltatás. A meglévő checkoutot használd, külön Git worktree nem szükséges. A böngészős teszt fejlesztői környezetben Playwrightot és Chromiumot igényel: `node tests/test_standalone.js` (Chromium útvonalához `CHROMIUM_PATH` adható meg). A teszt ideiglenes böngészőprofilon fut; nem módosítja a valódi készletet.

Ellenőrzött: Enter nélküli beolvasás, összevonás, Enterrel dupla számolás elkerülése, név és mennyiség javítása, újratöltés utáni adatmegőrzés, EAN-keresőlink, JSON/CSV export, JSON-visszatöltés, hibás import és sikertelen tárolás kezelése. Chromiumon, Linuxon, ideiglenes helyi tesztkiszolgálóval ellenőrizve. A felhős böngésző házirendje tiltja a file: címeket, ezért a közvetlen helyi fájlmegnyitás és a Windowsos fizikai olvasós próba még helyben szükséges.

---

# Indítás az Inditas.bat fájllal (Python-kompatibilitás)

Az `Inditas.bat` most ugyanazt a **polctérképes felületet** nyitja meg, mint a `Leltar.html`. Az elavult `static/index.html` felületet a Python-kiszolgáló már nem szolgálja ki a kezdőlapon. A régi SQLite API-t a korábbi készlet megőrzéséhez és ellenőrzéséhez megtartottuk; az új felület készlete a böngészőben tárolódik.

## Frissítés a régi indítóról

1. A régi felületből készíts CSV-exportot, és másold el a `data` mappát.
2. Zárd be a régi program fekete parancsablakát és a régi böngészőlapot.
3. A legfrissebb ZIP **összes programfájlját** másold a régi program mappájába, felülírva az `app.py`, `Leltar.html` és `Inditas.bat` fájlokat. A `data` mappát ne töröld.
4. Az új `Inditas.bat` fájlt indítsd el. A fekete ablakban „Polcterkepes valtozat inditasa...” látható. A böngészőben nyomj Ctrl+F5-öt: felül a „Bolt polctérképe” rajznak kell megjelennie.
5. Első használatkor az eddigi adatbázis tartalma polchely nélkül automatikusan átkerül, ha még nincs elmentett új készlet ezen a címen. Ezekhez a régi sorokhoz utólag add meg a polchelyet; ugyanazokat a darabokat ne csippantsd újra. Készíts JSON-mentést az új felületen.

A Pythonos HTTP-belépési pontot is ellenőrző böngészős teszt: `node tests/test_python_launcher.js`. Ideiglenes SQLite-adatbázissal ellenőrzi a térkép megjelenését, a régi készlet egyszeri átvételét, a csippantást, a régi adatbázis sértetlenségét és a már létező böngészős készlet megőrzését.

## Windows 10

Letöltés GitHubról: a tároló oldalán **Code → Download ZIP**, majd a letöltött ZIP-en jobb kattintás → **Az összes kibontása**. Ne a ZIP-en belül nyisd meg a programot. Frissítésnél állítsd le a régi programot, másold a programfájlokat a meglévő mappába, a `data` mappát őrizd meg, és újraindítás után a böngészőben nyomj Ctrl+F5-öt.

1. Telepíts Python 3.12-t a https://www.python.org/downloads/windows/ oldalról (a Windows telepítőt válaszd). Engedélyezd az „Add python.exe to PATH” lehetőséget. Nincs további csomagfüggőség.
2. Csomagold ki a programot egy írható mappába, például a Dokumentumok közé.
3. Kattints duplán az `Inditas.bat` fájlra. A program megnyílik az alapértelmezett böngészőben. A parancsablakot használat közben hagyd nyitva.
4. Kattints a vonalkód mezőbe, és olvass be. Enter nélkül is ment: a beírás végétől fél másodperc után automatikusan hozzáad 1 darabot, kiüríti a mezőt és várja a következő kódot. Várd meg a „Mentve” visszajelzést a következő csippantás előtt. Az Enter/CR lezárású olvasók is használhatók. Kézi gépeléshez kapcsold ki az „Automatikus mentés” jelölést, és Enterrel vagy a „+ 1 darab” gombbal ments.
5. A polctérképen először válassz helyet. Minden fizikai darabot egyszer olvass be. Három azonos termék három csippantás után egy sorban, 3 darabbal szerepel. Téves beolvasásnál javítsd a mennyiséget, majd nyomj Mentést.

Leállítás: a parancsablakban Ctrl+C. Újraindításkor a korábbi készlet folytatódik; nem indul új leltár. A régi készlet helye `data/leltar.sqlite3`; az új felületen végzett műveletek a böngészőbe kerülnek. A régi állapot megőrzéséhez a teljes `data` mappát másold, az új leltárhoz a felület **Biztonsági mentés** gombját használd. A CSV export nem visszaállítható adatbázismentés. Excelben az Adatok → Szövegből/CSV importálással a vonalkód oszlopot **szövegként** töltsd be, így megmaradnak a kezdő nullák.

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
