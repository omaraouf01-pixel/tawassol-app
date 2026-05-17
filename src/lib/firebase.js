// ════════════════════════════════════════════════════════════════
// Firebase Client Config — TAWASSOL
// ════════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 👈 استيراد خدمة التخزين للصور

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
      "\n→ Ensure these are set in .env.local with the NEXT_PUBLIC_ prefix."
    );
  }
}

// ─── 3. Singleton init (HMR-safe) ────────────────────────────────
let app;
let auth;
let firestore;
let storage; // 👈 تعريف متغير التخزين

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  try {
    auth = initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch (e) {
    auth = getAuth(app);
  }
} else {
  app = getApp();
  auth = getAuth(app);
}

// تهيئة الخدمات
firestore = getFirestore(app);
storage = getStorage(app); // 👈 ربط خدمة التخزين بالتطبيق

// ─── 4. Phone Auth: تعطيل التحقق في التطوير لاستخدام أرقام الاختبار ───
if (
  process.env.NODE_ENV === "development" &&
  typeof window !== "undefined" &&
  auth?.settings
) {
  auth.settings.appVerificationDisabledForTesting = true;
}

export { app, auth, firestore, storage }; // 👈 تصدير storage لاستخدامه في الأونبوردينج