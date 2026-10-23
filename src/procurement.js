import { makeId, salePriceFor, shopItemFromCatalog } from './shopData.js';

export const settlements = [
  { id: 'village', label: 'Falu (≤1 000 fő)' },
  { id: 'small-town', label: 'Kisváros (1–10 ezer fő)' },
  { id: 'city', label: 'Város (10–50 ezer fő)' },
  { id: 'large-city', label: 'Nagyváros (50–200 ezer fő)' },
  { id: 'metropolis', label: 'Metropolisz (200 ezer fő felett)' },
];

const chances = {
  village: [90, 40, 15, 0, 0],
  'small-town': [95, 65, 25, 5, 0],
  city: [100, 80, 45, 15, 2],
  'large-city': [100, 95, 65, 30, 6],
  metropolis: [100, 100, 85, 45, 12],
};
const rarityOrder = ['Gyakori', 'Nem gyakori', 'Ritka', 'Nagyon ritka', 'Legendás'];
const markupByRoll = [0, 10, 10, 25, 50, 100];
export const markupReasons = ['Meglepően könnyen hozzáférhető', 'Szokásos beszerzési költség', 'Szokásos beszerzési költség', 'Szállítási nehézségek', 'Ritka forrás, monopólium vagy vám', 'Kockázatos kapcsolat vagy feketepiaci útvonal'];
const rollDie = (sides, random) => 1 + Math.floor(random() * sides);

export function procurementChance(rarity, settlement = 'city', prevalence = 'normal', specialty = false) {
  const index = rarityOrder.indexOf(rarity);
  const base = chances[settlement]?.[index] ?? 0;
  if (!base) return 0;
  return Math.min(100, Math.max(0, base + ({ scarce: -10, normal: 0, abundant: 10 }[prevalence] ?? 0) + (specialty ? 10 : 0)));
}

export function procurementTime(rarity, random = Math.random) {
  if (rarity === 'Gyakori') return { amount: rollDie(4, random), unit: 'nap', formula: '1d4 nap' };
  if (rarity === 'Nem gyakori') return { amount: rollDie(6, random) + 2, unit: 'nap', formula: '1d6+2 nap' };
  if (rarity === 'Ritka') return { amount: rollDie(6, random) + rollDie(6, random) + 3, unit: 'nap', formula: '2d6+3 nap' };
  if (rarity === 'Nagyon ritka') return { amount: rollDie(10, random) + rollDie(10, random) + 10, unit: 'nap', formula: '2d10+10 nap' };
  if (rarity === 'Legendás') return { amount: rollDie(4, random) + 1, unit: 'hónap', formula: '1d4+1 hónap' };
  return null;
}

export function procurementQuote(item, shop, options = {}, random = Math.random) {
  const settlement = options.settlement ?? shop?.settlementSize ?? 'city';
  const prevalence = options.prevalence ?? shop?.magicPrevalence ?? 'normal';
  const specialty = Boolean(options.specialty);
  const chance = procurementChance(item?.rarity, settlement, prevalence, specialty);
  const availabilityRoll = rollDie(100, random);
  const success = chance > 0 && availabilityRoll <= chance;
  const markupRoll = success ? rollDie(6, random) : null;
  const markupPercent = markupRoll ? markupByRoll[markupRoll - 1] : null;
  const time = success ? procurementTime(item.rarity, random) : null;
  const basePrice = item?.price == null ? null : salePriceFor(item, shop);
  return { settlement, prevalence, specialty, chance, availabilityRoll, success, markupRoll, markupPercent, markupReason: markupRoll ? markupReasons[markupRoll - 1] : null,
    timeAmount: time?.amount ?? null, timeUnit: time?.unit ?? null, timeFormula: time?.formula ?? null,
    quotedPrice: success && basePrice != null ? Math.round(basePrice * (1 + markupPercent / 100)) : null };
}

export function reviseProcurementQuote(quote, item, shop, changes) {
  const next = { ...quote, ...changes };
  if ('availabilityRoll' in changes) next.success = next.chance > 0 && Number(next.availabilityRoll) <= next.chance;
  if ('markupRoll' in changes) {
    next.markupPercent = markupByRoll[Number(next.markupRoll) - 1] ?? 0;
    next.markupReason = markupReasons[Number(next.markupRoll) - 1] ?? '';
    next.quotedPrice = item.price == null ? null : Math.round(salePriceFor(item, shop) * (1 + next.markupPercent / 100));
  }
  return next;
}

export function saveProcurement(shop, item, quote, note = '', { id = makeId(), at = new Date().toISOString() } = {}) {
  if (!item || !quote || item.rarity === 'Artefaktum') return null;
  const price = quote.quotedPrice == null || quote.quotedPrice === '' ? null : Number(quote.quotedPrice);
  const amount = Number(quote.timeAmount);
  const availabilityRoll = Number(quote.availabilityRoll);
  if (!Number.isInteger(availabilityRoll) || availabilityRoll < 1 || availabilityRoll > 100) return null;
  if (quote.success && (!Number.isInteger(amount) || amount < 1 || !Number.isInteger(Number(quote.markupRoll)) || Number(quote.markupRoll) < 1 || Number(quote.markupRoll) > 6 || price != null && (!Number.isFinite(price) || price < 0))) return null;
  const order = { id, at, itemId: item.id, item: { ...item }, itemName: item.name, rarity: item.rarity,
    status: quote.success ? 'ordered' : 'failed', settlement: quote.settlement, prevalence: quote.prevalence,
    specialty: quote.specialty, chance: quote.chance, availabilityRoll,
    markupRoll: quote.success ? Number(quote.markupRoll) : null, markupPercent: quote.success ? quote.markupPercent : null,
    markupReason: quote.success ? quote.markupReason ?? markupReasons[Number(quote.markupRoll) - 1] : null,
    timeAmount: quote.success ? amount : null, timeUnit: quote.success ? quote.timeUnit : null,
    quotedPrice: quote.success ? price : null, note: note.trim() };
  return { ...shop, procurements: [...(shop.procurements ?? []), order] };
}

export function cancelProcurement(shop, orderId) {
  if (!(shop.procurements ?? []).some(order => order.id === orderId && order.status === 'ordered')) return null;
  return { ...shop, procurements: shop.procurements.map(order => order.id === orderId ? { ...order, status: 'cancelled' } : order) };
}

export function receiveProcurement(shop, orderId, { id = makeId(), at = new Date().toISOString() } = {}) {
  const order = (shop.procurements ?? []).find(entry => entry.id === orderId && entry.status === 'ordered');
  if (!order || !order.item) return null;
  const existing = shop.items.find(item => item.catalogId === order.itemId);
  const item = existing ?? shopItemFromCatalog(order.item, 0);
  const change = { itemId: item.id, itemName: item.name, before: item.stock, after: item.stock + 1,
    ...(!existing ? { created: true } : {}) };
  return { ...shop,
    items: existing ? shop.items.map(entry => entry.id === existing.id ? { ...entry, stock: entry.stock + 1 } : entry)
      : [...shop.items, { ...item, stock: 1 }],
    procurements: shop.procurements.map(entry => entry.id === orderId ? { ...entry, status: 'received', receivedAt: at } : entry),
    activity: [...(shop.activity ?? []), { id, at, type: 'procurement', procurementId: orderId, changes: [change] }],
  };
}
