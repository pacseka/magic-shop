# Firebase beállítása

Az alkalmazás Firebase nélkül is működik, ekkor a boltok a böngésző helyi tárhelyén maradnak. A felhős mentéshez saját Firebase-projekt szükséges.

1. A [Firebase Console-ban](https://console.firebase.google.com/) hozz létre egy új projektet a **Spark (ingyenes)** csomagban.
2. Regisztrálj benne egy **Web appot**, és másold ki az alkalmazás konfigurációjából az `apiKey`, `authDomain`, `projectId` és `appId` értékeket.
3. Az **Authentication → Sign-in method** oldalon kapcsold be a **Google** szolgáltatót. Az **Authorized domains** listához add hozzá azt a domaint, ahol az alkalmazást használod. A helyi fejlesztéshez a `localhost` is szükséges.
4. Hozz létre egy **Cloud Firestore** adatbázist. A **Rules** fülön a `firestore.rules` fájl tartalmát állítsd be és publikáld. A szabály minden bejelentkezett felhasználónak csak a saját boltadatait engedi olvasni és módosítani.
5. Másold a `.env.example` fájlt `.env.local` néven, és töltsd ki a négy `VITE_FIREBASE_*` értéket. Ezután indítsd újra a helyi szervert.

Az első bejelentkezéskor a meglévő helyi boltok felkerülnek a felhőbe. Ha a fiókban már van eltérő bolti adat, az alkalmazás választást kér a helyi és a felhős változat között. A módosítások helyben azonnal, a felhőbe rövid késleltetéssel mentődnek. A JSON export az összes boltot és azok készletét tartalmazza.

Az `.env.local` fájl ne kerüljön forráskezelésbe. A Firebase webes konfiguráció önmagában nem titkos hozzáférési kulcs; az adatok védelmét a bejelentkezés és a Firestore-szabályok adják. A felhős működés éles ellenőrzéséhez a projekt létrehozása és a fenti beállítások szükségesek.
