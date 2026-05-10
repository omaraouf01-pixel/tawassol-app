import { NextResponse } from "next/server";
import { groupsCol, messagesCol, resourcesCol, joinRequestsCol } from "@/lib/collections";
import { db } from "@/lib/firestore";
import { verifyAdmin } from "@/lib/verifyAdmin";

// DELETE /api/admin/groups/[id]
export async function DELETE(request, { params }) {
  const v = await verifyAdmin(request);
  if (v.error) return NextResponse.json({ error: v.error }, { status: v.status });

  try {
    const groupId = params.id;
    const batch = db.batch();

    // 1. Supprimer le groupe (les requêtes en attente sont embarquées et seront supprimées avec)
    batch.delete(groupsCol().doc(groupId));

    // 2. Supprimer les messages
    const msgSnap = await messagesCol().where("groupId", "==", groupId).get();
    msgSnap.docs.forEach((d) => batch.delete(d.ref));

    // 3. Supprimer les ressources
    const resSnap = await resourcesCol().where("groupId", "==", groupId).get();
    resSnap.docs.forEach((d) => batch.delete(d.ref));

    // 4. Nettoyer l'ancienne collection joinRequests au cas où
    const jrSnap = await joinRequestsCol().where("groupId", "==", groupId).get();
    jrSnap.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();
    return NextResponse.json({ ok: true, message: "Groupe supprimé avec succès." });
  } catch (e) {
    console.error("Erreur lors de la suppression:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}