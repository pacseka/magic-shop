export const initialItems = [
  { id: 'potion', name: 'Gyógyital', rarity: 'Gyakori', kind: 'Csodás tárgy', category: 'Ital', stock: 12, price: 50, image: '/assets/potion.png', teaser: 'Visszaállít 2d4 + 2 életerőt.', description: 'Mélyvörös, szikrázó folyadék egy gondosan zárt üvegben.', effect: 'Elfogyasztásakor 2d4 + 2 életerőt állít vissza.' },
  { id: 'bag', name: 'Bag of Holding', rarity: 'Nem gyakori', kind: 'Csodás tárgy', category: 'Táska', stock: 2, price: 400, image: '/assets/bag.png', teaser: 'Tágas belső tér egy másik síkhoz kapcsolva.', description: 'Kívülről közönséges bőrtáska, belül meglepően tágas.', effect: 'A belseje jóval több felszerelést képes tárolni, mint amennyit a külseje sejtet.' },
  { id: 'cloak', name: 'Köpeny az oltalomhoz', rarity: 'Nem gyakori', kind: 'Csodás tárgy', category: 'Köpeny', stock: 1, price: 400, image: '/assets/cloak-cutout.png', teaser: '+1 bónusz AC-re és mentődobásokra.', description: 'Ezt a finoman hímzett köpenyt gyakran viselik az úton járók, akiknek nagyobb védelemre van szükségük a világ veszélyei ellen.', effect: 'Míg viseled a köpenyt, +1 bónuszt kapsz a páncélosztályodra (AC), valamint a mentődobásokra. Összehangolódást igényel.' },
  { id: 'scroll', name: 'Varázstekercs: Pajzs', rarity: 'Gyakori', kind: 'Varázstekercs', category: 'Tekercs', stock: 5, price: 50, image: '/assets/scroll.png', teaser: '1. szintű abjurációs varázslat.', description: 'Vörös viasszal lezárt, mágikus jelekkel írt tekercs.', effect: 'A Pajzs varázslatot tartalmazza; használat után a tekercs megsemmisül.' },
  { id: 'ring', name: 'Tűzellenállás gyűrűje', rarity: 'Ritka', kind: 'Csodás tárgy', category: 'Gyűrű', stock: 1, price: 4000, image: '/assets/ring.png', teaser: 'Ellenállást ad a tűzsebzéssel szemben.', description: 'Rubinkővel díszített aranygyűrű, amely langyosnak érződik az ujjon.', effect: 'A viselőjének ellenállást ad a tűzsebzéssel szemben.' },
];

export const storageKey = 'magic-shop-ledger-v1';
export const activeShopKey = 'magic-shop-active-id-v1';
const legacyKey = 'rezhold-shop-items-v3';

export const defaultShop = {
  id: 'rezhold', name: 'A Rézhold Kereskedés', location: 'Vízmély', owner: 'Mira Rézhold',
  description: 'Varázstárgyak és ritka úti felszerelések a kalandozóknak.',
  multiplier: 1, contact: '', faction: '', relationship: '', adventureHook: '',
  items: initialItems,
};

export const blankShop = () => ({
  name: '', location: '', owner: '', description: '', multiplier: 1,
  contact: '', faction: '', relationship: '', adventureHook: '',
});

export function loadShops() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved?.shops) && saved.shops.length) return saved.shops;
    const oldItems = JSON.parse(localStorage.getItem(legacyKey));
    if (Array.isArray(oldItems) && oldItems.length) return [{ ...defaultShop, items: oldItems }];
  } catch { /* Keep the sample shop when local data is damaged. */ }
  return [{ ...defaultShop, items: initialItems.map(item => ({ ...item })) }];
}

export const salePriceFor = (item, shop) => Math.round(Number(item?.price || 0) * Number(shop?.multiplier || 1));
export const makeId = () => globalThis.crypto?.randomUUID?.() ?? `shop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
