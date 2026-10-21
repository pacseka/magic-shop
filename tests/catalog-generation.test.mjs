import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStock, loadLedger, normalizeLedger, shopItemFromCatalog, storageKey } from '../src/shopData.js';

test('older shop inventories become a shared catalog without merging stocks', () => {
  const item = { id: 'a', name: 'Próbatárgy', rarity: 'Gyakori', category: 'Ital', price: 50, stock: 4 };
  const ledger = normalizeLedger({ shops: [
    { id: 'one', items: [item] },
    { id: 'two', items: [{ ...item, id: 'b', stock: 2 }] },
  ] });
  assert.equal(ledger.catalog.length, 1);
  assert.equal(ledger.catalog[0].stock, undefined);
  assert.equal(ledger.shops[0].items[0].stock, 4);
  assert.equal(ledger.shops[1].items[0].stock, 2);
  assert.equal(ledger.shops[0].items[0].catalogId, ledger.shops[1].items[0].catalogId);
});

test('local ledger loads catalog-only items for reuse', () => {
  const data = { schemaVersion: 2, shops: [{ id: 'one', items: [] }], catalog: [{ id: 'wand', name: 'Pálca', rarity: 'Ritka', price: 4000 }] };
  globalThis.localStorage = { getItem: key => key === storageKey ? JSON.stringify(data) : null };
  try { assert.deepEqual(loadLedger(), { shops: [{ ...data.shops[0], activity: [] }], catalog: data.catalog }); }
  finally { delete globalThis.localStorage; }
});

test('random stock respects rarity, category, existing items, and quantity limits', () => {
  const catalog = [
    { id: 'a', name: 'A', rarity: 'Gyakori', category: 'Ital', price: 50 },
    { id: 'b', name: 'B', rarity: 'Nem gyakori', category: 'Ital', price: 400 },
    { id: 'c', name: 'C', rarity: 'Ritka', category: 'Gyűrű', price: 4000 },
    { id: 'd', name: 'D', rarity: 'Artefaktum', category: 'Ital', price: 0 },
  ];
  const result = generateStock(catalog, [shopItemFromCatalog(catalog[0], 5)], {
    prevalence: 'abundant', size: 'large', maxRarity: 'Nem gyakori', category: 'Ital', count: 5, includeExisting: false,
  }, () => 0);
  assert.deepEqual(result.map(item => item.catalogId), ['b']);
  assert.equal(result[0].stock, 1);
  assert.equal(catalog[1].stock, undefined);
});

test('random stock can replenish an existing catalog item without changing its definition', () => {
  const catalog = [{ id: 'potion', name: 'Gyógyital', rarity: 'Gyakori', category: 'Ital', price: 50 }];
  const existing = [shopItemFromCatalog(catalog[0], 3)];
  const result = generateStock(catalog, existing, { count: 1, maxRarity: 'Gyakori' }, () => 0);
  assert.equal(result[0].catalogId, 'potion');
  assert.equal(result[0].stock, 1);
  assert.equal(existing[0].stock, 3);
});

test('random stock can filter by a D&D item type even without a subtype', () => {
  const catalog = [
    { id: 'rod', name: 'Próba jogar', kind: 'Jogar', category: '', rarity: 'Nem gyakori', price: 400 },
    { id: 'armor', name: 'Próba páncél', kind: 'Páncél', category: '', rarity: 'Nem gyakori', price: 400 },
  ];
  const result = generateStock(catalog, [], { category: 'Jogar', maxRarity: 'Nem gyakori', count: 2 }, () => 0);
  assert.deepEqual(result.map(item => item.catalogId), ['rod']);
});
