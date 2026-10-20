import test from 'node:test';
import assert from 'node:assert/strict';
import { previewItemImport } from '../src/itemImport.js';

test('imports a single machine-readable item with English D&D values and defaults', () => {
  const preview = previewItemImport(JSON.stringify({
    id: 'foreign-id', name: 'Moonlit Blade', rarity: 'Rare', type: 'Weapon', description: 'Glows at night.', stock: 9,
  }), []);
  assert.equal(preview.total, 1);
  assert.equal(preview.items.length, 1);
  assert.deepEqual(preview.issues, []);
  assert.deepEqual(preview.items[0], {
    name: 'Moonlit Blade', rarity: 'Ritka', kind: 'Fegyver', category: '', price: 4000,
    image: '/assets/item-type-weapon.jpg', teaser: 'Glows at night.', description: 'Glows at night.', effect: 'Glows at night.',
  });
});

test('imports the catalog from a full export and leaves shops and stock out', () => {
  const preview = previewItemImport(JSON.stringify({
    schemaVersion: 2,
    shops: [{ id: 'shop', items: [{ name: 'Shop-only item', rarity: 'Gyakori' }] }],
    catalog: [{ id: 'potion', name: 'Healing Draught', rarity: 'Uncommon', kind: 'Potion', price: 200, image: 'https://example.org/potion.png', stock: 4 }],
  }), []);
  assert.equal(preview.items.length, 1);
  assert.equal(preview.items[0].name, 'Healing Draught');
  assert.equal(preview.items[0].price, 200);
  assert.equal(preview.items[0].image, 'https://example.org/potion.png');
  assert.equal('stock' in preview.items[0], false);
  assert.equal('id' in preview.items[0], false);
});

test('recognizes legacy exported item categories as D&D types', () => {
  const preview = previewItemImport(JSON.stringify({ catalog: [
    { name: 'Old potion', rarity: 'Gyakori', kind: 'Csodás tárgy', category: 'Ital', price: 50 },
    { name: 'Old scroll', rarity: 'Gyakori', kind: 'Varázstekercs', category: 'Tekercs', price: 50 },
  ] }), []);
  assert.equal(preview.items[0].kind, 'Ital');
  assert.equal(preview.items[0].category, '');
  assert.equal(preview.items[1].kind, 'Tekercs');
});

test('keeps valid array entries while reporting duplicates and invalid records', () => {
  const preview = previewItemImport(JSON.stringify([
    { name: 'Existing', rarity: 'Common' },
    { name: 'New Rod', rarity: 'Uncommon', category: 'Rods' },
    { name: 'New Rod', rarity: 'Uncommon', category: 'Rods' },
    { name: 'Bad price', rarity: 'Rare', price: -4 },
    { name: 'No rarity' },
  ]), [{ name: 'Existing', rarity: 'Gyakori' }]);
  assert.deepEqual(preview.items.map(item => item.name), ['New Rod']);
  assert.equal(preview.items[0].kind, 'Jogar');
  assert.equal(preview.duplicates, 2);
  assert.deepEqual(preview.issues.map(issue => issue.index), [4, 5]);
});

test('rejects malformed JSON and unsupported top-level shapes', () => {
  assert.throws(() => previewItemImport('{bad', []), /Érvénytelen JSON/);
  assert.throws(() => previewItemImport('{"shops":[]}', []), /Nem található tárgy/);
});
