import { useEffect, useRef, useState } from 'react';
import { Books, CaretRight, ClockCounterClockwise, Cloud, DiceFive, DownloadSimple, GearSix, Plus, Storefront, UploadSimple, X } from '@phosphor-icons/react';
import { publicAssetUrl } from './itemTypes.js';

function DrawerAction({ icon: Icon, title, description, onClick, trailing, expanded }) {
  return <button type="button" className="management-action" onClick={onClick} aria-expanded={expanded}>
    <Icon size={30} aria-hidden="true" />
    <span className="management-action-copy"><strong>{title}</strong><small>{description}</small></span>
    {trailing && <span className="management-action-trailing">{trailing}</span>}
    <CaretRight className="management-chevron" size={20} aria-hidden="true" />
  </button>;
}

export function ManagementDrawer({ open, onClose, onAction, shop, catalogCount, hasSaleBar, firebaseReady, user, cloudStatus, onConnectCloud, onSignOut }) {
  const closeRef = useRef(null);
  const [cloudExpanded, setCloudExpanded] = useState(false);

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

  const cloudLabel = firebaseReady
    ? user ? cloudStatus || 'Felhőbe mentve' : 'Helyi mentés'
    : 'Helyi mentés';

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
          <DrawerAction icon={GearSix} title="Bolt szerkesztése" description={shop?.name || 'A bolt adatai'} onClick={() => onAction('edit-shop')} />
          <DrawerAction icon={Plus} title="Új bolt" description="Új kereskedés létrehozása." onClick={() => onAction('new-shop')} />
        </section>
        <section className="management-group" aria-labelledby="management-catalog-title">
          <div className="management-group-heading"><Books size={28} aria-hidden="true" /><div><h3 id="management-catalog-title">Katalógus és készlet</h3><p>Varázstárgyak és készletkezelés.</p></div></div>
          <DrawerAction icon={Books} title="Közös varázstárgyak" description={`${catalogCount} tárgy a közös listában.`} onClick={() => onAction('catalog')} />
          <DrawerAction icon={DiceFive} title="Véletlen készlet" description="A bolt készletének sorsolása." onClick={() => onAction('random')} />
          <DrawerAction icon={ClockCounterClockwise} title="Eladásnapló" description="Eladások és készletváltozások." onClick={() => onAction('activity')} />
        </section>
        <section className="management-group" aria-labelledby="management-data-title">
          <div className="management-group-heading"><Cloud size={28} aria-hidden="true" /><div><h3 id="management-data-title">Adatok és felhő</h3><p>Importálás, exportálás és szinkronizálás.</p></div></div>
          <DrawerAction icon={UploadSimple} title="JSON import" description="Tárgyak betöltése fájlból vagy szövegből." onClick={() => onAction('import')} />
          <DrawerAction icon={DownloadSimple} title="JSON export" description="A boltok és a katalógus mentése." onClick={() => onAction('export')} />
          <DrawerAction icon={Cloud} title="Felhőszinkron" description="Adatok szinkronizálása a felhővel." trailing={<span className="management-cloud-status">{cloudLabel}</span>} expanded={cloudExpanded} onClick={() => setCloudExpanded(value => !value)} />
          {cloudExpanded && <div className="management-cloud-details"><p>{firebaseReady ? user ? `${user.displayName || user.email} · ${cloudStatus}` : 'Jelentkezz be, ha a boltokat a felhőbe is mentenéd.' : 'A Firebase-projekt még nincs beállítva. A helyi mentés működik.'}</p>{firebaseReady && (user ? <button type="button" onClick={onSignOut}>Kijelentkezés</button> : <button type="button" onClick={onConnectCloud}>Bejelentkezés Google-fiókkal</button>)}</div>}
        </section>
        <details className="management-shop-notes"><summary>Bolti tudnivalók</summary><p>{shop?.description || 'Még nincs leírás ehhez a bolthoz.'}</p>{[shop?.contact && `Kapcsolat: ${shop.contact}`, shop?.faction && `Frakció: ${shop.faction}`, shop?.relationship && `Viszony: ${shop.relationship}`, shop?.adventureHook && `Kalandötlet: ${shop.adventureHook}`].filter(Boolean).map(note => <p key={note}>{note}</p>)}<p>Árszorzó ×{String(shop?.multiplier ?? 1).replace('.', ',')}</p></details>
      </div>
    </aside>
  </div>;
}
