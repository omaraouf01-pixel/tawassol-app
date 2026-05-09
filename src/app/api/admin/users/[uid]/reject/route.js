import { NextResponse } from "next/server";
import { usersCol } from "@/lib/collections";
import { FieldValue } from "@/lib/firestore";
import { verifyAdmin } from "@/lib/verifyAdmin";

// POST /api/admin/users/[uid]/reject
export async function POST(request, { params }) {
  const v = await verifyAdmin(request);
  if (v.error) return NextResponse.json({ error: v.error }, { status: v.status });

  try {
    const direct = usersCol().doc(params.uid);
    const snap = await direct.get();

    let ref;
    if (snap.exists) {
      ref = direct;
    } else {
      const q = await usersCol().where("uid", "==", params.uid).limit(1).get();
      if (q.empty) return NextResponse.json({ error: "User not found" }, { status: 404 });
      ref = q.docs[0].ref;
    }

    await ref.update({ status: "rejected", updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
