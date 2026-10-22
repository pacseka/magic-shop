import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore, setDoc } from 'firebase/firestore';

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
