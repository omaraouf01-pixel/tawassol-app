import { NextResponse } from "next/server";
import { usersCol } from "@/lib/collections";
import { FieldValue, adminAuth } from "@/lib/firestore";
import { verifyAdmin } from "@/lib/verifyAdmin";

/**
 * Helper: récupère la référence du document user.
 * On stocke maintenant uid comme ID du doc, mais fallback sur le champ uid
 * pour compatibilité avec d'anciens documents.
 */
async function getUserRef(uid) {
  const direct = usersCol().doc(uid);
  const snap = await direct.get();
  if (snap.exists) return direct;

  const q = await usersCol().where("uid", "==", uid).limit(1).get();
  if (q.empty) return null;
  return q.docs[0].ref;
}

// PATCH /api/admin/users/[uid]
export async function PATCH(request, { params }) {
  const v = await verifyAdmin(request);
  if (v.error) return NextResponse.json({ error: v.error }, { status: v.status });

  const { uid } = params;
  const body = await request.json();
  const allowed = ["fullName", "name", "matricule", "email", "role", "status", "groups"];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  if (updates.name && !updates.fullName) {
    updates.fullName = updates.name;
    delete updates.name;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updatedAt = FieldValue.serverTimestamp();

  try {
    const ref = await getUserRef(uid);
    if (!ref) return NextResponse.json({ error: "User not found" }, { status: 404 });
    await ref.update(updates);

    // Si le rôle ou status a changé → synchroniser les Custom Claims
    if (updates.role !== undefined || updates.status !== undefined) {
      const fresh = (await ref.get()).data();
      const authUid = fresh.uid || uid;
      try {
        await adminAuth.setCustomUserClaims(authUid, {
          role: fresh.role || "student",
          admin: fresh.role === "admin",
          status: fresh.status || "pending",
        });
      } catch (e) {
        console.warn("[PATCH user] setCustomUserClaims:", e.code || e.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/admin/users/[uid]
export async function DELETE(request, { params }) {
  const v = await verifyAdmin(request);
  if (v.error) return NextResponse.json({ error: v.error }, { status: v.status });

  try {
    const ref = await getUserRef(params.uid);
    if (ref) {
      const data = (await ref.get()).data();
      await ref.delete();

      // Supprimer aussi le compte Firebase Auth (si existe)
      const authUid = data?.uid || params.uid;
      try {
        await adminAuth.deleteUser(authUid);
      } catch (e) {
        // user-not-found est OK (peut-être un placeholder)
        if (e.code !== "auth/user-not-found") {
          console.warn("[DELETE USER] Auth delete failed:", e.code);
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
