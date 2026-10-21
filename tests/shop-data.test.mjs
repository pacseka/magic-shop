import test from 'node:test';
import assert from 'node:assert/strict';
import { itemDefinition, loadShops, normalizeLedger, salePriceFor, shopItemFromCatalog, storageKey } from '../src/shopData.js';

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
