// Bundled with the app so the guide does not depend on a cloud account or a separate help site.
export const guideSections = [
  {
    id: 'kezdes',
    title: 'Kezdés egy új bolttal',
    summary: 'Hozz létre egy boltot, majd válaszd ki az első tárgyait.',
    topics: [
      {
        title: 'Az első bolt létrehozása',
        text: 'Egy új adatkészletben még nincs bolt vagy saját tárgy. A főképernyő Új bolt létrehozása gombjával, vagy a Kezelés → Új bolt útvonalon kezdhetsz.',
        steps: ['Az Alapadatok lapon add meg a bolt nevét. A pozitív árszorzó is kötelező; az 1 változatlan alapárat jelent.', 'Töltsd ki a helyet, a tulajdonost és a rövid leírást, ha már tudod őket.', 'A Kapcsolatok és kalandok lapon opcionális jegyzeteket adhatsz hozzá. A mentés mindkét lapon elérhető.'],
      },
      {
        title: 'Bolt váltása és szerkesztése',
        text: 'A felső Bolt választóval válthatsz a kereskedések között. A Kezelés → Bolt szerkesztése alatt módosíthatod az adatokat; a Kezelés fiók Bolti tudnivalók része játék közben gyorsan megmutatja a jegyzeteket.',
      },
      {
        title: 'Honnan lesznek tárgyak?',
        text: 'A saját tárgylistába kézzel hozhatsz létre tárgyat, JSON-ből importálhatsz, vagy bejelentkezés után másolhatsz az SRD alaplistából. Ezután választhatod ki, melyik bolt készletébe kerüljenek.',
      },
      {
        title: 'Telepítés telefonra vagy tabletre',
        text: 'Nyisd meg az alkalmazás HTTPS-címét a készülék böngészőjében. Az első betöltés után a felület és ez az útmutató kapcsolat nélkül is megnyitható. A felhős szinkronizáláshoz továbbra is internet kell; a helyi és a fiókhoz tartozó offline adatok külön maradnak.',
        steps: ['Androidon Chrome-ban nyisd meg a böngésző menüjét, majd válaszd az Alkalmazás telepítése vagy Hozzáadás a kezdőképernyőhöz lehetőséget.', 'iPhone-on és iPaden Safariban nyisd meg a Megosztás menüt, majd válaszd a Hozzáadás a Főképernyőhöz lehetőséget.'],
        note: 'iPhone-on és iPaden a telepített példány helyi tárhelye eltérhet a Safariban tárolt adatokétól. Meglévő helyi készletet a Kezelés → Helyi és felhőadatok ablakban, kifejezett feltöltéssel vihetsz át a felhőbe; a művelet a felhős céladatokat lecseréli.',
      },
    ],
  },
  {
    id: 'targyak',
    title: 'Tárgyak előkészítése',
    summary: 'Értsd meg a listák szerepét, és töltsd fel a boltokat.',
    topics: [
      {
        title: 'Alaplista, saját tárgylista, bolti készlet',
        text: 'Az SRD alaplista közös, bejelentkezve olvasható forrás. Az onnan átvett tárgy a saját tárgylistádba kerül, ahol szabadon szerkesztheted. Minden bolt külön készletet és külön bolti árat tart nyilván; egyik bolt készletváltozása sem módosítja a másikat.',
      },
      {
        title: 'Tárgy létrehozása',
        text: 'A Kezelés → Saját tárgylista → Új a listába útvonalon új katalógustárgyat készíthetsz. A Tárgy hozzáadása gombból az Új tárgy rögtön a boltba művelet a saját listába és az aktuális boltba is felveszi a tárgyat.',
        steps: ['Add meg a nevet, típust és ritkaságot. A ritkaság javasolt alapárat tölt ki, amelyet átírhatsz.', 'Válassz illusztrált alapképet a Kép cseréje alatt, vagy adj meg saját kép URL-t.', 'Írd meg a listában látható rövid leírást, a részletes leírást és a hatást, majd mentsd a tárgyat.'],
        note: 'Az italoknál a javasolt ár a ritkasági ár fele. Az artefaktum alapára üresen hagyható: így felbecsülhetetlen.',
      },
      {
        title: 'Tárgy boltba helyezése',
        text: 'A főképernyő Tárgy hozzáadása gombja megnyitja a saját tárgylistát. A kívánt tételnél válaszd a Boltba teszem gombot. Egy tárgyat más boltokba is felvehetsz, de ugyanabban a boltban nem duplázhatod meg.',
      },
      {
        title: 'Másolás az SRD alaplistából',
        text: 'A Kezelés → SRD alaplista bejelentkezve érhető el. Egyesével vagy kijelölve másolhatsz tárgyakat a saját listádba. A másolat később önállóan szerkeszthető, és az alaplista későbbi változásai nem írják felül. A bolti készletbe külön kell felvenned.',
      },
      {
        title: 'Tárgyak importálása JSON-ből',
        text: 'A Kezelés → JSON import felületen fájlt választhatsz vagy JSON-szöveget illeszthetsz be. Egy tárgy, tömb és az alkalmazás exportjának catalog része is használható.',
        steps: ['Kattints a JSON ellenőrzése gombra.', 'Nézd át az új, már létező és hibás tételek számát.', 'Az Importálás gombbal csak a saját tárgylistát bővíted; a bolti készlet nem változik.'],
      },
    ],
  },
  {
    id: 'eladas',
    title: 'Eladás játék közben',
    summary: 'Keress, árazz és változtass készletet a rögzített alsó sávból.',
    topics: [
      {
        title: 'Gyors eladás',
        text: 'Keress a bolti készletben, majd koppints a tárgyra. Az alsó sáv játék közben kéznél marad: a tárgy nevére koppintva megnyithatod a leírását és a hatását.',
        steps: ['Állítsd be a darabszámot.', 'Ha szükséges, írd át az alkalmi eladási árat.', 'Koppints az Eladás gombra. A készlet csökken, az eladás bekerül az adott bolt naplójába.'],
      },
      {
        title: 'Alapár, bolti ár és eladási ár',
        text: 'A saját tárgylistában megadott alapár közös kiindulási érték. A bolt árszorzója ebből számol bolti árat. A tárgy részleteinél megadhatsz ettől eltérő árat, amelyet a Bolti ár mentése gombbal csak az aktuális bolt tárgyára rögzítesz.',
        note: 'Az alsó eladási sávban átírt ár csak az éppen rögzített eladásra vonatkozik: nem változtatja meg sem a bolti árat, sem a saját tárgylista alapárát.',
      },
      {
        title: 'Készlet hozzáadása vagy levonása',
        text: 'A kiválasztott tárgy készletszámára koppintva nyisd meg a Készlet módosítása ablakot. Válassz hozzáadást vagy levonást, add meg a mennyiséget, és szükség esetén írj megjegyzést. A változás bekerül az adott bolt naplójába.',
      },
      {
        title: 'Tárgy eltávolítása a boltból',
        text: 'A tárgy részleteinél válaszd az Eltávolítás a boltból műveletet, majd ellenőrizd a megerősítésben a tárgyat és a készletet. Csak az aktuális bolt készlete változik. A tárgy saját katalóguspéldánya és a többi bolt készlete megmarad; az eltávolítás naplózott és visszavonható.',
      },
    ],
  },
  {
    id: 'keszlet',
    title: 'Bolt, készlet és beszerzések',
    summary: 'Sorsolj készletet, szerezz be hiányzó tárgyat, és kezeld a boltokat.',
    topics: [
      {
        title: 'Véletlen készlet sorsolása',
        text: 'A Kezelés → Véletlen készlet a saját tárgylistádból sorsol. Megadhatod a környék mágiáját, a bolt méretét, a legmagasabb ritkaságot, a bolti profilt és a kívánt tételszámot. Az artefaktumok kimaradnak.',
        steps: ['Kattints a Készlet sorsolása gombra.', 'Nézd át az előnézetet; ha nem tetszik, sorsolj újra.', 'A Készlet hozzáadása a meglévő mennyiségekhez adja a sorsolt darabokat, nem írja felül őket.'],
      },
      {
        title: 'Hiányzó tárgy beszerzése',
        text: 'Ha a bolti keresés nem talál tárgyat, válaszd a Beszerzés ellenőrzése gombot. A Kezelés → Beszerzések alatt is indíthatsz ajánlatot. A saját tárgylistából válassz; az SRD alaplistából előbb kifejezetten másold a tárgyat a saját listádba.',
        steps: ['A bolt településmérete és a környék mágiája alapból kitöltődik, de az ajánlatnál felülírható. A bolt profiljába illő tárgy további +10 százalékpont esélyt kap.', 'Sorsold ki az elérhetőséget d100-zal. Siker esetén az időt és a felárat is. A dobás, az eredmény, az idő és az ajánlati ár átírható.', 'Mentsd a megrendelést vagy a sikertelen próbát, majd kövesd az állapotát a Kezelés → Beszerzések alatt.'],
        note: 'Az artefaktumok beszerzése mesélői döntés; a sorsoló nem ad rájuk ajánlatot.',
      },
      {
        title: 'Beszerezhetőség településméret szerint',
        text: 'Az alábbi alapértékeket a környék mágiája módosítja: szórványos mágia −10, átlagos mágia 0, bőséges mágia +10 százalékpont. A bolt profiljába illő tárgy további +10 százalékpontot kap. A végeredmény legfeljebb 100%; a 0%-os alapérték 0% marad. A d100 dobás akkor sikeres, ha legfeljebb az esély.',
        table: {
          headers: ['Településméret', 'Gyakori', 'Nem gyakori', 'Ritka', 'Nagyon ritka', 'Legendás'],
          rows: [
            ['Falu (≤1 000 fő)', '90%', '40%', '15%', '0%', '0%'],
            ['Kisváros (1–10 ezer fő)', '95%', '65%', '25%', '5%', '0%'],
            ['Város (10–50 ezer fő)', '100%', '80%', '45%', '15%', '2%'],
            ['Nagyváros (50–200 ezer fő)', '100%', '95%', '65%', '30%', '6%'],
            ['Metropolisz (200 ezer fő felett)', '100%', '100%', '85%', '45%', '12%'],
          ],
        },
      },
      {
        title: 'Beszerzési idő',
        text: 'Sikeres elérhetőségi próbánál a ritkaság alapján sorsold ki az időt. Ezek játékbeli napok vagy hónapok, nem valódi naptári határidők. A legendás tárgyhoz kapcsolat vagy kaland is szükséges lehet.',
        table: {
          headers: ['Gyakoriság', 'Alap idő'],
          rows: [
            ['Gyakori', '1d4 nap'],
            ['Nem gyakori', '1d6+2 nap'],
            ['Ritka', '2d6+3 nap'],
            ['Nagyon ritka', '2d10+10 nap'],
            ['Legendás', '1d4+1 hónap'],
          ],
        },
      },
      {
        title: 'Beszerzési felár és ajánlati ár',
        text: 'Sikeres próba után egy d6 dobás határozza meg a felárat. Az ajánlati ár a tárgy alapárából a bolt árszorzójával számolt ár, erre kerül az alábbi felár. Az ajánlat egyszeri összeg: nem módosítja a saját tárgylista alapárát vagy a bolt tartós tárgyárát.',
        table: {
          headers: ['d6', 'Felár', 'Oka'],
          rows: [
            ['1', '+0%', 'Meglepően könnyen hozzáférhető'],
            ['2–3', '+10%', 'Szokásos beszerzési költség'],
            ['4', '+25%', 'Szállítási nehézségek'],
            ['5', '+50%', 'Ritka forrás, monopólium vagy vám'],
            ['6', '+100%', 'Kockázatos kapcsolat vagy feketepiaci útvonal'],
          ],
        },
        note: 'Az ajánlati ár szerkeszthető. Alapár nélküli tárgynál az árat a mesélő adhatja meg.',
      },
      {
        title: 'Megrendelések követése és átvétele',
        text: 'A Kezelés → Beszerzések az adott bolt próbáit és megrendeléseit őrzi. Egy mentett eredmény lehet függő megrendelés vagy sikertelen próba. A függő megrendelést lemondhatod, vagy a játékbeli idő elteltével Megérkezett állapotba teheted.',
        steps: ['A megrendelés mentése még nem változtatja meg a készletet.', 'A Megérkezett művelet egy darabot ad a bolt készletéhez, és bekerül a bolt naplójába.', 'A legutóbbi készletművelet visszavonható az Eladásnaplóban. A lemondott és sikertelen próbák megmaradnak a beszerzések között.'],
      },
      {
        title: 'Eladásnapló és visszavonás',
        text: 'A Kezelés → Eladásnapló az aktuális bolt eladásait és készletváltozásait mutatja. A legutóbbi visszavonható műveletet az Utolsó művelet visszavonása gombbal állíthatod vissza. A korábbi bejegyzések továbbra is láthatók.',
      },
      {
        title: 'Bolt törlése',
        text: 'A Kezelés → Bolt törlése a kiválasztott bolt teljes készletét, beszerzéseit és naplóját törli a jelenleg aktív helyi vagy felhős adatkészletből. A megerősítés előtt ellenőrizd a bolt nevét és az érintett adatok számát. A saját tárgylista és a többi bolt megmarad.',
        note: 'A bolt törlése végleges; az utolsó bolt is törölhető. Ilyenkor új bolt létrehozására hívó üres képernyő jelenik meg.',
      },
    ],
  },
  {
    id: 'adatok',
    title: 'Adatok és mentés',
    summary: 'Tudd, melyik adatkészlet aktív, és mit cserél le egy másolás.',
    topics: [
      {
        title: 'Helyi és felhőadatok',
        text: 'A felső állapotsor és a Kezelés → Helyi és felhőadatok mutatja az aktív forrást. Kijelentkezve az ezen az eszközön tárolt helyi adatokkal dolgozol. Bejelentkezve az adott fiók felhőadatai aktívak. A két adatkészlet külön marad; be- vagy kijelentkezéskor nincs automatikus másolás.',
      },
      {
        title: 'Munka kapcsolat nélkül',
        text: 'Ha a bejelentkezett fiók adatairól már van ezen az eszközön offline másolat, kapcsolatkimaradáskor azzal folytathatod a munkát. A függő módosítások visszakapcsolódáskor feltöltődnek. Ha nincs felhős offline másolat, a sikertelen betöltés után az alkalmazás nem mutatja helyette a külön helyi adataidat; használd az Újrapróbálás lehetőséget.',
      },
      {
        title: 'Kézi másolás és visszaállítás',
        text: 'Bejelentkezve a Kezelés → Helyi és felhőadatok ablakban másolhatod a felhőt az eszköz helyi adataira, vagy feltöltheted a helyi adatokat a felhőbe. Mindkét művelet a teljes céladatkészletet lecseréli: boltokat, tárgyakat, készletet és naplót. A megerősítés megnevezi a célhelyet.',
        note: 'Az előző célváltozatról visszaállítható biztonsági másolat készül. A felhő helyire másolása után bejelentkezve továbbra is a felhőadatok aktívak.',
      },
      {
        title: 'JSON-export',
        text: 'A Kezelés → JSON export az éppen aktív boltokat, naplókat és saját tárgylistát fájlba menti. Az SRD alaplista nem része az exportnak. A fájl a saját tárgyak későbbi importálásához is használható.',
      },
    ],
  },
  {
    id: 'gyors-valaszok',
    title: 'Gyors válaszok',
    summary: 'Rövid válaszok a leggyakoribb félreértésekre.',
    topics: [
      { title: 'Miért üres a bolt bejelentkezés után?', text: 'Bejelentkezve a fiókod külön felhős adatai aktívak. Új fiók nem veszi át automatikusan az eszköz helyi boltjait. Ha azokat szeretnéd használni a felhőben, válaszd a Helyi adatok feltöltése a felhőbe műveletet, és ellenőrizd a csere megerősítését.' },
      { title: 'Hová került az SRD alaplistából átvett tárgy?', text: 'A saját tárgylistádba. A Tárgy hozzáadása ablakban keresd meg, majd válaszd a Boltba teszem gombot az aktuális bolthoz.' },
      { title: 'Miért nem maradt meg az eladáskor beírt ár?', text: 'Az alsó sáv ára csak egy eladásra szól. Tartós bolti árhoz a tárgy részleteinél írd át a Bolti ár mezőt, majd kattints a Bolti ár mentése gombra.' },
      { title: 'Hogyan javíthatok egy téves készletváltozást?', text: 'Nyisd meg a Kezelés → Eladásnapló felületet, és ha elérhető, válaszd az Utolsó művelet visszavonása gombot. A bolti ár és készlet visszaállítását az eltávolítás visszavonása is kezeli.' },
      { title: 'Mi történik, ha nem töltődnek be a felhőadatok?', text: 'Próbáld meg újra a betöltést a forrás állapotsorában vagy a Helyi és felhőadatok ablakban. Offline másolat nélkül az alkalmazás nem vált észrevétlenül a kijelentkezett helyi adatokra.' },
    ],
  },
  {
    id: 'tulajdonos',
    title: 'Az alaplista kezelése',
    summary: 'Kiegészítés a Firestore alaplista tulajdonosának.',
    topics: [
      {
        title: 'Ki módosíthatja az alaplistát?',
        text: 'A bejelentkezett felhasználók olvashatják az SRD alaplistát. Feltölteni és törölni csak az a tulajdonos tud, akinek a Firebase Console-ban catalogAdmins/{uid} adminjelölőt hoztak létre. Ilyen jogosultságot az alkalmazásból nem lehet adni. A telepítés technikai lépéseit a projekt Firebase-beállítási dokumentuma írja le.',
      },
      {
        title: 'Tárgyak feltöltése vagy frissítése',
        text: 'Tulajdonosként nyisd meg a Kezelés → SRD alaplista → Alaplista kezelése · JSON feltöltés felületet. Válassz JSON-fájlt vagy illeszd be a szöveget, majd az Ellenőrzés gombbal nézd át az érvényes, frissítendő és hibás tételeket. Csak az előnézet után indítsd a feltöltést.',
        note: 'Azonos azonosítójú tárgy frissül, új azonosító hozzáadódik. A fájlból kihagyott tárgyak nem törlődnek. A felhasználók korábban átvett saját példányai változatlanok.',
      },
      {
        title: 'Tárgy törlése az alaplistából',
        text: 'A tulajdonos az alaplista egyes tételeit a Törlés művelettel távolíthatja el. A korábban saját listába másolt példányokat ez nem törli. Az eredeti SRD neveket és angol hatásösszefoglalókat őrizd meg az alaplista szerkesztésekor.',
      },
    ],
  },
];
