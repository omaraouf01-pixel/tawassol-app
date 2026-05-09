import { groupsCol, messagesCol, buildMessageDoc } from "@/lib/collections";
import { Timestamp, FieldValue, snapToObj, listSnap } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

async function ensureMember(uid, user, groupId) {
  const gSnap = await groupsCol().doc(groupId).get();
  if (!gSnap.exists) return { error: "Group not found", status: 404 };
  const group = gSnap.data();
  const isAdmin = user?.role === "admin";
  const isMember = (group.members || []).includes(uid);
  if (!isMember && !isAdmin) return { error: "Forbidden", status: 403 };
  return { group, ref: gSnap.ref };
}

/**
 * GET /api/groups/[id]/messages?limit=200&since=<isoDate>
 *  - sans `since` → derniers N messages dans l'ordre chronologique (ASC)
 *  - avec `since` → uniquement les messages créés APRÈS cette date
 */
export const GET = withAuth(async (req, { params }, { uid, user }) => {
  const ctx = await ensureMember(uid, user, params.id);
  if (ctx.error) return jsonError(ctx.error, ctx.status);

  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 500);

  if (since) {
    const sinceTs = Timestamp.fromDate(new Date(since));
    const snap = await messagesCol()
      .where("groupId", "==", params.id)
      .where("createdAt", ">", sinceTs)
      .orderBy("createdAt", "asc")
      .limit(limit)
      .get();
    return jsonOk({ messages: listSnap(snap) });
  }

  // Mode initial : récupère les N derniers, on inverse pour ordre chronologique
  const snap = await messagesCol()
    .where("groupId", "==", params.id)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return jsonOk({ messages: listSnap(snap).reverse() });
}, "MESSAGES_GET");

/**
 * POST /api/groups/[id]/messages
 * Body: { text?, imageUrl?, fileUrl?, fileName?, fileType?, replyTo? }
 * Au moins un de text/imageUrl/fileUrl doit être présent.
 */
export const POST = withAuth(async (req, { params }, { uid, user }) => {
  const body = await safeJson(req);
  const text = (body.text || "").trim();
  const imageUrl = body.imageUrl || null;
  const fileUrl = body.fileUrl || null;
  const fileName = body.fileName || null;
  const fileType = body.fileType || null;
  const replyTo = body.replyTo || null;

  if (!text && !imageUrl && !fileUrl) return jsonError("Message vide");
  if (text.length > 4000) return jsonError("Message trop long");

  const ctx = await ensureMember(uid, user, params.id);
  if (ctx.error) return jsonError(ctx.error, ctx.status);

  // Créer le message
  const ref = await messagesCol().add(
    buildMessageDoc({
      groupId: params.id,
      uid,
      userName: user?.fullName || "Étudiant",
      text,
      imageUrl,
      fileUrl,
      fileName,
      fileType,
      replyTo,
    })
  );

  // ⚡ Bump updatedAt sur le groupe → fait remonter le groupe dans la liste "mes groupes"
  ctx.ref.update({ updatedAt: FieldValue.serverTimestamp() }).catch(() => {});

  const fresh = await ref.get();
  return jsonOk(snapToObj(fresh), 201);
}, "MESSAGES_POST");
