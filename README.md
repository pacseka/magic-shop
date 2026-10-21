# Hacsi's magic shops

Tablet használatra tervezett D&D 2024 varázstárgybolt-kezelő. Több bolt, közös tárgykatalógus, boltonként külön készlet és ár, eladásnapló, véletlen készlet és JSON export érhető el benne. Firebase nélkül is használható: ilyenkor az adatok az adott böngésző helyi tárhelyén maradnak.

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
2. Hozz létre egy **Cloud Firestore** adatbázist. A **Rules** lapon másold be a repository [firestore.rules](firestore.rules) fájlját és publikáld. A szabály csak a bejelentkezett felhasználó saját dokumentumaihoz enged hozzáférést; az alkalmazás a `users/{uid}/ledgers/main` dokumentumot használja.
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

5. Indítsd újra a fejlesztői szervert, majd az alkalmazás **Kezelés → Felhőszinkron** részében jelentkezz be. Az első szinkronizáláskor, ha a helyi és a felhős adatok eltérnek, az alkalmazás választást kér. Előtte a **Kezelés → JSON export** művelettel készíthetsz mentést.

Az `.env.local` fájlt a `.gitignore` kizárja a Gitből. A `VITE_` kezdetű változók a böngészőbe küldött JavaScriptbe épülnek, ezért **ne** tegyél beléjük szolgáltatásfiók-kulcsot vagy más titkot. A Firebase webes API-kulcsa projektazonosító, nem adatvédelmi szabály; a hozzáférést a bejelentkezés és a Firestore-szabályok védik. Részletesebb lépések: [Firebase beállítása](FIREBASE_SETUP.md). A Firebase hivatalos útmutatói: [webalkalmazás regisztrálása](https://firebase.google.com/docs/web/setup), [Google-bejelentkezés](https://firebase.google.com/docs/auth/web/google-signin), [Firestore-szabályok](https://firebase.google.com/docs/firestore/security/get-started).

## GitHub Pages

A repositoryban található workflow kézzel indítható az **Actions → Deploy GitHub Pages → Run workflow** útvonalon. A Pages beállítását, a `/magic-shop/` alapútvonalat és a Firebase buildváltozókat a [GitHub Pages útmutató](GITHUB_PAGES.md) írja le.

## Adatok és mentés

Az alkalmazás az adatokat először a böngésző helyi tárhelyére menti. Ez böngészőhöz és webcímhez kötött; törléskor elveszhet. A **Kezelés → JSON export** segítségével az összes bolt és a közös katalógus menthető. A katalógusba külön JSON tárgyak is importálhatók, anélkül hogy megváltozna a boltok készlete.
