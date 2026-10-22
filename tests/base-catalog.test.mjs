import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { copyBaseItems, previewBaseCatalogImport } from '../src/baseCatalogData.js';

const source = readFileSync(new URL('../data/srd-5.2.1-magic-items.json', import.meta.url), 'utf8');

test('the SRD file is ready for an admin upload with stable unique IDs', () => {
  const result = previewBaseCatalogImport(source);
  assert.equal(result.total, 317);
  assert.equal(result.items.length, 317);
  assert.deepEqual(result.issues, []);
  assert.equal(new Set(result.items.map(item => item.id)).size, 317);
});

test('copying produces editable personal definitions without changing stock or the source', () => {
  const base = previewBaseCatalogImport(source).items[0];
  const original = { catalog: [], shops: [{ id: 'shop', items: [] }] };
  const first = copyBaseItems(original, [base], [base.id]);
  assert.equal(first.added, 1);
  assert.notEqual(first.ledger.catalog[0].id, base.id);
  assert.equal(first.ledger.catalog[0].sourceBaseId, base.id);
  assert.deepEqual(first.ledger.shops, original.shops);
  first.ledger.catalog[0].name = 'Custom name';
  assert.notEqual(base.name, first.ledger.catalog[0].name);
  assert.equal(copyBaseItems(first.ledger, [base], [base.id]).added, 0);
});

test('an admin upload rejects duplicate and invalid IDs', () => {
  const row = JSON.parse(source)[0];
  const result = previewBaseCatalogImport(JSON.stringify([row, row, { ...row, id: '../unsafe' }]));
  assert.equal(result.items.length, 1);
  assert.equal(result.issues.length, 2);
});
