// src/lib/firestore.js
// Server-only barrel — يُعيد تصدير firebase-admin. لا تستورده من "use client".

/**
 * TAWASSOL — Server-Only Firestore Barrel
 * ---------------------------------------
 * هذا الملف يُعيد تصدير كل ما تحتاجه الـ API Routes من firebaseAdmin،
 * مع الحفاظ على نقاط الاستيراد القائمة (db, FieldValue, Timestamp, snapToObj, ...).
 *
 * مهم: لا تستورد من هذا الملف داخل أي مكوّن "use client" —
 * استخدم بدلاً منه: import { firestore } from "@/lib/firebase";
 */

export {
  adminDb,
  adminDb as db,
  adminAuth,
  FieldValue,
  Timestamp,
  snapToObj,
  listSnap,
  convertTimestamps,
  admin,
} from "./firebaseAdmin";
