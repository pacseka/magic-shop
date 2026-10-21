import { useState } from 'react';
import { ArrowLeft, ImageSquare, X } from '@phosphor-icons/react';
import { ItemImage, ItemImagePicker } from './ItemImagePicker.jsx';
import { defaultImageFor, isDefaultImage, itemTypes, suggestedBasePrice } from './itemTypes.js';
import { rarities } from './shopData.js';

function priceHint(item) {
  if (item.rarity === 'Artefaktum') return 'Az artefaktum felbecsülhetetlen; az alapár üresen hagyható.';
  if (item.kind === 'Tekercs') return 'Varázstekercsnél a másolási költség eltérhet. Az alapár átírható.';
  if (item.kind === 'Ital') return 'Fogyóeszköz: a ritkasági érték felét ajánljuk. Az alapár átírható.';
  return 'A ritkasági táblázat szerinti javaslat. Az alapár átírható.';
}

export function MagicItemEditor({ item, onChange, onSubmit, onCancel, onClose, shop, mode, editing }) {
  const [choosingImage, setChoosingImage] = useState(false);
  const customUrl = item.image && !item.image.startsWith('/assets/') ? item.image : '';
  const update = (field, value) => onChange({ ...item, [field]: value });
  const changeKind = kind => onChange({
    ...item,
    kind,
    price: item.price === suggestedBasePrice(item.rarity, item.kind) ? suggestedBasePrice(item.rarity, kind) : item.price,
    image: isDefaultImage(item.image) ? defaultImageFor(kind) : item.image,
  });

  return <form className="magic-editor" onSubmit={onSubmit}>
    <header className="magic-editor-header">
      <div>
        <h2>{editing ? 'Varázstárgy szerkesztése' : 'Új varázstárgy'}</h2>
        <p>{mode === 'shop' ? `${shop?.location || shop?.name || 'Bolt'} · ${shop?.owner || 'Készlet'}` : 'Közös varázstárgyak · minden boltban használható'}</p>
      </div>
      <button type="button" aria-label="Bezárás" onClick={onClose}><X size={23} /></button>
    </header>

    {choosingImage ? <div className="magic-editor-body magic-editor-image-view">
      <button type="button" className="magic-editor-back" onClick={() => setChoosingImage(false)}><ArrowLeft size={18} /> Vissza az adatokhoz</button>
      <p>Válassz egy illusztrált alapképet. Saját kép URL-jét az adatoknál adhatod meg.</p>
      <ItemImagePicker item={item} onChange={image => update('image', image)} />
    </div> : <div className="magic-editor-body">
      <div className="magic-editor-top">
        <div className="magic-editor-visual">
          <div className="magic-editor-image"><ItemImage item={item} alt="Kiválasztott tárgykép" /></div>
          <button type="button" className="magic-editor-image-button" onClick={() => setChoosingImage(true)}><ImageSquare size={21} /> Kép cseréje</button>
        </div>
        <div className="magic-editor-fields">
          <label>Tárgy neve<input autoFocus required value={item.name} onChange={event => update('name', event.target.value)} placeholder="Például: Holdfény amulettje" /></label>
          <div className="magic-editor-pair">
            <label>Típus<select value={item.kind} onChange={event => changeKind(event.target.value)}>{itemTypes.map(type => <option key={type.name}>{type.name}</option>)}</select></label>
            <label>Ritkaság<select value={item.rarity} onChange={event => onChange({ ...item, rarity: event.target.value, price: suggestedBasePrice(event.target.value, item.kind) })}>{rarities.map(rarity => <option key={rarity}>{rarity}</option>)}</select></label>
          </div>
          <div className={`magic-editor-price-row ${mode === 'shop' ? 'has-stock' : ''}`}>
            <label>Alapár (gp)<input type="number" min="0" step="1" value={item.price} onChange={event => update('price', event.target.value)} placeholder={item.rarity === 'Artefaktum' ? 'Felbecsülhetetlen' : ''} /></label>
            {mode === 'shop' && <label>Készlet<input type="number" min="0" step="1" value={item.stock} onChange={event => update('stock', event.target.value)} /></label>}
            <label>Alkategória<input value={item.category} onChange={event => update('category', event.target.value)} placeholder="Például: köpeny" /></label>
          </div>
          <small className="magic-editor-price-hint">{priceHint(item)}</small>
        </div>
      </div>

      <details className="magic-editor-url">
        <summary>Saját kép URL-je (opcionális)</summary>
        <label>Hivatkozás<input type="url" inputMode="url" pattern="https?://.+" placeholder="https://példa.hu/varazstargy.png" value={customUrl} onChange={event => update('image', event.target.value || defaultImageFor(item.kind))} /></label>
      </details>

      <div className="magic-editor-descriptions">
        <label>Rövid leírás<textarea rows="2" value={item.teaser ?? ''} onChange={event => update('teaser', event.target.value)} placeholder="A listában látható rövid összefoglaló" /></label>
        <label>Leírás<textarea rows="3" value={item.description ?? ''} onChange={event => update('description', event.target.value)} placeholder="Hogyan néz ki, mi a története?" /></label>
        <label>Hatás<textarea rows="3" value={item.effect ?? ''} onChange={event => update('effect', event.target.value)} placeholder="Mit tesz a tárgy használat közben?" /></label>
      </div>
    </div>}

    <footer className="magic-editor-footer">
      <span className="magic-editor-rule" aria-hidden="true" />
      <div>
        <button type="button" className="button button-secondary" onClick={choosingImage ? () => setChoosingImage(false) : onCancel}>{choosingImage ? 'Vissza' : 'Mégse'}</button>
        <button type="submit" className="button button-primary" disabled={!item.name.trim()}>{editing ? 'Mentés' : mode === 'shop' ? 'Boltba és listába' : 'Mentés'}</button>
      </div>
    </footer>
  </form>;
}
