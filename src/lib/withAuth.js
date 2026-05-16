import { NextResponse } from "next/server";
import { adminAuth, db as adminDb } from "./firebaseAdmin"; // استدعاء ملف الأدمن الذي أصلحناه

/**
 * ════════════════════════════════════════════════════════════════
 * Wrappers d'authentification — TAWASSOL
 * ════════════════════════════════════════════════════════════════
 * الهدف: توحيد نظام الحماية لجميع الـ APIs ومنع تكرار الكود.
 * يتعامل هذا الملف مع (Token Verification) و (Error Handling).
 * ════════════════════════════════════════════════════════════════
 */

/** مساعدات الرد القياسية (JSON Helpers) */
export function jsonOk(data = { ok: true }, status = 200) {
  return NextResponse.json(data, { status });
}
export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** مؤقت السيرفر - لمنع الطلبات المعلقة لأكثر من 10 ثوانٍ */
const SERVER_TIMEOUT_MS = 10000;

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      const err = new Error(`Server timeout (${ms}ms) on ${label}`);
      err.status = 504;
      reject(err);
    }, ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

/**
 * ─── الأساس: معالج الأخطاء العالمي ───
 */
export function withErrorHandling(handler, label = "API") {
  return async (req, ctx) => {
    const reqId = Math.random().toString(36).slice(2, 8);

    try {
      const result = await withTimeout(handler(req, ctx), SERVER_TIMEOUT_MS, label);
      if (!result) return new NextResponse(null, { status: 204 });
      return result;
    } catch (e) {
      console.error(`[${label}#${reqId} ERROR]`, e);

      // التعامل مع أخطاء Firebase المحددة
      if (e.code === "auth/id-token-expired") {
        return jsonError("Token expired. Please login again.", 401);
      }

      const status = e.status || 500;
      const msg = e.message || "Internal Server Error.";
      return jsonError(msg, status);
    }
  };
}

/**
 * ─── withAuth: يتطلب مستخدم مسجل (أي رتبة) ───
 */
export function withAuth(handler, label = "AUTH") {
  return withErrorHandling(async (req, ctx) => {
    try {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return jsonError("Authentication required (No Token)", 401);
      }

      const token = authHeader.split(" ")[1];
      const decodedToken = await adminAuth.verifyIdToken(token);
      const uid = decodedToken.uid;

      // جلب بيانات المستخدم من Firestore لضمان وجود الحساب
      const userDoc = await adminDb.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        return jsonError("User record not found in database", 401);
      }

      const user = userDoc.data();

      // تمرير البيانات للـ Handler الأصلي (uid, user, decodedToken)
      return handler(req, ctx, { uid, user, decodedToken });
    } catch (error) {
      console.error("Auth Wrapper Error:", error.message);
      return jsonError("Invalid or expired session", 401);
    }
  }, label);
}

/**
 * ─── withAdmin: يتطلب صلاحيات الأدمن حصراً ───
 */
export function withAdmin(handler, label = "ADMIN") {
  return withAuth(async (req, ctx, auth) => {
    // التحقق من الرتبة في Firestore
    if (auth.user.role !== "admin") {
      return jsonError("Admin privileges required", 403);
    }
    return handler(req, ctx, auth);
  }, label);
}

/**
 * ─── withPublic: للـ APIs العامة مع معالجة الأخطاء ───
 */
export function withPublic(handler, label = "PUBLIC") {
  return withErrorHandling(handler, label);
}

/**
 * ─── Parser JSON آمن ───
 */
export async function safeJson(req) {
  try {
    const text = await req.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
}