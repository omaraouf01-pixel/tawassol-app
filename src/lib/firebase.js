// ════════════════════════════════════════════════════════════════
// Firebase Client Config — TAWASSOL
// ════════════════════════════════════════════════════════════════
// Firebase is used for Authentication (client) + Firestore (real-time listeners).
// All secure writes go through API routes that use firebase-admin.
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

// ─── 2. Validation (client-side only) ────────────────────────────
const REQUIRED_KEYS = ["apiKey", "authDomain", "projectId", "appId"];

if (typeof window !== "undefined") {
  const missing = REQUIRED_KEYS.filter((k) => !firebaseConfig[k]);
  if (missing.length) {
    console.error(
      `[Firebase] ⛔ Missing REQUIRED env vars: ${missing.join(", ")}`,
      "\n→ Ensure these are set in .env.local with the NEXT_PUBLIC_ prefix.",
      "\n→ Restart `npm run dev` after editing .env.local."
    );
  }
}

// ─── 3. Singleton init (HMR-safe) ────────────────────────────────
let app;
let auth;
let firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // Use multi-layer persistence for maximum reliability
  try {
    auth = initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
      ],
    });
  } catch (e) {
    // initializeAuth throws if called twice in the same process (HMR)
    auth = getAuth(app);
  }
} else {
  app = getApp();
  auth = getAuth(app);
}

firestore = getFirestore(app);

export { app, auth, firestore };
