import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defaultImageFor, imageForItem, itemTypes, normalizedItemKind, suggestedBasePrice } from '../src/itemTypes.js';

test('all D&D 2024 magic-item categories have bundled illustrations', () => {
  assert.deepEqual(itemTypes.map(type => type.name), [
    'Páncél', 'Ital', 'Gyűrű', 'Jogar', 'Tekercs', 'Varázsbot', 'Varázspálca', 'Fegyver', 'Csodás tárgy',
  ]);
  for (const type of itemTypes) assert.ok(existsSync(join('public', type.image.slice(1))), type.name);
});

test('rarity suggests the 2024 value, halves potions, and leaves artifacts priceless', () => {
  assert.deepEqual(['Gyakori', 'Nem gyakori', 'Ritka', 'Nagyon ritka', 'Legendás'].map(rarity => suggestedBasePrice(rarity, 'Fegyver')),
    [100, 400, 4000, 40000, 200000]);
  assert.equal(suggestedBasePrice('Ritka', 'Ital'), 2000);
  assert.equal(suggestedBasePrice('Artefaktum', 'Fegyver'), '');
});

test('legacy item categories and invalid image URLs fall back to the matching local illustration', () => {
  const legacyPotion = { kind: 'Csodás tárgy', category: 'Ital', image: 'javascript:invalid' };
  assert.equal(normalizedItemKind(legacyPotion), 'Ital');
  assert.equal(imageForItem(legacyPotion), defaultImageFor('Ital'));
  assert.equal(imageForItem({ kind: 'Jogar', image: 'https://example.com/rod.png' }), 'https://example.com/rod.png');
});
