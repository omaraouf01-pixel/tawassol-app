import { usersCol } from "@/lib/collections";
import { FieldValue, snapToObj } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

/** Sérialise un user pour le frontend (avec aliases legacy). */
function serialize(u) {
  return {
    uid: u.uid,
    name: u.fullName,
    fullName: u.fullName,
    email: u.email,
    matricule: u.matricule,
    role: u.role,
    status: u.status,
    groups: u.groups,
    onboarded: u.onboarded,
    studentCardUrl: u.studentCardUrl,
    idCardUrl: u.studentCardUrl,
    university: u.university,
    department: u.department,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
  };
}

/** GET /api/user/profile */
export const GET = withAuth(async (_req, _ctx, { user }) => {
  if (!user) return jsonError("User not found", 404);
  return jsonOk(serialize(user));
}, "PROFILE_GET");

/** PATCH /api/user/profile — self update (whitelisted fields only) */
export const PATCH = withAuth(async (req, _ctx, { uid }) => {
  const body = await safeJson(req);

  const ALLOWED = ["fullName", "bio", "avatarUrl", "university", "department", "onboarded"];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED.includes(k))
  );
  if (body?.name && !updates.fullName) updates.fullName = body.name;

  if (Object.keys(updates).length === 0) return jsonError("No valid fields to update");
  if (typeof updates.bio === "string" && updates.bio.length > 500) {
    return jsonError("Bio trop longue (max 500)");
  }
  if (typeof updates.fullName === "string" && updates.fullName.trim().length < 2) {
    return jsonError("Nom trop court");
  }

  updates.updatedAt = FieldValue.serverTimestamp();

  // Trouver le doc (par ID = uid, sinon par champ uid)
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

  await ref.update(updates);
  const fresh = await ref.get();
  return jsonOk(serialize(snapToObj(fresh)));
}, "PROFILE_PATCH");
