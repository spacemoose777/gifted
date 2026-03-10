import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use persistent local cache (replaces enableIndexedDbPersistence).
// initializeFirestore is synchronous — persistence is ready immediately,
// avoiding the race condition where Firestore operations queued before
// the old async enableIndexedDbPersistence resolved would hang on a
// poor connection. Falls back to in-memory on SSR.
export const db = (() => {
  if (typeof window !== 'undefined') {
    try {
      return initializeFirestore(app, { localCache: persistentLocalCache() });
    } catch {
      // Already initialized (e.g. Next.js HMR) — return existing instance
      return getFirestore(app);
    }
  }
  return getFirestore(app);
})();
