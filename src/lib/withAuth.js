import { NextResponse } from "next/server";
import { verifyAuth, verifyAdmin } from "./verifyAdmin";
import { adminInitError } from "./firestore";

/**
 * ════════════════════════════════════════════════════════════════
 *  Wrappers d'authentification — TSSWAL
 * ════════════════════════════════════════════════════════════════
 *  But : éviter la répétition du code d'auth dans chaque route +
 *        attraper toutes les erreurs (plus de crash 500).
 *
 *  Avant (verbeux + risqué) :
 *    export async function GET(req, ctx) {
 *      const v = await verifyAuth(req);
 *      if (v.error) return NextResponse.json(...);
 *      try { ... } catch (e) { ... }
 *    }
 *
 *  Après (DRY + safe) :
 *    export const GET = withAuth(async (req, ctx, { uid, user }) => {
 *      // logique métier uniquement, le wrapper gère tout le reste
 *    });
 * ════════════════════════════════════════════════════════════════
 */

/** Helpers de réponse standard */
export function jsonOk(data = { ok: true }, status = 200) {
  return NextResponse.json(data, { status });
}
export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Timeout serveur — coupe toute route bloquée à 10s (évite spinners infinis). */
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
 * Wrapper d'erreurs : enrobe un handler dans un try/catch global + timeout.
 * → Plus aucune route ne peut crasher avec un 500 silencieux ou rester pendue.
 */
export function withErrorHandling(handler, label = "API") {
  return async (req, ctx) => {
    const reqId = Math.random().toString(36).slice(2, 8);

    // ── Fail-fast if Firebase Admin never initialized ──
    if (adminInitError) {
      console.error(`[${label}#${reqId}] Firebase Admin not initialized: ${adminInitError}`);
      return jsonError(
        "Server configuration error — Firebase Admin failed to initialize. Check server logs.",
        503
      );
    }

    try {
      const result = await withTimeout(handler(req, ctx), SERVER_TIMEOUT_MS, label);
      // Garde-fou ultime : si le handler oublie de return, on force une réponse
      if (!result) {
        console.warn(`[${label}#${reqId}] handler returned undefined — forcing 204`);
        return new NextResponse(null, { status: 204 });
      }
      return result;
    } catch (e) {
      console.error(`[${label}#${reqId} ERROR]`, e);

      // Cas spécial : Firestore composite index manquant
      // → message clair avec lien pour créer l'index, au lieu d'un 500 obscur
      if (e.code === 9 || e.code === "failed-precondition" ||
          (e.message && e.message.includes("FAILED_PRECONDITION"))) {
        const indexUrlMatch = e.message?.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
        const url = indexUrlMatch ? indexUrlMatch[0] : null;
        return jsonError(
          "Firestore composite index manquant. " +
          (url ? `Créez-le ici : ${url}` : "Voir terminal du serveur pour le lien."),
          503
        );
      }

      const status = e.status || 500;
      const msg = e.message || "Erreur serveur interne.";
      return jsonError(msg, status);
    }
  };
}

/**
 * withAuth : exige un user authentifié (n'importe quel rôle).
 *
 *   export const GET = withAuth(async (req, ctx, auth) => {
 *     // auth = { uid, user, claims }
 *     return jsonOk({ hello: auth.user.fullName });
 *   });
 */
export function withAuth(handler, label = "AUTH") {
  return withErrorHandling(async (req, ctx) => {
    const v = await verifyAuth(req);
    if (v.error) return jsonError(v.error, v.status);
    return handler(req, ctx, { uid: v.uid, user: v.user, claims: v.claims });
  }, label);
}

/**
 * withAdmin : exige un admin (claim ou role Firestore).
 *
 *   export const POST = withAdmin(async (req, ctx, auth) => { ... });
 */
export function withAdmin(handler, label = "ADMIN") {
  return withErrorHandling(async (req, ctx) => {
    const v = await verifyAdmin(req);
    if (v.error) return jsonError(v.error, v.status);
    return handler(req, ctx, { uid: v.uid, user: v.user, claims: v.claims });
  }, label);
}

/**
 * withPublic : pas d'auth, juste le wrapper d'erreurs (plus de crash 500).
 *
 *   export const GET = withPublic(async (req) => { ... });
 */
export function withPublic(handler, label = "PUBLIC") {
  return withErrorHandling(handler, label);
}

/**
 * Parser JSON body sûr (renvoie {} si vide ou invalide au lieu de planter).
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
