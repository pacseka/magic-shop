# GitHub Pages telepítés

Az alkalmazás a `pacseka/magic-shop` repository GitHub Pages címére épül:

**https://pacseka.github.io/magic-shop/**

## Első beállítás

1. A GitHub repositoryban nyisd meg a **Settings → Pages** oldalt, és a **Build and deployment → Source** mezőnél válaszd a **GitHub Actions** lehetőséget.
2. Töltsd fel a változtatásokat a `main` ágra. A `.github/workflows/deploy-pages.yml` minden `main` ágra történő feltöltéskor telepít, és az **Actions** lapon kézzel is indítható.
3. A sikeres futás után a fenti címen érhető el az alkalmazás. A workflow a `dist/client` statikus fájljait publikálja.

## Firebase szinkronizálás

A felhős bejelentkezéshez a repository **Settings → Secrets and variables → Actions → Variables** részén add meg az `.env.example` fájlban szereplő `VITE_FIREBASE_*` értékeket. A négy kötelező változó: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`. A `VITE_FIREBASE_STORAGE_BUCKET` és `VITE_FIREBASE_MESSAGING_SENDER_ID` opcionális.

A Firebase Console-ban engedélyezd a Google bejelentkezést, majd az **Authentication → Settings → Authorized domains** listához add hozzá: `pacseka.github.io` (protokoll és `/magic-shop/` útvonal nélkül). A Firebase webalkalmazás beállításait a Vite a nyilvános JavaScript csomagba építi; a hozzáférést a Firebase Authentication és a Firestore szabályai védjék. A változók nélkül az alkalmazás továbbra is használható böngészőnkénti helyi mentéssel, de az adatok nem szinkronizálódnak az eszközök között.

## Helyi ellenőrzés

`npm run build:pages` a `/magic-shop/` alútvonalhoz készíti el a statikus alkalmazást. A szokásos `npm run build` továbbra is a helyi/Sites csomagot készíti.
