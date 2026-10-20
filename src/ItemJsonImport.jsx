import { useState } from 'react';
import { UploadSimple } from '@phosphor-icons/react';
import { previewItemImport } from './itemImport.js';

const example = `[
  {
    "name": "Holdfény kardja",
    "rarity": "Rare",
    "type": "Weapon",
    "description": "Holdfényben dereng a pengéje."
  }
]`;

export function ItemJsonImport({ catalog, onImport, onBack }) {
  const [json, setJson] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  function changeJson(value) { setJson(value); setPreview(null); setError(''); }
  async function chooseFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try { changeJson(await file.text()); setFileName(file.name); }
    catch { setError('A fájl nem olvasható.'); }
    event.target.value = '';
  }
  function review() {
    try { setPreview(previewItemImport(json, catalog)); setError(''); }
    catch (cause) { setPreview(null); setError(cause.message); }
  }

  return <div className="item-json-import">
    <p className="dialog-intro">Egy tárgyat, tárgyak tömbjét, <code>{'{ "items": [...] }'}</code> listát vagy a JSON export <code>catalog</code> részét töltheted be. A boltok készlete nem változik.</p>
    <label className="json-file-label">JSON fájl kiválasztása<input type="file" accept=".json,application/json" onChange={chooseFile} /></label>
    {fileName && <small className="field-hint">Kiválasztva: {fileName}</small>}
    <label className="json-text-label">Vagy illeszd be a JSON-t<textarea value={json} onChange={event => { changeJson(event.target.value); setFileName(''); }} rows="9" spellCheck="false" placeholder={example} /></label>
    <p className="field-hint">Kötelező: <code>name</code> és <code>rarity</code>. A <code>type</code> vagy <code>kind</code>, <code>price</code>, <code>image</code>, <code>description</code>, <code>effect</code> megadható. Angol és magyar D&D típusok és ritkaságok használhatók. Hiányzó árnál a ritkaság szerinti javaslat érvényes.</p>
    {error && <p className="json-import-error" role="alert">{error}</p>}
    {preview && <section className="json-import-review" aria-label="Import előnézet">
      <strong>{preview.items.length} új tárgy · {preview.duplicates} már létezik · {preview.issues.length} hibás</strong>
      <small>Összesen {preview.total} beolvasott bejegyzés. Az azonos nevű és ritkaságú tárgyakat kihagyjuk.</small>
      {preview.items.length > 0 && <div className="json-import-items">{preview.items.slice(0, 6).map((item, index) => <span key={`${item.name}-${index}`}>{item.name} <small>{item.rarity} · {item.kind}</small></span>)}{preview.items.length > 6 && <span>… és még {preview.items.length - 6} tárgy</span>}</div>}
      {preview.issues.length > 0 && <div className="json-import-issues">{preview.issues.slice(0, 8).map(issue => <p key={issue.index}>{issue.index}. bejegyzés: {issue.reason}</p>)}{preview.issues.length > 8 && <p>… és még {preview.issues.length - 8} hiba</p>}</div>}
    </section>}
    <div className="dialog-actions"><button type="button" className="button button-secondary" onClick={onBack}>Vissza a listához</button><button type="button" className="button button-secondary" disabled={!json.trim()} onClick={review}>JSON ellenőrzése</button><button type="button" className="button button-primary" disabled={!preview?.items.length} onClick={() => onImport(json)}><UploadSimple size={18} /> Importálás{preview?.items.length ? ` (${preview.items.length})` : ''}</button></div>
  </div>;
}
