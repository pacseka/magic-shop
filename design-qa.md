# Kereskedői ajánlat — design QA

**Forrás és állapot**

- Vizuális minta: `C:\Users\Hacsi\.codex\generated_images\01a167fb-e72e-7843-8823-603387f27d0b\exec-9f401579-cf5c-4384-bede-fa62c8e74458.png` (a felhasználó által kiválasztott 2. változat).
- Implementáció: `C:\Users\Hacsi\.codex\visualizations\2026\10\23\01a167fb-e72e-7843-8823-603387f27d0b\bargaining-tablet-qa.png`; mobil ellenőrzés: `C:\Users\Hacsi\.codex\visualizations\2026\10\23\01a167fb-e72e-7843-8823-603387f27d0b\bargaining-mobile-qa.png`.
- A forrás 1048 × 1496 képpont; az implementáció tablet képe 834 × 1194 képpont, 834 × 1194 CSS pixel nézetben, 1× böngészőképként. A két kép közel azonos képarányú; a teljes nézetet azonos szélességre igazítva hasonlítottam össze.
- Állapot: nyitott jobb oldali panel, „Bolt vesz” mód, kiválasztott tárgy és fix eladási sáv. A minta és a helyi tesztadat tárgyneve/ára eltér; a szerkezetet, hierarchiát és azonos interakciós állapotot hasonlítottam.

**Megállapítások**

- Nincs fennmaradó P0/P1/P2 eltérés. A panel jobb oldali helyzete, szélessége, pergamenfelülete, bordó címei, számozott szakaszai, kiválasztott tárgykártyája és az alsó eladási sáv a mintát követik.
- Betűk: a címek kontrasztos talpas betűje és a kisebb űrlapszövegek súlya megfelel a meglévő alkalmazásnak és a mintának. A kisebb tablet szélességen a cím alatti magyarázat két sorba kerül; ez olvasható és nem takar kezelőszervet.
- Térköz és színek: a szakaszvonalak, világos pergamenmezők és bordó elsődleges gombok vizuális ritmusa egyezik. A mintánál alacsonyabb nézetben a szakaszok görgethetők, a rögzítő gombok végig láthatók.
- Képminőség: a tarsoly díszítő elem külön raszteres, átlátszó hátterű kép. Tablet méretben illeszkedik a minta hangulatához; szűk mobilnézetben el van rejtve, hogy ne ütközzön a címmel. A tárgyképek a meglévő alkalmazás eszközeit használják.
- Tartalom: az alkalmazás a tényleges helyi katalógust mutatja. A minta játékos-készletet feltételező szövegét pontosítottam, mert az alkalmazás ilyen készletet nem vezet. A mintában látható 20%-os ajánlatemelés helyett a felület egy szerkeszthető, 10%-os opcionális háziszabályt javasol; a D&D 2024 nem határoz meg ehhez kötelező árváltozási százalékot.

**Összehasonlítás előzménye**

1. Első tablet ellenőrzés: [P2] a hosszú űrlap alján lévő műveletek rövid nézetben nem látszottak. Javítás: a mezők külön görgethetők, a műveleti sor a panel alján marad. Utóellenőrzés: `bargaining-tablet-qa.png`, a gombok és a fix eladási sáv egyidejűleg láthatók.
2. Első mobil ellenőrzés: [P2] a tarsoly képe a keskeny fejléc szélére szorult. Javítás: a díszítő kép 560 CSS pixel alatt rejtett. Utóellenőrzés: `bargaining-mobile-qa.png`, a cím és a bezárás akadálytalanul olvasható.

**Működés és további ellenőrzés**

- A helyi, elkülönített tesztadaton a felvásárlás növelte a bolti készletet, a visszavonás visszaállította azt. Az egyszeri alkuáras eladás a naplóba került, a tartós bolti ár változatlan maradt.
- Az alkalmazás böngészőkonzoljában nem volt hiba. A produkciós build, a célzott alku tesztek és a Sites tesztek sikeresek.
- P3: a pontos képi egyezéshez a különböző tesztadatok és árak egy azonos tartalmú demóképen cserélhetők; ez a valós adatokkal működő panel használhatóságát nem befolyásolja.

**Végső ellenőrzőlista**

- [x] A kiválasztott kép és a renderelt tablet nézet összehasonlítva.
- [x] Fejléc, kiválasztás, ármezők, rögzítő gombok és fix eladási sáv ellenőrizve.
- [x] Mobilnézet, fő műveletek és konzol ellenőrizve.
- [x] P0/P1/P2 eltérések javítva és újra ellenőrizve.

final result: passed
