import { NextResponse } from "next/server";
import { usersCol } from "@/lib/collections";
import { FieldValue, adminAuth } from "@/lib/firestore";
import { verifyAdmin } from "@/lib/verifyAdmin";

// POST /api/admin/users/[uid]/approve
export async function POST(request, { params }) {
  const v = await verifyAdmin(request);
  if (v.error) return NextResponse.json({ error: v.error }, { status: v.status });

  try {
    // Trouver le doc (par ID ou champ uid)
    const direct = usersCol().doc(params.uid);
    const snap = await direct.get();

    let ref, userData;
    if (snap.exists) {
      ref = direct;
      userData = snap.data();
    } else {
      const q = await usersCol().where("uid", "==", params.uid).limit(1).get();
      if (q.empty) return NextResponse.json({ error: "User not found" }, { status: 404 });
      ref = q.docs[0].ref;
      userData = q.docs[0].data();
    }

    await ref.update({ status: "active", updatedAt: FieldValue.serverTimestamp() });

    // Synchroniser les Custom Claims (rôle de l'user) sur Firebase Auth
    const authUid = userData.uid || params.uid;
    try {
      await adminAuth.setCustomUserClaims(authUid, {
        role: userData.role || "student",
        admin: userData.role === "admin",
        status: "active",
      });
    } catch (e) {
      console.warn("[approve] setCustomUserClaims:", e.code || e.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
