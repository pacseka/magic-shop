import { useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlass, Plus, Package, CaretRight, CaretUp, CaretDown, Minus, Coins, X, CheckCircle, ArrowCounterClockwise, Storefront, DownloadSimple, PencilSimple, Cloud, SignOut } from '@phosphor-icons/react';
import { activeShopKey, blankShop, loadShops, makeId, salePriceFor, storageKey } from './shopData.js';
import { firebaseReady, loadCloudShops, saveCloudShops, signIn, signOutUser, watchUser } from './firebase.js';

const money = value => new Intl.NumberFormat('hu-HU').format(value);
const rarityClass = text => `rarity-${text.toLocaleLowerCase('hu-HU').replaceAll(' ', '-')}`;

export function App() {
  const [shops, setShops] = useState(loadShops);
  const [activeId, setActiveId] = useState(() => localStorage.getItem(activeShopKey) || 'rezhold');
  const [selectedId, setSelectedId] = useState('cloak');
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState(400);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState('');
  const [draft, setDraft] = useState(blankShop);
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', rarity: 'Gyakori', stock: 1, price: 100, description: '' });
  const [restockId, setRestockId] = useState('');
  const [restockAmount, setRestockAmount] = useState(1);
  const [user, setUser] = useState(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('');
  const [cloudConflict, setCloudConflict] = useState(null);
  const shopsRef = useRef(shops);
  const skipCloudSave = useRef(false);
  const hasStoredData = useRef(Boolean(localStorage.getItem(storageKey) || localStorage.getItem('rezhold-shop-items-v3')));
  shopsRef.current = shops;

  const shop = shops.find(entry => entry.id === activeId) ?? shops[0];
  const items = shop?.items ?? [];
  const selected = items.find(item => item.id === selectedId) ?? items[0];
  const filtered = useMemo(() => items.filter(item => `${item.name} ${item.rarity}`.toLocaleLowerCase('hu-HU').includes(search.toLocaleLowerCase('hu-HU'))), [items, search]);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify({ schemaVersion: 1, shops })); }, [shops]);
  useEffect(() => { if (shop) localStorage.setItem(activeShopKey, shop.id); }, [shop?.id]);
  useEffect(() => { setSalePrice(salePriceFor(selected, shop)); setQuantity(1); }, [selected?.id, shop?.id, shop?.multiplier]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3600); return () => clearTimeout(timer); }, [toast]);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = watchUser(async nextUser => {
      if (cancelled) return;
      setUser(nextUser);
      setCloudLoaded(false);
      setCloudConflict(null);
      if (!nextUser) { setCloudStatus(''); return; }
      setCloudStatus('Felhőadatok betöltése...');
      try {
        const cloudShops = await loadCloudShops(nextUser.uid);
        if (cancelled) return;
        if (cloudShops?.length) {
          if (hasStoredData.current && JSON.stringify(cloudShops) !== JSON.stringify(shopsRef.current)) {
            setCloudConflict({ uid: nextUser.uid, shops: cloudShops });
            setCloudStatus('A helyi és a felhős adatok eltérnek');
            return;
          }
          skipCloudSave.current = true;
          setShops(cloudShops);
          setActiveId(current => cloudShops.some(entry => entry.id === current) ? current : cloudShops[0].id);
        } else {
          await saveCloudShops(nextUser.uid, shopsRef.current);
          skipCloudSave.current = true;
        }
        if (!cancelled) { setCloudLoaded(true); setCloudStatus('Felhőbe mentve'); }
      } catch {
        if (!cancelled) setCloudStatus('A felhő nem érhető el · helyi mentés aktív');
      }
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user || !cloudLoaded) return;
    if (skipCloudSave.current) { skipCloudSave.current = false; return; }
    setCloudStatus('Mentés folyamatban...');
    const timer = setTimeout(() => {
      saveCloudShops(user.uid, shops)
        .then(() => setCloudStatus('Felhőbe mentve'))
        .catch(() => setCloudStatus('A felhő nem érhető el · helyi mentés aktív'));
    }, 650);
    return () => clearTimeout(timer);
  }, [shops, user, cloudLoaded]);

  function updateItems(updater) {
    if (!shop) return;
    hasStoredData.current = true;
    setShops(current => current.map(entry => entry.id === shop.id ? { ...entry, items: updater(entry.items ?? []) } : entry));
  }
  function selectItem(item) { setSelectedId(item.id); setSalePrice(salePriceFor(item, shop)); setQuantity(1); }
  function changeStock(id, delta) { updateItems(current => current.map(item => item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item)); }
  function sell() {
    const price = Number(salePrice);
    if (!selected || selected.stock < quantity || quantity < 1 || !Number.isFinite(price) || price < 0) return;
    changeStock(selected.id, -quantity);
    setToast(`${quantity} × ${selected.name} eladva · ${money(price * quantity)} gp`);
    setQuantity(1);
  }
  function addItem(event) {
    event.preventDefault();
    const name = newItem.name.trim();
    if (!name || !shop) return;
    const description = newItem.description.trim();
    const item = { id: makeId(), name, rarity: newItem.rarity, kind: 'Csodás tárgy', category: 'Egyedi tárgy', stock: Math.max(0, Number(newItem.stock) || 0), price: Math.max(0, Number(newItem.price) || 0), image: '', teaser: description || 'Egyedi varázstárgy.', description: description || 'A mesélő által hozzáadott varázstárgy.', effect: description || 'A tárgy hatását a mesélő határozza meg.' };
    updateItems(current => [...current, item]);
    selectItem(item); setSearch(''); setDialog(null);
    setNewItem({ name: '', rarity: 'Gyakori', stock: 1, price: 100, description: '' });
    setToast(`${name} hozzáadva: ${shop.name}`);
  }
  function restock(event) {
    event.preventDefault();
    const amount = Math.max(1, Number(restockAmount) || 1);
    changeStock(restockId, amount);
    setDialog(null); setToast(`Készlet feltöltve: +${amount} db`);
  }
  function openShopDialog(entry) {
    setEditingId(entry?.id ?? null);
    setDraft(entry ? Object.fromEntries(Object.keys(blankShop()).map(key => [key, entry[key] ?? ''])) : blankShop());
    setDialog('shop');
  }
  function saveShop(event) {
    event.preventDefault();
    const name = draft.name.trim();
    const multiplier = Number(draft.multiplier);
    if (!name || !Number.isFinite(multiplier) || multiplier <= 0) return;
    hasStoredData.current = true;
    const details = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
    details.name = name; details.multiplier = multiplier;
    if (editingId) {
      setShops(current => current.map(entry => entry.id === editingId ? { ...entry, ...details } : entry));
      setToast(`${name} adatai frissítve`);
    } else {
      const id = makeId();
      setShops(current => [...current, { id, ...details, items: [] }]);
      setActiveId(id); setSelectedId(''); setSearch('');
      setToast(`${name} létrehozva`);
    }
    setDialog(null);
  }
  function exportJson() {
    const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), shops };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `varazsboltok-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast('Az összes bolt JSON-fájlba exportálva');
  }
  async function connectCloud() {
    try { await signIn(); } catch (error) { if (error?.code !== 'auth/popup-closed-by-user') setToast('Nem sikerült a bejelentkezés. Ellenőrizd a Firebase beállításait.'); }
  }
  async function resolveCloudConflict(choice) {
    if (!cloudConflict) return;
    if (choice === 'cloud') {
      skipCloudSave.current = true;
      setShops(cloudConflict.shops);
      setActiveId(current => cloudConflict.shops.some(entry => entry.id === current) ? current : cloudConflict.shops[0].id);
      setCloudLoaded(true);
      setCloudStatus('Felhőadatok betöltve');
      setCloudConflict(null);
      return;
    }
    setCloudStatus('Helyi adatok feltöltése...');
    try {
      await saveCloudShops(cloudConflict.uid, shopsRef.current);
      skipCloudSave.current = true;
      setCloudLoaded(true);
      setCloudStatus('Helyi adatok felhőbe mentve');
      setCloudConflict(null);
    } catch { setCloudStatus('A felhő nem érhető el · helyi mentés aktív'); }
  }

  return <main className="ledger">
    <header className="shop-header"><img className="header-art" src="/assets/header-merchant.png" alt="" /><div className="header-content"><h1>{shop?.name}</h1><p>{shop?.location || 'Ismeretlen hely'} <span aria-hidden="true">·</span> {shop?.owner || 'Ismeretlen tulajdonos'}</p><div className="header-rule" aria-hidden="true"><span /></div></div></header>
    <section className="shop-bar" aria-label="Boltkezelés"><label className="shop-picker"><Storefront size={22} aria-hidden="true" /><span>Bolt</span><select aria-label="Aktív bolt" value={shop?.id ?? ''} onChange={event => { setActiveId(event.target.value); setSelectedId(''); setSearch(''); }}>{shops.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><button className="shop-icon-button" onClick={() => openShopDialog(shop)} aria-label="Bolt szerkesztése" title="Bolt szerkesztése"><PencilSimple size={20} /></button><button className="button button-secondary" onClick={() => openShopDialog(null)}><Plus size={19} /> Új bolt</button><button className="button button-secondary export-button" onClick={exportJson}><DownloadSimple size={19} /> JSON export</button></section>
    <section className="shop-notes" aria-label="Bolti tudnivalók"><div><strong>{shop?.description || 'Még nincs leírás ehhez a bolthoz.'}</strong><span>{[shop?.contact && `Kapcsolat: ${shop.contact}`, shop?.faction && `Frakció: ${shop.faction}`, shop?.relationship && `Viszony: ${shop.relationship}`, shop?.adventureHook && `Kalandötlet: ${shop.adventureHook}`].filter(Boolean).join(' · ')}</span></div><span className="multiplier-badge">Árszorzó ×{String(shop?.multiplier ?? 1).replace('.', ',')}</span></section>
    <section className="cloud-bar" aria-label="Felhőszinkron"><Cloud size={20} aria-hidden="true" /><span>{firebaseReady ? user ? `${user.displayName || user.email} · ${cloudStatus}` : 'Helyi mentés · jelentkezz be a felhőhöz' : 'Helyi mentés · Firebase-projekt még nincs beállítva'}</span>{firebaseReady && (user ? <button onClick={signOutUser}><SignOut size={17} /> Kijelentkezés</button> : <button onClick={connectCloud}>Bejelentkezés Google-fiókkal</button>)}</section>
    {cloudConflict && <section className="cloud-conflict" aria-label="Felhőadatok egyeztetése"><strong>A helyi és a felhős boltok eltérnek.</strong><span>Válaszd ki, melyik készletet tartod meg. A másik változatot előbb a JSON exporttal lementheted.</span><div><button className="button button-secondary" onClick={() => resolveCloudConflict('cloud')}>Felhőadatok használata</button><button className="button button-primary" onClick={() => resolveCloudConflict('local')}>Helyi adatok feltöltése</button></div></section>}
    <section className="toolbar" aria-label="Bolti műveletek"><label className="search-field"><MagnifyingGlass size={26} aria-hidden="true" /><input aria-label="Keresés a tárgyak között" value={search} onChange={event => setSearch(event.target.value)} placeholder="Keresés a tárgyak között..." /></label><button className="button button-primary add-button" onClick={() => setDialog('add')}><Plus size={23} /> Tárgy hozzáadása</button><button className="button button-secondary restock-button" onClick={() => { setRestockId(selected?.id ?? items[0]?.id); setDialog('restock'); }} disabled={!items.length}><Package size={22} /> Készlet feltöltése</button></section>
    <section className="inventory" aria-label="Bolti készlet"><div className="inventory-head"><span>Név</span><span>Ritkaság</span><span>Készlet</span><span>Bolti ár (gp)</span><span /></div><div className="inventory-list">{filtered.length ? filtered.map(item => <button key={item.id} className={`inventory-row ${item.id === selected?.id ? 'is-selected' : ''}`} onClick={() => selectItem(item)} aria-pressed={item.id === selected?.id}><span className="item-main"><span className="item-thumb">{item.image ? <img src={item.image} alt="" /> : <Package size={34} aria-hidden="true" />}</span><span className="item-words"><strong>{item.name}</strong><small>{item.teaser}</small></span></span><span className={`rarity ${rarityClass(item.rarity)}`}>{item.rarity}</span><span className="stock-value">{item.stock}</span><span className="price-value">{money(salePriceFor(item, shop))} gp</span><CaretRight className="row-caret" size={19} aria-hidden="true" /></button>) : <div className="empty-results">{items.length ? 'Nincs találat. Próbálj másik nevet.' : 'Ebben a boltban még nincs tárgy. Adj hozzá egyet a készlethez.'}</div>}</div></section>
    {selected && <section className="detail" aria-label={`${selected.name} részletei`}><div className="detail-rule" aria-hidden="true"><span>◇</span></div><div className="detail-content"><div className="detail-illustration">{selected.image ? <img src={selected.image} alt={selected.name} /> : <Package size={112} aria-hidden="true" />}</div><div className="detail-info"><h2>{selected.name}</h2><div className="detail-tags"><span className={`rarity ${rarityClass(selected.rarity)}`}>{selected.rarity}</span><span>{selected.kind}</span><span>{selected.category}</span></div><p className="detail-description">{selected.description}</p><h3>Hatás</h3><p className="detail-effect">{selected.effect}</p><p className="base-price">Alapár: {money(selected.price)} gp · bolti szorzó: ×{String(shop.multiplier).replace('.', ',')}</p><div className="purchase-controls"><div className="quantity-wrap"><label>Mennyiség</label><div className="stepper"><button aria-label="Mennyiség csökkentése" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}><Minus size={18} /></button><output>{selected.stock ? quantity : 0}</output><button aria-label="Mennyiség növelése" onClick={() => setQuantity(q => Math.min(selected.stock, q + 1))} disabled={quantity >= selected.stock}><Plus size={18} /></button></div></div><div className="price-wrap"><label htmlFor="sale-price">Eladási ár (gp)</label><div className="price-input"><Coins size={22} aria-hidden="true" /><input id="sale-price" type="number" min="0" step="1" value={salePrice} onChange={event => setSalePrice(event.target.value)} /><span className="price-arrows"><button aria-label="Ár növelése 50 arannyal" onClick={() => setSalePrice(p => Math.max(0, Number(p) + 50))}><CaretUp size={14} /></button><button aria-label="Ár csökkentése 50 arannyal" onClick={() => setSalePrice(p => Math.max(0, Number(p) - 50))}><CaretDown size={14} /></button></span></div></div></div><button className="button button-primary sell-button" onClick={sell} disabled={selected.stock < quantity || selected.stock === 0 || salePrice === '' || Number(salePrice) < 0}><Coins size={25} /><span>{selected.stock ? 'Eladás' : 'Elfogyott'}</span><strong>{selected.stock ? `${money((Number(salePrice) || 0) * quantity)} gp` : ''}</strong></button></div></div></section>}
    {toast && <div className="toast" role="status"><CheckCircle size={21} weight="fill" />{toast}<button aria-label="Értesítés bezárása" onClick={() => setToast('')}><X size={16} /></button></div>}
    {dialog && <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDialog(null); }}><div className="dialog" role="dialog" aria-modal="true" aria-label={dialog === 'shop' ? 'Bolt adatai' : dialog === 'add' ? 'Tárgy hozzáadása' : 'Készlet feltöltése'}><div className="dialog-heading"><h2>{dialog === 'shop' ? editingId ? 'Bolt szerkesztése' : 'Új bolt' : dialog === 'add' ? 'Tárgy hozzáadása' : 'Készlet feltöltése'}</h2><button aria-label="Bezárás" onClick={() => setDialog(null)}><X size={22} /></button></div>
      {dialog === 'shop' ? <form onSubmit={saveShop}><label>Bolt neve<input autoFocus required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Például: A Holdkő Műhely" /></label><div className="form-grid"><label>Hely<input value={draft.location} onChange={event => setDraft({ ...draft, location: event.target.value })} placeholder="Város, kerület vagy utca" /></label><label>Tulajdonos<input value={draft.owner} onChange={event => setDraft({ ...draft, owner: event.target.value })} placeholder="Név és megszólítás" /></label></div><label>Árszorzó az alapárhoz képest<input type="number" min="0.01" step="0.01" required value={draft.multiplier} onChange={event => setDraft({ ...draft, multiplier: event.target.value })} /><small className="field-hint">1,25 = 25%-kal drágább; 0,8 = 20%-kal olcsóbb. Az eladási ár külön is átírható.</small></label><label>Leírás<textarea rows="2" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="Milyen hangulatú a bolt?" /></label><div className="form-grid"><label>Kapcsolattartó<input value={draft.contact} onChange={event => setDraft({ ...draft, contact: event.target.value })} placeholder="Ki segíthet a csapatnak?" /></label><label>Frakció vagy szövetség<input value={draft.faction} onChange={event => setDraft({ ...draft, faction: event.target.value })} placeholder="Céh, rend, nemesi ház..." /></label></div><label>Viszony a csapattal<input value={draft.relationship} onChange={event => setDraft({ ...draft, relationship: event.target.value })} placeholder="Bizalmatlan, barátságos, tartozik nekik..." /></label><label>Kalandötlet vagy titok<textarea rows="2" value={draft.adventureHook} onChange={event => setDraft({ ...draft, adventureHook: event.target.value })} placeholder="Pletyka, megbízás vagy rejtett szándék" /></label><div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => setDialog(null)}>Mégse</button><button type="submit" className="button button-primary"><CheckCircle size={18} /> {editingId ? 'Mentés' : 'Bolt létrehozása'}</button></div></form> : dialog === 'add' ? <form onSubmit={addItem}><label>Tárgy neve<input autoFocus required value={newItem.name} onChange={event => setNewItem({ ...newItem, name: event.target.value })} placeholder="Például: Holdfény amulettje" /></label><div className="form-grid"><label>Ritkaság<select value={newItem.rarity} onChange={event => setNewItem({ ...newItem, rarity: event.target.value })}><option>Gyakori</option><option>Nem gyakori</option><option>Ritka</option><option>Nagyon ritka</option><option>Legendás</option><option>Artefaktum</option></select></label><label>Készlet<input type="number" min="0" value={newItem.stock} onChange={event => setNewItem({ ...newItem, stock: event.target.value })} /></label></div><label>Alapár (gp)<input type="number" min="0" value={newItem.price} onChange={event => setNewItem({ ...newItem, price: event.target.value })} /></label><label>Rövid leírás<textarea rows="3" value={newItem.description} onChange={event => setNewItem({ ...newItem, description: event.target.value })} placeholder="Mit tud a tárgy?" /></label><div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => setDialog(null)}>Mégse</button><button type="submit" className="button button-primary"><Plus size={18} /> Hozzáadás</button></div></form> : <form onSubmit={restock}><label>Tárgy<select value={restockId} onChange={event => setRestockId(event.target.value)}>{items.map(item => <option key={item.id} value={item.id}>{item.name} · jelenleg {item.stock} db</option>)}</select></label><label>Hozzáadandó mennyiség<input autoFocus type="number" min="1" value={restockAmount} onChange={event => setRestockAmount(event.target.value)} /></label><div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => setDialog(null)}>Mégse</button><button type="submit" className="button button-primary"><ArrowCounterClockwise size={18} /> Feltöltés</button></div></form>}
    </div></div>}
  </main>;
}
