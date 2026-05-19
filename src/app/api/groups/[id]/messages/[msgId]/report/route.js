import { groupsCol, messagesCol, reportsCol, usersCol } from "@/lib/collections";
import { FieldValue } from "@/lib/firebaseAdmin";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";
import { notifyMany } from "@/lib/serverNotify";

const VALID_REASONS = [
  "inappropriate",
  "spam",
  "harassment",
  "misinformation",
  "other",
];

const REASON_LABELS = {
  inappropriate: "محتوى غير لائق",
  spam: "سبام أو إعلان",
  harassment: "تحرش أو إساءة",
  misinformation: "معلومات مضللة",
  other: "سبب آخر",
};

/**
 * POST /api/groups/[id]/messages/[msgId]/report
 * Body: { reason: string }
 * Any group member can report a message (once per user).
 */
export const POST = withAuth(async (req, { params }, { uid, user }) => {
  const { id: groupId, msgId } = params;

  const gSnap = await groupsCol().doc(groupId).get();
  if (!gSnap.exists) return jsonError("Group not found", 404);

  const g = gSnap.data();
  const isMember = Array.isArray(g.members) && g.members.includes(uid);
  const isAdmin = user.role === "admin";
  if (!isMember && !isAdmin) return jsonError("Group members only", 403);

  const mSnap = await messagesCol().doc(msgId).get();
  if (!mSnap.exists) return jsonError("Message not found", 404);
  if (mSnap.data().groupId !== groupId)
    return jsonError("Message does not belong to this group", 403);

  const body = await safeJson(req);
  const reason = VALID_REASONS.includes(body?.reason) ? body.reason : "other";

  // Prevent duplicate reports from the same user
  const existing = await reportsCol()
    .where("messageId", "==", msgId)
    .where("reportedBy", "==", uid)
    .limit(1)
    .get();
  if (!existing.empty) return jsonError("You already reported this message", 409);

  const msgData = mSnap.data();
  const messageText = (msgData.text || msgData.content || "").slice(0, 120);

  await reportsCol().add({
    messageId: msgId,
    groupId,
    reportedBy: uid,
    reporterName: user.fullName || "Scholar",
    reason,
    messageText,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });

  // ── Notify moderators (leader + co-leaders + site admins) ──────
  try {
    const recipientSet = new Set();

    if (g.leaderId) recipientSet.add(g.leaderId);
    if (Array.isArray(g.coLeaderIds)) g.coLeaderIds.forEach((id) => recipientSet.add(id));

    const adminSnap = await usersCol().where("role", "==", "admin").get();
    adminSnap.forEach((d) => recipientSet.add(d.id));

    // Don't notify the reporter themselves
    recipientSet.delete(uid);

    await notifyMany({
      userIds: [...recipientSet],
      title: `إبلاغ جديد — ${g.name || "مجموعة"}`,
      body: `${user.fullName || "Scholar"} أبلغ عن رسالة · ${REASON_LABELS[reason] || reason}`,
      link: `/hub/chat/${groupId}?reports=1`,
      type: "review",
    });
  } catch (notifyErr) {
    console.error("[REPORT_NOTIFY]", notifyErr);
  }

  return jsonOk({ ok: true }, 201);
}, "MSG_REPORT");
