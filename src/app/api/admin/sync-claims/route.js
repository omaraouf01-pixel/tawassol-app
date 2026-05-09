import { NextResponse } from "next/server";
import { usersCol } from "@/lib/collections";
import { adminAuth } from "@/lib/firestore";

/**
 * POST /api/admin/sync-claims
 *
 * 🔧 ENDPOINT DE MIGRATION (à utiliser une seule fois)
 *
 * Synchronise les Custom Claims Firebase Auth avec les rôles Firestore
 * pour TOUS les users existants. Appelé après avoir migré vers le système
 * de claims, pour que les admins déjà créés aient bien `admin: true` dans
 * leur token.
 *
 * Body : { secret: "<MIGRATION_SECRET>" }
 *
 * Ajoute dans .env.local :
 *   MIGRATION_SECRET="une-phrase-secrete-quelconque"
 *
 * Usage (depuis le navigateur ou curl) :
 *   await fetch("/api/admin/sync-claims", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ secret: "votre-phrase" })
 *   })
 *
 * Après l'appel : déconnectez-vous et reconnectez-vous (ou attendez 1h)
 * pour que le nouveau token contienne le claim `admin: true`.
 */
export async function POST(req) {
  const { secret } = await req.json().catch(() => ({}));
  const expected = process.env.MIGRATION_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "MIGRATION_SECRET non défini dans .env.local" },
      { status: 500 }
    );
  }
  if (secret !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snap = await usersCol().get();
  const results = { updated: 0, skipped: 0, failed: 0, details: [] };

  for (const doc of snap.docs) {
    const data = doc.data();
    const authUid = data.uid || doc.id;

    try {
      await adminAuth.setCustomUserClaims(authUid, {
        role: data.role || "student",
        admin: data.role === "admin",
        status: data.status || "pending",
      });
      results.updated++;
      results.details.push({ uid: authUid, role: data.role, ok: true });
    } catch (e) {
      // user-not-found = doc Firestore sans compte Auth correspondant
      if (e.code === "auth/user-not-found") {
        results.skipped++;
      } else {
        results.failed++;
        results.details.push({ uid: authUid, error: e.code || e.message });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Sync terminé. Déconnectez-vous puis reconnectez-vous pour activer les nouveaux claims.",
    ...results,
  });
}
