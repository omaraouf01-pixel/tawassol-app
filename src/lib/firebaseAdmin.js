// src/lib/firebaseAdmin.js
// Server-only: يستخدم firebase-admin (Node) — لا يجوز استيراده من "use client".
import admin from "firebase-admin";

/**
 * TAWASSOL FIREBASE ADMIN ENGINE
 * -----------------------------
 * يعمل على جهة السيرفر فقط. يُستخدم في الـ API Routes والـ Server Actions.
 *
 * بعد التهيئة، نُصدّر:
 *   - adminDb (الاسم الرسمي)
 *   - db      (alias متوافق مع الاستيرادات القديمة)
 *
 * أي محاولة استخدام قبل التهيئة الناجحة ترمي خطأً واضحاً
 * بدلاً من ترك adminDb بقيمة undefined.
 */

let adminInitError = null;

function getCredentials() {
  const config = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  };

  const missing = Object.keys(config).filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(
      `[Firebase Admin] Missing Environment Variables: ${missing.join(", ")}`
    );
  }

  const formattedPrivateKey = config.privateKey.replace(/\\n/g, "\n");
  if (!formattedPrivateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error("[Firebase Admin] FIREBASE_PRIVATE_KEY format is invalid.");
  }

  return {
    projectId: config.projectId,
    clientEmail: config.clientEmail,
    privateKey: formattedPrivateKey,
  };
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(getCredentials()),
    });
    console.log("[Firebase Admin] Node Engine Connected Successfully");
  } catch (e) {
    adminInitError = e.message;
    console.error("[Firebase Admin] CRITICAL INITIALIZATION ERROR:", e.message);
  }
}

function assertInitialized() {
  if (adminInitError) {
    throw new Error(`[Firebase Admin] Not initialized: ${adminInitError}`);
  }
  if (!admin.apps.length) {
    throw new Error("[Firebase Admin] App was not initialized");
  }
}

assertInitialized();

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

// Alias متوافق مع الاستيرادات القائمة (login/register/profile/withAuth/...)
export const db = adminDb;

export { admin, adminInitError };

// ─── DATA SERIALIZATION HELPERS ───

export function snapToObj(doc) {
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    ...convertTimestamps(data),
  };
}

export function listSnap(snapshot) {
  if (snapshot.empty) return [];
  return snapshot.docs.map((d) => snapToObj(d));
}

export function convertTimestamps(obj) {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof admin.firestore.Timestamp) {
    return obj.toDate().toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }

  if (typeof obj === "object") {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
      out[key] = convertTimestamps(value);
    }
    return out;
  }

  return obj;
}
