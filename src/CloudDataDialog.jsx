import { useEffect, useRef, useState } from 'react';
import { DownloadSimple, UploadSimple } from '@phosphor-icons/react';

const transferLabels = {
  download: { title: 'Felhő másolása erre az eszközre', detail: 'Ez lecseréli az ezen az eszközön tárolt összes boltodat, tárgyadat, készletedet és naplódat. Továbbra is a felhőadatokat használod.' },
  upload: { title: 'Helyi adatok feltöltése a felhőbe', detail: 'Ez lecseréli a fiókod felhőben tárolt összes boltját, tárgyát, készletét és naplóját az ezen az eszközön tárolt adatokra. Ezután ezt a felhős változatot használod.' },
  'restore-local': { title: 'Előző helyi adatok visszaállítása', detail: 'Az utolsó másolás előtti helyi adatokat állítjuk vissza. A felhőadatok megmaradnak.' },
  'restore-cloud': { title: 'Előző felhőadatok visszaállítása', detail: 'Az utolsó feltöltés előtti felhőadatok váltják fel a fiókod jelenlegi boltjait, tárgyait, készleteit és naplóit.' },
};

export function CloudDataDialog({ firebaseReady, onConnectCloud, onSignOut, dataState, onDataAction, onRetryCloud }) {
  const { user, status: cloudStatus } = dataState;
  const [transfer, setTransfer] = useState(null);
  const transferTriggerRef = useRef(null);
  const canEdit = dataState.ready && !dataState.busy;

  useEffect(() => { setTransfer(null); }, [user?.uid]);

  function openTransfer(action, event) {
    transferTriggerRef.current = event.currentTarget;
    setTransfer(action);
  }

  function closeTransfer() {
    setTransfer(null);
    requestAnimationFrame(() => transferTriggerRef.current?.focus());
  }

  async function confirmTransfer() {
    if (await onDataAction(transfer)) closeTransfer();
  }

  return <div className="management-cloud-details">
    <p><strong>{user ? `Felhőadatok · ${user.displayName || user.email || 'Bejelentkezve'}` : 'Helyi adatok · ezen az eszközön'}</strong></p>
    <p role="status">{!dataState.authReady ? 'Fiók ellenőrzése…' : user ? cloudStatus : firebaseReady ? 'Belépéskor a fiókod felhőadataira váltunk. A helyi készleted megmarad.' : 'A Firebase-projekt még nincs beállítva. A helyi mentés működik.'}</p>
    {user && <div className="cloud-copy-actions">
      <button disabled={!canEdit} type="button" onClick={event => openTransfer('download', event)}><DownloadSimple size={19} aria-hidden="true" /> Felhő másolása erre az eszközre</button>
      <button disabled={!canEdit} type="button" onClick={event => openTransfer('upload', event)}><UploadSimple size={19} aria-hidden="true" /> Helyi adatok feltöltése a felhőbe</button>
      <small>A másolás az összes boltot, tárgyat, készletet és naplót lecseréli a célhelyen. Az előző változatról biztonsági másolat készül.</small>
    </div>}
    {dataState.hasLocalBackup && <button disabled={dataState.busy} className="cloud-restore" type="button" onClick={event => openTransfer('restore-local', event)}>Előző helyi adatok visszaállítása</button>}
    {user && dataState.hasCloudBackup && <button disabled={!canEdit} className="cloud-restore" type="button" onClick={event => openTransfer('restore-cloud', event)}>Előző felhőadatok visszaállítása</button>}
    {transfer && <div className="cloud-copy-confirm" role="region" aria-label={transferLabels[transfer].title}>
      <strong>{transferLabels[transfer].title}</strong><p>{transferLabels[transfer].detail}</p>
      <div><button autoFocus disabled={dataState.busy} type="button" onClick={closeTransfer}>Mégse</button><button disabled={dataState.busy} type="button" onClick={confirmTransfer}>{dataState.busy ? 'Másolás folyamatban…' : 'Igen, lecserélem'}</button></div>
    </div>}
    {firebaseReady && <div className="cloud-account-actions">
      {user && <button disabled={dataState.busy} type="button" onClick={onRetryCloud}>Újrapróbálás / frissítés</button>}
      {user ? <button disabled={dataState.busy} type="button" onClick={onSignOut}>Kijelentkezés</button> : <button disabled={!dataState.authReady} type="button" onClick={onConnectCloud}>Bejelentkezés Google-fiókkal</button>}
    </div>}
  </div>;
}
