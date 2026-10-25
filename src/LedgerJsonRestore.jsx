import { useState } from 'react';
import { UploadSimple } from '@phosphor-icons/react';
import { previewLedgerJsonRestore } from './ledgerJsonRestore.js';

export function LedgerJsonRestore({ dataState, onRestore }) {
  const [json, setJson] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const target = dataState.user ? 'a bejelentkezett fiók felhőadatait' : 'az eszköz helyi adatait';

  function changeJson(value) { setJson(value); setPreview(null); setConfirming(false); setError(''); }
  async function chooseFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try { changeJson(await file.text()); setFileName(file.name); }
    catch { setError('A fájl nem olvasható.'); }
    event.target.value = '';
  }
  function review() {
    try { setPreview(previewLedgerJsonRestore(json)); setError(''); }
    catch (cause) { setPreview(null); setError(cause.message); }
  }
  async function restore() {
    if (!preview || !confirming || working) return;
    setWorking(true); setError('');
    try { await onRestore(preview.ledger); }
    catch (cause) { setError(cause.message || 'A visszaállítás nem sikerült.'); setConfirming(false); }
    finally { setWorking(false); }
  }

  return <div className="ledger-json-restore item-json-import">
    <p className="dialog-intro">A JSON export teljes mentését töltheted vissza. Ez {target} lecseréli: a boltokat, készleteket, naplókat, beszerzéseket és a saját tárgylistát. A jelenlegi adatokból előbb visszaállítható másolat készül.</p>
    <label className="json-file-label">Exportált JSON-fájl kiválasztása<input type="file" accept=".json,application/json" onChange={chooseFile} /></label>
    {fileName && <small className="field-hint">Kiválasztva: {fileName}</small>}
    <label className="json-text-label">Vagy illeszd be a teljes exportot<textarea value={json} onChange={event => { changeJson(event.target.value); setFileName(''); }} rows="6" spellCheck="false" /></label>
    {error && <p className="json-import-error" role="alert">{error}</p>}
    {preview && <section className="json-import-review" aria-label="Teljes mentés előnézete">
      <strong>{preview.shops} bolt · {preview.catalog} saját tárgy · {preview.stockRows} bolti tétel</strong>
      <p>{preview.activity} naplóbejegyzés · {preview.procurements} beszerzés</p>
      <div className="ledger-restore-shops">{preview.ledger.shops.map(shop => <span key={shop.id}>{shop.name} · {shop.items.length} tétel</span>)}</div>
      {preview.shops === 0 && <p>A mentésben nincs bolt.</p>}
    </section>}
    {confirming && <section className="cloud-copy-confirm" role="region" aria-label="Teljes adatállomány cseréjének megerősítése">
      <strong>{dataState.user ? 'Felhőadatok' : 'Helyi adatok'} lecserélése</strong>
      <p>A mentés teljes tartalma váltja fel {target}. A korábbi változatot a Helyi és felhőadatok ablakból állíthatod vissza.</p>
      <div><button type="button" disabled={working} onClick={() => setConfirming(false)}>Mégse</button><button type="button" disabled={working} onClick={restore}>{working ? 'Visszaállítás…' : 'Igen, lecserélem'}</button></div>
    </section>}
    <div className="dialog-actions"><button type="button" className="button button-secondary" disabled={!json.trim() || working} onClick={review}>JSON ellenőrzése</button><button type="button" className="button button-primary" disabled={!preview || confirming || working || !dataState.ready || dataState.busy} onClick={() => setConfirming(true)}><UploadSimple size={18} /> Teljes mentés visszatöltése</button></div>
  </div>;
}
