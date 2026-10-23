import { useState } from 'react';
import { CheckCircle, X } from '@phosphor-icons/react';
import { settlements } from './procurement.js';

export function ShopEditor({ shop, onChange, onSubmit, onClose, editing }) {
  const [section, setSection] = useState('basics');
  const update = (field, value) => onChange({ ...shop, [field]: value });
  const multiplier = Number(shop.multiplier);
  const canSave = Boolean(shop.name.trim()) && Number.isFinite(multiplier) && multiplier > 0;

  return <form className="shop-editor" onSubmit={onSubmit}>
    <header className="shop-editor-header">
      <div>
        <h2>{editing ? 'Bolt szerkesztése' : 'Új bolt'}</h2>
        <p>{editing ? 'Frissítsd a bolt adatait és a kalandjegyzeteket.' : 'Add meg a bolt alapadatait, aztán töltsd ki a hasznos jegyzeteket.'}</p>
      </div>
      <button type="button" aria-label="Bezárás" onClick={onClose}><X size={23} /></button>
    </header>

    <nav className="shop-editor-nav" aria-label="Bolti adatok szakaszai">
      <button type="button" className={section === 'basics' ? 'is-active' : ''} aria-pressed={section === 'basics'} onClick={() => setSection('basics')}><span>01</span> Alapadatok</button>
      <button type="button" className={section === 'notes' ? 'is-active' : ''} aria-pressed={section === 'notes'} onClick={() => setSection('notes')}><span>02</span> Kapcsolatok és kalandok <small>opcionális</small></button>
    </nav>

    <div className="shop-editor-body">
      {section === 'basics' ? <section className="shop-editor-section" aria-label="Alapadatok">
        <label>Bolt neve<input autoFocus required value={shop.name} onChange={event => update('name', event.target.value)} placeholder="Például: A Holdkő Műhely" /></label>
        <div className="shop-editor-pair">
          <label>Hely<input value={shop.location} onChange={event => update('location', event.target.value)} placeholder="Város, kerület vagy utca" /></label>
          <label>Tulajdonos<input value={shop.owner} onChange={event => update('owner', event.target.value)} placeholder="Név és megszólítás" /></label>
        </div>
        <div className="shop-editor-pair">
          <label>Településméret<select value={shop.settlementSize || 'city'} onChange={event => update('settlementSize', event.target.value)}>{settlements.map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
          <label>Környék mágiája<select value={shop.magicPrevalence || 'normal'} onChange={event => update('magicPrevalence', event.target.value)}><option value="scarce">Szórványos</option><option value="normal">Átlagos</option><option value="abundant">Bőséges</option></select></label>
        </div>
        <label>Árszorzó az alapárhoz képest<input type="number" min="0.01" step="0.01" required value={shop.multiplier} onChange={event => update('multiplier', event.target.value)} /><small className="shop-editor-hint">1,25 = 25%-kal drágább · 0,8 = 20%-kal olcsóbb. A tárgyak bolti ára külön is megadható.</small></label>
        <label>Rövid boltleírás<textarea rows="3" value={shop.description} onChange={event => update('description', event.target.value)} placeholder="Milyen hangulatú a bolt? Mit látnak meg először a kalandozók?" /></label>
      </section> : <section className="shop-editor-section" aria-label="Kapcsolatok és kalandok">
        <p className="shop-editor-intro">Ezek a jegyzetek játék közben segítenek felidézni a fontos szereplőket és szálakat.</p>
        <div className="shop-editor-pair">
          <label>Kapcsolattartó<input value={shop.contact} onChange={event => update('contact', event.target.value)} placeholder="Ki segíthet a csapatnak?" /></label>
          <label>Frakció vagy szövetség<input value={shop.faction} onChange={event => update('faction', event.target.value)} placeholder="Céh, rend, nemesi ház..." /></label>
        </div>
        <label>Viszony a csapattal<textarea rows="3" value={shop.relationship} onChange={event => update('relationship', event.target.value)} placeholder="Bizalmatlan, barátságos, tartozik nekik..." /></label>
        <label>Kalandötlet vagy titok<textarea rows="3" value={shop.adventureHook} onChange={event => update('adventureHook', event.target.value)} placeholder="Pletyka, megbízás vagy rejtett szándék" /></label>
      </section>}
    </div>

    <footer className="shop-editor-footer">
      <span>{canSave ? 'A bolt adatai készen állnak a mentésre.' : 'A mentéshez add meg a bolt nevét és egy pozitív árszorzót.'}</span>
      <div>
        <button type="button" className="button button-secondary" onClick={onClose}>Mégse</button>
        <button type="submit" className="button button-primary" disabled={!canSave}><CheckCircle size={18} /> {editing ? 'Mentés' : 'Bolt létrehozása'}</button>
      </div>
    </footer>
  </form>;
}
