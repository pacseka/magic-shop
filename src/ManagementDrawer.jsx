import { useEffect, useRef, useState } from 'react';
import { Books, CaretRight, ClockCounterClockwise, Cloud, DiceFive, DownloadSimple, GearSix, Plus, Storefront, UploadSimple, X } from '@phosphor-icons/react';
import { publicAssetUrl } from './itemTypes.js';

function DrawerAction({ icon: Icon, title, description, onClick, trailing, expanded, disabled }) {
  return <button type="button" className="management-action" disabled={disabled} onClick={onClick} aria-expanded={expanded}>
    <Icon size={30} aria-hidden="true" />
    <span className="management-action-copy"><strong>{title}</strong><small>{description}</small></span>
    {trailing && <span className="management-action-trailing">{trailing}</span>}
    <CaretRight className="management-chevron" size={20} aria-hidden="true" />
  </button>;
}

const transferLabels = {
  download: { title: 'Felhő másolása erre az eszközre', detail: 'Ez lecseréli az ezen az eszközön tárolt összes boltodat, tárgyadat, készletedet és naplódat. Továbbra is a felhőadatokat használod.' },
  upload: { title: 'Helyi adatok feltöltése a felhőbe', detail: 'Ez lecseréli a fiókod felhőben tárolt összes boltját, tárgyát, készletét és naplóját az ezen az eszközön tárolt adatokra. Ezután ezt a felhős változatot használod.' },
  'restore-local': { title: 'Előző helyi adatok visszaállítása', detail: 'Az utolsó másolás előtti helyi adatokat állítjuk vissza. A felhőadatok megmaradnak.' },
  'restore-cloud': { title: 'Előző felhőadatok visszaállítása', detail: 'Az utolsó feltöltés előtti felhőadatok váltják fel a fiókod jelenlegi boltjait, tárgyait, készleteit és naplóit.' },
};

export function ManagementDrawer({ open, onClose, onAction, shop, catalogCount, hasSaleBar, firebaseReady, onConnectCloud, onSignOut, dataState, onDataAction, onRetryCloud }) {
  const { user, status: cloudStatus } = dataState;
  const closeRef = useRef(null);
  const [cloudExpanded, setCloudExpanded] = useState(false);
  const [transfer, setTransfer] = useState(null);
  const canEdit = dataState.ready && !dataState.busy;

  useEffect(() => { setTransfer(null); }, [user?.uid, open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      setCloudExpanded(false);
    };
  }, [open]);

  if (!open) return null;

  function handleKeyDown(event) {
    if (event.key === 'Escape') { onClose(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...event.currentTarget.querySelectorAll('button:not(:disabled), summary, a[href], input:not(:disabled)')];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  const cloudLabel = !dataState.authReady ? 'Fiók ellenőrzése…' : user ? 'Felhőadatok' : 'Helyi adatok';

  async function confirmTransfer() {
    if (await onDataAction(transfer)) setTransfer(null);
  }

  return <div className={`management-layer ${hasSaleBar ? '' : 'no-sale-bar'}`} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="management-drawer" role="dialog" aria-modal="true" aria-labelledby="management-title" onKeyDown={handleKeyDown}>
      <header className="management-header">
        <img src={publicAssetUrl('/assets/header-merchant.png')} alt="" />
        <button ref={closeRef} className="management-close" type="button" onClick={onClose} aria-label="Kezelés bezárása"><X size={28} /></button>
        <h2 id="management-title">Kezelés</h2>
        <p>A bolt és a készlet kezelése</p>
        <span className="management-rule" aria-hidden="true" />
      </header>
      <div className="management-content">
        <section className="management-group" aria-labelledby="management-shop-title">
          <div className="management-group-heading"><Storefront size={28} aria-hidden="true" /><div><h3 id="management-shop-title">Bolt</h3><p>A bolt alapadatai és beállításai.</p></div></div>
          <DrawerAction disabled={!canEdit} icon={GearSix} title="Bolt szerkesztése" description={shop?.name || 'A bolt adatai'} onClick={() => onAction('edit-shop')} />
          <DrawerAction disabled={!canEdit} icon={Plus} title="Új bolt" description="Új kereskedés létrehozása." onClick={() => onAction('new-shop')} />
        </section>
        <section className="management-group" aria-labelledby="management-catalog-title">
          <div className="management-group-heading"><Books size={28} aria-hidden="true" /><div><h3 id="management-catalog-title">Katalógus és készlet</h3><p>Varázstárgyak és készletkezelés.</p></div></div>
          <DrawerAction disabled={!canEdit} icon={Books} title="Közös varázstárgyak" description={`${catalogCount} tárgy a közös listában.`} onClick={() => onAction('catalog')} />
          <DrawerAction disabled={!canEdit} icon={DiceFive} title="Véletlen készlet" description="A bolt készletének sorsolása." onClick={() => onAction('random')} />
          <DrawerAction disabled={!canEdit} icon={ClockCounterClockwise} title="Eladásnapló" description="Eladások és készletváltozások." onClick={() => onAction('activity')} />
        </section>
        <section className="management-group" aria-labelledby="management-data-title">
          <div className="management-group-heading"><Cloud size={28} aria-hidden="true" /><div><h3 id="management-data-title">Adatok és felhő</h3><p>Importálás, exportálás és kézi másolás.</p></div></div>
          <DrawerAction disabled={!canEdit} icon={UploadSimple} title="JSON import" description="Tárgyak betöltése fájlból vagy szövegből." onClick={() => onAction('import')} />
          <DrawerAction disabled={!canEdit} icon={DownloadSimple} title="JSON export" description="Az éppen használt boltok és katalógus mentése." onClick={() => onAction('export')} />
          <DrawerAction icon={Cloud} title="Helyi és felhőadatok" description="Aktív tároló, fiók és másolás." trailing={<span className={`management-cloud-status ${dataState.pending || !dataState.ready ? 'is-pending' : ''}`}>{cloudLabel}</span>} expanded={cloudExpanded} onClick={() => setCloudExpanded(value => !value)} />
          {cloudExpanded && <div className="management-cloud-details">
            <p><strong>{user ? `Felhőadatok · ${user.displayName || user.email || 'Bejelentkezve'}` : 'Helyi adatok · ezen az eszközön'}</strong></p>
            <p role="status">{!dataState.authReady ? 'Fiók ellenőrzése…' : user ? cloudStatus : firebaseReady ? 'Belépéskor a fiókod felhőadataira váltunk. A helyi készleted megmarad.' : 'A Firebase-projekt még nincs beállítva. A helyi mentés működik.'}</p>
            {user && <div className="cloud-copy-actions">
              <button disabled={!canEdit} type="button" onClick={() => setTransfer('download')}><DownloadSimple size={19} aria-hidden="true" /> Felhő másolása erre az eszközre</button>
              <button disabled={!canEdit} type="button" onClick={() => setTransfer('upload')}><UploadSimple size={19} aria-hidden="true" /> Helyi adatok feltöltése a felhőbe</button>
              <small>A másolás az összes boltot, tárgyat, készletet és naplót lecseréli a célhelyen. Az előző változatról biztonsági másolat készül.</small>
            </div>}
            {dataState.hasLocalBackup && <button disabled={dataState.busy} className="cloud-restore" type="button" onClick={() => setTransfer('restore-local')}>Előző helyi adatok visszaállítása</button>}
            {user && dataState.hasCloudBackup && <button disabled={!canEdit} className="cloud-restore" type="button" onClick={() => setTransfer('restore-cloud')}>Előző felhőadatok visszaállítása</button>}
            {transfer && <div className="cloud-copy-confirm" role="region" aria-label={transferLabels[transfer].title}>
              <strong>{transferLabels[transfer].title}</strong><p>{transferLabels[transfer].detail}</p>
              <div><button disabled={dataState.busy} type="button" onClick={() => setTransfer(null)}>Mégse</button><button disabled={dataState.busy} type="button" onClick={confirmTransfer}>{dataState.busy ? 'Másolás folyamatban…' : 'Igen, lecserélem'}</button></div>
            </div>}
            {firebaseReady && <div className="cloud-account-actions">
              {user && <button disabled={dataState.busy} type="button" onClick={onRetryCloud}>Újrapróbálás / frissítés</button>}
              {user ? <button disabled={dataState.busy} type="button" onClick={onSignOut}>Kijelentkezés</button> : <button disabled={!dataState.authReady} type="button" onClick={onConnectCloud}>Bejelentkezés Google-fiókkal</button>}
            </div>}
          </div>}
        </section>
        <details className="management-shop-notes"><summary>Bolti tudnivalók</summary><p>{shop?.description || 'Még nincs leírás ehhez a bolthoz.'}</p>{[shop?.contact && `Kapcsolat: ${shop.contact}`, shop?.faction && `Frakció: ${shop.faction}`, shop?.relationship && `Viszony: ${shop.relationship}`, shop?.adventureHook && `Kalandötlet: ${shop.adventureHook}`].filter(Boolean).map(note => <p key={note}>{note}</p>)}<p>Árszorzó ×{String(shop?.multiplier ?? 1).replace('.', ',')}</p></details>
      </div>
    </aside>
  </div>;
}
