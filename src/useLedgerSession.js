import { useEffect, useState, useSyncExternalStore } from 'react';
import { firebaseReady, loadCloudLedger, saveCloudLedger, watchUser } from './firebase.js';
import { createLedgerSession } from './ledgerSession.js';

export function useLedgerSession(seedItems) {
  const [session] = useState(() => createLedgerSession({ seedItems, authRequired: firebaseReady,
    loadCloud: loadCloudLedger, saveCloud: saveCloudLedger }));
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);

  useEffect(() => {
    let active = true;
    session.setOnline(navigator.onLine);
    const online = () => session.setOnline(true);
    const offline = () => session.setOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    const unsubscribe = watchUser(user => { if (active) void session.setUser(user); });
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, [session]);

  return [state, session];
}
