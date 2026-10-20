import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

test('Auth and Firestore register with the same Firebase app', async () => {
  const app = initializeApp({ apiKey: 'test-key', appId: 'test-app', projectId: 'test-project' }, 'registration-test');
  try {
    assert.equal(getAuth(app).app, app);
    assert.equal(getFirestore(app).app, app);
  } finally {
    await deleteApp(app);
  }
});
