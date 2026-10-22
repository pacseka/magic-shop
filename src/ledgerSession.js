import { loadLedger, makeId, normalizeLedger, storageKey } from './shopData.js';

const localBackupKey = `${storageKey}-backup`;
const cacheKey = uid => `${storageKey}-cloud-${uid}`;
const cloudBackupKey = uid => `${cacheKey(uid)}-backup`;
const payload = ledger => ({ schemaVersion: 2, ...ledger });
const errorStatus = error => error?.code === 'permission-denied'
  ? 'A felhő nem érhető el · hozzáférés elutasítva'
  : 'A felhő nem érhető el · a módosítások feltöltésre várnak';

export function createLedgerSession({ storage = localStorage, seedItems = [], authRequired = false, loadCloud, saveCloud }) {
  const listeners = new Set();
  let generation = 0;
  let online = true;
  let saving = null;
  let state = { ledger: loadLedger(seedItems, storage), user: null, ready: !authRequired,
    authReady: !authRequired, pending: false, busy: false, status: '', hasLocalBackup: Boolean(read(localBackupKey)?.ledger), hasCloudBackup: false };

  function read(key) {
    try { return JSON.parse(storage.getItem(key)); } catch { return null; }
  }
  function publish(changes) {
    const next = { ...state, ...changes };
    if (next.user?.uid !== state.user?.uid) {
      next.hasCloudBackup = Boolean(next.user && read(cloudBackupKey(next.user.uid))?.ledger);
    }
    state = next;
    listeners.forEach(listener => listener());
  }
  function cache(uid, ledger, pending) {
    const entry = { ledger: payload(ledger), pending, revision: makeId() };
    storage.setItem(cacheKey(uid), JSON.stringify(entry));
  }
  function adoptCloudLedger(uid, ledger, status) {
    try {
      cache(uid, ledger, false);
    } catch {
      try { storage.removeItem(cacheKey(uid)); } catch { /* Storage access may also be blocked. */ }
      status = `${status} · offline másolat nem készíthető, ellenőrizd az eszköz tárhelyét`;
    }
    publish({ ledger, ready: true, pending: false, status });
  }
  function backup(key, ledger) {
    storage.setItem(key, JSON.stringify({ ledger: payload(ledger), at: new Date().toISOString() }));
    publish(key === localBackupKey ? { hasLocalBackup: true } : { hasCloudBackup: true });
  }

  async function setUser(user) {
    const token = ++generation;
    saving = null;
    if (!user) {
      const local = loadLedger(seedItems, storage);
      publish({ user: null, ledger: local, authReady: true, ready: true, pending: false, busy: false, status: '' });
      return;
    }
    const cached = read(cacheKey(user.uid));
    publish({ user, authReady: true, ready: false, busy: false, pending: Boolean(cached?.pending),
      ledger: normalizeLedger(cached?.ledger), status: 'Felhőadatok betöltése…' });
    if (cached?.pending) {
      publish({ ready: true, status: 'Feltöltésre vár · ezen az eszközön megőrizve' });
      await flush();
      return;
    }
    if (!online) {
      publish({ ready: Boolean(cached?.ledger), status: cached?.ledger
        ? 'Offline · a felhőadatok eszközön megőrzött másolata'
        : 'A felhőadatok betöltéséhez internetkapcsolat szükséges' });
      return;
    }
    try {
      const ledger = normalizeLedger(await loadCloud(user.uid));
      if (token !== generation) return;
      adoptCloudLedger(user.uid, ledger, 'Felhőadatok betöltve');
    } catch (error) {
      if (token !== generation) return;
      publish({ ready: Boolean(cached?.ledger), status: cached?.ledger
        ? 'A felhő nem érhető el · az eszközön megőrzött másolatot használod'
        : error?.code === 'permission-denied' ? 'Felhőadatok betöltése sikertelen · hozzáférés elutasítva' : 'Felhőadatok betöltése sikertelen · próbáld újra' });
    }
  }

  function update(updater) {
    if (!state.ready || state.busy || !state.authReady) return;
    const ledger = typeof updater === 'function' ? updater(state.ledger) : updater;
    try {
      if (state.user) {
        cache(state.user.uid, ledger, true);
        publish({ ledger, pending: true, status: 'Feltöltésre vár · ezen az eszközön megőrizve' });
        void flush();
      } else {
        storage.setItem(storageKey, JSON.stringify(payload(ledger)));
        publish({ ledger, status: '' });
      }
    } catch {
      publish({ status: 'Az eszközre mentés sikertelen · a módosítás nem lett alkalmazva' });
    }
  }

  function flush() {
    if (saving) return saving;
    if (!state.user || !state.pending || !state.ready || !online) return Promise.resolve();
    const token = generation;
    const uid = state.user.uid;
    saving = (async () => {
      while (token === generation && state.pending && online) {
        const entry = read(cacheKey(uid));
        if (!entry?.pending) break;
        publish({ status: 'Felhőmentés folyamatban…' });
        try {
          await saveCloud(uid, normalizeLedger(entry.ledger));
          if (token !== generation) return;
          const latest = read(cacheKey(uid));
          if (latest?.revision === entry.revision) {
            storage.setItem(cacheKey(uid), JSON.stringify({ ...latest, pending: false }));
            publish({ pending: false, status: 'Felhőbe mentve' });
          }
        } catch (error) {
          if (token === generation) publish({ status: errorStatus(error) });
          return;
        }
      }
    })().finally(() => { if (token === generation) saving = null; });
    return saving;
  }

  function copyCloudToLocal() {
    if (!state.user || !state.ready || state.busy) return;
    backup(localBackupKey, loadLedger(seedItems, storage));
    storage.setItem(storageKey, JSON.stringify(payload(state.ledger)));
    publish({});
  }

  function restoreLocalBackup() {
    if (state.busy) return;
    const previous = read(localBackupKey)?.ledger;
    if (!previous) return;
    backup(localBackupKey, loadLedger(seedItems, storage));
    const ledger = normalizeLedger(previous);
    storage.setItem(storageKey, JSON.stringify(payload(ledger)));
    publish(state.user ? {} : { ledger });
  }

  async function replaceCloud(nextLedger) {
    if (!state.user || !state.ready || state.busy) return;
    const token = generation;
    const uid = state.user.uid;
    publish({ busy: true });
    try {
      await flush();
      if (token !== generation) return;
      if (state.pending || !online) throw new Error('A felhőmentés még nem fejeződött be.');
      const previous = normalizeLedger(await loadCloud(uid));
      if (token !== generation) return;
      backup(cloudBackupKey(uid), previous);
      await saveCloud(uid, nextLedger);
      if (token !== generation) return;
      adoptCloudLedger(uid, nextLedger, 'Felhőbe mentve');
    } finally {
      if (token === generation) publish({ busy: false });
    }
  }

  function setOnline(value) {
    if (online === value) return;
    online = value;
    if (!state.user || state.busy) return;
    if (online) {
      if (state.pending) void flush();
      else void setUser(state.user);
    } else if (state.ready) {
      publish({ status: state.pending ? 'Feltöltésre vár · ezen az eszközön megőrizve' : 'Offline · a felhőadatok eszközön megőrzött másolata' });
    }
  }

  return {
    getSnapshot: () => state,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    setUser, update, flush, setOnline, copyCloudToLocal, restoreLocalBackup,
    uploadLocal: () => replaceCloud(loadLedger(seedItems, storage)),
    restoreCloudBackup: () => {
      const previous = state.user && read(cloudBackupKey(state.user.uid))?.ledger;
      return previous ? replaceCloud(normalizeLedger(previous)) : Promise.resolve();
    },
  };
}
