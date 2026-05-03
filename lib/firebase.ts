import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY     ?? "",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID  ?? "",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID      ?? "",
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db   = getFirestore(app);
  auth = getAuth(app);
} catch {
  app  = {} as FirebaseApp;
  db   = {} as Firestore;
  auth = {} as Auth;
}

// Storage is initialized lazily only when needed (image upload)
export async function getStorageInstance() {
  const { getStorage } = await import("firebase/storage");
  return getStorage(app);
}

export { db, auth };
export default app;
