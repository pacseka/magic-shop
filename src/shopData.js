import { normalizedItemKind } from './itemTypes.js';

export const initialItems = [
  { id: 'potion', name: 'Gyógyital', rarity: 'Gyakori', kind: 'Ital', category: 'Gyógyital', stock: 12, price: 50, image: '/assets/potion.png', teaser: 'Visszaállít 2d4 + 2 életerőt.', description: 'Mélyvörös, szikrázó folyadék egy gondosan zárt üvegben.', effect: 'Elfogyasztásakor 2d4 + 2 életerőt állít vissza.' },
  { id: 'bag', name: 'Bag of Holding', rarity: 'Nem gyakori', kind: 'Csodás tárgy', category: 'Táska', stock: 2, price: 400, image: '/assets/bag.png', teaser: 'Tágas belső tér egy másik síkhoz kapcsolva.', description: 'Kívülről közönséges bőrtáska, belül meglepően tágas.', effect: 'A belseje jóval több felszerelést képes tárolni, mint amennyit a külseje sejtet.' },
  { id: 'cloak', name: 'Köpeny az oltalomhoz', rarity: 'Nem gyakori', kind: 'Csodás tárgy', category: 'Köpeny', stock: 1, price: 400, image: '/assets/cloak-cutout.png', teaser: '+1 bónusz AC-re és mentődobásokra.', description: 'Ezt a finoman hímzett köpenyt gyakran viselik az úton járók, akiknek nagyobb védelemre van szükségük a világ veszélyei ellen.', effect: 'Míg viseled a köpenyt, +1 bónuszt kapsz a páncélosztályodra (AC), valamint a mentődobásokra. Összehangolódást igényel.' },
  { id: 'scroll', name: 'Varázstekercs: Pajzs', rarity: 'Gyakori', kind: 'Tekercs', category: 'Varázstekercs', stock: 5, price: 50, image: '/assets/scroll.png', teaser: '1. szintű abjurációs varázslat.', description: 'Vörös viasszal lezárt, mágikus jelekkel írt tekercs.', effect: 'A Pajzs varázslatot tartalmazza; használat után a tekercs megsemmisül.' },
  { id: 'ring', name: 'Tűzellenállás gyűrűje', rarity: 'Ritka', kind: 'Gyűrű', category: '', stock: 1, price: 4000, image: '/assets/ring.png', teaser: 'Ellenállást ad a tűzsebzéssel szemben.', description: 'Rubinkővel díszített aranygyűrű, amely langyosnak érződik az ujjon.', effect: 'A viselőjének ellenállást ad a tűzsebzéssel szemben.' },
];

export const storageKey = 'magic-shop-ledger-v1';
export const activeShopKey = 'magic-shop-active-id-v1';
const legacyKey = 'rezhold-shop-items-v3';
export const rarities = ['Gyakori', 'Nem gyakori', 'Ritka', 'Nagyon ritka', 'Legendás', 'Artefaktum'];

export const defaultShop = {
  id: 'rezhold', name: 'A Rézhold Kereskedés', location: 'Vízmély', owner: 'Mira Rézhold',
  description: 'Varázstárgyak és ritka úti felszerelések a kalandozóknak.',
  multiplier: 1, contact: '', faction: '', relationship: '', adventureHook: '',
  items: initialItems.map(item => ({ ...item, catalogId: item.id })), activity: [],
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

export const salePriceFor = (item, shop) => item?.shopPrice != null
  ? Number(item.shopPrice)
  : Math.round(Number(item?.price || 0) * Number(shop?.multiplier || 1));
export const makeId = () => globalThis.crypto?.randomUUID?.() ?? `shop-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function recordStockChange(shop, { id = makeId(), at = new Date().toISOString(), type, itemId, delta, unitPrice, reason = '' }) {
  const item = shop.items.find(entry => entry.id === itemId);
  if (!item || !['sale', 'adjustment'].includes(type) || !Number.isInteger(delta) || delta === 0 || (type === 'sale' && delta > 0)) return null;
  const after = item.stock + delta;
  if (after < 0 || (type === 'sale' && (!Number.isFinite(unitPrice) || unitPrice < 0))) return null;
  const change = { itemId, itemName: item.name, before: item.stock, after };
  const activity = { id, at, type, changes: [change], ...(type === 'sale' ? { unitPrice, totalPrice: -delta * unitPrice } : { reason: reason.trim() }) };
  return { ...shop, items: shop.items.map(entry => entry.id === itemId ? { ...entry, stock: after } : entry), activity: [...(shop.activity ?? []), activity] };
}

export function recordRandomStock(shop, rolled, { id = makeId(), at = new Date().toISOString() } = {}) {
  if (!rolled.length) return null;
  const items = shop.items.map(item => ({ ...item }));
  const changes = [];
  for (const item of rolled) {
    const existing = items.find(entry => entry.catalogId === item.catalogId);
    if (existing) {
      changes.push({ itemId: existing.id, itemName: existing.name, before: existing.stock, after: existing.stock + item.stock });
      existing.stock += item.stock;
    } else {
      items.push({ ...item });
      changes.push({ itemId: item.id, itemName: item.name, before: 0, after: item.stock, created: true });
    }
  }
  return { ...shop, items, activity: [...(shop.activity ?? []), { id, at, type: 'random', changes }] };
}

export function canUndoLatestActivity(shop) {
  const latest = (shop?.activity ?? []).findLast(event => !event.undoneAt);
  return Boolean(latest?.changes?.length && latest.changes.every(change => shop.items.find(item => item.id === change.itemId)?.stock === change.after));
}

export function undoLatestActivity(shop, at = new Date().toISOString()) {
  if (!canUndoLatestActivity(shop)) return null;
  const latest = shop.activity.findLast(event => !event.undoneAt);
  const changes = new Map(latest.changes.map(change => [change.itemId, change]));
  const items = shop.items.flatMap(item => {
    const change = changes.get(item.id);
    return change?.created ? [] : [{ ...item, ...(change ? { stock: change.before } : {}) }];
  });
  return { ...shop, items, activity: shop.activity.map(event => event.id === latest.id ? { ...event, undoneAt: at } : event) };
}

export const itemDefinition = item => {
  const { stock, catalogId, shopPrice, ...definition } = item;
  return definition;
};
export const shopItemFromCatalog = (item, stock = 1) => ({ ...itemDefinition(item), catalogId: item.id, stock });

// Older ledgers only held shop inventories. Preserve each shop's stock while
// building one reusable definition for every distinct name and rarity.
export function normalizeLedger(data) {
  const shops = Array.isArray(data?.shops) && data.shops.length
    ? data.shops : [{ ...defaultShop, items: defaultShop.items.map(item => ({ ...item })) }];
  const catalog = Array.isArray(data?.catalog) ? data.catalog.map(itemDefinition) : [];
  const byId = new Map(catalog.map(item => [item.id, item]));
  const byName = new Map(catalog.map(item => [`${item.name?.trim().toLocaleLowerCase('hu-HU')}|${item.rarity}`, item.id]));
  const nextShops = shops.map(shop => ({ ...shop, activity: Array.isArray(shop.activity) ? shop.activity : [], items: (shop.items ?? []).map(item => {
    const key = `${item.name?.trim().toLocaleLowerCase('hu-HU')}|${item.rarity}`;
    const catalogId = byId.has(item.catalogId) ? item.catalogId : byName.get(key) ?? item.catalogId ?? item.id ?? makeId();
    if (!byId.has(catalogId)) {
      const definition = { ...itemDefinition(item), id: catalogId };
      catalog.push(definition);
      byId.set(catalogId, definition);
      byName.set(key, catalogId);
    }
    return { ...item, id: item.id ?? makeId(), catalogId };
  }) }));
  return { shops: nextShops, catalog };
}

export function loadLedger() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved?.shops) && saved.shops.length) return normalizeLedger(saved);
    const oldItems = JSON.parse(localStorage.getItem(legacyKey));
    if (Array.isArray(oldItems) && oldItems.length) return normalizeLedger({ shops: [{ ...defaultShop, items: oldItems }] });
  } catch { /* Keep sample data when local storage is damaged. */ }
  return normalizeLedger(null);
}

const baseWeights = [64, 24, 9, 2.5, .5, 0];
const magicScale = { scarce: [.95, .6, .25, .08, 0, 0], normal: [1, 1, 1, .5, .15, 0], abundant: [1, 1.25, 1.5, 1.3, .65, 0] };
const sizeCounts = { small: 2, medium: 4, large: 7 };
const prevalenceScale = { scarce: .65, normal: 1, abundant: 1.5 };

export function generateStock(catalog, existingItems, options, random = Math.random) {
  const { prevalence = 'normal', size = 'medium', maxRarity = 'Ritka', category = 'all', count, consumables = false, includeExisting = true } = options;
  const maxIndex = rarities.indexOf(maxRarity);
  const existing = new Set(existingItems.map(item => item.catalogId ?? item.id));
  const pool = catalog.filter(item => (includeExisting || !existing.has(item.id)) && (category === 'all' || item.category === category || normalizedItemKind(item) === category)
    && rarities.indexOf(item.rarity) >= 0 && rarities.indexOf(item.rarity) <= maxIndex && item.rarity !== 'Artefaktum');
  const target = Math.min(pool.length, Math.max(0, Math.floor(count === '' || count == null || !Number.isFinite(Number(count))
    ? Math.round(sizeCounts[size] * prevalenceScale[prevalence]) : Number(count))));
  const result = [];
  while (result.length < target && pool.length) {
    const weights = pool.map(item => {
      const rarityIndex = rarities.indexOf(item.rarity);
      const isConsumable = ['Ital', 'Tekercs'].includes(item.category) || ['Ital', 'Tekercs', 'Varázstekercs'].includes(item.kind);
      return baseWeights[rarityIndex] * magicScale[prevalence][rarityIndex] * (consumables && isConsumable ? 2.5 : 1);
    });
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (!total) break;
    let roll = random() * total;
    let index = weights.findIndex(weight => (roll -= weight) < 0);
    if (index < 0) index = pool.length - 1;
    const [item] = pool.splice(index, 1);
    const rarityIndex = rarities.indexOf(item.rarity);
    const isConsumable = ['Ital', 'Tekercs'].includes(item.category) || ['Ital', 'Tekercs', 'Varázstekercs'].includes(item.kind);
    const maxStock = isConsumable ? Math.max(1, 4 - rarityIndex + (prevalence === 'abundant' ? 2 : 0)) : Math.max(1, 3 - rarityIndex);
    result.push(shopItemFromCatalog(item, 1 + Math.floor(random() * maxStock)));
  }
  return result;
}
