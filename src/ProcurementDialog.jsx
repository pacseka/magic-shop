import { useEffect, useMemo, useState } from 'react';
import { procurementChance, procurementQuote, reviseProcurementQuote, settlements } from './procurement.js';
import { salePriceFor } from './shopData.js';

const money = value => new Intl.NumberFormat('hu-HU').format(value);
const statusText = { ordered: 'Megrendelve', received: 'Megérkezett', failed: 'Nem beszerezhető', cancelled: 'Lemondva' };

export function ProcurementDialog({ shop, catalog, initialSearch = '', initialView = 'orders', onSave, onReceive, onCancel, onOpenCatalog }) {
  const [view, setView] = useState(initialView);
  const [search, setSearch] = useState(initialSearch);
  const [itemId, setItemId] = useState('');
  const [settlement, setSettlement] = useState(shop.settlementSize || 'city');
  const [prevalence, setPrevalence] = useState(shop.magicPrevalence || 'normal');
  const [specialty, setSpecialty] = useState(false);
  const [quote, setQuote] = useState(null);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const matches = useMemo(() => catalog.filter(item => `${item.name} ${item.rarity} ${item.kind}`.toLocaleLowerCase('hu-HU').includes(search.toLocaleLowerCase('hu-HU'))), [catalog, search]);
  const available = useMemo(() => search.trim().length < 2 ? [] : matches.filter(entry => !shop.items.some(stock => stock.catalogId === entry.id && stock.stock > 0)), [matches, search, shop.items]);
  const item = catalog.find(entry => entry.id === itemId);
  const chance = procurementChance(item?.rarity, settlement, prevalence, specialty);
  const orders = [...(shop.procurements ?? [])].reverse();

  useEffect(() => { setQuote(null); }, [itemId, settlement, prevalence, specialty]);

  function roll() {
    if (!item || item.rarity === 'Artefaktum') return;
    setQuote(procurementQuote(item, shop, { settlement, prevalence, specialty }));
    setMessage('');
  }

  function changeResult(success) {
    setQuote(current => ({ ...current, success,
      timeAmount: success ? current.timeAmount ?? 1 : null,
      timeUnit: success ? current.timeUnit ?? (item.rarity === 'Legendás' ? 'hónap' : 'nap') : null,
      markupRoll: success ? current.markupRoll ?? 1 : null,
      markupPercent: success ? current.markupPercent ?? 0 : null,
      markupReason: success ? current.markupReason ?? 'Meglepően könnyen hozzáférhető' : null,
      quotedPrice: success ? current.quotedPrice ?? (item.price == null ? null : salePriceFor(item, shop)) : null }));
  }

  function save() {
    if (!item || !quote) return;
    const result = onSave(item, quote, note);
    if (result !== true) { setMessage(typeof result === 'string' ? result : 'Ellenőrizd a dobásokat, a beszerzési időt és az árat.'); return; }
    setQuote(null);
    setNote('');
    setMessage('A beszerzés elmentve ennél a boltnál.');
    setView('orders');
  }

  return <div className="procurement-dialog">
    <div className="procurement-tabs" role="tablist" aria-label="Beszerzés nézetei">
      <button type="button" role="tab" aria-selected={view === 'orders'} className={view === 'orders' ? 'is-active' : ''} onClick={() => setView('orders')}>Megrendelések ({orders.filter(order => order.status === 'ordered').length})</button>
      <button type="button" role="tab" aria-selected={view === 'new'} className={view === 'new' ? 'is-active' : ''} onClick={() => setView('new')}>Új ajánlat</button>
    </div>
    {message && <p className="procurement-message" role="status">{message}</p>}
    {view === 'orders' ? <>
      <p className="dialog-intro">A megrendelés játékbeli idő szerint halad. A készlet csak a „Megérkezett” művelet után nő.</p>
      {orders.length ? <div className="procurement-orders">{orders.map(order => <article className="procurement-order" key={order.id}>
        <div><strong>{order.itemName}</strong><span className={`procurement-status status-${order.status}`}>{statusText[order.status] ?? order.status}</span></div>
        <small>{order.rarity} · {new Date(order.at).toLocaleString('hu-HU')}</small>
        <p>{order.status === 'failed' ? `Nem találtak forrást · ${order.chance}% esély · dobás: ${order.availabilityRoll}` : <>{order.timeAmount} {order.timeUnit} · {order.quotedPrice == null ? 'Ár: mesélői döntés' : `${money(order.quotedPrice)} gp`} · {order.chance}% esély · dobás: {order.availabilityRoll}</>}</p>
        {order.markupReason && <small>+{order.markupPercent}% · {order.markupReason}</small>}
        {order.note && <p className="procurement-note">{order.note}</p>}
        {order.status === 'ordered' && <div className="procurement-order-actions"><button type="button" className="button button-primary" onClick={() => onReceive(order.id)}>Megérkezett · +1 db</button><button type="button" className="button button-secondary" onClick={() => onCancel(order.id)}>Lemondás</button></div>}
      </article>)}</div> : <p className="empty-results">Ehhez a bolthoz még nincs beszerzés.</p>}
    </> : <>
      <p className="dialog-intro">Válassz egy hiányzó tárgyat a saját listádból. Az ajánlat csak mentés után kerül a bolt megrendelései közé.</p>
      <label className="procurement-search">Tárgy keresése<input autoFocus value={search} onChange={event => { setSearch(event.target.value); setItemId(''); }} placeholder="Írj be legalább 2 karaktert" /></label>
      {available.length > 0 && <div className="procurement-catalog" role="radiogroup" aria-label="Beszerzendő tárgy">
        {available.slice(0, 40).map(entry => <label key={entry.id} className={entry.id === itemId ? 'is-selected' : ''}><input type="radio" name="procurement-item" checked={entry.id === itemId} onChange={() => setItemId(entry.id)} /><span><strong>{entry.name}</strong><small>{entry.rarity} · {entry.price == null ? 'Ár nélkül' : `${money(entry.price)} gp alapár`}</small></span></label>)}
      </div>}
      {search.trim().length < 2 && <p className="field-hint">Írj be legalább két karaktert a saját tárgylista kereséséhez.</p>}
      {available.length > 40 && <p className="field-hint">{available.length} találat · pontosítsd a keresést a többi tárgyhoz.</p>}
      {(!catalog.length || search.trim().length >= 2 && !available.length) && <div className="procurement-no-match"><p className="empty-results">Nincs ilyen hiányzó tárgy a saját listában.</p><button type="button" className="button button-secondary" onClick={onOpenCatalog}>Saját tárgylista megnyitása</button></div>}
      {item && <div className="procurement-options">
        <div className="procurement-grid"><label>Településméret<select value={settlement} onChange={event => setSettlement(event.target.value)}>{settlements.map(entry => <option value={entry.id} key={entry.id}>{entry.label}</option>)}</select></label>
          <label>Környék mágiája<select value={prevalence} onChange={event => setPrevalence(event.target.value)}><option value="scarce">Szórványos · −10%</option><option value="normal">Átlagos</option><option value="abundant">Bőséges · +10%</option></select></label></div>
        <label className="procurement-check"><input type="checkbox" checked={specialty} onChange={event => setSpecialty(event.target.checked)} /> A bolt profiljába illik · +10%</label>
        <p className="procurement-chance">Beszerzési esély: <strong>{chance}%</strong>{item.rarity === 'Legendás' && ' · siker esetén is különleges kapcsolat vagy kaland szükséges'}</p>
        {item.rarity === 'Artefaktum' ? <p className="stock-adjust-preview">Az artefaktum beszerzése mesélői döntés, ezért nem sorsolható.</p> : <button type="button" className="button button-secondary" onClick={roll}>{quote ? 'Újrasorsolás' : 'Beszerzés ellenőrzése'}</button>}
      </div>}
      {quote && item && <div className="procurement-quote">
        <h3>{quote.success ? 'Találtak forrást' : 'Nem találtak forrást'}</h3>
        <div className="procurement-grid"><label>Esélydobás (d100)<input type="number" min="1" max="100" value={quote.availabilityRoll} onChange={event => setQuote(current => {
          const next = reviseProcurementQuote(current, item, shop, { availabilityRoll: event.target.value });
          return next.success && !current.success ? { ...next, timeAmount: 1, timeUnit: item.rarity === 'Legendás' ? 'hónap' : 'nap', markupRoll: 1, markupPercent: 0, markupReason: 'Meglepően könnyen hozzáférhető', quotedPrice: item.price == null ? null : salePriceFor(item, shop) } : next;
        })} /></label>
          <label>Mesélői eredmény<select value={quote.success ? 'success' : 'failed'} onChange={event => changeResult(event.target.value === 'success')}><option value="success">Beszerezhető</option><option value="failed">Nem beszerezhető</option></select></label></div>
        {quote.success && <><div className="procurement-grid"><label>Idő ({quote.timeUnit})<input type="number" min="1" step="1" value={quote.timeAmount ?? ''} onChange={event => setQuote(current => ({ ...current, timeAmount: event.target.value }))} /><small>{quote.timeFormula}</small></label>
          <label>Felárdobás (d6)<input type="number" min="1" max="6" value={quote.markupRoll ?? 1} onChange={event => setQuote(current => reviseProcurementQuote(current, item, shop, { markupRoll: event.target.value }))} /><small>+{quote.markupPercent ?? 0}% · {quote.markupReason}</small></label></div>
          <label>Egyszeri ajánlati ár (gp)<input type="number" min="0" step="1" value={quote.quotedPrice ?? ''} onChange={event => setQuote(current => ({ ...current, quotedPrice: event.target.value }))} placeholder="Mesélői döntés" /></label>
          <p className="field-hint">Az ajánlat nem módosítja a tárgy alapárát vagy a bolt tartós árát.</p></>}
        <label>Megjegyzés (opcionális)<input value={note} onChange={event => setNote(event.target.value)} placeholder="Forrás, feltétel vagy kalandötlet" /></label>
        <div className="dialog-actions"><button type="button" className="button button-primary" onClick={save}>{quote.success ? 'Megrendelés mentése' : 'Sikertelen próbálkozás mentése'}</button></div>
      </div>}
    </>}
  </div>;
}
