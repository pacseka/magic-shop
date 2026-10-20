export const itemTypes = [
  { name: 'Páncél', image: '/assets/item-type-armor.jpg' },
  { name: 'Ital', image: '/assets/potion.png' },
  { name: 'Gyűrű', image: '/assets/ring.png' },
  { name: 'Jogar', image: '/assets/item-type-rod.jpg' },
  { name: 'Tekercs', image: '/assets/scroll.png' },
  { name: 'Varázsbot', image: '/assets/item-type-staff.jpg' },
  { name: 'Varázspálca', image: '/assets/item-type-wand.jpg' },
  { name: 'Fegyver', image: '/assets/item-type-weapon.jpg' },
  { name: 'Csodás tárgy', image: '/assets/bag.png' },
];

const defaultImages = new Set(itemTypes.map(type => type.image));
const rarityValues = { 'Gyakori': 100, 'Nem gyakori': 400, 'Ritka': 4000, 'Nagyon ritka': 40000, 'Legendás': 200000 };

export const defaultImageFor = kind => itemTypes.find(type => type.name === kind)?.image ?? '/assets/bag.png';
export const publicAssetUrl = path => path?.startsWith('/assets/') ? `${import.meta.env?.BASE_URL || '/'}${path.slice(1)}` : path;
export const isDefaultImage = image => !image || defaultImages.has(image);
export const suggestedBasePrice = (rarity, kind) => rarity === 'Artefaktum' ? '' : (rarityValues[rarity] ?? 100) * (kind === 'Ital' ? 0.5 : 1);
export const imageForItem = item => {
  const image = item?.image?.trim();
  if (image?.startsWith('/assets/')) return publicAssetUrl(image);
  if (/^https?:\/\//i.test(image ?? '')) return image;
  return publicAssetUrl(defaultImageFor(normalizedItemKind(item ?? {})));
};
export const normalizedItemKind = item => {
  if (item.kind === 'Csodás tárgy' && itemTypes.some(type => type.name === item.category && type.name !== 'Csodás tárgy')) return item.category;
  if (itemTypes.some(type => type.name === item.kind)) return item.kind;
  if (item.kind === 'Varázstekercs') return 'Tekercs';
  return itemTypes.some(type => type.name === item.category) ? item.category : 'Csodás tárgy';
};
