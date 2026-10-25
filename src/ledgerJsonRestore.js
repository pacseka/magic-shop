import { normalizeLedger, rarities } from './shopData.js';

const record = value => value && typeof value === 'object' && !Array.isArray(value);
const named = value => typeof value === 'string' && value.trim().length > 0;
const nonNegative = value => value == null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);

export function previewLedgerJsonRestore(json) {
  let source;
  try { source = JSON.parse(json); } catch { throw new Error('Érvénytelen JSON. Ellenőrizd a fájlt vagy a beillesztett szöveget.'); }
  if (!record(source) || source.schemaVersion !== 2 || !Array.isArray(source.shops) || !Array.isArray(source.catalog)) {
    throw new Error('Teljes, 2-es verziójú alkalmazásexport szükséges, shops és catalog listával.');
  }

  const catalogIds = new Set();
  source.catalog.forEach((item, index) => {
    if (!record(item) || !named(item.id) || !named(item.name) || !rarities.includes(item.rarity) || !nonNegative(item.price) || catalogIds.has(item.id)) {
      throw new Error(`Hibás vagy ismétlődő tárgy a katalógus ${index + 1}. sorában.`);
    }
    catalogIds.add(item.id);
  });

  const shopIds = new Set();
  source.shops.forEach((shop, index) => {
    if (!record(shop) || !named(shop.id) || !named(shop.name) ||
      typeof shop.multiplier !== 'number' || !Number.isFinite(shop.multiplier) || shop.multiplier <= 0 ||
      !Array.isArray(shop.items) ||
      (shop.activity != null && !Array.isArray(shop.activity)) ||
      (shop.procurements != null && !Array.isArray(shop.procurements)) ||
      shopIds.has(shop.id)) {
      throw new Error(`Hibás vagy ismétlődő bolt a ${index + 1}. sorban.`);
    }
    if (shop.activity?.some(event => !record(event) || !named(event.id)) ||
      shop.procurements?.some(order => !record(order) || !named(order.id))) {
      throw new Error(`Hibás napló vagy beszerzés: ${shop.name}.`);
    }
    shopIds.add(shop.id);
    const itemIds = new Set();
    shop.items.forEach((item, itemIndex) => {
      if (!record(item) || !named(item.id) || !named(item.catalogId) || !catalogIds.has(item.catalogId) ||
        !named(item.name) || !rarities.includes(item.rarity) ||
        !Number.isInteger(item.stock) || item.stock < 0 ||
        !nonNegative(item.price) || !nonNegative(item.shopPrice) || itemIds.has(item.id)) {
        throw new Error(`Hibás bolti tárgy: ${shop.name}, ${itemIndex + 1}. sor.`);
      }
      itemIds.add(item.id);
    });
  });

  const ledger = normalizeLedger(source);
  return { ledger, shops: ledger.shops.length, catalog: ledger.catalog.length,
    stockRows: ledger.shops.reduce((sum, shop) => sum + shop.items.length, 0),
    activity: ledger.shops.reduce((sum, shop) => sum + shop.activity.length, 0),
    procurements: ledger.shops.reduce((sum, shop) => sum + shop.procurements.length, 0) };
}
