import { useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlass, Plus, Package, CaretRight, CaretUp, CaretDown, Minus, Coins, X, CheckCircle, ArrowCounterClockwise, Storefront, DownloadSimple, UploadSimple, PencilSimple, Cloud, SignOut, Books, DiceFive } from '@phosphor-icons/react';
import { activeShopKey, blankShop, generateStock, loadLedger, makeId, normalizeLedger, rarities, salePriceFor, shopItemFromCatalog, storageKey } from './shopData.js';
import { firebaseReady, loadCloudLedger, saveCloudLedger, signIn, signOutUser, watchUser } from './firebase.js';
import { ItemImage, ItemImagePicker } from './ItemImagePicker.jsx';
import { ItemJsonImport } from './ItemJsonImport.jsx';
import { defaultImageFor, isDefaultImage, itemTypes, normalizedItemKind, publicAssetUrl, suggestedBasePrice } from './itemTypes.js';
import { previewItemImport } from './itemImport.js';

const money = value => new Intl.NumberFormat('hu-HU').format(value);
const rarityClass = text => `rarity-${text.toLocaleLowerCase('hu-HU').replaceAll(' ', '-')}`;
const cloudError = error => error?.code === 'permission-denied'
  ? 'Firestore-hozzáférés elutasítva · ellenőrizd a Rules beállítást'
  : `Felhőmentés sikertelen (${error?.code || 'ismeretlen hiba'}) · helyi mentés aktív`;
const itemTypeChange = (item, kind) => ({ ...item, kind,
  price: item.price === suggestedBasePrice(item.rarity, item.kind) ? suggestedBasePrice(item.rarity, kind) : item.price,
  image: isDefaultImage(item.image) ? defaultImageFor(kind) : item.image,
});
const suggestedSalePrice = (item, shop) => item?.rarity === 'Artefaktum' && item.price == null && item.shopPrice == null ? '' : salePriceFor(item, shop);

function PriceHint({ item }) {
  const note = item.rarity === 'Artefaktum'
    ? 'Az artefaktum felbecsülhetetlen; az alapár üresen hagyható.'
    : item.kind === 'Tekercs'
      ? 'Varázstekercsnél a szabály szerinti ár a varázslat másolási költségétől függ; az értéket ellenőrizd és szükség esetén írd át.'
      : item.kind === 'Ital'
        ? 'Az ital fogyóeszköz: a ritkasági érték felét ajánljuk. Az alapár átírható.'
        : 'A ritkasági táblázat szerinti javaslat. Az alapár átírható.';
  return <small className="field-hint price-hint">{note}</small>;
}

function ShopPriceEditor({ item, shop, value, onChange, onSave, onReset }) {
  const price = Number(value);
  const canSave = value !== '' && Number.isFinite(price) && price >= 0 && price !== salePriceFor(item, shop);
  return <form className="shop-price-editor" onSubmit={onSave}>
    <label htmlFor="shop-price">Bolti ár (gp)</label>
    <div className="shop-price-controls">
      <input id="shop-price" type="number" min="0" step="1" value={value} onChange={event => onChange(event.target.value)} placeholder={item.price == null ? 'Felbecsülhetetlen' : ''} />
      <button type="submit" className="button button-secondary" disabled={!canSave}>Bolti ár mentése</button>
    </div>
    {item.shopPrice != null && <button type="button" className="reset-shop-price" onClick={onReset}>Szorzó szerinti ár visszaállítása</button>}
    <small>Ebben a boltban érvényes ár. Az eladáskor megadott ár csak arra az eladásra szól.</small>
  </form>;
}

export function App() {
  const [ledger, setLedger] = useState(loadLedger);
  const { shops, catalog } = ledger;
  const [activeId, setActiveId] = useState(() => localStorage.getItem(activeShopKey) || 'rezhold');
  const [selectedId, setSelectedId] = useState('cloak');
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState(400);
  const [shopPriceDraft, setShopPriceDraft] = useState(400);
  const [showSelectedDescription, setShowSelectedDescription] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState('');
  const [draft, setDraft] = useState(blankShop);
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', rarity: 'Gyakori', kind: 'Csodás tárgy', stock: 1, price: 100, category: '', image: defaultImageFor('Csodás tárgy'), description: '' });
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogDraft, setCatalogDraft] = useState(null);
  const [catalogEditingId, setCatalogEditingId] = useState(null);
  const [randomOptions, setRandomOptions] = useState({ prevalence: 'normal', size: 'medium', maxRarity: 'Ritka', category: 'all', count: '', consumables: false, includeExisting: true });
  const [randomPreview, setRandomPreview] = useState(null);
  const [restockId, setRestockId] = useState('');
  const [restockAmount, setRestockAmount] = useState(1);
  const [user, setUser] = useState(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('');
  const [cloudConflict, setCloudConflict] = useState(null);
  const ledgerRef = useRef(ledger);
  const skipCloudSave = useRef(false);
  const hasStoredData = useRef(Boolean(localStorage.getItem(storageKey) || localStorage.getItem('rezhold-shop-items-v3')));
  ledgerRef.current = ledger;

  const shop = shops.find(entry => entry.id === activeId) ?? shops[0];
  const items = shop?.items ?? [];
  const selected = items.find(item => item.id === selectedId) ?? items[0];
  const filtered = useMemo(() => items.filter(item => `${item.name} ${item.rarity}`.toLocaleLowerCase('hu-HU').includes(search.toLocaleLowerCase('hu-HU'))), [items, search]);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify({ schemaVersion: 2, ...ledger })); }, [ledger]);
  useEffect(() => { if (shop) localStorage.setItem(activeShopKey, shop.id); }, [shop?.id]);
  useEffect(() => { setSalePrice(suggestedSalePrice(selected, shop)); setShopPriceDraft(suggestedSalePrice(selected, shop)); setQuantity(1); setShowSelectedDescription(false); }, [selected?.id, selected?.price, selected?.shopPrice, shop?.id, shop?.multiplier]);
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
        const cloudData = await loadCloudLedger(nextUser.uid);
        if (cancelled) return;
        if (cloudData?.shops?.length) {
          const cloudLedger = normalizeLedger(cloudData);
          if (hasStoredData.current && JSON.stringify(cloudLedger) !== JSON.stringify(ledgerRef.current)) {
            setCloudConflict({ uid: nextUser.uid, ledger: cloudLedger });
            setCloudStatus('A helyi és a felhős adatok eltérnek');
            return;
          }
          skipCloudSave.current = true;
          setLedger(cloudLedger);
          setActiveId(current => cloudLedger.shops.some(entry => entry.id === current) ? current : cloudLedger.shops[0].id);
        } else {
          await saveCloudLedger(nextUser.uid, ledgerRef.current);
          skipCloudSave.current = true;
        }
        if (!cancelled) { setCloudLoaded(true); setCloudStatus('Felhőbe mentve'); }
      } catch (error) {
        if (!cancelled) setCloudStatus(cloudError(error));
      }
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user || !cloudLoaded) return;
    if (skipCloudSave.current) { skipCloudSave.current = false; return; }
    setCloudStatus('Mentés folyamatban...');
    const timer = setTimeout(() => {
      saveCloudLedger(user.uid, ledger)
        .then(() => setCloudStatus('Felhőbe mentve'))
        .catch(error => setCloudStatus(cloudError(error)));
    }, 650);
    return () => clearTimeout(timer);
  }, [ledger, user, cloudLoaded]);

  function updateItems(updater) {
    if (!shop) return;
    hasStoredData.current = true;
    setLedger(current => ({ ...current, shops: current.shops.map(entry => entry.id === shop.id ? { ...entry, items: updater(entry.items ?? []) } : entry) }));
  }
  function selectItem(item) { setSelectedId(item.id); setSalePrice(suggestedSalePrice(item, shop)); setShopPriceDraft(suggestedSalePrice(item, shop)); setQuantity(1); setShowSelectedDescription(false); }
  function changeStock(id, delta) { updateItems(current => current.map(item => item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item)); }
  function saveShopPrice(event) {
    event.preventDefault();
    const price = Number(shopPriceDraft);
    if (!selected || shopPriceDraft === '' || !Number.isFinite(price) || price < 0) return;
    const suggested = Math.round(Number(selected.price || 0) * Number(shop?.multiplier || 1));
    const shopPrice = price === suggested ? null : price;
    if ((selected.shopPrice ?? null) !== shopPrice) {
      updateItems(current => current.map(item => item.id === selected.id ? { ...item, shopPrice } : item));
    }
    setToast(`${selected.name} bolti ára mentve`);
  }
  function changeSalePriceBy(delta) {
    const next = Math.max(0, (Number(salePrice) || 0) + delta);
    setSalePrice(next);
  }
  function resetShopPrice() {
    updateItems(current => current.map(item => item.id === selected.id ? { ...item, shopPrice: null } : item));
    setShopPriceDraft(selected.price == null ? '' : Math.round(Number(selected.price) * Number(shop?.multiplier || 1)));
  }
  function sell() {
    const price = Number(salePrice);
    if (!selected || selected.stock < quantity || quantity < 1 || !Number.isFinite(price) || price < 0) return;
    changeStock(selected.id, -quantity);
    setToast(`${quantity} × ${selected.name} eladva · ${money(price * quantity)} gp`);
    setQuantity(1);
    setSalePrice(suggestedSalePrice(selected, shop));
  }
  function addItem(event) {
    event.preventDefault();
    const name = newItem.name.trim();
    if (!name || !shop) return;
    const description = newItem.description.trim();
    const definition = { id: makeId(), name, rarity: newItem.rarity, kind: newItem.kind, category: newItem.category.trim(), price: newItem.price === '' ? null : Math.max(0, Number(newItem.price) || 0), image: newItem.image || defaultImageFor(newItem.kind), teaser: description || 'Egyedi varázstárgy.', description: description || 'A mesélő által hozzáadott varázstárgy.', effect: description || 'A tárgy hatását a mesélő határozza meg.' };
    const duplicate = catalog.find(item => item.name.trim().toLocaleLowerCase('hu-HU') === name.toLocaleLowerCase('hu-HU') && item.rarity === definition.rarity);
    const chosen = duplicate ?? definition;
    const item = shopItemFromCatalog(chosen, Math.max(0, Number(newItem.stock) || 0));
    const alreadyHere = items.find(existing => existing.catalogId === chosen.id);
    hasStoredData.current = true;
    setLedger(current => ({ catalog: duplicate ? current.catalog : [...current.catalog, definition], shops: current.shops.map(entry => entry.id === shop.id ? { ...entry, items: entry.items.some(existing => existing.catalogId === chosen.id) ? entry.items.map(existing => existing.catalogId === chosen.id ? { ...existing, stock: existing.stock + item.stock } : existing) : [...entry.items, item] } : entry) }));
    selectItem(alreadyHere ?? item); setSearch(''); setDialog(null);
    setNewItem({ name: '', rarity: 'Gyakori', kind: 'Csodás tárgy', stock: 1, price: 100, category: '', image: defaultImageFor('Csodás tárgy'), description: '' });
    setToast(`${name} a boltba és a közös tárgylistába került`);
  }
  function saveCatalogItem(event) {
    event.preventDefault();
    const name = catalogDraft.name.trim();
    if (!name) return;
    const duplicate = catalog.find(item => item.id !== catalogEditingId && item.name.trim().toLocaleLowerCase('hu-HU') === name.toLocaleLowerCase('hu-HU') && item.rarity === catalogDraft.rarity);
    if (duplicate) { setToast('Ilyen nevű és ritkaságú tárgy már van a listában.'); return; }
    const description = catalogDraft.description.trim();
    const definition = { id: catalogEditingId ?? makeId(), name, rarity: catalogDraft.rarity, kind: catalogDraft.kind, category: catalogDraft.category.trim(), price: catalogDraft.price === '' ? null : Math.max(0, Number(catalogDraft.price) || 0), image: catalogDraft.image || defaultImageFor(catalogDraft.kind), teaser: catalogDraft.teaser?.trim() || description || 'Egyedi varázstárgy.', description: description || 'A mesélő által hozzáadott varázstárgy.', effect: catalogDraft.effect?.trim() || description || 'A tárgy hatását a mesélő határozza meg.' };
    hasStoredData.current = true;
    setLedger(current => ({
      catalog: catalogEditingId ? current.catalog.map(item => item.id === catalogEditingId ? definition : item) : [...current.catalog, definition],
      shops: catalogEditingId ? current.shops.map(entry => ({ ...entry, items: entry.items.map(item => item.catalogId === catalogEditingId ? { ...definition, id: item.id, catalogId: catalogEditingId, stock: item.stock, shopPrice: item.shopPrice ?? null } : item) })) : current.shops,
    }));
    setCatalogDraft(null); setCatalogEditingId(null);
    setToast(catalogEditingId ? `${name} minden boltban frissítve` : `${name} a közös tárgylistába került`);
  }
  function addFromCatalog(item) {
    if (!shop) return;
    const existing = items.find(entry => entry.catalogId === item.id);
    if (existing) { setSelectedId(existing.id); setDialog(null); setToast('A tárgy már szerepel ebben a boltban.'); return; }
    const shopItem = shopItemFromCatalog(item);
    updateItems(current => [...current, shopItem]);
    selectItem(shopItem); setSearch(''); setDialog(null);
    setToast(`${item.name} hozzáadva: ${shop.name}`);
  }
  function importCatalogJson(json) {
    let preview;
    try { preview = previewItemImport(json, ledgerRef.current.catalog); }
    catch (error) { setToast(error.message); return; }
    if (!preview.items.length) { setToast('Nincs új, importálható tárgy.'); return; }
    hasStoredData.current = true;
    setLedger(current => {
      const fresh = previewItemImport(json, current.catalog);
      return { ...current, catalog: [...current.catalog, ...fresh.items.map(item => ({ ...item, id: makeId() }))] };
    });
    setDialog('catalog');
    setCatalogSearch('');
    setToast(`${preview.items.length} tárgy a közös listába került`);
  }
  function openRandomDialog() { setRandomPreview(null); setDialog('random'); }
  function rollStock() { setRandomPreview(generateStock(catalog, items, randomOptions)); }
  function acceptRandomStock() {
    if (!randomPreview?.length) return;
    updateItems(current => {
      const next = current.map(item => ({ ...item }));
      for (const rolled of randomPreview) {
        const existing = next.find(item => item.catalogId === rolled.catalogId);
        if (existing) existing.stock += rolled.stock;
        else next.push(rolled);
      }
      return next;
    });
    selectItem(items.find(item => item.catalogId === randomPreview[0].catalogId) ?? randomPreview[0]); setSearch(''); setDialog(null); setRandomPreview(null);
    setToast(`${randomPreview.length} tárgy készlete frissült`);
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
      setLedger(current => ({ ...current, shops: current.shops.map(entry => entry.id === editingId ? { ...entry, ...details } : entry) }));
      setToast(`${name} adatai frissítve`);
    } else {
      const id = makeId();
      setLedger(current => ({ ...current, shops: [...current.shops, { id, ...details, items: [] }] }));
      setActiveId(id); setSelectedId(''); setSearch('');
      setToast(`${name} létrehozva`);
    }
    setDialog(null);
  }
  function exportJson() {
    const payload = { schemaVersion: 2, exportedAt: new Date().toISOString(), ...ledger };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `varazsboltok-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast('A boltok és a közös tárgylista exportálva');
  }
  async function connectCloud() {
    try { await signIn(); } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user') return;
      setToast(error?.code === 'auth/unauthorized-domain' ? 'A jelenlegi domain nincs engedélyezve a Firebase Authenticationben.' : `Google-bejelentkezés sikertelen (${error?.code || 'ismeretlen hiba'}).`);
    }
  }
  async function resolveCloudConflict(choice) {
    if (!cloudConflict) return;
    if (choice === 'cloud') {
      skipCloudSave.current = true;
      setLedger(cloudConflict.ledger);
      setActiveId(current => cloudConflict.ledger.shops.some(entry => entry.id === current) ? current : cloudConflict.ledger.shops[0].id);
      setCloudLoaded(true);
      setCloudStatus('Felhőadatok betöltve');
      setCloudConflict(null);
      return;
    }
    setCloudStatus('Helyi adatok feltöltése...');
    try {
      await saveCloudLedger(cloudConflict.uid, ledgerRef.current);
      skipCloudSave.current = true;
      setCloudLoaded(true);
      setCloudStatus('Helyi adatok felhőbe mentve');
      setCloudConflict(null);
    } catch (error) { setCloudStatus(cloudError(error)); }
  }

  return <main className="ledger">
    <header className="shop-header"><img className="header-art" src={publicAssetUrl('/assets/header-merchant.png')} alt="" /><div className="header-content"><h1>{shop?.name}</h1><p>{shop?.location || 'Ismeretlen hely'} <span aria-hidden="true">·</span> {shop?.owner || 'Ismeretlen tulajdonos'}</p><div className="header-rule" aria-hidden="true"><span /></div></div></header>
    <section className="shop-bar" aria-label="Boltkezelés"><label className="shop-picker"><Storefront size={22} aria-hidden="true" /><span>Bolt</span><select aria-label="Aktív bolt" value={shop?.id ?? ''} onChange={event => { setActiveId(event.target.value); setSelectedId(''); setSearch(''); }}>{shops.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><button className="shop-icon-button" onClick={() => openShopDialog(shop)} aria-label="Bolt szerkesztése" title="Bolt szerkesztése"><PencilSimple size={20} /></button><button className="button button-secondary" onClick={() => openShopDialog(null)}><Plus size={19} /> Új bolt</button><button className="button button-secondary export-button" onClick={exportJson}><DownloadSimple size={19} /> JSON export</button></section>
    <section className="shop-notes" aria-label="Bolti tudnivalók"><div><strong>{shop?.description || 'Még nincs leírás ehhez a bolthoz.'}</strong><span>{[shop?.contact && `Kapcsolat: ${shop.contact}`, shop?.faction && `Frakció: ${shop.faction}`, shop?.relationship && `Viszony: ${shop.relationship}`, shop?.adventureHook && `Kalandötlet: ${shop.adventureHook}`].filter(Boolean).join(' · ')}</span></div><span className="multiplier-badge">Árszorzó ×{String(shop?.multiplier ?? 1).replace('.', ',')}</span></section>
    <section className="cloud-bar" aria-label="Felhőszinkron"><Cloud size={20} aria-hidden="true" /><span>{firebaseReady ? user ? `${user.displayName || user.email} · ${cloudStatus}` : 'Helyi mentés · jelentkezz be a felhőhöz' : 'Helyi mentés · Firebase-projekt még nincs beállítva'}</span>{firebaseReady && (user ? <button onClick={signOutUser}><SignOut size={17} /> Kijelentkezés</button> : <button onClick={connectCloud}>Bejelentkezés Google-fiókkal</button>)}</section>
    {cloudConflict && <section className="cloud-conflict" aria-label="Felhőadatok egyeztetése"><strong>A helyi és a felhős boltok eltérnek.</strong><span>Válaszd ki, melyik készletet tartod meg. A másik változatot előbb a JSON exporttal lementheted.</span><div><button className="button button-secondary" onClick={() => resolveCloudConflict('cloud')}>Felhőadatok használata</button><button className="button button-primary" onClick={() => resolveCloudConflict('local')}>Helyi adatok feltöltése</button></div></section>}
    <section className="toolbar" aria-label="Bolti műveletek"><label className="search-field"><MagnifyingGlass size={26} aria-hidden="true" /><input aria-label="Keresés a tárgyak között" value={search} onChange={event => setSearch(event.target.value)} placeholder="Keresés a tárgyak között..." /></label><button className="button button-primary add-button" onClick={() => { setCatalogSearch(''); setCatalogDraft(null); setDialog('catalog'); }}><Plus size={23} /> Tárgy hozzáadása</button><button className="button button-secondary restock-button" onClick={() => { setRestockId(selected?.id ?? items[0]?.id); setDialog('restock'); }} disabled={!items.length}><Package size={22} /> Készlet feltöltése</button></section>
    <section className="ledger-actions" aria-label="Közös tárgyak és készletgenerálás"><button onClick={() => { setCatalogSearch(''); setCatalogDraft(null); setDialog('catalog'); }}><Books size={19} /> Közös varázstárgyak <span>{catalog.length}</span></button><button onClick={() => setDialog('import')}><UploadSimple size={19} /> JSON import</button><button onClick={openRandomDialog}><DiceFive size={19} /> Véletlen készlet</button></section>
    <section className="inventory" aria-label="Bolti készlet"><div className="inventory-head"><span>Név</span><span>Ritkaság</span><span>Készlet</span><span>Bolti ár (gp)</span><span /></div><div className="inventory-list">{filtered.length ? filtered.map(item => <button key={item.id} className={`inventory-row ${item.id === selected?.id ? 'is-selected' : ''}`} onClick={() => selectItem(item)} aria-pressed={item.id === selected?.id}><span className="item-main"><span className="item-thumb"><ItemImage item={item} alt="" /></span><span className="item-words"><strong>{item.name}</strong><small>{item.teaser}</small></span></span><span className={`rarity ${rarityClass(item.rarity)}`}>{item.rarity}</span><span className="stock-value">{item.stock}</span><span className="price-value">{item.rarity === 'Artefaktum' && item.price == null && item.shopPrice == null ? 'Felbecsülhetetlen' : `${money(salePriceFor(item, shop))} gp`}</span><CaretRight className="row-caret" size={19} aria-hidden="true" /></button>) : <div className="empty-results">{items.length ? 'Nincs találat. Próbálj másik nevet.' : 'Ebben a boltban még nincs tárgy. Adj hozzá egyet a készlethez.'}</div>}</div></section>
    {selected && <section className="detail" aria-label={`${selected.name} részletei`}><div className="detail-rule" aria-hidden="true"><span>◇</span></div><div className="detail-content"><div className="detail-illustration"><ItemImage item={selected} alt={selected.name} /></div><div className="detail-info"><h2>{selected.name}</h2><div className="detail-tags"><span className={`rarity ${rarityClass(selected.rarity)}`}>{selected.rarity}</span><span>{normalizedItemKind(selected)}</span>{selected.category && selected.category !== normalizedItemKind(selected) && <span>{selected.category}</span>}</div><p className="detail-description">{selected.description}</p><h3>Hatás</h3><p className="detail-effect">{selected.effect}</p><p className="base-price">Alapár: {selected.rarity === 'Artefaktum' && selected.price == null ? 'felbecsülhetetlen' : `${money(selected.price)} gp`} · bolti szorzó: ×{String(shop.multiplier).replace('.', ',')}</p><ShopPriceEditor item={selected} shop={shop} value={shopPriceDraft} onChange={setShopPriceDraft} onSave={saveShopPrice} onReset={resetShopPrice} /><div className="purchase-controls"><div className="quantity-wrap"><label>Mennyiség</label><div className="stepper"><button aria-label="Mennyiség csökkentése" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}><Minus size={18} /></button><output>{selected.stock ? quantity : 0}</output><button aria-label="Mennyiség növelése" onClick={() => setQuantity(q => Math.min(selected.stock, q + 1))} disabled={quantity >= selected.stock}><Plus size={18} /></button></div></div><div className="price-wrap"><label htmlFor="sale-price">Eladási ár (gp)</label><div className="price-input"><Coins size={22} aria-hidden="true" /><input id="sale-price" type="number" min="0" step="1" value={salePrice} onChange={event => setSalePrice(event.target.value)} /><span className="price-arrows"><button aria-label="Ár növelése 50 arannyal" onClick={() => changeSalePriceBy(50)}><CaretUp size={14} /></button><button aria-label="Ár csökkentése 50 arannyal" onClick={() => changeSalePriceBy(-50)}><CaretDown size={14} /></button></span></div></div></div><button className="button button-primary sell-button" onClick={sell} disabled={selected.stock < quantity || selected.stock === 0 || salePrice === '' || Number(salePrice) < 0}><Coins size={25} /><span>{selected.stock ? 'Eladás' : 'Elfogyott'}</span><strong>{selected.stock && salePrice !== '' ? `${money((Number(salePrice) || 0) * quantity)} gp` : ''}</strong></button></div></div></section>}
    {selected && <section className="quick-sale" aria-label="Gyors eladás"><button className="quick-sale-name" type="button" aria-expanded={showSelectedDescription} aria-controls="selected-description" onClick={() => setShowSelectedDescription(open => !open)}><small>Kiválasztott tárgy · leírás</small><strong>{selected.name}</strong></button><label>Db<div className="quick-stepper"><button aria-label="Gyors mennyiség csökkentése" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={16} /></button><output>{selected.stock ? quantity : 0}</output><button aria-label="Gyors mennyiség növelése" disabled={quantity >= selected.stock} onClick={() => setQuantity(q => Math.min(selected.stock, q + 1))}><Plus size={16} /></button></div></label><label>Eladási ár (gp)<input aria-label="Alkalmi eladási ár" type="number" min="0" step="1" value={salePrice} onChange={event => setSalePrice(event.target.value)} /></label><button className="button button-primary" disabled={selected.stock < quantity || selected.stock === 0 || salePrice === '' || Number(salePrice) < 0} onClick={sell}><Coins size={18} /> {selected.stock ? 'Eladás' : 'Elfogyott'}</button><div id="selected-description" className="selected-description" hidden={!showSelectedDescription}><div><span className={`rarity ${rarityClass(selected.rarity)}`}>{selected.rarity}</span><button type="button" aria-label="Leírás bezárása" onClick={() => setShowSelectedDescription(false)}><X size={18} /></button></div><p>{selected.description}</p><strong>Hatás</strong><p>{selected.effect}</p></div></section>}
    {toast && <div className="toast" role="status"><CheckCircle size={21} weight="fill" />{toast}<button aria-label="Értesítés bezárása" onClick={() => setToast('')}><X size={16} /></button></div>}
    {dialog && <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDialog(null); }}><div className={`dialog ${['catalog', 'random', 'add', 'import'].includes(dialog) ? 'dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-label={{ shop: 'Bolt adatai', add: 'Tárgy hozzáadása', restock: 'Készlet feltöltése', catalog: 'Közös varázstárgyak', random: 'Véletlen készlet', import: 'JSON import' }[dialog]}><div className="dialog-heading"><h2>{dialog === 'shop' ? editingId ? 'Bolt szerkesztése' : 'Új bolt' : { add: 'Új tárgy a boltba', restock: 'Készlet feltöltése', catalog: 'Közös varázstárgyak', random: 'Véletlen készlet', import: 'Tárgyak importálása JSON-ből' }[dialog]}</h2><button aria-label="Bezárás" onClick={() => setDialog(null)}><X size={22} /></button></div>
      {dialog === 'shop' ? <form onSubmit={saveShop}><label>Bolt neve<input autoFocus required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Például: A Holdkő Műhely" /></label><div className="form-grid"><label>Hely<input value={draft.location} onChange={event => setDraft({ ...draft, location: event.target.value })} placeholder="Város, kerület vagy utca" /></label><label>Tulajdonos<input value={draft.owner} onChange={event => setDraft({ ...draft, owner: event.target.value })} placeholder="Név és megszólítás" /></label></div><label>Árszorzó az alapárhoz képest<input type="number" min="0.01" step="0.01" required value={draft.multiplier} onChange={event => setDraft({ ...draft, multiplier: event.target.value })} /><small className="field-hint">1,25 = 25%-kal drágább; 0,8 = 20%-kal olcsóbb. A bolti ár minden tárgynál külön is beállítható.</small></label><label>Leírás<textarea rows="2" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="Milyen hangulatú a bolt?" /></label><div className="form-grid"><label>Kapcsolattartó<input value={draft.contact} onChange={event => setDraft({ ...draft, contact: event.target.value })} placeholder="Ki segíthet a csapatnak?" /></label><label>Frakció vagy szövetség<input value={draft.faction} onChange={event => setDraft({ ...draft, faction: event.target.value })} placeholder="Céh, rend, nemesi ház..." /></label></div><label>Viszony a csapattal<input value={draft.relationship} onChange={event => setDraft({ ...draft, relationship: event.target.value })} placeholder="Bizalmatlan, barátságos, tartozik nekik..." /></label><label>Kalandötlet vagy titok<textarea rows="2" value={draft.adventureHook} onChange={event => setDraft({ ...draft, adventureHook: event.target.value })} placeholder="Pletyka, megbízás vagy rejtett szándék" /></label><div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => setDialog(null)}>Mégse</button><button type="submit" className="button button-primary"><CheckCircle size={18} /> {editingId ? 'Mentés' : 'Bolt létrehozása'}</button></div></form> : null}
      {dialog === 'add' && <form onSubmit={addItem}>
        <label>Tárgy neve<input autoFocus required value={newItem.name} onChange={event => setNewItem({ ...newItem, name: event.target.value })} placeholder="Például: Holdfény amulettje" /></label>
        <div className="form-grid"><label>Ritkaság<select value={newItem.rarity} onChange={event => setNewItem({ ...newItem, rarity: event.target.value, price: suggestedBasePrice(event.target.value, newItem.kind) })}>{rarities.map(rarity => <option key={rarity}>{rarity}</option>)}</select></label><label>Készlet<input type="number" min="0" value={newItem.stock} onChange={event => setNewItem({ ...newItem, stock: event.target.value })} /></label></div>
        <div className="form-grid"><label>Típus<select value={newItem.kind} onChange={event => setNewItem(itemTypeChange(newItem, event.target.value))}>{itemTypes.map(type => <option key={type.name}>{type.name}</option>)}</select></label><label>Alkategória (opcionális)<input value={newItem.category} onChange={event => setNewItem({ ...newItem, category: event.target.value })} placeholder="Például: köpeny" /></label></div>
        <label>Alapár (gp)<input type="number" min="0" value={newItem.price} onChange={event => setNewItem({ ...newItem, price: event.target.value })} placeholder={newItem.rarity === 'Artefaktum' ? 'Felbecsülhetetlen' : ''} /></label>
        <PriceHint item={newItem} />
        <ItemImagePicker item={newItem} onChange={image => setNewItem({ ...newItem, image })} />
        <label>Rövid leírás<textarea rows="3" value={newItem.description} onChange={event => setNewItem({ ...newItem, description: event.target.value })} placeholder="Mit tud a tárgy?" /></label>
        <div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => setDialog('catalog')}>Vissza</button><button type="submit" className="button button-primary"><Plus size={18} /> Boltba és listába</button></div>
      </form>}
      {dialog === 'restock' && <form onSubmit={restock}><label>Tárgy<select value={restockId} onChange={event => setRestockId(event.target.value)}>{items.map(item => <option key={item.id} value={item.id}>{item.name} · jelenleg {item.stock} db</option>)}</select></label><label>Hozzáadandó mennyiség<input autoFocus type="number" min="1" value={restockAmount} onChange={event => setRestockAmount(event.target.value)} /></label><div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => setDialog(null)}>Mégse</button><button type="submit" className="button button-primary"><ArrowCounterClockwise size={18} /> Feltöltés</button></div></form>}
      {dialog === 'import' && <ItemJsonImport catalog={catalog} onImport={importCatalogJson} onBack={() => setDialog('catalog')} />}
      {dialog === 'catalog' && (catalogDraft ? <form onSubmit={saveCatalogItem}>
        <p className="dialog-intro">{catalogEditingId ? 'A módosítás minden érintett bolt tárgyleírását és alapárát frissíti. A készlet változatlan marad.' : 'A tárgy a közös listába kerül, és bármelyik boltba később betehető.'}</p>
        <label>Tárgy neve<input autoFocus required value={catalogDraft.name} onChange={event => setCatalogDraft({ ...catalogDraft, name: event.target.value })} /></label>
        <div className="form-grid"><label>Ritkaság<select value={catalogDraft.rarity} onChange={event => setCatalogDraft({ ...catalogDraft, rarity: event.target.value, price: suggestedBasePrice(event.target.value, catalogDraft.kind) })}>{rarities.map(rarity => <option key={rarity}>{rarity}</option>)}</select></label><label>Alapár (gp)<input type="number" min="0" value={catalogDraft.price} onChange={event => setCatalogDraft({ ...catalogDraft, price: event.target.value })} placeholder={catalogDraft.rarity === 'Artefaktum' ? 'Felbecsülhetetlen' : ''} /></label></div>
        <PriceHint item={catalogDraft} />
        <div className="form-grid"><label>Típus<select value={catalogDraft.kind} onChange={event => setCatalogDraft(itemTypeChange(catalogDraft, event.target.value))}>{itemTypes.map(type => <option key={type.name}>{type.name}</option>)}</select></label><label>Alkategória (opcionális)<input value={catalogDraft.category} onChange={event => setCatalogDraft({ ...catalogDraft, category: event.target.value })} placeholder="Például: köpeny" /></label></div>
        <ItemImagePicker item={catalogDraft} onChange={image => setCatalogDraft({ ...catalogDraft, image })} />
        <label>Rövid leírás<input value={catalogDraft.teaser} onChange={event => setCatalogDraft({ ...catalogDraft, teaser: event.target.value })} /></label>
        <label>Leírás<textarea rows="2" value={catalogDraft.description} onChange={event => setCatalogDraft({ ...catalogDraft, description: event.target.value })} /></label>
        <label>Hatás<textarea rows="2" value={catalogDraft.effect} onChange={event => setCatalogDraft({ ...catalogDraft, effect: event.target.value })} /></label>
        <div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => { setCatalogDraft(null); setCatalogEditingId(null); }}>Vissza a listához</button><button type="submit" className="button button-primary">Mentés</button></div>
      </form> : <><p className="dialog-intro">A közös lista minden boltban használható. A készlet boltonként külön számolódik.</p><div className="catalog-tools"><label className="catalog-search"><MagnifyingGlass size={19} /><input autoFocus aria-label="Keresés a közös tárgyak között" placeholder="Tárgy keresése..." value={catalogSearch} onChange={event => setCatalogSearch(event.target.value)} /></label><button className="button button-primary" onClick={() => { setCatalogEditingId(null); setCatalogDraft({ name: '', rarity: 'Gyakori', price: 100, kind: 'Csodás tárgy', category: '', image: defaultImageFor('Csodás tárgy'), teaser: '', description: '', effect: '' }); }}><Plus size={18} /> Új a listába</button></div><div className="catalog-list">{catalog.filter(item => `${item.name} ${item.rarity} ${item.kind} ${item.category}`.toLocaleLowerCase('hu-HU').includes(catalogSearch.toLocaleLowerCase('hu-HU'))).map(item => { const inShop = items.some(entry => entry.catalogId === item.id); return <div className="catalog-row" key={item.id}><span className="catalog-row-image"><ItemImage item={item} alt="" /></span><span className="catalog-row-main"><strong>{item.name}</strong><small>{item.rarity} · {normalizedItemKind(item)}{item.category && item.category !== normalizedItemKind(item) && ` / ${item.category}`} · {item.rarity === 'Artefaktum' && item.price == null ? 'Felbecsülhetetlen' : `${money(item.price)} gp`}</small></span><button className="catalog-edit" aria-label={`${item.name} szerkesztése`} title="Tárgy szerkesztése" onClick={() => { setCatalogEditingId(item.id); setCatalogDraft({ name: item.name ?? '', rarity: item.rarity ?? 'Gyakori', price: item.price ?? (item.rarity === 'Artefaktum' ? '' : 0), kind: normalizedItemKind(item), category: item.category ?? '', teaser: item.teaser ?? '', description: item.description ?? '', effect: item.effect ?? '', image: item.image || defaultImageFor(normalizedItemKind(item)) }); }}><PencilSimple size={19} /></button><button className="button button-secondary" disabled={inShop} onClick={() => addFromCatalog(item)}>{inShop ? 'A boltban' : 'Boltba teszem'}</button></div>; })}</div><div className="dialog-actions"><button className="button button-secondary" onClick={() => setDialog('add')}><Plus size={18} /> Új tárgy rögtön a boltba</button></div></>)}
      {dialog === 'random' && <div className="random-panel"><p className="dialog-intro">A közös listából sorsol, az artefaktumokat kihagyja. A sorsolás előtt ellenőrizheted az eredményt.</p><div className="form-grid random-grid"><label>Környék mágiája<select value={randomOptions.prevalence} onChange={event => { setRandomOptions({ ...randomOptions, prevalence: event.target.value }); setRandomPreview(null); }}><option value="scarce">Szórványos</option><option value="normal">Átlagos</option><option value="abundant">Bőséges</option></select></label><label>Bolt mérete<select value={randomOptions.size} onChange={event => { setRandomOptions({ ...randomOptions, size: event.target.value }); setRandomPreview(null); }}><option value="small">Kicsi</option><option value="medium">Közepes</option><option value="large">Nagy</option></select></label><label>Legmagasabb ritkaság<select value={randomOptions.maxRarity} onChange={event => { setRandomOptions({ ...randomOptions, maxRarity: event.target.value }); setRandomPreview(null); }}>{rarities.slice(0, 5).map(rarity => <option key={rarity}>{rarity}</option>)}</select></label><label>Bolti profil<select value={randomOptions.category} onChange={event => { setRandomOptions({ ...randomOptions, category: event.target.value }); setRandomPreview(null); }}><option value="all">Vegyes kínálat</option>{[...new Set([...itemTypes.map(type => type.name), ...catalog.map(item => item.category)])].filter(Boolean).sort().map(category => <option key={category}>{category}</option>)}</select></label><label>Különböző tárgyak száma<input type="number" min="1" max="50" placeholder="Méret alapján" value={randomOptions.count} onChange={event => { setRandomOptions({ ...randomOptions, count: event.target.value }); setRandomPreview(null); }} /></label><label className="checkbox-label"><input type="checkbox" checked={randomOptions.consumables} onChange={event => { setRandomOptions({ ...randomOptions, consumables: event.target.checked }); setRandomPreview(null); }} /> Több ital és tekercs</label><label className="checkbox-label"><input type="checkbox" checked={randomOptions.includeExisting} onChange={event => { setRandomOptions({ ...randomOptions, includeExisting: event.target.checked }); setRandomPreview(null); }} /> Meglévő tárgyak újrakészletezése</label></div><div className="random-hint">A gyakori tárgyak esélyesebbek; az italokból és tekercsekből több darab lehet. A meglévő készlethez hozzáadunk, nem írjuk felül.</div><div className="dialog-actions"><button className="button button-secondary" onClick={rollStock}><DiceFive size={18} /> {randomPreview ? 'Újrasorsolás' : 'Készlet sorsolása'}</button></div>{randomPreview && <><div className="preview-heading"><strong>Sorsolt készlet</strong><span>{randomPreview.length} tárgy</span></div>{randomPreview.length ? <div className="random-preview">{randomPreview.map(item => <div key={item.id}><strong>{item.name}</strong><span>{items.some(existing => existing.catalogId === item.catalogId) ? '+' : ''}{item.stock} db · {item.rarity} · {money(salePriceFor(item, shop))} gp</span></div>)}</div> : <p className="empty-results">Nincs megfelelő tárgy a közös listában. Bővítsd a listát, vagy lazítsd a szűrőket.</p>}<div className="dialog-actions"><button className="button button-secondary" onClick={() => setDialog(null)}>Mégse</button><button className="button button-primary" disabled={!randomPreview.length} onClick={acceptRandomStock}>Készlet hozzáadása</button></div></>}</div>}
    </div></div>}
  </main>;
}
