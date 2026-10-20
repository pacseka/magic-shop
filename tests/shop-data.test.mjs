import test from 'node:test';
import assert from 'node:assert/strict';
import { loadShops, salePriceFor, storageKey } from '../src/shopData.js';

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
