// ════════════════════════════════════════════════════════════════
// Firebase Admin (Firestore) — TSSWAL
// ════════════════════════════════════════════════════════════════
// Remplace MongoDB / Mongoose. Toutes les données passent par Firestore.
// Utilise firebase-admin côté serveur (API Routes seulement).
// ════════════════════════════════════════════════════════════════

import admin from "firebase-admin";

/**
 * Service account credentials.
 * Utilise UNIQUEMENT les variables d'environnement (Vercel friendly).
 */
function getCredentials() {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  throw new Error(
    "Service Account manquant. Vous devez définir les variables d'environnement FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, et FIREBASE_PRIVATE_KEY."
  );
}

// Singleton — Next.js hot-reload safe
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getCredentials()),
  });
  console.log("[Firestore] Connected successfully");
}

export const db = admin.firestore();
export const adminAuth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
export { admin };

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Convertit un DocumentSnapshot en objet JSON sérialisable
 * avec son ID + conversion des Timestamps en ISO string.
 */
export function snapToObj(doc) {
  if (!doc.exists) return null;
  const data = doc.data();
  return { id: doc.id, ...convertTimestamps(data) };
}

/**
 * Convertit récursivement les Firestore Timestamps en ISO strings
 * (pour rester compatible avec le frontend qui s'attend à des strings).
 */
export function convertTimestamps(obj) {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof admin.firestore.Timestamp) return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(convertTimestamps);
  if (typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = convertTimestamps(obj[k]);
    return out;
  }
  return obj;
}

/** Liste un QuerySnapshot en tableau d'objets */
export function listSnap(snapshot) {
  return snapshot.docs.map((d) => snapToObj(d));
}
