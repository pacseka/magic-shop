# Felhasználói útmutató – fejezetvázlat

Az útmutató elsődleges helye az alkalmazás **Kezelés → Útmutató** felülete. A Kezelés fejlécéből nyíló, teljes oldalas, kereshető nézet rövid, feladatorientált fejezeteket mutat. A tartalom az alkalmazásba van csomagolva, ezért a már betöltött alkalmazásban bejelentkezés és hálózat nélkül is olvasható. Ez a fájl a tartalom vázlata; a megjelenő teljes szöveg forrása a `src/guideContent.js`.

## 1. Kezdés egy új bolttal

- **Bolt létrehozása:** név, hely, tulajdonos, árszorzó és rövid leírás megadása; a kapcsolatok és kalandjegyzetek opcionálisak.
- **Bolt kiválasztása és szerkesztése:** váltás a boltok között, az adatok és a jegyzetek későbbi módosítása.
- **Mit jelent az üres kezdőállapot?** Új telepítéskor a saját tárgylista és a bolti készlet üres; tárgyat saját kezűleg, JSON-ből vagy bejelentkezés után az SRD alaplistából lehet átvenni.
- **Telepítés telefonra vagy tabletre:** HTTPS-címről Androidon Chrome menü, iPhone-on és iPaden Safari Megosztás → Hozzáadás a Főképernyőhöz; az első online betöltés után az app és az útmutató offline megnyitható.

## 2. Tárgyak előkészítése

- **Három külön szint:** az SRD alaplista másolható forrás; a saját tárgylista a szerkeszthető katalógus; minden bolt készlete önálló.
- **Tárgy létrehozása és szerkesztése:** típus, ritkaság, alapár, kép, leírás és hatás. A ritkaság ajánlott árat ad, amely módosítható; az artefaktum alapból felbecsülhetetlen.
- **Tárgy boltba helyezése:** a saját listából bármelyik boltba felvehető. A boltban létrehozott tárgy a saját listába is bekerül.
- **Átvétel az SRD alaplistából:** csak bejelentkezve érhető el. Az átvett példány egyszeri, független másolat; nem kerül automatikusan bolti készletbe.
- **Tárgyak JSON-importja:** fájl vagy beillesztett szöveg ellenőrzése, érvényes és ismétlődő tételek áttekintése, majd importálás. Ez a saját listát bővíti, bolti készletet nem módosít.

## 3. Eladás játék közben

- **Tárgy keresése és kiválasztása:** keresés a bolti készletben, részletek megnyitása; a rögzített alsó sávban a tárgynév a leírást és a hatást is megmutatja.
- **Eladás rögzítése:** darabszám és alkalmi eladási ár beállítása az alsó sávban, majd eladás. A készlet csökken, az esemény bekerül a bolt naplójába.
- **Melyik ár mit változtat?** A saját listában lévő alapárra a bolt árszorzója hat. A tárgy bolti árát a részleteknél külön lehet menteni, csak az adott boltban. Az eladáskor átírt ár kizárólag arra az egy eladásra vonatkozik.
- **Gyors készletkorrekció:** a kiválasztott tárgy készletszámából nyitható hozzáadás vagy levonás, opcionális megjegyzéssel.

## 4. A bolt készletének kezelése

- **Véletlen készlet:** környék, boltméret, ritkasághatár és profil beállítása, sorsolás, előnézet, majd hozzáadás a meglévő készlethez.
- **Tárgy eltávolítása egy boltból:** a részleteknél megerősített eltávolítás csak annak a boltnak a készletét érinti. A saját tárgylista és más boltok készlete megmarad.
- **Eladásnapló és visszavonás:** eladások, készletkorrekciók és eltávolítások áttekintése; a legutóbbi visszavonható készletművelet visszaállítása.
- **Bolt törlése:** a megerősítésben ellenőrizni kell az érintett boltot, készletet és naplót. A saját tárgylista és a többi bolt megmarad.

## 5. Helyi adatok, felhő és mentés

- **Aktív adatforrás felismerése:** kijelentkezve a külön helyi adatok, bejelentkezve az adott fiók felhőadatai aktívak. A bejelentkezés nem másolja át magától a helyi készletet.
- **Kapcsolat nélkül:** a bejelentkezett fiók saját offline másolatával lehet folytatni a munkát; a függő változások visszakapcsolódáskor feltöltődnek. Ha nincs ilyen másolat, a helyi adatok nem jelennek meg a felhőadatok helyén.
- **Kézi másolás a két adatkészlet között:** a felhő helyire másolása és a helyi felhőbe feltöltése mindig a teljes céladatkészletet cseréli le. Megerősítés szükséges, az előző célváltozatról visszaállítható mentés készül.
- **JSON-export:** az éppen aktív boltok és a saját tárgylista mentése. Az SRD alaplista nem része az exportnak.
- **Kijelentkezés:** visszatérés a külön helyi adatokhoz automatikus másolás nélkül.

## 6. Gyors válaszok

- Miért üres a bolt vagy a tárgylista bejelentkezés után?
- Miért nem változott a bolti ár az eladáskor megadott összegtől?
- Hová került az SRD alaplistából átvett tárgy?
- Hogyan állítható vissza egy téves készletművelet vagy adatmásolás?
- Mi a teendő, ha a felhőadatok nem tölthetők be?

## Tulajdonosi kiegészítés

Az SRD alaplista feltöltése és kezelése az alkalmazásbeli útmutató utolsó, tulajdonosoknak szóló fejezete, így nem terheli az általános útmutató első lépéseit. A Firebase és GitHub Pages technikai beállításai maradnak a repository külön dokumentumaiban.

## Helyi magyarázatok az alkalmazásban

- A bolti ár mező mellett: a mentett bolti ár csak az aktuális bolt tárgyára hat; az eladási sáv ára egyetlen eladásra szól.
- A helyi/felhő másolás megerősítésénél: pontosan melyik teljes adatkészlet íródik felül, melyik marad aktív, és hol érhető el a mentés.
- A tárgyimport és az SRD-másolás mellett: a saját listába kerülő tárgyak nem kerülnek automatikusan egyik bolt készletébe sem.
