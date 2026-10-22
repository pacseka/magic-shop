import test from 'node:test';
import assert from 'node:assert/strict';
import { canUndoLatestActivity, itemDefinition, loadLedger, loadShops, normalizeLedger, recordItemRemoval, recordRandomStock, recordStockChange, removeShop, salePriceFor, shopItemFromCatalog, storageKey, undoLatestActivity } from '../src/shopData.js';

test('migrates the previous single-shop inventory without losing stock', () => {
  const saved = new Map([['rezhold-shop-items-v3', JSON.stringify([{ id: 'custom', name: 'Próbatárgy', stock: 3, price: 80 }])]]);
  globalThis.localStorage = { getItem: key => saved.get(key) ?? null };
  const shops = loadShops();
  assert.equal(shops.length, 1);
  assert.equal(shops[0].id, 'rezhold');
  assert.deepEqual(shops[0].items, [{ id: 'custom', name: 'Próbatárgy', stock: 3, price: 80 }]);
  delete globalThis.localStorage;
});

test('loads saved shops and applies each shop multiplier to the base price', () => {
  const shops = [{ id: 'new', name: 'Új bolt', multiplier: 1.25, items: [{ id: 'item', price: 80 }] }];
  globalThis.localStorage = { getItem: key => key === storageKey ? JSON.stringify({ schemaVersion: 1, shops }) : null };
  assert.deepEqual(loadShops(), shops);
  assert.equal(salePriceFor(shops[0].items[0], shops[0]), 100);
  delete globalThis.localStorage;
});

test('keeps a changed sale price on one shop item without changing the shared definition', () => {
  const definition = { id: 'wand', name: 'Próbapálca', rarity: 'Ritka', price: 400 };
  const first = { id: 'first', multiplier: 1.25, items: [{ ...shopItemFromCatalog(definition), shopPrice: 620 }] };
  const second = { id: 'second', multiplier: 2, items: [shopItemFromCatalog(definition)] };
  const ledger = normalizeLedger({ catalog: [definition], shops: [first, second] });

  assert.equal(salePriceFor(ledger.shops[0].items[0], ledger.shops[0]), 620);
  assert.equal(salePriceFor(ledger.shops[1].items[0], ledger.shops[1]), 800);
  assert.equal(ledger.shops[0].multiplier, 1.25);
  assert.equal(ledger.catalog[0].shopPrice, undefined);
  assert.equal(itemDefinition(ledger.shops[0].items[0]).shopPrice, undefined);
});

test('records a sale with its actual price and restores stock when undone', () => {
  const shop = { id: 'shop', multiplier: 2, items: [{ id: 'potion', name: 'Gyógyital', stock: 5, price: 50, shopPrice: 90 }], activity: [] };
  const sold = recordStockChange(shop, { id: 'sale-1', at: '2026-10-21T10:00:00.000Z', type: 'sale', itemId: 'potion', delta: -2, unitPrice: 75 });
  assert.equal(sold.items[0].stock, 3);
  assert.equal(sold.items[0].shopPrice, 90);
  assert.equal(sold.activity[0].totalPrice, 150);
  assert.equal(sold.activity[0].changes[0].before, 5);
  assert.equal(sold.activity[0].changes[0].after, 3);
  assert.equal(canUndoLatestActivity(sold), true);

  const undone = undoLatestActivity(sold, '2026-10-21T10:01:00.000Z');
  assert.equal(undone.items[0].stock, 5);
  assert.equal(undone.activity[0].undoneAt, '2026-10-21T10:01:00.000Z');
  assert.equal(canUndoLatestActivity(undone), false);
});

test('records a manual correction and rejects a reduction below zero', () => {
  const shop = { id: 'shop', items: [{ id: 'ring', name: 'Gyűrű', stock: 2 }], activity: [] };
  const corrected = recordStockChange(shop, { id: 'fix-1', at: '2026-10-21T10:00:00.000Z', type: 'adjustment', itemId: 'ring', delta: -1, reason: 'Elveszett' });
  assert.equal(corrected.items[0].stock, 1);
  assert.equal(corrected.activity[0].reason, 'Elveszett');
  assert.equal(recordStockChange(corrected, { id: 'fix-2', at: '2026-10-21T10:01:00.000Z', type: 'adjustment', itemId: 'ring', delta: -2 }), null);
  assert.equal(undoLatestActivity(corrected).items[0].stock, 2);
});

test('undoes one random stock batch, including newly added items', () => {
  const shop = { id: 'shop', items: [{ id: 'potion', catalogId: 'potion', name: 'Gyógyital', stock: 3 }], activity: [] };
  const rolled = [{ id: 'potion-new', catalogId: 'potion', name: 'Gyógyital', stock: 2 }, { id: 'wand', catalogId: 'wand', name: 'Pálca', stock: 1 }];
  const stocked = recordRandomStock(shop, rolled, { id: 'random-1', at: '2026-10-21T10:00:00.000Z' });
  assert.deepEqual(stocked.items.map(item => item.stock), [5, 1]);
  assert.equal(stocked.activity.length, 1);
  assert.equal(stocked.activity[0].changes.length, 2);
  const undone = undoLatestActivity(stocked);
  assert.deepEqual(undone.items, shop.items);
});

test('keeps saved activity when normalizing a ledger', () => {
  const event = { id: 'sale-1', type: 'sale', changes: [{ itemId: 'potion', before: 2, after: 1 }] };
  const ledger = normalizeLedger({ shops: [{ id: 'shop', items: [{ id: 'potion', name: 'Gyógyital', stock: 1 }], activity: [event] }] });
  assert.deepEqual(ledger.shops[0].activity, [event]);
});

test('removes a shop item without changing the catalog or other shops, and restores its price, stock and position after reload', () => {
  const definition = { id: 'ring', name: 'Gyűrű', rarity: 'Ritka', price: 400 };
  const item = { ...shopItemFromCatalog(definition, 3), shopPrice: 620 };
  const shop = { id: 'first', multiplier: 1.25, items: [{ id: 'wand', name: 'Pálca', stock: 1 }, item], activity: [] };
  const second = { id: 'second', items: [shopItemFromCatalog(definition, 9)] };
  const removed = recordItemRemoval(shop, item.id, { id: 'remove-1' });
  assert.deepEqual(removed.items, [shop.items[0]]);
  assert.deepEqual(shop.items[1], item);
  assert.equal(removed.activity[0].type, 'removal');
  const ledger = normalizeLedger(JSON.parse(JSON.stringify({ catalog: [definition], shops: [removed, second] })));
  assert.deepEqual(ledger.catalog.find(entry => entry.id === definition.id), definition);
  assert.equal(ledger.shops[1].items[0].stock, 9);
  assert.equal(canUndoLatestActivity(ledger.shops[0]), true);
  const restored = undoLatestActivity(ledger.shops[0]);
  assert.deepEqual(restored.items[1], item);
  assert.equal(restored.multiplier, 1.25);
  assert.ok(restored.activity[0].undoneAt);
});

test('removes the last out-of-stock item and can undo without losing earlier activity', () => {
  const item = { id: 'ring', name: 'Gyűrű', stock: 1 };
  const sold = recordStockChange({ items: [item], activity: [] }, { type: 'sale', itemId: item.id, delta: -1, unitPrice: 80 });
  const removed = recordItemRemoval(sold, item.id);
  assert.deepEqual(removed.items, []);
  assert.equal(removed.activity.length, 2);
  const restored = undoLatestActivity(removed);
  assert.equal(restored.items[0].stock, 0);
  assert.equal(undoLatestActivity(restored).items[0].stock, 1);
  assert.equal(recordItemRemoval(removed, 'missing'), null);
});

test('does not undo a removal over a re-added item from the same catalog', () => {
  const item = { id: 'old', catalogId: 'ring', name: 'Gyűrű', stock: 2 };
  const removed = recordItemRemoval({ items: [item], activity: [] }, item.id);
  const restocked = { ...removed, items: [{ ...item, id: 'new', stock: 4 }] };
  assert.equal(canUndoLatestActivity(restocked), false);
  assert.equal(undoLatestActivity(restocked), null);
});

test('deletes only the targeted shop with its stock and activity, keeping the shared catalog and other shops', () => {
  const definition = { id: 'wand', name: 'Pálca', rarity: 'Ritka', price: 400 };
  const target = { id: 'delete', name: 'Törlendő', items: [{ ...shopItemFromCatalog(definition), stock: 4, shopPrice: 620 }], activity: [{ id: 'sale' }] };
  const other = { id: 'keep', name: 'Megmaradó', items: [shopItemFromCatalog(definition, 2)], activity: [] };
  const ledger = { catalog: [definition], shops: [target, other] };
  const result = removeShop(ledger, target.id);
  assert.deepEqual(result.shops, [other]);
  assert.strictEqual(result.catalog, ledger.catalog);
  assert.strictEqual(result.shops[0], other);
  assert.deepEqual(ledger.shops, [target, other]);
  assert.strictEqual(removeShop(ledger, 'missing'), ledger);
});

test('deleting the last shop survives normalization and local reload without restoring legacy stock or development examples', () => {
  const catalog = [{ id: 'wand', name: 'Pálca', rarity: 'Ritka', price: 400 }];
  const empty = removeShop({ shops: [{ id: 'last', items: [shopItemFromCatalog(catalog[0])] }], catalog }, 'last');
  const saved = new Map([[storageKey, JSON.stringify(empty)], ['rezhold-shop-items-v3', JSON.stringify([{ id: 'old', stock: 5 }])]]);
  globalThis.localStorage = { getItem: key => saved.get(key) ?? null };
  try {
    assert.deepEqual(normalizeLedger(empty), { shops: [], catalog });
    assert.deepEqual(loadLedger([{ id: 'dev-example', stock: 2 }]), { shops: [], catalog });
    assert.deepEqual(loadShops(), []);
  } finally { delete globalThis.localStorage; }
});
