// src/lib/rankingSystem.js
// Server-only — يستخدم Firebase Admin SDK.
// ─────────────────────────────────────────────────────────────────────────────
// نظام نقاط المساهمة الأكاديمية في Tawassol
//
//  getRank(points)          → اسم الرتبة بناءً على رصيد النقاط
//  updateUserPoints(uid, n) → يزيد أو يخصم نقاطاً بأمان عبر Transaction
// ─────────────────────────────────────────────────────────────────────────────
import { adminDb, FieldValue } from "./firebaseAdmin";
import { COL } from "./collectionNames";

// ── عتبات الرتب ──────────────────────────────────────────────────────────────
const RANKS = [
  { label: "مُبادِر",    min: 0    },  // Initiator
  { label: "مُساهِم",   min: 151  },  // Contributor
  { label: "باحِث",     min: 501  },  // Researcher
  { label: "مَرجِع",    min: 1501 },  // Reference
];

/**
 * getRank — دالة صافية (لا تستدعي Firestore)
 * @param {number} points
 * @returns {string} اسم الرتبة
 */
export function getRank(points) {
  const p = Math.max(0, Number(points) || 0);
  // نمشي عكسياً لإيجاد أعلى عتبة مناسبة
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (p >= RANKS[i].min) return RANKS[i].label;
  }
  return RANKS[0].label;
}

/**
 * updateUserPoints — يُحدِّث حقلَي points و rank للمستخدم داخل Transaction
 * لتفادي Race Conditions عند التحديثات المتزامنة.
 *
 * @param {string} uid    - معرّف المستخدم في Firestore
 * @param {number} amount - القيمة المُضافة (موجبة أو سالبة)
 * @returns {Promise<{points: number, rank: string}>} الرصيد والرتبة الجديدان
 */
export async function updateUserPoints(uid, amount) {
  if (!uid) throw new Error("[rankingSystem] uid is required");
  const delta = Number(amount);
  if (!Number.isFinite(delta) || delta === 0) return;   // لا شيء يستدعي الكتابة

  const userRef = adminDb.collection(COL.USERS).doc(uid);

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);

    // نتجاهل بصمت إذا لم يُوجد المستخدم (حالة نادرة)
    if (!snap.exists) {
      console.warn(`[rankingSystem] User ${uid} not found — skipping points update`);
      return;
    }

    const current = snap.data().points ?? 0;
    const updated = Math.max(0, current + delta);  // لا يقل الرصيد عن 0
    const rank    = getRank(updated);

    tx.update(userRef, { points: updated, rank });
    return { points: updated, rank };
  });
}
