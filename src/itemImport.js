import { rarities } from './shopData.js';
import { defaultImageFor, itemTypes, suggestedBasePrice } from './itemTypes.js';

const normalized = value => value.trim().toLocaleLowerCase('hu-HU');
const rarityNames = new Map([
  ...rarities.map(rarity => [normalized(rarity), rarity]),
  ['common', 'Gyakori'], ['uncommon', 'Nem gyakori'], ['rare', 'Ritka'],
  ['very rare', 'Nagyon ritka'], ['legendary', 'Legendás'], ['artifact', 'Artefaktum'],
]);
const typeNames = new Map([
  ...itemTypes.map(type => [normalized(type.name), type.name]),
  ['armor', 'Páncél'], ['potion', 'Ital'], ['potions', 'Ital'],
  ['ring', 'Gyűrű'], ['rings', 'Gyűrű'], ['rod', 'Jogar'], ['rods', 'Jogar'],
  ['scroll', 'Tekercs'], ['scrolls', 'Tekercs'], ['staff', 'Varázsbot'], ['staffs', 'Varázsbot'], ['staves', 'Varázsbot'],
  ['varázstekercs', 'Tekercs'],
  ['wand', 'Varázspálca'], ['wands', 'Varázspálca'], ['weapon', 'Fegyver'], ['weapons', 'Fegyver'],
  ['wondrous item', 'Csodás tárgy'], ['wondrous items', 'Csodás tárgy'],
]);

const keyFor = item => `${normalized(item.name)}|${item.rarity}`;

function sourceItems(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.catalog)) return parsed.catalog;
    if (Array.isArray(parsed.items)) return parsed.items;
    if ('name' in parsed) return [parsed];
  }
  throw new Error('Nem található tárgy. Adj meg egy tárgyat, tárgylistát vagy exportált catalog listát.');
}

function optionalText(row, field) {
  if (row[field] == null) return '';
  if (typeof row[field] !== 'string') throw new Error(`A(z) ${field} mező szöveg legyen.`);
  return row[field].trim();
}

function normalizeItem(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('A tárgy JSON objektum legyen.');
  const name = optionalText(row, 'name');
  if (!name) throw new Error('Hiányzik a tárgy neve (name).');
  const rarityInput = optionalText(row, 'rarity');
  const rarity = rarityNames.get(normalized(rarityInput));
  if (!rarity) throw new Error('Ismeretlen vagy hiányzó ritkaság (rarity).');

  const categoryInput = optionalText(row, 'category');
  const kindInput = optionalText(row, 'kind') || optionalText(row, 'type') || optionalText(row, 'itemType');
  let kind = kindInput ? typeNames.get(normalized(kindInput)) : typeNames.get(normalized(categoryInput)) ?? 'Csodás tárgy';
  if (!kind) throw new Error('Ismeretlen típus (kind vagy type).');
  const categoryType = typeNames.get(normalized(categoryInput));
  if (kind === 'Csodás tárgy' && categoryType && categoryType !== kind) kind = categoryType;
  const category = categoryType === kind ? '' : categoryInput;

  const rawPrice = row.price ?? row.basePrice;
  const price = rawPrice == null ? suggestedBasePrice(rarity, kind) : Number(rawPrice);
  if (rawPrice === '' || (price !== '' && (!Number.isFinite(price) || price < 0))) throw new Error('Az alapár (price) nem lehet negatív vagy érvénytelen.');

  const rawImage = optionalText(row, 'image') || optionalText(row, 'imageUrl');
  if (rawImage && !rawImage.startsWith('/assets/') && !/^https?:\/\//i.test(rawImage)) throw new Error('A kép (image) HTTPS/HTTP URL vagy /assets/ útvonal legyen.');
  const description = optionalText(row, 'description');
  const teaser = optionalText(row, 'teaser') || description || 'Egyedi varázstárgy.';
  const effect = optionalText(row, 'effect') || description || 'A tárgy hatását a mesélő határozza meg.';
  return { name, rarity, kind, category, price: price === '' ? null : price,
    image: rawImage || defaultImageFor(kind), teaser,
    description: description || 'A mesélő által hozzáadott varázstárgy.', effect };
}

export function previewItemImport(json, catalog) {
  let parsed;
  try { parsed = JSON.parse(json); } catch { throw new Error('Érvénytelen JSON. Ellenőrizd a szintaxist.'); }
  const source = sourceItems(parsed);
  const known = new Set(catalog.map(keyFor));
  const items = [];
  const issues = [];
  let duplicates = 0;
  source.forEach((row, index) => {
    try {
      const item = normalizeItem(row);
      const key = keyFor(item);
      if (known.has(key)) { duplicates += 1; return; }
      known.add(key);
      items.push(item);
    } catch (error) { issues.push({ index: index + 1, reason: error.message }); }
  });
  return { total: source.length, items, duplicates, issues };
}
