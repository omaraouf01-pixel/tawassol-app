import { groupsCol, messagesCol, buildMessageDoc } from "@/lib/collections";
import { Timestamp, FieldValue, snapToObj, listSnap } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";
import { getUserByUid } from "@/lib/verifyAdmin";
import { adminAuth } from "@/lib/firestore";
import { NextResponse } from "next/server";

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
 * - sans `since` → derniers N messages dans l'ordre chronologique (ASC)
 * - avec `since` → uniquement les messages créés APRÈS cette date
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
export async function POST(req, { params }) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No Authorization header provided" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const body = await safeJson(req);
    const text = (body.text || "").trim();
    const imageUrl = body.imageUrl || null;
    const fileUrl = body.fileUrl || null;
    const fileName = body.fileName || null;
    const fileType = body.fileType || null;
    const replyTo = body.replyTo || null;

    if (!text && !imageUrl && !fileUrl) return jsonError("Message is empty");
    if (text.length > 4000) return jsonError("Message is too long");

    // Fetch user details for name/role (to verify membership)
    const userSnap = await getUserByUid(uid);
    const ctx = await ensureMember(uid, userSnap, params.id);
    if (ctx.error) return jsonError(ctx.error, ctx.status);

    const hasAttachment = !!(imageUrl || fileUrl);
    const isLeader = ctx.group.leaderId === uid;

    // 🎯 المنطق الجديد للرقابة:
    let moderationStatus = "approved";
    if (hasAttachment && !isLeader) {
      moderationStatus = "pending";
    }

    const messageData = buildMessageDoc({
      groupId: params.id,
      uid,
      userName: userSnap?.fullName || "Student",
      leaderId: ctx.group.leaderId,
      text,
      imageUrl,
      fileUrl,
      fileName,
      fileType,
      replyTo,
    });

    // Override uid with senderId as requested by the prompt
    messageData.senderId = uid;
    messageData.moderationStatus = moderationStatus;

    const ref = await messagesCol().add(messageData);

    ctx.ref.update({ updatedAt: FieldValue.serverTimestamp() }).catch(() => { });

    const fresh = await ref.get();
    return jsonOk(snapToObj(fresh), 201);
  } catch (error) {
    console.error("[MESSAGES POST ERROR]", error);
    return jsonError("Server error", 500);
  }
}