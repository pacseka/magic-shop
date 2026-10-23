import test from 'node:test';
import assert from 'node:assert/strict';
import { recordBuyback, recordStockChange, undoLatestActivity } from '../src/shopData.js';

const ring = { id: 'ring', name: 'Ring of Swimming', rarity: 'Nem gyakori', price: 400, kind: 'Gyűrű' };
const shop = { id: 'shop-one', multiplier: 1.2, items: [], activity: [], procurements: [] };

test('player buyback adds only the purchased shop stock and is undoable', () => {
  const after = recordBuyback(shop, ring, 2, 220, { id: 'buyback-one' });
  assert.equal(after.items[0].stock, 2);
  assert.equal(after.items[0].catalogId, 'ring');
  assert.equal(after.activity[0].totalPrice, 440);
  assert.equal(after.activity[0].type, 'buyback');
  assert.equal(ring.price, 400);
  assert.equal(shop.items.length, 0);

  const undone = undoLatestActivity(after, '2026-10-23T00:00:00.000Z');
  assert.deepEqual(undone.items, []);
  assert.ok(undone.activity[0].undoneAt);
});

test('buyback restores original stock and persistent shop price on undo', () => {
  const stocked = { ...shop, items: [{ ...ring, catalogId: ring.id, stock: 3, shopPrice: 510 }] };
  const after = recordBuyback(stocked, ring, 1, 200, { id: 'buyback-two' });
  assert.equal(after.items[0].stock, 4);
  assert.equal(after.items[0].shopPrice, 510);
  const undone = undoLatestActivity(after);
  assert.equal(undone.items[0].stock, 3);
  assert.equal(undone.items[0].shopPrice, 510);
});

test('negotiated sale logs its one-time price without changing the shop item price', () => {
  const stocked = { ...shop, items: [{ ...ring, catalogId: ring.id, stock: 2, shopPrice: 510 }] };
  const negotiation = { method: 'persuasion', dc: 15, rollTotal: 18, finalOffer: 459 };
  const after = recordStockChange(stocked, { type: 'sale', itemId: ring.id, delta: -1, unitPrice: 459, negotiation });
  assert.equal(after.items[0].stock, 1);
  assert.equal(after.items[0].shopPrice, 510);
  assert.deepEqual(after.activity[0].negotiation, negotiation);
  assert.equal(after.activity[0].totalPrice, 459);
});
