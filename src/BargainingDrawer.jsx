import { useMemo, useState } from 'react';
import { Coins, MagnifyingGlass, Minus, Plus, Scales, X } from '@phosphor-icons/react';
import { ItemImage } from './ItemImagePicker.jsx';
import { publicAssetUrl } from './itemTypes.js';
import { bargainSuccessPercent, suggestedBargainPrice } from './bargainingRules.js';

const money = value => new Intl.NumberFormat('hu-HU').format(value);
const methods = [
  ['persuasion', 'Rábeszélés'],
  ['deception', 'Megtévesztés'],
  ['intimidation', 'Megfélemlítés'],
  ['performance', 'Előadás'],
];
const validPrice = value => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
const buybackSuggestion = item => item?.price == null ? '' : Math.round(Number(item.price) / 2);

export function BargainingDrawer({ shop, catalog, selected, salePrice, onApplySale, onBuyback, onOpenCatalog, onClose }) {
  const [mode, setMode] = useState(selected ? 'sell' : 'buy');
  const [itemId, setItemId] = useState(selected?.catalogId ?? catalog[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [openingOffer, setOpeningOffer] = useState(selected ? salePrice : buybackSuggestion(catalog[0]));
  const [finalOverride, setFinalOverride] = useState(null);
  const [attitude, setAttitude] = useState('indifferent');
  const [response, setResponse] = useState('hesitant');
  const [intelligence, setIntelligence] = useState(12);
  const [dcOverride, setDcOverride] = useState(null);
  const [method, setMethod] = useState('persuasion');
  const [rollTotal, setRollTotal] = useState('');
  const [error, setError] = useState('');

  const catalogItem = catalog.find(item => item.id === itemId) ?? null;
  const item = mode === 'sell' ? selected : catalogItem;
  const matches = useMemo(() => catalog.filter(entry => `${entry.name} ${entry.rarity}`.toLocaleLowerCase('hu-HU').includes(search.toLocaleLowerCase('hu-HU'))).slice(0, 6), [catalog, search]);
  const dc = dcOverride ?? Math.max(15, Number(intelligence) || 0);
  const rolled = rollTotal !== '' && Number.isFinite(Number(rollTotal));
  const successPercent = bargainSuccessPercent(response, rollTotal, dc);
  const success = successPercent > 0;
  const failed = response === 'unwilling' || (response === 'hesitant' && rolled && !success);
  const suggested = suggestedBargainPrice(openingOffer, successPercent, mode);
  const finalPrice = finalOverride ?? suggested;
  const canAccept = Boolean(item) && validPrice(openingOffer) && validPrice(finalPrice) && Number.isInteger(Number(finalPrice)) && (mode === 'buy' || selected?.stock > 0);

  function changeMode(next) {
    setMode(next);
    setOpeningOffer(next === 'sell' ? salePrice : buybackSuggestion(catalogItem));
    setFinalOverride(null);
    setError('');
  }

  function chooseItem(next) {
    setItemId(next.id);
    setSearch('');
    setOpeningOffer(buybackSuggestion(next));
    setFinalOverride(null);
    setError('');
  }

  function submit(event) {
    event.preventDefault();
    if (!canAccept || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) return;
    const negotiation = {
      method, attitude, response, intelligence: Number(intelligence), dc: Number(dc),
      rollTotal: rolled ? Number(rollTotal) : null, result: success ? 'success' : failed ? 'failure' : 'unrolled',
      openingOffer: Number(openingOffer), finalOffer: Number(finalPrice), suggestedPercent: successPercent,
    };
    if (mode === 'sell') {
      onApplySale(Number(finalPrice), negotiation);
      return;
    }
    if (onBuyback(catalogItem, Number(quantity), Number(finalPrice), negotiation)) return;
    setError('A felvásárlást nem sikerült menteni. Próbáld újra.');
  }

  return <div className="bargaining-drawer">
    <header className="bargaining-header">
      <img src={publicAssetUrl('/assets/merchant-offer.png')} alt="" />
      <button type="button" className="bargaining-close" aria-label="Ajánlat bezárása" onClick={onClose}><X size={25} /></button>
      <h2 id="bargaining-title">Kereskedői ajánlat</h2>
      <p>Alku és tárgyfelvásárlás a játékasztalnál</p>
    </header>
    <form onSubmit={submit} className="bargaining-body">
      <div className="bargaining-fields">
      <div className="bargaining-mode" role="group" aria-label="Üzlet iránya">
        <button type="button" className={mode === 'sell' ? 'is-active' : ''} aria-pressed={mode === 'sell'} disabled={!selected} onClick={() => changeMode('sell')}>Bolt elad <small>játékos vásárol</small></button>
        <button type="button" className={mode === 'buy' ? 'is-active' : ''} aria-pressed={mode === 'buy'} onClick={() => changeMode('buy')}>Bolt vesz <small>játékos elad</small></button>
      </div>

      {mode === 'buy' ? <section className="bargaining-section" aria-labelledby="bargain-item-title">
        <h3 id="bargain-item-title">1. Tárgy kiválasztása</h3>
        <p>A játékos felajánlott tárgyát válaszd ki a saját tárgylistából. Játékos-készletet az app nem vezet.</p>
        <label className="bargaining-search"><MagnifyingGlass size={18} aria-hidden="true" /><input autoFocus type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Keresés a saját tárgylistában…" aria-label="Felajánlott tárgy keresése" /></label>
        {search && <div className="bargaining-results" role="listbox" aria-label="Találatok">{matches.length ? matches.map(entry => <button type="button" role="option" aria-selected={entry.id === itemId} key={entry.id} onClick={() => chooseItem(entry)}>{entry.name} <small>{entry.rarity}</small></button>) : <p>Nincs találat.</p>}</div>}
        {catalogItem ? <div className="bargaining-item"><span className="bargaining-item-image"><ItemImage item={catalogItem} alt="" /></span><span><strong>{catalogItem.name}</strong><small>{catalogItem.rarity} · {catalogItem.teaser}</small></span></div> : <p className="bargaining-empty">Még nincs tárgy a saját listában.</p>}
        <label className="bargaining-inline">Mennyiség <span className="bargaining-stepper"><button type="button" aria-label="Mennyiség csökkentése" disabled={quantity <= 1} onClick={() => setQuantity(value => Math.max(1, value - 1))}><Minus size={15} /></button><input type="number" min="1" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} aria-label="Felvásárolt darabszám" /><button type="button" aria-label="Mennyiség növelése" onClick={() => setQuantity(value => Number(value || 0) + 1)}><Plus size={15} /></button></span></label>
        <button type="button" className="bargaining-text-action" onClick={onOpenCatalog}>Nincs a listában? Új tárgy létrehozása</button>
      </section> : <section className="bargaining-section"><h3>1. Kiválasztott bolti tárgy</h3><div className="bargaining-item"><span className="bargaining-item-image"><ItemImage item={selected} alt="" /></span><span><strong>{selected.name}</strong><small>{selected.rarity} · {selected.stock} db készleten</small></span></div></section>}

      <section className="bargaining-section" aria-labelledby="bargain-value-title">
        <h3 id="bargain-value-title">2. Érték és ajánlat</h3>
        <div className="bargaining-value"><span>{mode === 'buy' ? 'Katalógus alapértéke' : 'Bolti ár'}</span><strong>{mode === 'buy' ? item?.price == null ? 'Felbecsülhetetlen' : `${money(item.price)} gp` : `${money(selected ? salePrice : 0)} gp`}</strong></div>
        <p className="bargaining-house-rule"><Coins size={21} aria-hidden="true" /><span><strong>Opcionális háziszabály.</strong> {mode === 'buy' ? 'Kezdő felvásárlási ajánlat: a katalógusérték 50%-a; sikerre 5/10/15% emelés.' : 'Sikeres alku esetén 5/10/15% kedvezmény a siker mértéke szerint.'}</span></p>
        <label className="bargaining-inline">{mode === 'buy' ? 'Kezdő felvásárlási ajánlat' : 'Kiinduló eladási ár'} <span className="bargaining-price"><input type="number" min="0" step="1" value={openingOffer} onChange={event => { setOpeningOffer(event.target.value); setFinalOverride(null); }} aria-label="Kiinduló ajánlat aranyban" /> gp</span></label>
      </section>

      <section className="bargaining-section" aria-labelledby="bargain-check-title">
        <h3 id="bargain-check-title">3. Hozzáállás és próba</h3>
        <div className="bargaining-grid"><label>Hozzáállás<select value={attitude} onChange={event => setAttitude(event.target.value)}><option value="friendly">Barátságos · előny</option><option value="indifferent">Közömbös</option><option value="hostile">Ellenséges · hátrány</option></select></label><label>Kérés megítélése<select value={response} onChange={event => { setResponse(event.target.value); setFinalOverride(null); }}><option value="hesitant">Habozik · próba</option><option value="willing">Beleegyezik · próba nélkül</option><option value="unwilling">Elutasítja · nincs alku</option></select></label></div>
        <div className="bargaining-grid"><label>Kereskedő INT<input type="number" min="1" max="30" step="1" value={intelligence} onChange={event => { setIntelligence(event.target.value); setDcOverride(null); setFinalOverride(null); }} /></label><label>Próba DC<input type="number" min="1" max="30" step="1" value={dc} onChange={event => { setDcOverride(event.target.value); setFinalOverride(null); }} /></label></div>
        <p className="bargaining-hint">Alap DC: 15 vagy a kereskedő INT-je, amelyik magasabb. A mesélő átírhatja.</p>
        <fieldset className="bargaining-methods"><legend>Befolyásolás módja</legend>{methods.map(([key, label]) => <label key={key} className={method === key ? 'is-active' : ''}><input type="radio" name="bargain-method" value={key} checked={method === key} onChange={() => setMethod(key)} />Karizma ({label})</label>)}</fieldset>
        {response === 'hesitant' && <label className="bargaining-inline">Próba összesen<input className="bargaining-roll" type="number" step="1" value={rollTotal} onChange={event => { setRollTotal(event.target.value); setFinalOverride(null); }} placeholder="d20 + módosítók" /></label>}
        <p className={`bargaining-result ${success ? 'is-success' : failed ? 'is-failure' : ''}`} role="status">{success ? `${response === 'willing' ? 'Próba nélküli beleegyezés' : `Sikeres próba · DC${Number(rollTotal) > Number(dc) ? `+${Number(rollTotal) - Number(dc)}` : ''}`} · ${successPercent}% ${mode === 'sell' ? 'kedvezmény' : 'ajánlatemelés'} javasolt.` : failed ? 'Nincs alku. Ugyanígy 24 óra múlva próbálható újra, vagy a mesélő döntése szerint.' : 'A próba eredménye nélkül a kiinduló ajánlat marad.'}</p>
      </section>

      <section className="bargaining-section bargaining-final" aria-labelledby="bargain-final-title"><h3 id="bargain-final-title">4. Végső ajánlat</h3><p>DC elérése: {mode === 'sell' ? '−' : '+'}5%, DC+5: {mode === 'sell' ? '−' : '+'}10%, DC+10: {mode === 'sell' ? '−' : '+'}15%. Próba nélküli beleegyezés: 5%. A végső összeg szabadon átírható.</p><label className="bargaining-inline">Egységár <span className="bargaining-price"><input type="number" min="0" step="1" value={finalPrice} onChange={event => setFinalOverride(event.target.value)} aria-label="Végső ajánlat aranyban" /> gp</span></label>{mode === 'buy' && <p className="bargaining-stock-note"><Plus size={18} aria-hidden="true" /> A felvásárlás {quantity || 0} darabot ad ehhez a bolt készletéhez, és naplózható, visszavonható.</p>}</section>
      {error && <p className="bargaining-error" role="alert">{error}</p>}
      </div>
      <div className="bargaining-actions"><button type="button" className="button button-secondary" onClick={onClose}>Mégse</button><button type="submit" className="button button-primary" disabled={!canAccept || (mode === 'buy' && (!Number.isInteger(Number(quantity)) || Number(quantity) < 1))}><Scales size={19} />{mode === 'buy' ? `Felvásárlás rögzítése · ${money(Number(finalPrice || 0) * Number(quantity || 0))} gp` : `Ár átvétele · ${money(Number(finalPrice || 0))} gp`}</button></div>
    </form>
  </div>;
}
