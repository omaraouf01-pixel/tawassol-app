// ════════════════════════════════════════════════════════════════
// Firebase Admin (Firestore) — TSSWAL
// ════════════════════════════════════════════════════════════════
// Remplace MongoDB / Mongoose. Toutes les données passent par Firestore.
// Utilise firebase-admin côté serveur (API Routes seulement).
// ════════════════════════════════════════════════════════════════

import admin from "firebase-admin";
import fs from "fs";
import path from "path";

/**
 * Service account credentials.
 * Deux méthodes acceptées (par ordre de priorité) :
 *
 *   A) Fichier JSON local (RECOMMANDÉ — plus simple) :
 *      → Téléchargez la clé depuis Firebase Console > Project Settings >
 *        Service accounts > Generate new private key
 *      → Sauvegardez le fichier JSON à la racine du projet
 *        sous le nom : firebase-service-account.json
 *      → Le fichier est déjà ignoré par .gitignore (NE PAS le commit !)
 *
 *   B) Variable d'environnement FIREBASE_SERVICE_ACCOUNT :
 *      → Contient le JSON entier sur une seule ligne dans .env.local
 */
function getCredentials() {
  // ── Méthode A : fichier JSON local ──
  const filePath = path.join(process.cwd(), "firebase-service-account.json");
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      return JSON.parse(content);
    } catch (e) {
      throw new Error("firebase-service-account.json invalide : " + e.message);
    }
  }

  // ── Méthode B : variable d'environnement ──
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw && raw.trim()) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed.private_key && parsed.private_key.includes("\\n")) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed;
    } catch (e) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT invalide (JSON malformé): " + e.message);
    }
  }

  throw new Error(
    "Service Account manquant. Téléchargez la clé depuis Firebase Console > " +
    "Project Settings > Service accounts > Generate new private key, " +
    "puis placez le fichier sous : firebase-service-account.json à la racine du projet."
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
