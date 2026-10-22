import { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlass, UploadSimple } from '@phosphor-icons/react';
import { previewBaseCatalogImport } from './baseCatalogData.js';
import { deleteBaseCatalogItem, isBaseCatalogAdmin, loadBaseCatalog, uploadBaseCatalog } from './firebase.js';
import { ItemImage } from './ItemImagePicker.jsx';

const keyFor = item => `${item.name.trim().toLocaleLowerCase('hu-HU')}|${item.rarity}`;

export function BaseCatalogDialog({ uid, catalog, onCopy }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [json, setJson] = useState('');
  const [preview, setPreview] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setItems([]);
    setAdmin(false);
    Promise.allSettled([loadBaseCatalog(), isBaseCatalogAdmin(uid)]).then(([list, role]) => {
      if (!active) return;
      if (list.status === 'fulfilled') setItems(list.value);
      else setError('Az alaplista nem tölthető be. Ellenőrizd a kapcsolatot és a Firestore-szabályokat.');
      if (role.status === 'fulfilled') setAdmin(role.value);
      setLoading(false);
    });
    return () => { active = false; };
  }, [uid]);

  const ownedSources = new Set(catalog.map(item => item.sourceBaseId).filter(Boolean));
  const ownedNames = new Set(catalog.map(keyFor));
  const isOwned = item => ownedSources.has(item.id) || ownedNames.has(keyFor(item));
  const visible = useMemo(() => items.filter(item => `${item.name} ${item.rarity} ${item.kind} ${item.category}`.toLocaleLowerCase('hu-HU').includes(search.toLocaleLowerCase('hu-HU'))), [items, search]);
  const availableIds = items.filter(item => !isOwned(item)).map(item => item.id);
  const selectedAvailable = selected.filter(id => availableIds.includes(id));

  function copy(ids) {
    const count = onCopy(items, ids);
    setSelected(current => current.filter(id => !ids.includes(id)));
    setNotice(count ? `${count} tárgy a saját listádba másolva. Szabadon szerkesztheted őket.` : 'A kijelölt tárgyak már szerepelnek a saját listádban.');
  }

  function changeJson(value) { setJson(value); setPreview(null); setError(''); setNotice(''); }
  async function chooseFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try { changeJson(await file.text()); }
    catch { setError('A fájl nem olvasható.'); }
    event.target.value = '';
  }
  function review() {
    try { setPreview(previewBaseCatalogImport(json, items)); setError(''); }
    catch (cause) { setPreview(null); setError(cause.message); }
  }
  async function upload() {
    if (!admin || !preview?.items.length || preview.issues.length) return;
    setBusy(true); setError('');
    try {
      await uploadBaseCatalog(preview.items);
      setItems(await loadBaseCatalog());
      setJson(''); setPreview(null); setShowUpload(false);
      setNotice(`${preview.items.length} alaplistás tárgy feltöltve vagy frissítve.`);
    } catch {
      try { setItems(await loadBaseCatalog()); } catch { /* Keep the last known list. */ }
      setError('A feltöltés megszakadt. Néhány tétel már felkerülhetett; az azonos id-k miatt a fájl biztonságosan újrapróbálható.');
    }
    finally { setBusy(false); }
  }
  async function remove(id) {
    if (!admin || deleteId !== id) return;
    setBusy(true); setError('');
    try {
      await deleteBaseCatalogItem(id);
      setItems(current => current.filter(item => item.id !== id));
      setNotice('A tárgy eltávolítva az alaplistából. A felhasználói másolatok megmaradnak.');
      setDeleteId(null);
    } catch { setError('A törlés nem sikerült. Ellenőrizd az admin jogosultságot és a kapcsolatot.'); }
    finally { setBusy(false); }
  }

  return <div className="base-catalog">
    <p className="dialog-intro">A bejelentkezett játékosok számára elérhető SRD alaplista. A másolás egyszeri: a saját példány később szabadon szerkeszthető, és az alaplista változásai nem írják felül.</p>
    <p className="base-catalog-credit">A <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">System Reference Document 5.2.1</a> alapján, Wizards of the Coast LLC · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. A teljes szabályokat az SRD tartalmazza.</p>
    {error && <p className="json-import-error" role="alert">{error}</p>}
    {notice && <p className="base-catalog-notice" role="status">{notice}</p>}
    {loading ? <p className="empty-results">Alaplista betöltése…</p> : <>
      <div className="catalog-tools"><label className="catalog-search"><MagnifyingGlass size={19} /><input autoFocus aria-label="Keresés az SRD alaplistában" placeholder="Tárgy keresése..." value={search} onChange={event => setSearch(event.target.value)} /></label><span className="base-catalog-count">{visible.length} / {items.length} tárgy</span></div>
      <div className="catalog-list base-catalog-list">{visible.length ? visible.map(item => <div className="catalog-row" key={item.id}>
        <input type="checkbox" aria-label={`${item.name} kijelölése`} disabled={isOwned(item)} checked={selected.includes(item.id)} onChange={event => setSelected(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} />
        <span className="catalog-row-image"><ItemImage item={item} alt="" /></span>
        <span className="catalog-row-main"><strong>{item.name}</strong><small>{item.rarity} · {item.kind}{item.sourcePage ? ` · SRD ${item.sourcePage}. oldal` : ''}</small><small>{item.effect}</small></span>
        <button type="button" className="button button-secondary" disabled={isOwned(item)} onClick={() => copy([item.id])}>{isOwned(item) ? 'A saját listában' : 'Másolás'}</button>
        {admin && (deleteId === item.id ? <span className="base-catalog-delete"><button type="button" disabled={busy} onClick={() => setDeleteId(null)}>Mégse</button><button type="button" disabled={busy} onClick={() => remove(item.id)}>Törlés</button></span> : <button type="button" className="base-catalog-delete-trigger" disabled={busy} onClick={() => setDeleteId(item.id)} aria-label={`${item.name} törlése az alaplistából`}>Törlés</button>)}
      </div>) : <p className="empty-results">Nincs találat az alaplistában.</p>}</div>
      <div className="dialog-actions base-catalog-actions"><button type="button" className="button button-secondary" disabled={!availableIds.length || selectedAvailable.length === availableIds.length} onClick={() => setSelected(availableIds)}>Összes kijelölése ({availableIds.length})</button><button type="button" className="button button-secondary" disabled={!selectedAvailable.length} onClick={() => setSelected([])}>Kijelölés törlése</button><button type="button" className="button button-primary" disabled={!selectedAvailable.length} onClick={() => copy(selectedAvailable)}>Kijelöltek másolása ({selectedAvailable.length})</button></div>
    </>}
    {admin && <section className="base-catalog-admin"><button type="button" className="button button-secondary" onClick={() => setShowUpload(open => !open)}><UploadSimple size={18} /> Alaplista kezelése · JSON feltöltés</button>{showUpload && <div className="item-json-import"><p className="dialog-intro">Azonos id esetén frissítés, új id esetén hozzáadás. A feltöltés nem törli a kihagyott tárgyakat. A felhasználók korábbi másolatai változatlanok.</p><label>JSON fájl<input type="file" accept=".json,application/json" onChange={chooseFile} /></label><label>Vagy JSON szöveg<textarea value={json} onChange={event => changeJson(event.target.value)} rows="6" spellCheck="false" /></label><div className="dialog-actions"><button type="button" className="button button-secondary" disabled={!json.trim() || busy} onClick={review}>Ellenőrzés</button><button type="button" className="button button-primary" disabled={!preview?.items.length || Boolean(preview?.issues.length) || busy} onClick={upload}>{busy ? 'Feltöltés…' : 'Feltöltés'}</button></div>{preview && <section className="json-import-review"><strong>{preview.items.length} érvényes · {preview.updates} frissítés · {preview.issues.length} hiba</strong>{preview.issues.slice(0, 8).map(issue => <p key={issue.index}>{issue.index}. bejegyzés: {issue.reason}</p>)}</section>}</div>}</section>}
  </div>;
}
