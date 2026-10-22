# GitHub Pages telepítés

Az alkalmazás a `magic-shop` nevű repository GitHub Pages projektútvonalára épül:

**`https://<felhasználó-vagy-szervezet>.github.io/magic-shop/`**

Más repository név esetén a `package.json` `build:pages` parancsában a `--base` értéket is módosítani kell.

## Első beállítás

1. A GitHub repositoryban nyisd meg a **Settings → Pages** oldalt, és a **Build and deployment → Source** mezőnél válaszd a **GitHub Actions** lehetőséget.
2. A repository alapértelmezett ágán az **Actions → Deploy GitHub Pages → Run workflow** paranccsal indítsd a `.github/workflows/deploy-pages.yml` workflow-t. A jelenlegi workflow csak kézzel indítható; a feltöltés nem indít telepítést.
3. A sikeres futás után a fenti címen érhető el az alkalmazás. A workflow a `dist/client` statikus fájljait publikálja.

## Telepítés telefonra vagy tabletre

A Pages HTTPS-címén megnyitott alkalmazás böngészőből telepíthető. Androidon Chrome-ban a menü **Alkalmazás telepítése** vagy **Hozzáadás a kezdőképernyőhöz** pontját használd. iPhone-on és iPaden Safariban a **Megosztás → Hozzáadás a Főképernyőhöz** útvonalat válaszd. Az első online betöltés után a felület és a beépített útmutató offline is elindul. A felhős adatok szinkronizálásához hálózat kell; az app a meglévő fiókonkénti offline másolatot használja.

iPhone-on és iPaden a telepített alkalmazás helyi tárhelye elkülönülhet a Safari helyi adataitól. Meglévő helyi boltokat a Safari-beli alkalmazás **Kezelés → Helyi és felhőadatok** műveletével lehet kifejezetten a felhőbe feltölteni, majd a telepített alkalmazásban ugyanabba a fiókba bejelentkezni. A feltöltés a teljes felhős céladatkészletet lecseréli, ezért a megerősítést ellenőrizni kell.

## Firebase szinkronizálás

A felhős bejelentkezéshez a repository **Settings → Secrets and variables → Actions → Variables** részén add meg az `.env.example` fájlban szereplő `VITE_FIREBASE_*` értékeket. A négy kötelező változó: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`. A `VITE_FIREBASE_STORAGE_BUCKET` és `VITE_FIREBASE_MESSAGING_SENDER_ID` opcionális.

A Firebase Console-ban engedélyezd a Google bejelentkezést, majd az **Authentication → Settings → Authorized domains** listához add hozzá a Pages hostnevét, például `<felhasználó>.github.io` (protokoll és `/magic-shop/` útvonal nélkül). A Firebase webalkalmazás beállításait a Vite a nyilvános JavaScript csomagba építi; a hozzáférést a Firebase Authentication és a [Firestore-szabályok](firestore.rules) védik. A változók nélkül az alkalmazás továbbra is használható böngészőnkénti helyi mentéssel, de az adatok nem szinkronizálódnak az eszközök között.

## Helyi ellenőrzés

`npm run build:pages` a `/magic-shop/` alútvonalhoz készíti el a statikus alkalmazást. A szokásos `npm run build` továbbra is a helyi/Sites csomagot készíti. A Pageshez használható [GitHub Actions workflow-król](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) a GitHub dokumentációja ír.
