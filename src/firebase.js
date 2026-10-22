import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocFromServer, getDocsFromServer, getFirestore, setDoc, writeBatch } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

export const firebaseReady = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
const app = firebaseReady ? initializeApp(config) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
let writeQueue = Promise.resolve();

export function watchUser(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export function signIn() {
  if (!auth) throw new Error('A Firebase még nincs beállítva.');
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signOutUser() { return auth ? signOut(auth) : Promise.resolve(); }

function ledgerRef(uid) { return doc(db, 'users', uid, 'ledgers', 'main'); }

export async function loadCloudLedger(uid) {
  const snapshot = await getDocFromServer(ledgerRef(uid));
  return snapshot.exists() && Array.isArray(snapshot.data()?.shops) ? snapshot.data() : null;
}

export function saveCloudLedger(uid, ledger) {
  writeQueue = writeQueue.catch(() => {}).then(() => setDoc(ledgerRef(uid), { schemaVersion: 2, ...ledger, updatedAt: Date.now() }));
  return writeQueue;
}

export async function loadBaseCatalog() {
  if (!db) throw new Error('A Firebase még nincs beállítva.');
  const snapshot = await getDocsFromServer(collection(db, 'baseCatalog'));
  return snapshot.docs.map(entry => ({ ...entry.data(), id: entry.id })).sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

export async function isBaseCatalogAdmin(uid) {
  if (!db || !uid) return false;
  return (await getDocFromServer(doc(db, 'catalogAdmins', uid))).exists();
}

export async function uploadBaseCatalog(items) {
  if (!db) throw new Error('A Firebase még nincs beállítva.');
  // Each write checks the admin marker in Security Rules. Keep batches below
  // Firestore's 20 document-access-call limit even without rule cache reuse.
  for (let offset = 0; offset < items.length; offset += 18) {
    const batch = writeBatch(db);
    for (const item of items.slice(offset, offset + 18)) batch.set(doc(db, 'baseCatalog', item.id), item);
    await batch.commit();
  }
}

export function deleteBaseCatalogItem(id) {
  if (!db) throw new Error('A Firebase még nincs beállítva.');
  return deleteDoc(doc(db, 'baseCatalog', id));
}
