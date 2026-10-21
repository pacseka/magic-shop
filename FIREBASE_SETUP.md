# Firebase beállítása

A Firebase opcionális. Konfiguráció nélkül az alkalmazás a böngésző helyi tárhelyén működik. Saját Firebase-projektet használj; a repository nem tartalmaz beépített projektazonosítót vagy hitelesítő adatot.

1. A [Firebase Console](https://console.firebase.google.com/) felületén hozz létre egy projektet, majd regisztrálj egy webalkalmazást. A kapott konfigurációs objektum mezőit másold át az `.env.example` alapján készített `.env.local` fájlba. A négy szükséges mező: `apiKey`, `authDomain`, `projectId`, `appId`; a `storageBucket` és a `messagingSenderId` opcionális. A pontos változónevek a [README-ben](README.md#firebase-szinkronizálás-opcionális) találhatók.
2. Az **Authentication → Sign-in method** részen engedélyezd a Google-bejelentkezést. Az **Authentication → Settings → Authorized domains** listához add hozzá az alkalmazás tényleges domainjét, helyi futtatáskor szükség esetén a `localhost` címet. Új Firebase-projekteknél a `localhost` már nem feltétlenül szerepel alapból a listában.
3. Hozz létre Cloud Firestore adatbázist. A **Rules** lapon a [firestore.rules](firestore.rules) teljes tartalmát publikáld. A szabály a `users/{uid}/ledgers/{ledgerId}` útvonalon kizárólag az adott bejelentkezett felhasználó számára enged olvasást és írást; minden más útvonalat elutasít.
4. Indítsd újra a fejlesztői szervert az `.env.local` módosítása után. Jelentkezz be az alkalmazás **Kezelés → Felhőszinkron** részében, majd ellenőrizd, hogy a mentés és egy másik böngészőben való betöltés működik-e.

Az első bejelentkezéskor a meglévő helyi adatok felkerülhetnek a felhőbe. Ha a két változat eltér, az alkalmazás választást kér. A választás előtt érdemes JSON exportot készíteni. A módosítások helyben azonnal, a felhőbe rövid késleltetéssel mentődnek.

Az `.env.local` fájl Gitből kizárt. A Firebase webes konfiguráció a kliensalkalmazásban látható; nem helyettesíti a Firestore-szabályokat. Ne írj `VITE_` változóba szolgáltatásfiók-kulcsot vagy más titkot. A Firebase [webes beállítási](https://firebase.google.com/docs/web/setup), [Google-bejelentkezési](https://firebase.google.com/docs/auth/web/google-signin), [engedélyezett domainekről szóló](https://firebase.google.com/docs/auth/faq-and-troubleshooting) és [Firestore-szabályokról szóló](https://firebase.google.com/docs/firestore/security/get-started) dokumentációja további részleteket ad.
