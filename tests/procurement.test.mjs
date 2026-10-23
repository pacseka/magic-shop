import test from 'node:test';
import assert from 'node:assert/strict';
import { cancelProcurement, procurementChance, procurementQuote, procurementTime, receiveProcurement, saveProcurement } from '../src/procurement.js';
import { canUndoLatestActivity, normalizeLedger, shopItemFromCatalog, undoLatestActivity } from '../src/shopData.js';

const ring = { id: 'ring', name: 'Próbagyűrű', rarity: 'Ritka', kind: 'Gyűrű', price: 4000 };
const shop = { id: 'first', name: 'Első bolt', multiplier: 1.25, settlementSize: 'city', magicPrevalence: 'normal', items: [], activity: [], procurements: [] };

test('uses the settlement table and capped local modifiers without opening impossible rarity cells', () => {
  assert.equal(procurementChance('Ritka', 'village', 'normal', false), 15);
  assert.equal(procurementChance('Ritka', 'village', 'abundant', true), 35);
  assert.equal(procurementChance('Legendás', 'village', 'abundant', true), 0);
  assert.equal(procurementChance('Gyakori', 'metropolis', 'abundant', true), 100);
  assert.equal(procurementChance('Artefaktum', 'metropolis', 'abundant', true), 0);
});

test('uses the agreed dice formulas for each rarity', () => {
  assert.deepEqual(['Gyakori', 'Nem gyakori', 'Ritka', 'Nagyon ritka', 'Legendás'].map(rarity => procurementTime(rarity, () => 0).amount), [1, 3, 5, 12, 2]);
  assert.equal(procurementTime('Legendás', () => 0).unit, 'hónap');
});

test('quotes a successful source, game time and one-time surcharge, then tracks and undoes receipt', () => {
  const rolls = [0.1, 0.6, 0, 0.5];
  const quote = procurementQuote(ring, shop, {}, () => rolls.shift());
  assert.equal(quote.chance, 45);
  assert.equal(quote.availabilityRoll, 11);
  assert.equal(quote.markupRoll, 4);
  assert.equal(quote.markupPercent, 25);
  assert.equal(quote.timeAmount, 8);
  assert.equal(quote.timeUnit, 'nap');
  assert.equal(quote.quotedPrice, 6250);

  const ordered = saveProcurement(shop, ring, quote, 'Titkos céhes útvonal', { id: 'order', at: '2026-10-23T12:00:00.000Z' });
  assert.equal(ordered.items.length, 0);
  assert.equal(ordered.procurements[0].status, 'ordered');
  assert.equal(ordered.procurements[0].quotedPrice, 6250);
  const persisted = normalizeLedger(JSON.parse(JSON.stringify({ catalog: [ring], shops: [ordered] })));
  const received = receiveProcurement(persisted.shops[0], 'order', { id: 'receipt', at: '2026-10-24T12:00:00.000Z' });
  assert.equal(received.items[0].stock, 1);
  assert.equal(received.items[0].shopPrice, undefined);
  assert.equal(received.procurements[0].status, 'received');
  assert.equal(received.activity[0].type, 'procurement');
  assert.equal(canUndoLatestActivity(received), true);
  const undone = undoLatestActivity(received);
  assert.equal(undone.items.length, 0);
  assert.equal(undone.procurements[0].status, 'ordered');
  assert.ok(undone.activity[0].undoneAt);
  assert.deepEqual(persisted.catalog, [ring]);
});

test('receipt adds one to existing stock without changing its persistent shop price', () => {
  const stocked = { ...shop, items: [{ ...shopItemFromCatalog(ring, 2), shopPrice: 7400 }] };
  const quote = procurementQuote(ring, stocked, {}, () => 0);
  const ordered = saveProcurement(stocked, ring, quote, '', { id: 'order' });
  const received = receiveProcurement(ordered, 'order');
  assert.equal(received.items.length, 1);
  assert.equal(received.items[0].stock, 3);
  assert.equal(received.items[0].shopPrice, 7400);
  assert.equal(undoLatestActivity(received).items[0].stock, 2);
});

test('failed attempts and cancellations stay in one shop without changing another shop', () => {
  const failedQuote = procurementQuote(ring, shop, { settlement: 'village' }, () => 0.99);
  const attempted = saveProcurement(shop, ring, failedQuote, 'Nincs ismert kereskedő', { id: 'failed' });
  assert.equal(attempted.procurements[0].status, 'failed');
  assert.deepEqual(attempted.items, []);
  const ordered = saveProcurement(attempted, ring, procurementQuote(ring, shop, {}, () => 0), '', { id: 'ordered' });
  const cancelled = cancelProcurement(ordered, 'ordered');
  assert.equal(cancelled.procurements[1].status, 'cancelled');
  assert.equal(receiveProcurement(cancelled, 'ordered'), null);
  assert.deepEqual(shop.procurements, []);
});
