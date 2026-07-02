import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

let appInstance = null;
let authInstance = null;
let dbInstance = null;

function getFirebaseConfig() {
  if (window.ES_FIREBASE_CONFIG && typeof window.ES_FIREBASE_CONFIG === "object") {
    return window.ES_FIREBASE_CONFIG;
  }
  return null;
}

export function getFirebaseApp() {
  if (appInstance) return appInstance;
  const config = getFirebaseConfig();
  if (!config || !config.projectId) return null;
  appInstance = getApps().length ? getApp() : initializeApp(config);
  return appInstance;
}

export function getFirebaseAuth() {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  if (!app) return null;
  authInstance = getAuth(app);
  return authInstance;
}

export function getFirestoreDb() {
  if (dbInstance) return dbInstance;
  const app = getFirebaseApp();
  if (!app) return null;
  dbInstance = getFirestore(app);
  return dbInstance;
}

