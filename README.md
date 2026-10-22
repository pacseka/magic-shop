# Hacsi's magic shops

Tablet használatra tervezett D&D 2024 varázstárgybolt-kezelő. Több bolt, saját tárgylista, boltonként külön készlet és ár, eladásnapló, véletlen készlet és JSON export érhető el benne. Firebase-szel a bejelentkezett felhasználók az SRD alaplistából is másolhatnak tárgyakat. Firebase nélkül az adatok az adott böngésző helyi tárhelyén maradnak.

A magyar felhasználói útmutató az alkalmazás **Kezelés → Útmutató** felületén érhető el. A tartalom az alkalmazás része, ezért a már betöltött nézetben kapcsolat nélkül is olvasható.

## Helyi futtatás

**Szükséges:** Node.js 22 és npm. A projekt függőségeit a `package-lock.json` rögzíti.

Az `OWNER` helyére annak a GitHub-fióknak vagy szervezetnek a nevét írd, ahol a repository található. Ha a repository neve eltér, az URL-ben és a `cd` parancsban is cseréld ki a `magic-shop` nevet.

```bash
git clone https://github.com/OWNER/magic-shop.git
cd magic-shop
npm ci
npm run dev
```

Nyisd meg a terminálban kiírt címet (alapértelmezés szerint `http://localhost:5173/`). Az első fejlesztői indításkor mintatárgyak jelennek meg; ezek csak fejlesztői módban töltődnek be, és nem írják felül a már mentett adatokat. A kiadási build új böngészőben üres katalógussal és készlettel indul.

Kiadási build és helyi előnézet:

```bash
npm run build
npm run preview
```

Ellenőrzéshez: `node --test` és `npm run test:sites`. Az `npm run build` a helyi alkalmazás mellett a Sites csomagot is előkészíti; a GitHub Pages saját buildparancsa `npm run build:pages`.

## Firebase szinkronizálás (opcionális)

1. A [Firebase Console](https://console.firebase.google.com/) felületén hozz létre egy projektet és regisztrálj benne egy **webalkalmazást**. A webalkalmazás konfigurációs objektumára lesz szükséged.
2. Hozz létre egy **Cloud Firestore** adatbázist. A **Rules** lapon másold be a repository [firestore.rules](firestore.rules) fájlját és publikáld. A saját `users/{uid}/ledgers/main` adatok mellett a szabály a minden bejelentkezett felhasználó által olvasható, tulajdonos által kezelhető `baseCatalog` gyűjteményt is védi. Az adminjelölő létrehozását és az SRD lista feltöltését a [Firebase beállítása](FIREBASE_SETUP.md) írja le.
3. Az **Authentication → Sign-in method** lapon engedélyezd a **Google** szolgáltatót. Az **Authentication → Settings → Authorized domains** listában engedélyezd a használt domaint. Helyi használathoz add hozzá a `localhost` címet, ha nincs a listában.
4. Másold az `.env.example` fájlt `.env.local` néven, és töltsd ki a Firebase webes konfigurációból a mezőket:

   | Változó | Firebase konfigurációs mező | Kötelező |
   | --- | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `apiKey` | igen |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` | igen |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` | igen |
   | `VITE_FIREBASE_APP_ID` | `appId` | igen |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` | nem |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` | nem |

5. Indítsd újra a fejlesztői szervert, majd az alkalmazás **Kezelés → Helyi és felhőadatok** részében jelentkezz be. Bejelentkezve a fiókod felhős adatait, kijelentkezve a külön helyi adatokat használod. A kettő között csak az ott található kézi másolási műveletekkel vihetsz át adatokat; új fiókba nem kerülnek át automatikusan a helyi boltok vagy tárgyak.

Az `.env.local` fájlt a `.gitignore` kizárja a Gitből. A `VITE_` kezdetű változók a böngészőbe küldött JavaScriptbe épülnek, ezért **ne** tegyél beléjük szolgáltatásfiók-kulcsot vagy más titkot. A Firebase webes API-kulcsa nem titkos hitelesítő adat; a hozzáférést a bejelentkezés és a Firestore-szabályok védik. Részletesebb lépések: [Firebase beállítása](FIREBASE_SETUP.md). A Firebase hivatalos útmutatói: [webalkalmazás regisztrálása](https://firebase.google.com/docs/web/setup), [Google-bejelentkezés](https://firebase.google.com/docs/auth/web/google-signin), [Firestore-szabályok](https://firebase.google.com/docs/firestore/security/get-started).

## SRD alaplista feltöltése saját telepítéshez

Az [SRD 5.2.1-ből készült, 317 tárgyas JSON](data/srd-5.2.1-magic-items.json) a repositoryban található. Az alkalmazás **nem tölti fel automatikusan** a Firebase-be, és nem teszi be magától senki saját tárgylistájába vagy boltjába. A feltöltést egyszer, a saját Firebase-projektedben kell elvégezned. Külön adminalkalmazás nem szükséges.

1. Végezd el a fenti Firebase-beállítást: saját projekt és webalkalmazás, Google-bejelentkezés, a használt domain engedélyezése, `VITE_FIREBASE_*` konfiguráció, valamint a repository [Firestore-szabályainak](firestore.rules) publikálása. Ha GitHub Pagesre telepítesz, a buildváltozókat az [ottani útmutató](GITHUB_PAGES.md#firebase-szinkronizálás) szerint add meg, majd indíts új buildet. A bejelentkezett felhasználók a `baseCatalog` gyűjteményt olvashatják; írni csak az alábbi adminjelölővel lehet.
2. Nyisd meg a saját telepítésedet, és jelentkezz be a **Kezelés → Helyi és felhőadatok** ablakban azzal a Google-fiókkal, amellyel az alaplistát kezelni szeretnéd. A Firebase Console **Authentication → Users** oldalán keresd meg ennek a felhasználónak a **User UID** értékét. Az UID-t használd, ne az e-mail-címet.
3. A Firebase Console **Firestore Database → Data** felületén hozz létre egy `catalogAdmins` gyűjteményt, benne egy dokumentumot, amelynek azonosítója pontosan a saját User UID-d. Adj hozzá például egy `role` nevű, `owner` értékű szövegmezőt. A jogosultságot a dokumentum létezése adja; a `role` mező csak tájékoztató adat. Adminjelölőt a kliensalkalmazás nem hozhat létre, ezért ezt a Console-ban vagy megbízható Admin SDK-val kell megtenni.
4. Frissítsd az alkalmazást, majd nyisd meg a **Kezelés → SRD alaplista → Alaplista kezelése · JSON feltöltés** felületet. Válaszd ki a repositoryból a `data/srd-5.2.1-magic-items.json` fájlt, kattints az **Ellenőrzés** gombra, és nézd meg az előnézetet: új projektnél **317 érvényes, 0 frissítés, 0 hiba** várható. Ezután kattints a **Feltöltés** gombra, és várd meg a visszajelzést.
5. Ellenőrizd, hogy az alaplista **317 / 317 tárgyat** mutat. Másik bejelentkezett fiókkal a lista olvasható és a tárgyak a saját listába másolhatók, de az admin feltöltési és törlési műveletek nem jelennek meg. Az **Összes kijelölése** a még át nem vett tárgyakat jelöli ki a teljes alaplistából, a keresési szűrőtől függetlenül; a másolás csak a felhasználó saját listáját bővíti, a bolti készletet nem.

Az ismételt adminfeltöltés az azonos `id`-jú alaplistás tárgyakat frissíti, az új azonosítókat hozzáadja. A fájlból kihagyott meglévő tárgyakat nem törli. Megszakadt feltöltés után ugyanaz a fájl újrapróbálható. A felhasználók egyszer átvett példányai később szabadon szerkeszthetők, és az alaplista frissítése vagy egy elem admin általi törlése nem változtatja meg őket. A JSON angol neveket és rövid, angol hatásösszefoglalókat tartalmaz; a teljes szabályszöveghez a [hivatalos SRD](https://www.dndbeyond.com/srd) használható. A forrás és licenc részletei a [katalógus leírásában](data/README.md) találhatók.

## GitHub Pages

A repositoryban található workflow kézzel indítható az **Actions → Deploy GitHub Pages → Run workflow** útvonalon. A Pages beállítását, a `/magic-shop/` alapútvonalat és a Firebase buildváltozókat a [GitHub Pages útmutató](GITHUB_PAGES.md) írja le.

## Adatok és mentés

Kijelentkezve az alkalmazás külön helyi adatkészletet használ a böngésző tárhelyén. Bejelentkezve a saját felhős adatok aktívak, és az alkalmazás fiókonként elkülönített offline másolatot tart fenn. A **Kezelés → JSON export** az éppen aktív boltokat és saját tárgylistát menti, az SRD alaplistát nem. A saját tárgylistába külön JSON tárgyak is importálhatók a boltok készletének változtatása nélkül.
