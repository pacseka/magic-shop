import test from 'node:test';
import assert from 'node:assert/strict';
import { createLedgerSession } from '../src/ledgerSession.js';
import { normalizeLedger, removeShop, storageKey } from '../src/shopData.js';

const ledger = (name, stock = 3) => normalizeLedger({ shops: [{ id: name, name, multiplier: 1.5, items: [{ id: 'wand', name: 'Pálca', rarity: 'Ritka', price: 400, shopPrice: 500, stock }], activity: [] }] });
const user = { uid: 'first', displayName: 'Teszt' };

function setup() {
  const values = new Map([[storageKey, JSON.stringify(ledger('Helyi'))]]);
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const cloud = new Map([[user.uid, ledger('Felhő')]]);
  let offline = false;
  const session = () => createLedgerSession({ storage, authRequired: true,
    loadCloud: async uid => { if (offline) throw new Error('offline'); return cloud.get(uid) ?? null; },
    saveCloud: async (uid, data) => { if (offline) throw new Error('offline'); cloud.set(uid, structuredClone(data)); },
  });
  return { storage, cloud, session, setOffline: value => { offline = value; } };
}

test('sign-in uses cloud data, sign-out returns to the independent local ledger', async () => {
  const env = setup();
  const session = env.session();
  await session.setUser(user);
  assert.deepEqual(session.getSnapshot().ledger, ledger('Felhő'));
  assert.deepEqual(JSON.parse(env.storage.getItem(storageKey)), ledger('Helyi'));
  session.update(data => ({ ...data, shops: data.shops.map(shop => ({ ...shop, name: 'Felhő módosítva' })) }));
  await session.flush();
  await session.setUser(null);
  assert.equal(session.getSnapshot().ledger.shops[0].name, 'Helyi');
  assert.equal(env.cloud.get(user.uid).shops[0].name, 'Felhő módosítva');
});

test('local edits persist locally and are never uploaded on sign-in to an empty account', async () => {
  const env = setup();
  const session = env.session();
  await session.setUser(null);
  session.update(() => ledger('Csak helyi', 8));
  await session.setUser({ uid: 'empty' });
  assert.deepEqual(session.getSnapshot().ledger.catalog, []);
  assert.equal(env.cloud.has('empty'), false);
  assert.equal(JSON.parse(env.storage.getItem(storageKey)).shops[0].name, 'Csak helyi');
});

test('copying cloud to local retains the cloud source and makes the previous local data restorable', async () => {
  const env = setup();
  const session = env.session();
  await session.setUser(user);
  session.copyCloudToLocal();
  assert.equal(session.getSnapshot().user.uid, user.uid);
  assert.deepEqual(JSON.parse(env.storage.getItem(storageKey)).shops, ledger('Felhő').shops);
  assert.equal(session.getSnapshot().hasLocalBackup, true);
  session.restoreLocalBackup();
  assert.deepEqual(JSON.parse(env.storage.getItem(storageKey)).shops, ledger('Helyi').shops);
  assert.equal(session.getSnapshot().ledger.shops[0].name, 'Felhő');
});

test('uploading local data replaces cloud data and keeps a restorable cloud backup', async () => {
  const env = setup();
  const session = env.session();
  await session.setUser(user);
  await session.uploadLocal();
  assert.deepEqual(env.cloud.get(user.uid), ledger('Helyi'));
  assert.equal(session.getSnapshot().ledger.shops[0].name, 'Helyi');
  assert.equal(session.getSnapshot().user.uid, user.uid);
  await session.restoreCloudBackup();
  assert.deepEqual(env.cloud.get(user.uid), ledger('Felhő'));
});

test('cloud copies stay accepted across reloads without conflict checks', async () => {
  const env = setup();
  const first = env.session();
  await first.setUser(user);
  first.copyCloudToLocal();
  const reloaded = env.session();
  await reloaded.setUser(user);
  assert.equal(reloaded.getSnapshot().ready, true);
  assert.deepEqual(reloaded.getSnapshot().ledger, ledger('Felhő'));
});

test('offline cloud edits survive reload, retry online, and do not change the local dataset', async () => {
  const env = setup();
  const first = env.session();
  await first.setUser(user);
  env.setOffline(true);
  first.setOnline(false);
  first.update(() => ledger('Offline felhő', 1));
  const reloaded = env.session();
  reloaded.setOnline(false);
  await reloaded.setUser(user);
  assert.equal(reloaded.getSnapshot().ledger.shops[0].name, 'Offline felhő');
  assert.equal(reloaded.getSnapshot().pending, true);
  assert.equal(reloaded.getSnapshot().ready, true);
  env.setOffline(false);
  reloaded.setOnline(true);
  await reloaded.flush();
  assert.equal(env.cloud.get(user.uid).shops[0].name, 'Offline felhő');
  assert.equal(reloaded.getSnapshot().pending, false);
  assert.equal(JSON.parse(env.storage.getItem(storageKey)).shops[0].name, 'Helyi');
});

test('an offline account without a cache never displays or edits the local dataset', async () => {
  const env = setup();
  const session = env.session();
  session.setOnline(false);
  await session.setUser(user);
  assert.equal(session.getSnapshot().ready, false);
  assert.equal(session.getSnapshot().ledger.shops.some(shop => shop.name === 'Helyi'), false);
  session.update(() => ledger('Tiltott'));
  assert.equal(JSON.parse(env.storage.getItem(storageKey)).shops[0].name, 'Helyi');
});

test('a late cloud load after sign-out cannot replace the local dataset', async () => {
  const env = setup();
  let finish;
  const session = createLedgerSession({ storage: env.storage, authRequired: true,
    loadCloud: () => new Promise(resolve => { finish = resolve; }), saveCloud: async () => {},
  });
  const signingIn = session.setUser(user);
  await session.setUser(null);
  finish(ledger('Késői felhő'));
  await signingIn;
  assert.equal(session.getSnapshot().user, null);
  assert.equal(session.getSnapshot().ledger.shops[0].name, 'Helyi');
});

test('cloud caches are isolated by account', async () => {
  const env = setup();
  const session = env.session();
  await session.setUser(user);
  session.setOnline(false);
  await session.setUser({ uid: 'other' });
  assert.equal(session.getSnapshot().ready, false);
  assert.equal(session.getSnapshot().ledger.shops.some(shop => shop.name === 'Felhő'), false);
});

test('a failed upload preserves the active cloud ledger and the local dataset', async () => {
  const env = setup();
  const session = env.session();
  await session.setUser(user);
  env.setOffline(true);
  await assert.rejects(session.uploadLocal());
  assert.equal(session.getSnapshot().ledger.shops[0].name, 'Felhő');
  assert.equal(JSON.parse(env.storage.getItem(storageKey)).shops[0].name, 'Helyi');
  assert.equal(session.getSnapshot().busy, false);
});

test('backup availability survives reload without Firebase and follows the active account', async () => {
  const env = setup();
  const session = env.session();
  await session.setUser(user);
  session.copyCloudToLocal();
  await session.uploadLocal();
  assert.equal(session.getSnapshot().hasCloudBackup, true);
  await session.setUser(null);
  assert.equal(session.getSnapshot().hasCloudBackup, false);
  const local = createLedgerSession({ storage: env.storage });
  assert.equal(local.getSnapshot().hasLocalBackup, true);
  assert.equal(local.getSnapshot().ready, true);
});

test('edits made while a cloud save is in flight are saved afterwards and survive reload', async () => {
  const env = setup();
  const releases = [];
  const session = createLedgerSession({ storage: env.storage, authRequired: true,
    loadCloud: async uid => env.cloud.get(uid),
    saveCloud: (uid, data) => new Promise(resolve => releases.push(() => { env.cloud.set(uid, data); resolve(); })),
  });
  await session.setUser(user);
  session.update(() => ledger('Első', 2));
  session.update(() => ledger('Második', 1));
  releases.shift()();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(session.getSnapshot().pending, true);
  releases.shift()();
  await session.flush();
  assert.equal(env.cloud.get(user.uid).shops[0].name, 'Második');
  const reloaded = env.session();
  await reloaded.setUser(user);
  assert.equal(reloaded.getSnapshot().ledger.shops[0].items[0].stock, 1);
  assert.equal(reloaded.getSnapshot().pending, false);
});

test('upload backs up the latest server contents before replacing them', async () => {
  const env = setup();
  const session = env.session();
  await session.setUser(user);
  env.cloud.set(user.uid, ledger('Másik eszközről'));
  await session.uploadLocal();
  assert.equal(env.cloud.get(user.uid).shops[0].name, 'Helyi');
  await session.restoreCloudBackup();
  assert.equal(env.cloud.get(user.uid).shops[0].name, 'Másik eszközről');
});

test('a successful cloud upload remains active even if caching fails, without reusing the stale cache', async () => {
  const env = setup();
  const write = env.storage.setItem;
  let full = false;
  env.storage.setItem = (key, value) => { if (full) throw new Error('QuotaExceededError'); write(key, value); };
  const session = createLedgerSession({ storage: env.storage, authRequired: true,
    loadCloud: async uid => env.cloud.get(uid),
    saveCloud: async (uid, data) => { env.cloud.set(uid, data); full = true; },
  });
  await session.setUser(user);
  await session.uploadLocal();
  assert.equal(env.cloud.get(user.uid).shops[0].name, 'Helyi');
  assert.equal(session.getSnapshot().ledger.shops[0].name, 'Helyi');
  assert.equal(session.getSnapshot().pending, false);
  assert.match(session.getSnapshot().status, /offline másolat/);
  const reloaded = env.session();
  reloaded.setOnline(false);
  await reloaded.setUser(user);
  assert.equal(reloaded.getSnapshot().ready, false);
});

test('deleting the last local shop survives reload and never modifies cloud data', async () => {
  const env = setup();
  const session = env.session();
  await session.setUser(null);
  session.update(data => removeShop(data, 'Helyi'));
  assert.deepEqual(session.getSnapshot().ledger.shops, []);
  const reloaded = env.session();
  await reloaded.setUser(null);
  assert.deepEqual(reloaded.getSnapshot().ledger.shops, []);
  assert.equal(reloaded.getSnapshot().ledger.catalog.length, 1);
  await reloaded.setUser(user);
  assert.equal(reloaded.getSnapshot().ledger.shops[0].name, 'Felhő');
});

test('deleting the last cloud shop offline persists across reconnect and cloud reload without changing local stock', async () => {
  const env = setup();
  const session = env.session();
  await session.setUser(user);
  env.setOffline(true);
  session.setOnline(false);
  session.update(data => removeShop(data, 'Felhő'));
  const reloaded = env.session();
  reloaded.setOnline(false);
  await reloaded.setUser(user);
  assert.deepEqual(reloaded.getSnapshot().ledger.shops, []);
  assert.equal(reloaded.getSnapshot().pending, true);
  env.setOffline(false);
  reloaded.setOnline(true);
  await reloaded.flush();
  const onlineReload = env.session();
  await onlineReload.setUser(user);
  assert.deepEqual(onlineReload.getSnapshot().ledger.shops, []);
  assert.equal(onlineReload.getSnapshot().ledger.catalog.length, 1);
  await onlineReload.setUser(null);
  assert.equal(onlineReload.getSnapshot().ledger.shops[0].items[0].stock, 3);
});
