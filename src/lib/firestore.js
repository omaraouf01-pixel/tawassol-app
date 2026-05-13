import admin from "firebase-admin";

/**
 * TAWASSOL FIREBASE ADMIN ENGINE
 * -----------------------------
 * هذا الملف يعمل على جهة السيرفر فقط (Server-side).
 * يُستخدم في الـ API Routes والـ Server Actions.
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
    throw new Error(`[Firebase Admin] ⛔ Missing Environment Variables: ${missing.join(", ")}`);
  }

  // معالجة المفتاح الخاص لضمان قراءة السطور الجديدة بشكل صحيح
  const formattedPrivateKey = config.privateKey.replace(/\\n/g, "\n");

  if (!formattedPrivateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error("[Firebase Admin] ❌ FIREBASE_PRIVATE_KEY format is invalid.");
  }

  return {
    projectId: config.projectId,
    clientEmail: config.clientEmail,
    privateKey: formattedPrivateKey,
  };
}

// ─── Singleton Pattern: التأكد من عدم تكرار تهيئة التطبيق ───
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(getCredentials()),
    });
    console.log("[Firebase Admin] ✅ Node Engine Connected Successfully");
  } catch (e) {
    adminInitError = e.message;
    console.error("[Firebase Admin] ❌ CRITICAL INITIALIZATION ERROR:", e.message);
  }
}

// تصدير المحركات الأساسية
export const db = admin.firestore();
export const adminAuth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
export { admin, adminInitError };

// ─── DATA SERIALIZATION HELPERS ───
// هذه الدوال تضمن تحويل بيانات Firestore "المعقدة" إلى كائنات JSON بسيطة للـ Front-end

/**
 * تحويل وثيقة واحدة من Firestore إلى Object بسيط
 */
export function snapToObj(doc) {
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    ...convertTimestamps(data)
  };
}

/**
 * تحويل مصفوفة من الوثائق (QuerySnapshot) إلى مصفوفة Object
 */
export function listSnap(snapshot) {
  if (snapshot.empty) return [];
  return snapshot.docs.map((d) => snapToObj(d));
}

/**
 * دالة ذكية لتحويل الـ Timestamps الخاصة بـ Firebase إلى ISO Strings
 * تعمل بشكل متداخل (Recursive) لمعالجة الكائنات والمصفوفات العميقة.
 */
export function convertTimestamps(obj) {
  if (obj === null || obj === undefined) return obj;

  // إذا كان Timestamp مباشر
  if (obj instanceof admin.firestore.Timestamp) {
    return obj.toDate().toISOString();
  }

  // إذا كانت مصفوفة، نعالج كل عنصر فيها
  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }

  // إذا كان كائن (Object)، نعالج المفاتيح الخاصة به
  if (typeof obj === "object") {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
      out[key] = convertTimestamps(value);
    }
    return out;
  }

  return obj;
}