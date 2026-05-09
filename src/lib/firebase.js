// ════════════════════════════════════════════════════════════════
// Firebase Client Config — TSSWAL
// ════════════════════════════════════════════════════════════════
// Firebase est utilisé UNIQUEMENT pour l'authentification client.
// Toutes les données (users, posts, groupes, messages, notifications)
// sont dans MongoDB, accédées via des API routes simples.
//
// ⛔ ZÉRO FIRESTORE — firebase-admin supprimé aussi.
// ════════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  getAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ─── 1. Configuration ────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ─── 2. Validation au démarrage ──────────────────────────────────
if (typeof window !== "undefined") {
  const missing = Object.entries(firebaseConfig)
    .filter(([k, v]) => !v && k !== "measurementId")
    .map(([k]) => k);
  if (missing.length) {
    console.error(
      "[Firebase] Variables manquantes dans .env.local :",
      missing,
      "\n→ Redémarrez `npm run dev` après avoir modifié .env.local."
    );
  }
}

// ─── 3. Initialisation singleton (HMR safe) ──────────────────────
let app;
let auth;
let firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      browserSessionPersistence,
    ],
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

// Firestore client (pour les listeners real-time onSnapshot)
firestore = getFirestore(app);

export { app, auth, firestore };
