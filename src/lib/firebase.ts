import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore, setLogLevel } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence non-fatal Firestore network timeout warnings in browser/iframe environment
try {
  setLogLevel('silent');
} catch {}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export const getDb = (): Firestore => {
  if (!firestoreInstance) {
    try {
      firestoreInstance = initializeFirestore(
        app,
        {
          experimentalForceLongPolling: true,
        },
        firebaseConfig.firestoreDatabaseId
      );
    } catch {
      firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    }
  }
  return firestoreInstance;
};

export const getAuthInstance = (): Auth => {
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
};

export const db: Firestore = getDb();
export const auth: Auth = getAuthInstance();


