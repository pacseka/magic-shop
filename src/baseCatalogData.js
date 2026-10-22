import { previewItemImport } from './itemImport.js';
import { makeId } from './shopData.js';

const itemKey = item => `${item.name.trim().toLocaleLowerCase('hu-HU')}|${item.rarity}`;

export function previewBaseCatalogImport(json, existing = []) {
  let rows;
  try { rows = JSON.parse(json); } catch { throw new Error('Érvénytelen JSON. Ellenőrizd a szintaxist.'); }
  if (!Array.isArray(rows)) throw new Error('Az alaplistához tárgyak tömbjét töltsd fel.');
  const knownIds = new Set();
  const knownNames = new Map(existing.map(item => [itemKey(item), item.id]));
  const items = [];
  const issues = [];
  rows.forEach((row, index) => {
    try {
      if (typeof row?.id !== 'string' || !/^[a-zA-Z0-9_-]{1,150}$/.test(row.id)) throw new Error('Hiányzó vagy érvénytelen, stabil id.');
      if (knownIds.has(row.id)) throw new Error('Ismétlődő id a fájlban.');
      const result = previewItemImport(JSON.stringify([row]), []);
      if (result.issues.length) throw new Error(result.issues[0].reason);
      const item = result.items[0];
      const otherId = knownNames.get(itemKey(item));
      if (otherId && otherId !== row.id) throw new Error('A név és ritkaság már más azonosítóval szerepel.');
      knownIds.add(row.id);
      knownNames.set(itemKey(item), row.id);
      items.push({ ...item, id: row.id,
        ...(Number.isInteger(row.sourcePage) && row.sourcePage > 0 ? { sourcePage: row.sourcePage } : {}),
        ...(typeof row.requiresAttunement === 'boolean' ? { requiresAttunement: row.requiresAttunement } : {}),
      });
    } catch (error) { issues.push({ index: index + 1, reason: error.message }); }
  });
  return { total: rows.length, items, issues, updates: items.filter(item => existing.some(entry => entry.id === item.id)).length };
}

export function copyBaseItems(ledger, baseItems, selectedIds) {
  const chosen = new Set(selectedIds);
  const knownSources = new Set(ledger.catalog.map(item => item.sourceBaseId).filter(Boolean));
  const knownNames = new Set(ledger.catalog.map(itemKey));
  const additions = [];
  for (const item of baseItems) {
    if (!chosen.has(item.id) || knownSources.has(item.id) || knownNames.has(itemKey(item))) continue;
    additions.push({ ...item, id: makeId(), sourceBaseId: item.id });
    knownSources.add(item.id);
    knownNames.add(itemKey(item));
  }
  return { ledger: additions.length ? { ...ledger, catalog: [...ledger.catalog, ...additions] } : ledger, added: additions.length };
}
