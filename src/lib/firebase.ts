import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export const getDb = (): Firestore => {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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

