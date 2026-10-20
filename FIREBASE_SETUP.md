# Firebase beállítása

Az alkalmazás a `magic-shops-of-hacsi` Firebase-projekthez van beállítva a helyi `.env.local` fájlban. A webes konfigurációt a felhasználó 2026. október 20-án adta meg. Firebase nélkül is működik: ekkor a boltok a böngésző helyi tárhelyén maradnak.

## A konzolban ellenőrizendő

1. Az **Authentication → Sign-in method** oldalon a **Google** szolgáltató legyen engedélyezve. Az **Authorized domains** listában szerepeljen a `localhost`, valamint a későbbi éles domain.
2. Létezzen **Cloud Firestore** adatbázis. A **Rules** fülön a [firestore.rules](firestore.rules) fájl tartalmát kell publikálni. Ez minden bejelentkezett felhasználónak csak a saját boltadatait engedi olvasni és módosítani.

A nyilvános Firebase API ellenőrzésekor a projekt válaszolt, a `localhost` engedélyezett domain volt, és a Google-szolgáltató bejelentkezési URL-t adott. A Firestore egy névtelen próbaolvasást elutasított. Ezek az ellenőrzések nem igazolják, hogy a bejelentkezett felhasználó írhatja a saját bolti adatát; ehhez az alkalmazásbeli első bejelentkezés és mentés szükséges.

Másik gépen a `.env.example` fájlból készíthető `.env.local`, és abba kell beírni a webes konfiguráció hat értékét. A Vite fejlesztői szervert a környezeti fájl változtatása után újra kell indítani.

Az első bejelentkezéskor a meglévő helyi boltok felkerülnek a felhőbe. Ha a fiókban már van eltérő bolti adat, az alkalmazás választást kér a helyi és a felhős változat között. A módosítások helyben azonnal, a felhőbe rövid késleltetéssel mentődnek. A JSON export az összes boltot és azok készletét tartalmazza.

Az `.env.local` fájl nem kerül forráskezelésbe. A Firebase webes konfiguráció önmagában nem titkos hozzáférési kulcs; az adatok védelmét a bejelentkezés és a Firestore-szabályok adják. A felhős működés éles ellenőrzéséhez egyszer be kell jelentkezni Google-fiókkal az alkalmazásban.
