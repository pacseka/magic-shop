import test from 'node:test';
import assert from 'node:assert/strict';
import { previewLedgerJsonRestore } from '../src/ledgerJsonRestore.js';
import { normalizeLedger } from '../src/shopData.js';

const exportJson = (ledger) => JSON.stringify({ schemaVersion: 2, exportedAt: '2026-10-25T00:00:00.000Z', ...ledger });
const ledger = normalizeLedger({ shops: [{
  id: 'shop', name: 'Próba bolt', multiplier: 1.5,
  items: [{ id: 'stock', catalogId: 'item', name: 'Próba tárgy', rarity: 'Ritka', price: 4000, shopPrice: 5500, stock: 3 }],
  activity: [{ id: 'sale', type: 'sale', itemId: 'stock', delta: -1 }],
  procurements: [{ id: 'order', catalogId: 'item', status: 'ordered' }],
}], catalog: [{ id: 'item', name: 'Próba tárgy', rarity: 'Ritka', price: 4000 }] });

test('previews a full app export without dropping shop state', () => {
  const preview = previewLedgerJsonRestore(exportJson(ledger));
  assert.deepEqual(preview.ledger, ledger);
  assert.deepEqual([preview.shops, preview.catalog, preview.stockRows, preview.activity, preview.procurements], [1, 1, 1, 1, 1]);
});

test('accepts a deliberately empty exported shop list', () => {
  const preview = previewLedgerJsonRestore(exportJson({ shops: [], catalog: [] }));
  assert.equal(preview.shops, 0);
  assert.deepEqual(preview.ledger, { shops: [], catalog: [] });
});

test('rejects catalog-only imports and damaged full backups', () => {
  assert.throws(() => previewLedgerJsonRestore('{bad'), /Érvénytelen JSON/);
  assert.throws(() => previewLedgerJsonRestore(JSON.stringify({ name: 'Egy tárgy', rarity: 'Rare' })), /Teljes/);
  assert.throws(() => previewLedgerJsonRestore(JSON.stringify({ schemaVersion: 2, shops: [], catalog: {} })), /Teljes/);
  const broken = structuredClone(ledger);
  broken.shops[0].items[0].catalogId = 'missing';
  assert.throws(() => previewLedgerJsonRestore(exportJson(broken)), /Hibás bolti tárgy/);
  broken.shops[0].items[0].catalogId = 'item';
  broken.shops[0].multiplier = -1;
  assert.throws(() => previewLedgerJsonRestore(exportJson(broken)), /Hibás vagy ismétlődő bolt/);
});
