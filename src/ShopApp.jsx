import { useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlass, Plus, Package, CaretRight, CaretUp, CaretDown, Minus, Coins, X, CheckCircle, Storefront, GearSix, DiceFive, PencilSimple, Trash } from '@phosphor-icons/react';
import { activeShopKey, blankShop, canUndoLatestActivity, generateStock, makeId, rarities, recordItemRemoval, recordRandomStock, recordStockChange, removeShop, salePriceFor, shopItemFromCatalog, undoLatestActivity } from './shopData.js';
import { firebaseReady, signIn, signOutUser } from './firebase.js';
import { useLedgerSession } from './useLedgerSession.js';
import { ItemImage } from './ItemImagePicker.jsx';
import { MagicItemEditor } from './MagicItemEditor.jsx';
import { ShopEditor } from './ShopEditor.jsx';
import { ItemJsonImport } from './ItemJsonImport.jsx';
import { defaultImageFor, itemTypes, normalizedItemKind, publicAssetUrl } from './itemTypes.js';
import { previewItemImport } from './itemImport.js';
import { ActivityJournal } from './InventoryActivity.jsx';
import { ManagementDrawer } from './ManagementDrawer.jsx';
import { CloudDataDialog } from './CloudDataDialog.jsx';
import { BaseCatalogDialog } from './BaseCatalogDialog.jsx';
import { UserGuide } from './UserGuide.jsx';
import { copyBaseItems } from './baseCatalogData.js';

const money = value => new Intl.NumberFormat('hu-HU').format(value);
const rarityClass = text => `rarity-${text.toLocaleLowerCase('hu-HU').replaceAll(' ', '-')}`;
const suggestedSalePrice = (item, shop) => item?.rarity === 'Artefaktum' && item.price == null && item.shopPrice == null ? '' : salePriceFor(item, shop);
const blankItem = () => ({ name: '', rarity: 'Gyakori', kind: 'Csodás tárgy', stock: 1, price: 100, category: '', image: defaultImageFor('Csodás tárgy'), teaser: '', description: '', effect: '' });

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

export function App({ seedItems = [] }) {
  const [dataState, dataSession] = useLedgerSession(seedItems);
  const { ledger, user, ready: dataReady, busy: dataBusy, status: cloudStatus } = dataState;
  const setLedger = dataSession.update;
  const { shops, catalog } = ledger;
  const [activeId, setActiveId] = useState(() => localStorage.getItem(activeShopKey) || 'rezhold');
  const [selectedId, setSelectedId] = useState('cloak');
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState(400);
  const [shopPriceDraft, setShopPriceDraft] = useState(400);
  const [showSelectedDescription, setShowSelectedDescription] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [removalTarget, setRemovalTarget] = useState(null);
  const [shopRemovalId, setShopRemovalId] = useState(null);
  const removalTriggerRef = useRef(null);
  const [managementOpen, setManagementOpen] = useState(false);
  const managementButtonRef = useRef(null);
  const dialogReturnFocusRef = useRef(null);
  const previousDialogRef = useRef(null);
  const [toast, setToast] = useState('');
  const [draft, setDraft] = useState(blankShop);
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState(blankItem);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogDraft, setCatalogDraft] = useState(null);
  const [catalogEditingId, setCatalogEditingId] = useState(null);
  const [randomOptions, setRandomOptions] = useState({ prevalence: 'normal', size: 'medium', maxRarity: 'Ritka', category: 'all', count: '', consumables: false, includeExisting: true });
  const [randomPreview, setRandomPreview] = useState(null);
  const [adjustItemId, setAdjustItemId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState(1);
  const [adjustDirection, setAdjustDirection] = useState('add');
  const [adjustReason, setAdjustReason] = useState('');
  const ledgerRef = useRef(ledger);
  ledgerRef.current = ledger;

  const shop = shops.find(entry => entry.id === activeId) ?? shops[0];
  const items = shop?.items ?? [];
  const selected = items.find(item => item.id === selectedId) ?? items[0];
  const removalItem = removalTarget?.shopId === shop?.id ? items.find(item => item.id === removalTarget.itemId) : null;
  const removalShop = shops.find(entry => entry.id === shopRemovalId);
  const adjustTarget = items.find(item => item.id === adjustItemId);
  const latestActivity = shop?.activity?.findLast(event => !event.undoneAt);
  const canUndo = canUndoLatestActivity(shop);
  const filtered = useMemo(() => items.filter(item => `${item.name} ${item.rarity}`.toLocaleLowerCase('hu-HU').includes(search.toLocaleLowerCase('hu-HU'))), [items, search]);

  useEffect(() => { localStorage.setItem(activeShopKey, shop?.id ?? ''); }, [shop?.id]);
  useEffect(() => { setSalePrice(suggestedSalePrice(selected, shop)); setShopPriceDraft(suggestedSalePrice(selected, shop)); setQuantity(1); setShowSelectedDescription(false); }, [selected?.id, selected?.price, selected?.shopPrice, shop?.id, shop?.multiplier]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), typeof toast === 'object' ? 8000 : 3600); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!dialog) return undefined;
    const frame = requestAnimationFrame(() => {
      if (dialog === 'remove') { document.querySelector('.remove-item-cancel')?.focus(); return; }
      if (dialog === 'delete-shop') { document.querySelector('.delete-shop-cancel')?.focus(); return; }
      if (!document.querySelector('.dialog')?.contains(document.activeElement)) {
        document.querySelector('.dialog [autofocus], .dialog-heading button, .dialog button')?.focus();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [dialog]);

  useEffect(() => {
    if (previousDialogRef.current && !dialog && managementOpen) {
      const frame = requestAnimationFrame(() => {
        const trigger = dialogReturnFocusRef.current;
        if (trigger?.isConnected && !trigger.disabled) trigger.focus();
        else document.querySelector('.management-close')?.focus();
        dialogReturnFocusRef.current = null;
      });
      previousDialogRef.current = dialog;
      return () => cancelAnimationFrame(frame);
    }
    previousDialogRef.current = dialog;
  }, [dialog, managementOpen]);

  useEffect(() => {
    setDialog(current => current === 'cloud' ? current : null);
    setSelectedId('');
    setSearch('');
    setToast('');
    setCatalogSearch('');
    setCatalogDraft(null);
    setCatalogEditingId(null);
    setNewItem(blankItem());
    setDraft(blankShop());
    setEditingId(null);
    setRemovalTarget(null);
    setShopRemovalId(null);
    setRandomPreview(null);
    setAdjustItemId('');
    setAdjustAmount(1);
    setAdjustDirection('add');
    setAdjustReason('');
    setQuantity(1);
    setShowSelectedDescription(false);
  }, [user?.uid]);

  function updateShop(updater) {
    if (!shop) return;
    setLedger(current => ({ ...current, shops: current.shops.map(entry => entry.id === shop.id ? updater(entry) : entry) }));
  }
  function updateItems(updater) { updateShop(entry => ({ ...entry, items: updater(entry.items ?? []) })); }
  function selectItem(item) { setSelectedId(item.id); setSalePrice(suggestedSalePrice(item, shop)); setShopPriceDraft(suggestedSalePrice(item, shop)); setQuantity(1); setShowSelectedDescription(false); }
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
    const activityId = makeId();
    updateShop(entry => recordStockChange(entry, { id: activityId, type: 'sale', itemId: selected.id, delta: -quantity, unitPrice: price }) ?? entry);
    setToast({ message: `${quantity} × ${selected.name} eladva · ${money(price * quantity)} gp`, undoId: activityId });
    setQuantity(1);
    setSalePrice(suggestedSalePrice(selected, shop));
  }
  function addItem(event) {
    event.preventDefault();
    const name = newItem.name.trim();
    if (!name || !shop) return;
    const description = newItem.description.trim();
    const definition = { id: makeId(), name, rarity: newItem.rarity, kind: newItem.kind, category: newItem.category.trim(), price: newItem.price === '' ? null : Math.max(0, Number(newItem.price) || 0), image: newItem.image || defaultImageFor(newItem.kind), teaser: newItem.teaser.trim() || description || 'Egyedi varázstárgy.', description: description || 'A mesélő által hozzáadott varázstárgy.', effect: newItem.effect.trim() || description || 'A tárgy hatását a mesélő határozza meg.' };
    const duplicate = catalog.find(item => item.name.trim().toLocaleLowerCase('hu-HU') === name.toLocaleLowerCase('hu-HU') && item.rarity === definition.rarity);
    const chosen = duplicate ?? definition;
    const item = shopItemFromCatalog(chosen, Math.max(0, Number(newItem.stock) || 0));
    const alreadyHere = items.find(existing => existing.catalogId === chosen.id);
    setLedger(current => ({ catalog: duplicate ? current.catalog : [...current.catalog, definition], shops: current.shops.map(entry => entry.id === shop.id ? { ...entry, items: entry.items.some(existing => existing.catalogId === chosen.id) ? entry.items.map(existing => existing.catalogId === chosen.id ? { ...existing, stock: existing.stock + item.stock } : existing) : [...entry.items, item] } : entry) }));
    selectItem(alreadyHere ?? item); setSearch(''); setDialog(null);
    setNewItem(blankItem());
    setToast(`${name} a boltba és a közös tárgylistába került`);
  }
  function saveCatalogItem(event) {
    event.preventDefault();
    const name = catalogDraft.name.trim();
    if (!name) return;
    const duplicate = catalog.find(item => item.id !== catalogEditingId && item.name.trim().toLocaleLowerCase('hu-HU') === name.toLocaleLowerCase('hu-HU') && item.rarity === catalogDraft.rarity);
    if (duplicate) { setToast('Ilyen nevű és ritkaságú tárgy már van a listában.'); return; }
    const description = catalogDraft.description.trim();
    const previous = catalog.find(item => item.id === catalogEditingId);
    const definition = { ...previous, id: catalogEditingId ?? makeId(), name, rarity: catalogDraft.rarity, kind: catalogDraft.kind, category: catalogDraft.category.trim(), price: catalogDraft.price === '' ? null : Math.max(0, Number(catalogDraft.price) || 0), image: catalogDraft.image || defaultImageFor(catalogDraft.kind), teaser: catalogDraft.teaser?.trim() || description || 'Egyedi varázstárgy.', description: description || 'A mesélő által hozzáadott varázstárgy.', effect: catalogDraft.effect?.trim() || description || 'A tárgy hatását a mesélő határozza meg.' };
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
    setLedger(current => {
      const fresh = previewItemImport(json, current.catalog);
      return { ...current, catalog: [...current.catalog, ...fresh.items.map(item => ({ ...item, id: makeId() }))] };
    });
    setDialog('catalog');
    setCatalogSearch('');
    setToast(`${preview.items.length} tárgy a közös listába került`);
  }
  function copyFromBase(baseItems, ids) {
    if (!user || !dataReady || dataBusy) return 0;
    const snapshot = dataSession.getSnapshot();
    const result = copyBaseItems(snapshot.ledger, baseItems, ids);
    if (result.added) setLedger(result.ledger);
    return dataSession.getSnapshot().ledger === result.ledger ? result.added : 0;
  }
  function openRandomDialog() { setRandomPreview(null); setDialog('random'); }
  function rollStock() { setRandomPreview(generateStock(catalog, items, randomOptions)); }
  function acceptRandomStock() {
    if (!randomPreview?.length) return;
    const activityId = makeId();
    updateShop(entry => recordRandomStock(entry, randomPreview, { id: activityId }) ?? entry);
    selectItem(items.find(item => item.catalogId === randomPreview[0].catalogId) ?? randomPreview[0]); setSearch(''); setDialog(null); setRandomPreview(null);
    setToast({ message: `${randomPreview.length} tárgy készlete frissült`, undoId: activityId });
  }
  function openAdjustDialog(itemId = selected?.id ?? items[0]?.id) {
    setAdjustItemId(itemId ?? ''); setAdjustAmount(1); setAdjustDirection('add'); setAdjustReason(''); setDialog('adjust');
  }
  function adjustStock(event) {
    event.preventDefault();
    const amount = Number(adjustAmount);
    const delta = adjustDirection === 'remove' ? -amount : amount;
    if (!adjustTarget || !Number.isInteger(amount) || amount < 1 || adjustTarget.stock + delta < 0) return;
    const activityId = makeId();
    updateShop(entry => recordStockChange(entry, { id: activityId, type: 'adjustment', itemId: adjustItemId, delta, reason: adjustReason }) ?? entry);
    setDialog(null);
    setToast({ message: `${adjustTarget.name} készlete ${delta > 0 ? '+' : ''}${delta} db`, undoId: activityId });
  }
  function openRemoval(event) {
    if (!selected || !shop) return;
    removalTriggerRef.current = event.currentTarget;
    setRemovalTarget({ shopId: shop.id, itemId: selected.id });
    setDialog('remove');
  }
  function cancelRemoval() {
    setDialog(null);
    requestAnimationFrame(() => removalTriggerRef.current?.focus());
  }
  function removeItem() {
    if (!removalItem) return;
    const activityId = makeId();
    updateShop(entry => recordItemRemoval(entry, removalItem.id, { id: activityId }) ?? entry);
    setSelectedId((filtered.find(item => item.id !== removalItem.id) ?? items.find(item => item.id !== removalItem.id))?.id ?? '');
    setShowSelectedDescription(false);
    setDialog(null);
    setRemovalTarget(null);
    setToast({ message: `${removalItem.name} eltávolítva a boltból`, undoId: activityId });
    requestAnimationFrame(() => (document.querySelector('.quick-sale-name') ?? document.querySelector('.add-button'))?.focus());
  }
  function handleDialogKeys(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeDialog(); }
    if (event.key === 'Tab') {
      const focusable = [...event.currentTarget.querySelectorAll('.dialog button:not(:disabled), .dialog input:not(:disabled), .dialog select:not(:disabled), .dialog textarea:not(:disabled), .dialog a[href], .dialog [tabindex]:not([tabindex="-1"])')].filter(element => element.getClientRects().length);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }
  function undoActivity() {
    if (!canUndo) { setToast('A legutóbbi művelet már nem vonható vissza.'); return; }
    updateShop(entry => undoLatestActivity(entry) ?? entry);
    setToast('A legutóbbi készletművelet visszavonva');
  }
  function openShopDialog(entry) {
    setEditingId(entry?.id ?? null);
    setDraft(entry ? Object.fromEntries(Object.keys(blankShop()).map(key => [key, entry[key] ?? ''])) : blankShop());
    setDialog('shop');
  }
  function cancelShopDeletion() {
    setDialog(null);
    setShopRemovalId(null);
  }
  function closeDialog() {
    if (dialog === 'remove') cancelRemoval();
    else if (dialog === 'delete-shop') cancelShopDeletion();
    else setDialog(null);
  }
  function deleteShop() {
    if (!removalShop || !dataReady || dataBusy) return;
    const next = removeShop(dataSession.getSnapshot().ledger, removalShop.id);
    setLedger(next);
    if (dataSession.getSnapshot().ledger !== next) {
      setToast('A bolt törlését nem sikerült menteni. Próbáld újra.');
      return;
    }
    setActiveId(current => next.shops.some(entry => entry.id === current) ? current : next.shops[0]?.id ?? '');
    setSelectedId('');
    setSearch('');
    setShowSelectedDescription(false);
    setShopRemovalId(null);
    setCatalogDraft(null);
    setCatalogEditingId(null);
    setNewItem(blankItem());
    setRandomPreview(null);
    setDialog(null);
    setToast(`${removalShop.name} törölve. A közös tárgykatalógus megmaradt.`);
    if (!managementOpen) requestAnimationFrame(() => (document.querySelector('.empty-shop-create') ?? managementButtonRef.current)?.focus());
  }
  function saveShop(event) {
    event.preventDefault();
    const name = draft.name.trim();
    const multiplier = Number(draft.multiplier);
    if (!name || !Number.isFinite(multiplier) || multiplier <= 0) return;
    const details = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
    details.name = name; details.multiplier = multiplier;
    if (editingId) {
      setLedger(current => ({ ...current, shops: current.shops.map(entry => entry.id === editingId ? { ...entry, ...details } : entry) }));
      setToast(`${name} adatai frissítve`);
    } else {
      const id = makeId();
      setLedger(current => ({ ...current, shops: [...current.shops, { id, ...details, items: [], activity: [] }] }));
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
  async function handleDataAction(action) {
    try {
      if (action === 'download') dataSession.copyCloudToLocal();
      else if (action === 'upload') await dataSession.uploadLocal();
      else if (action === 'restore-local') dataSession.restoreLocalBackup();
      else if (action === 'restore-cloud') await dataSession.restoreCloudBackup();
      setToast({ download: 'A felhőadatok a helyi tárhelyre másolva. Továbbra is a felhőadatokat használod.', upload: 'A helyi adatok feltöltve. Most ezt a felhős változatot használod.', 'restore-local': 'Az előző helyi adatok visszaállítva.', 'restore-cloud': 'Az előző felhőadatok visszaállítva.' }[action]);
      return true;
    } catch {
      setToast('A másolás nem sikerült. Ellenőrizd az internetkapcsolatot és a tárhelyet, majd próbáld újra.');
      return false;
    }
  }

  async function disconnectCloud() {
    try { await signOutUser(); }
    catch { setToast('A kijelentkezés nem sikerült. Próbáld újra.'); }
  }

  const editingMagicItem = dialog === 'add' || (dialog === 'catalog' && Boolean(catalogDraft));

  function closeManagement() {
    setManagementOpen(false);
    requestAnimationFrame(() => managementButtonRef.current?.focus());
  }

  function openManagementAction(action) {
    dialogReturnFocusRef.current = document.activeElement;
    if (action === 'edit-shop') openShopDialog(shop);
    else if (action === 'new-shop') openShopDialog(null);
    else if (action === 'delete-shop' && shop) { setShopRemovalId(shop.id); setDialog('delete-shop'); }
    else if (action === 'catalog') { setCatalogSearch(''); setCatalogDraft(null); setDialog('catalog'); }
    else if (action === 'base-catalog' && user) setDialog('base-catalog');
    else if (action === 'random') openRandomDialog();
    else if (action === 'activity') setDialog('activity');
    else if (action === 'import') setDialog('import');
    else if (action === 'cloud') setDialog('cloud');
    else if (action === 'guide') setDialog('guide');
    else if (action === 'export') exportJson();
  }

  return <main className="ledger game-ledger">
    <header className="shop-header"><img className="header-art" src={publicAssetUrl('/assets/header-merchant.png')} alt="" /><div className="header-content"><h1>{dataReady && shop ? shop.name : "Hacsi's magic shops"}</h1><p hidden={!dataReady || !shop}>{shop?.location || 'Ismeretlen hely'} <span aria-hidden="true">·</span> {shop?.owner || 'Ismeretlen tulajdonos'}</p><div className="header-rule" aria-hidden="true"><span /></div></div></header>
    <section className="shop-bar" aria-label="Bolt kiválasztása és kezelés"><label className="shop-picker"><Storefront size={22} aria-hidden="true" /><span>Bolt</span><select disabled={!dataReady || dataBusy || !shop} aria-label="Aktív bolt" value={shop?.id ?? ''} onChange={event => { setActiveId(event.target.value); setSelectedId(''); setSearch(''); }}>{!shop && <option value="">Nincs bolt</option>}{shops.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><button ref={managementButtonRef} type="button" className="management-toggle" aria-haspopup="dialog" aria-expanded={managementOpen} onClick={() => setManagementOpen(true)}><GearSix size={21} aria-hidden="true" /> Kezelés</button></section>
    <div className="data-source-status" role="status"><strong>{!dataState.authReady ? 'Fiók ellenőrzése…' : user ? `Felhőadatok · ${user.displayName || user.email || 'Bejelentkezve'}` : 'Helyi adatok · ezen az eszközön'}</strong>{cloudStatus && <span>{cloudStatus}</span>}{user && !dataReady && <button type="button" onClick={() => dataSession.setUser(user)}>Újrapróbálás</button>}</div>
    {dataReady && <fieldset className="ledger-workspace" disabled={dataBusy} inert={dataBusy}>
    {!shop ? <section className="empty-shops" aria-label="Még nincs bolt"><Storefront size={42} aria-hidden="true" /><h2>Még nincs boltod</h2><p>Hozz létre egy kereskedést, majd adj hozzá tárgyakat a közös katalógusból.</p><button type="button" className="button button-primary empty-shop-create" onClick={() => openShopDialog(null)}><Plus size={21} /> Új bolt létrehozása</button></section> : <>
    <section className="shop-notes" aria-label="Bolti tudnivalók"><div><strong>{shop?.description || 'Még nincs leírás ehhez a bolthoz.'}</strong><span>{[shop?.contact && `Kapcsolat: ${shop.contact}`, shop?.faction && `Frakció: ${shop.faction}`, shop?.relationship && `Viszony: ${shop.relationship}`, shop?.adventureHook && `Kalandötlet: ${shop.adventureHook}`].filter(Boolean).join(' · ')}</span></div><span className="multiplier-badge">Árszorzó ×{String(shop?.multiplier ?? 1).replace('.', ',')}</span></section>
    <section className="toolbar" aria-label="Bolti műveletek"><label className="search-field"><MagnifyingGlass size={26} aria-hidden="true" /><input aria-label="Keresés a tárgyak között" value={search} onChange={event => setSearch(event.target.value)} placeholder="Keresés a tárgyak között..." /></label><button className="button button-primary add-button" onClick={() => { setCatalogSearch(''); setCatalogDraft(null); setDialog('catalog'); }}><Plus size={23} /><span className="add-label-long">Tárgy hozzáadása</span><span className="add-label-short">Tárgy</span></button></section>
    <section className="inventory" aria-label="Bolti készlet"><div className="inventory-head"><span>Név</span><span>Ritkaság</span><span>Készlet</span><span>Bolti ár (gp)</span><span /></div><div className="inventory-list">{filtered.length ? filtered.map(item => <button key={item.id} className={`inventory-row ${item.id === selected?.id ? 'is-selected' : ''}`} onClick={() => selectItem(item)} aria-pressed={item.id === selected?.id}><span className="item-main"><span className="item-thumb"><ItemImage item={item} alt="" /></span><span className="item-words"><strong>{item.name}</strong><small>{item.teaser}</small></span></span><span className={`rarity ${rarityClass(item.rarity)}`}>{item.rarity}</span><span className="stock-value">{item.stock}</span><span className="price-value">{item.rarity === 'Artefaktum' && item.price == null && item.shopPrice == null ? 'Felbecsülhetetlen' : `${money(salePriceFor(item, shop))} gp`}</span><CaretRight className="row-caret" size={19} aria-hidden="true" /></button>) : <div className="empty-results">{items.length ? 'Nincs találat. Próbálj másik nevet.' : 'Ebben a boltban még nincs tárgy. Adj hozzá egyet a készlethez.'}</div>}</div></section>
    {selected && <section className="detail" aria-label={`${selected.name} részletei`}><div className="detail-rule" aria-hidden="true"><span>◇</span></div><div className="detail-content"><div className="detail-illustration"><ItemImage item={selected} alt={selected.name} /></div><div className="detail-info"><h2>{selected.name}</h2><div className="detail-tags"><span className={`rarity ${rarityClass(selected.rarity)}`}>{selected.rarity}</span><span>{normalizedItemKind(selected)}</span>{selected.category && selected.category !== normalizedItemKind(selected) && <span>{selected.category}</span>}</div><p className="detail-description">{selected.description}</p><h3>Hatás</h3><p className="detail-effect">{selected.effect}</p><p className="base-price">Alapár: {selected.rarity === 'Artefaktum' && selected.price == null ? 'felbecsülhetetlen' : `${money(selected.price)} gp`} · bolti szorzó: ×{String(shop.multiplier).replace('.', ',')}</p><button type="button" className="remove-shop-item" onClick={openRemoval}><Trash size={18} aria-hidden="true" /> Eltávolítás a boltból</button><ShopPriceEditor item={selected} shop={shop} value={shopPriceDraft} onChange={setShopPriceDraft} onSave={saveShopPrice} onReset={resetShopPrice} /><div className="purchase-controls"><div className="quantity-wrap"><label>Mennyiség</label><div className="stepper"><button aria-label="Mennyiség csökkentése" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}><Minus size={18} /></button><output>{selected.stock ? quantity : 0}</output><button aria-label="Mennyiség növelése" onClick={() => setQuantity(q => Math.min(selected.stock, q + 1))} disabled={quantity >= selected.stock}><Plus size={18} /></button></div></div><div className="price-wrap"><label htmlFor="sale-price">Eladási ár (gp)</label><div className="price-input"><Coins size={22} aria-hidden="true" /><input id="sale-price" type="number" min="0" step="1" value={salePrice} onChange={event => setSalePrice(event.target.value)} /><span className="price-arrows"><button aria-label="Ár növelése 50 arannyal" onClick={() => changeSalePriceBy(50)}><CaretUp size={14} /></button><button aria-label="Ár csökkentése 50 arannyal" onClick={() => changeSalePriceBy(-50)}><CaretDown size={14} /></button></span></div></div></div><button className="button button-primary sell-button" onClick={sell} disabled={selected.stock < quantity || selected.stock === 0 || salePrice === '' || Number(salePrice) < 0}><Coins size={25} /><span>{selected.stock ? 'Eladás' : 'Elfogyott'}</span><strong>{selected.stock && salePrice !== '' ? `${money((Number(salePrice) || 0) * quantity)} gp` : ''}</strong></button></div></div></section>}
    {selected && <section className="quick-sale" aria-label="Gyors eladás" inert={managementOpen || ['remove', 'delete-shop'].includes(dialog)}><button className="quick-sale-name" type="button" aria-expanded={showSelectedDescription} aria-controls="selected-description" onClick={() => setShowSelectedDescription(open => !open)}><small>Kiválasztott tárgy · leírás</small><strong>{selected.name}</strong></button><button className="quick-stock-button" type="button" onClick={() => openAdjustDialog(selected.id)} aria-label={`${selected.name} készletének módosítása, jelenleg ${selected.stock} darab`}><Package size={17} /> {selected.stock} db</button><label>Db<div className="quick-stepper"><button aria-label="Gyors mennyiség csökkentése" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={16} /></button><output>{selected.stock ? quantity : 0}</output><button aria-label="Gyors mennyiség növelése" disabled={quantity >= selected.stock} onClick={() => setQuantity(q => Math.min(selected.stock, q + 1))}><Plus size={16} /></button></div></label><label>Eladási ár (gp)<input aria-label="Alkalmi eladási ár" type="number" min="0" step="1" value={salePrice} onChange={event => setSalePrice(event.target.value)} /></label><button className="button button-primary" disabled={selected.stock < quantity || selected.stock === 0 || salePrice === '' || Number(salePrice) < 0} onClick={sell}><Coins size={18} /> {selected.stock ? 'Eladás' : 'Elfogyott'}</button><div id="selected-description" className="selected-description" hidden={!showSelectedDescription}><div><span className={`rarity ${rarityClass(selected.rarity)}`}>{selected.rarity}</span><button type="button" aria-label="Leírás bezárása" onClick={() => setShowSelectedDescription(false)}><X size={18} /></button></div><p>{selected.description}</p><strong>Hatás</strong><p>{selected.effect}</p><button type="button" className="remove-shop-item" onClick={openRemoval}><Trash size={18} aria-hidden="true" /> Eltávolítás a boltból</button></div></section>}
    </>}
    </fieldset>}
    <ManagementDrawer open={managementOpen} dialogOpen={Boolean(dialog)} onClose={closeManagement} onAction={openManagementAction} shop={shop} catalogCount={catalog.length} hasSaleBar={dataReady && Boolean(selected)} dataState={dataState} />
    {toast && <div className="toast" role="status"><CheckCircle size={21} weight="fill" /><span>{typeof toast === 'string' ? toast : toast.message}</span>{typeof toast === 'object' && toast.undoId === latestActivity?.id && canUndo && <button className="toast-undo" onClick={undoActivity}>Visszavonás</button>}<button aria-label="Értesítés bezárása" onClick={() => setToast('')}><X size={16} /></button></div>}
    {dialog && <div className={`dialog-backdrop ${dialog === 'guide' ? `guide-backdrop ${dataReady && selected ? '' : 'no-sale-bar'}` : ''}`} onKeyDown={handleDialogKeys} onMouseDown={event => { if (event.target === event.currentTarget) { closeDialog(); } }}><div className={`dialog ${['catalog', 'base-catalog', 'random', 'add', 'import', 'activity'].includes(dialog) ? 'dialog-wide' : ''} ${editingMagicItem ? 'magic-editor-dialog' : ''} ${dialog === 'shop' ? 'shop-editor-dialog' : ''} ${dialog === 'cloud' ? 'cloud-data-dialog' : ''} ${dialog === 'guide' ? 'user-guide-dialog' : ''}`} role={dialog === 'delete-shop' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-describedby={dialog === 'delete-shop' ? 'delete-shop-description' : undefined} aria-label={{ 'delete-shop': 'Bolt törlése', remove: 'Tárgy eltávolítása a boltból', shop: 'Bolt adatai', add: 'Tárgy hozzáadása', adjust: 'Készlet módosítása', activity: 'Eladásnapló', catalog: 'Saját tárgylista', 'base-catalog': 'SRD alaplista', random: 'Véletlen készlet', import: 'JSON import', cloud: 'Helyi és felhőadatok', guide: 'Útmutató' }[dialog]}>{!editingMagicItem && dialog !== 'shop' && dialog !== 'guide' && <div className="dialog-heading"><h2>{{ 'delete-shop': 'Bolt törlése', remove: 'Eltávolítás a boltból', add: 'Új tárgy a boltba', adjust: 'Készlet módosítása', activity: 'Eladásnapló', catalog: 'Saját tárgylista', 'base-catalog': 'SRD alaplista', random: 'Véletlen készlet', import: 'Tárgyak importálása JSON-ből', cloud: 'Helyi és felhőadatok' }[dialog]}</h2><button aria-label="Bezárás" onClick={closeDialog}><X size={22} /></button></div>}
      {dialog === 'guide' && <UserGuide onClose={closeDialog} />}
      {dialog === 'cloud' && <CloudDataDialog firebaseReady={firebaseReady} onConnectCloud={connectCloud} onSignOut={disconnectCloud} dataState={dataState} onDataAction={handleDataAction} onRetryCloud={() => dataState.pending ? dataSession.flush() : dataSession.setUser(user)} />}
      {dialog === 'delete-shop' && <div className="delete-shop-confirmation">
        {removalShop ? <><p id="delete-shop-description" className="dialog-intro">Biztosan törlöd a(z) <strong>{removalShop.name}</strong> boltot a teljes készletével és eladásnaplójával együtt?</p><p className="stock-adjust-preview">{removalShop.location || 'Ismeretlen hely'} · {removalShop.owner || 'Ismeretlen tulajdonos'}<br />{removalShop.items.length} különböző tárgy · {removalShop.items.reduce((sum, item) => sum + (Number(item.stock) || 0), 0)} db készlet · {removalShop.activity?.length ?? 0} naplóbejegyzés</p><p className="dialog-intro">A törlés végleges. A közös tárgykatalógus és a többi bolt megmarad. {user ? 'A felhőből töröljük; a külön helyi adatok megmaradnak.' : 'Az ezen az eszközön tárolt helyi adatokból töröljük.'}</p></> : <p id="delete-shop-description" className="dialog-intro">Ez a bolt már nem szerepel a listában.</p>}
        <div className="dialog-actions"><button type="button" className="button button-secondary delete-shop-cancel" onClick={cancelShopDeletion}>Mégse</button><button type="button" className="button button-primary" disabled={!removalShop || !dataReady || dataBusy} onClick={deleteShop}><Trash size={18} aria-hidden="true" /> Bolt törlése</button></div>
      </div>}
      {dialog === 'remove' && <div className="remove-item-confirmation">
        {removalItem ? <><p className="dialog-intro"><strong>{removalItem.name}</strong> teljes készletét eltávolítod ebből a boltból?</p><p className="stock-adjust-preview">{shop.name} · {removalItem.stock} db</p><p className="dialog-intro">A közös tárgylistában és a többi boltban megmarad. Az eltávolítást a naplóban visszavonhatod.</p></> : <p className="dialog-intro">Ez a tárgy már nem szerepel a boltban.</p>}
        <div className="dialog-actions"><button type="button" className="button button-secondary remove-item-cancel" onClick={cancelRemoval}>Mégse</button><button type="button" className="button button-primary" disabled={!removalItem} onClick={removeItem}><Trash size={18} aria-hidden="true" /> Eltávolítás</button></div>
      </div>}
      {dialog === 'shop' && <ShopEditor shop={draft} onChange={setDraft} onSubmit={saveShop} onClose={() => setDialog(null)} editing={Boolean(editingId)} />}
      {dialog === 'add' && <MagicItemEditor item={newItem} onChange={setNewItem} onSubmit={addItem} onCancel={() => setDialog('catalog')} onClose={() => setDialog(null)} shop={shop} mode="shop" editing={false} />}
      {dialog === 'adjust' && <form className="stock-adjustment" onSubmit={adjustStock}><label>Tárgy<select value={adjustItemId} onChange={event => setAdjustItemId(event.target.value)}>{items.map(item => <option key={item.id} value={item.id}>{item.name} · {item.stock} db</option>)}</select></label><fieldset><legend>Változás</legend><label><input type="radio" name="stock-direction" value="add" checked={adjustDirection === 'add'} onChange={() => setAdjustDirection('add')} /> Hozzáadás</label><label><input type="radio" name="stock-direction" value="remove" checked={adjustDirection === 'remove'} onChange={() => setAdjustDirection('remove')} /> Levonás</label></fieldset><label>Mennyiség<input autoFocus type="number" min="1" step="1" max={adjustDirection === 'remove' ? adjustTarget?.stock : undefined} value={adjustAmount} onChange={event => setAdjustAmount(event.target.value)} /></label><label>Megjegyzés (opcionális)<input value={adjustReason} onChange={event => setAdjustReason(event.target.value)} placeholder="Például ajándék vagy elveszett tárgy" /></label><p className="stock-adjust-preview">Jelenleg {adjustTarget?.stock ?? 0} db · utána {adjustTarget ? adjustTarget.stock + (adjustDirection === 'remove' ? -Number(adjustAmount || 0) : Number(adjustAmount || 0)) : 0} db</p><div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => setDialog(null)}>Mégse</button><button type="submit" className="button button-primary" disabled={!adjustTarget || !Number.isInteger(Number(adjustAmount)) || Number(adjustAmount) < 1 || (adjustDirection === 'remove' && Number(adjustAmount) > adjustTarget.stock)}><Package size={18} /> Készlet mentése</button></div></form>}
      {dialog === 'activity' && <ActivityJournal shop={shop} canUndo={canUndo} onUndo={undoActivity} />}
      {dialog === 'import' && <ItemJsonImport catalog={catalog} onImport={importCatalogJson} onBack={() => setDialog('catalog')} />}
      {dialog === 'base-catalog' && user && <BaseCatalogDialog uid={user.uid} catalog={catalog} onCopy={copyFromBase} />}
      {dialog === 'catalog' && (catalogDraft ? <MagicItemEditor item={catalogDraft} onChange={setCatalogDraft} onSubmit={saveCatalogItem} onCancel={() => { setCatalogDraft(null); setCatalogEditingId(null); }} onClose={() => setDialog(null)} mode="catalog" editing={Boolean(catalogEditingId)} /> : <><p className="dialog-intro">A közös lista minden boltban használható. A készlet boltonként külön számolódik.</p><div className="catalog-tools"><label className="catalog-search"><MagnifyingGlass size={19} /><input autoFocus aria-label="Keresés a közös tárgyak között" placeholder="Tárgy keresése..." value={catalogSearch} onChange={event => setCatalogSearch(event.target.value)} /></label><button className="button button-primary" onClick={() => { setCatalogEditingId(null); setCatalogDraft({ name: '', rarity: 'Gyakori', price: 100, kind: 'Csodás tárgy', category: '', image: defaultImageFor('Csodás tárgy'), teaser: '', description: '', effect: '' }); }}><Plus size={18} /> Új a listába</button></div><div className="catalog-list">{catalog.filter(item => `${item.name} ${item.rarity} ${item.kind} ${item.category}`.toLocaleLowerCase('hu-HU').includes(catalogSearch.toLocaleLowerCase('hu-HU'))).map(item => { const inShop = items.some(entry => entry.catalogId === item.id); return <div className="catalog-row" key={item.id}><span className="catalog-row-image"><ItemImage item={item} alt="" /></span><span className="catalog-row-main"><strong>{item.name}</strong><small>{item.rarity} · {normalizedItemKind(item)}{item.category && item.category !== normalizedItemKind(item) && ` / ${item.category}`} · {item.rarity === 'Artefaktum' && item.price == null ? 'Felbecsülhetetlen' : `${money(item.price)} gp`}</small></span><button className="catalog-edit" aria-label={`${item.name} szerkesztése`} title="Tárgy szerkesztése" onClick={() => { setCatalogEditingId(item.id); setCatalogDraft({ name: item.name ?? '', rarity: item.rarity ?? 'Gyakori', price: item.price ?? (item.rarity === 'Artefaktum' ? '' : 0), kind: normalizedItemKind(item), category: item.category ?? '', teaser: item.teaser ?? '', description: item.description ?? '', effect: item.effect ?? '', image: item.image || defaultImageFor(normalizedItemKind(item)) }); }}><PencilSimple size={19} /></button><button className="button button-secondary" disabled={inShop || !shop} onClick={() => addFromCatalog(item)}>{inShop ? 'A boltban' : 'Boltba teszem'}</button></div>; })}</div><div className="dialog-actions"><button className="button button-secondary" disabled={!shop} onClick={() => setDialog('add')}><Plus size={18} /> Új tárgy rögtön a boltba</button></div></>)}
      {dialog === 'random' && <div className="random-panel"><p className="dialog-intro">A közös listából sorsol, az artefaktumokat kihagyja. A sorsolás előtt ellenőrizheted az eredményt.</p><div className="form-grid random-grid"><label>Környék mágiája<select value={randomOptions.prevalence} onChange={event => { setRandomOptions({ ...randomOptions, prevalence: event.target.value }); setRandomPreview(null); }}><option value="scarce">Szórványos</option><option value="normal">Átlagos</option><option value="abundant">Bőséges</option></select></label><label>Bolt mérete<select value={randomOptions.size} onChange={event => { setRandomOptions({ ...randomOptions, size: event.target.value }); setRandomPreview(null); }}><option value="small">Kicsi</option><option value="medium">Közepes</option><option value="large">Nagy</option></select></label><label>Legmagasabb ritkaság<select value={randomOptions.maxRarity} onChange={event => { setRandomOptions({ ...randomOptions, maxRarity: event.target.value }); setRandomPreview(null); }}>{rarities.slice(0, 5).map(rarity => <option key={rarity}>{rarity}</option>)}</select></label><label>Bolti profil<select value={randomOptions.category} onChange={event => { setRandomOptions({ ...randomOptions, category: event.target.value }); setRandomPreview(null); }}><option value="all">Vegyes kínálat</option>{[...new Set([...itemTypes.map(type => type.name), ...catalog.map(item => item.category)])].filter(Boolean).sort().map(category => <option key={category}>{category}</option>)}</select></label><label>Különböző tárgyak száma<input type="number" min="1" max="50" placeholder="Méret alapján" value={randomOptions.count} onChange={event => { setRandomOptions({ ...randomOptions, count: event.target.value }); setRandomPreview(null); }} /></label><label className="checkbox-label"><input type="checkbox" checked={randomOptions.consumables} onChange={event => { setRandomOptions({ ...randomOptions, consumables: event.target.checked }); setRandomPreview(null); }} /> Több ital és tekercs</label><label className="checkbox-label"><input type="checkbox" checked={randomOptions.includeExisting} onChange={event => { setRandomOptions({ ...randomOptions, includeExisting: event.target.checked }); setRandomPreview(null); }} /> Meglévő tárgyak újrakészletezése</label></div><div className="random-hint">A gyakori tárgyak esélyesebbek; az italokból és tekercsekből több darab lehet. A meglévő készlethez hozzáadunk, nem írjuk felül.</div><div className="dialog-actions"><button className="button button-secondary" onClick={rollStock}><DiceFive size={18} /> {randomPreview ? 'Újrasorsolás' : 'Készlet sorsolása'}</button></div>{randomPreview && <><div className="preview-heading"><strong>Sorsolt készlet</strong><span>{randomPreview.length} tárgy</span></div>{randomPreview.length ? <div className="random-preview">{randomPreview.map(item => <div key={item.id}><strong>{item.name}</strong><span>{items.some(existing => existing.catalogId === item.catalogId) ? '+' : ''}{item.stock} db · {item.rarity} · {money(salePriceFor(item, shop))} gp</span></div>)}</div> : <p className="empty-results">Nincs megfelelő tárgy a közös listában. Bővítsd a listát, vagy lazítsd a szűrőket.</p>}<div className="dialog-actions"><button className="button button-secondary" onClick={() => setDialog(null)}>Mégse</button><button className="button button-primary" disabled={!randomPreview.length} onClick={acceptRandomStock}>Készlet hozzáadása</button></div></>}</div>}
    </div></div>}
  </main>;
}
