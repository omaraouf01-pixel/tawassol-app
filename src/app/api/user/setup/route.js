import { usersCol } from "@/lib/collections";
import { FieldValue, snapToObj } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

/**
 * ════════════════════════════════════════════════════════════════
 *  POST /api/user/setup
 *  Endpoint dédié à la fin de l'onboarding.
 * ════════════════════════════════════════════════════════════════
 *  Garanties (par design) :
 *   ✅ onboarded: true est HARDCODÉ — impossible de finir sans flipper le bit
 *   ✅ Les 3 champs (university, department, bio) sont validés strictement
 *   ✅ Renvoie { success: true, user } seulement après écriture confirmée
 *   ✅ Le frontend ne doit rediriger QU'APRÈS avoir reçu { success: true }
 *
 *  Body attendu : { university, department, bio?, avatarUrl? }
 * ════════════════════════════════════════════════════════════════
 */
export const POST = withAuth(async (req, _ctx, { uid }) => {
  const body = await safeJson(req);
  const university = (body.university || "").trim();
  const department = (body.department || "").trim();
  const bio = (body.bio || "").trim();
  const avatarUrl = body.avatarUrl || null;

  // ── Validation stricte ──
  if (!university) return jsonError("Université requise.", 400);
  if (!department) return jsonError("Département requis.", 400);
  if (bio.length > 500) return jsonError("Bio trop longue (max 500 caractères).", 400);

  // ── Trouver le doc user (par ID = uid, sinon par champ uid) ──
  const directRef = usersCol().doc(uid);
  const direct = await directRef.get();

  let ref;
  if (direct.exists) {
    ref = directRef;
  } else {
    const snap = await usersCol().where("uid", "==", uid).limit(1).get();
    if (snap.empty) return jsonError("User not found", 404);
    ref = snap.docs[0].ref;
  }

  // ── Update : onboarded:true HARDCODÉ ──
  //    Même si le client tente d'envoyer onboarded:false, on l'ignore.
  const updates = {
    university,
    department,
    bio,
    onboarded: true, // ⚡ TOUJOURS true à la fin du setup
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (avatarUrl) updates.avatarUrl = avatarUrl;

  await ref.update(updates);

  // ── Lecture fraîche pour confirmer + renvoyer au client ──
  const fresh = await ref.get();
  const user = snapToObj(fresh);

  // ── Garde-fou ultime : vérifier que onboarded est bien true ──
  if (!user.onboarded) {
    return jsonError("Échec de la mise à jour. Réessayez.", 500);
  }

  return jsonOk({
    success: true,
    user: {
      uid: user.uid,
      fullName: user.fullName,
      university: user.university,
      department: user.department,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      onboarded: user.onboarded,
    },
  });
}, "USER_SETUP");
