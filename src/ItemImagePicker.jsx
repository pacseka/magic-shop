import { useEffect, useState } from 'react';
import { defaultImageFor, imageForItem, itemTypes, normalizedItemKind, publicAssetUrl } from './itemTypes.js';

export function ItemImage({ item, alt = '', ...props }) {
  const fallback = defaultImageFor(normalizedItemKind(item));
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.image, item.kind]);
  return <img {...props} src={failed ? publicAssetUrl(fallback) : imageForItem(item)} alt={alt} onError={() => setFailed(true)} />;
}

export function ItemImagePicker({ item, onChange }) {
  const image = item.image ?? '';
  const customUrl = image && !image.startsWith('/assets/') ? image : '';
  const preview = imageForItem(item);
  return <fieldset className="item-image-picker">
    <legend>Tárgy képe</legend>
    <div className="item-image-choices" aria-label="Alapképek">
      {itemTypes.map(type => <button key={type.name} type="button" className={`item-image-choice ${preview === publicAssetUrl(type.image) && !customUrl ? 'is-active' : ''}`} aria-pressed={preview === publicAssetUrl(type.image) && !customUrl} onClick={() => onChange(type.image)}><img src={publicAssetUrl(type.image)} alt="" /><span>{type.name}</span></button>)}
    </div>
    <div className="item-image-preview"><span>Előnézet</span><ItemImage item={item} alt="Kiválasztott tárgykép előnézete" /><small>{customUrl ? 'Saját URL' : 'Alapkép'}</small></div>
  </fieldset>;
}
