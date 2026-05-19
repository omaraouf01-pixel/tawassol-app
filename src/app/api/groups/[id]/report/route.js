import { groupsCol, reportsCol, usersCol } from "@/lib/collections";
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
 * POST /api/groups/[id]/report
 * Body: { reason: string }
 * Any group member (non-leader) can report the group (once per user).
 */
export const POST = withAuth(async (req, { params }, { uid, user }) => {
  const { id: groupId } = params;

  const gSnap = await groupsCol().doc(groupId).get();
  if (!gSnap.exists) return jsonError("Group not found", 404);

  const g = gSnap.data();

  // Only members can report
  const isMember = Array.isArray(g.members) && g.members.includes(uid);
  const isAdmin = user.role === "admin";
  if (!isMember && !isAdmin) return jsonError("Group members only", 403);

  // Leader cannot report their own group
  if (g.leaderId === uid) return jsonError("Cannot report your own group", 403);

  const body = await safeJson(req);
  const reason = VALID_REASONS.includes(body?.reason) ? body.reason : "other";

  // Prevent duplicate reports from the same user
  const existing = await reportsCol()
    .where("groupId", "==", groupId)
    .where("type", "==", "group")
    .where("reportedBy", "==", uid)
    .limit(1)
    .get();
  if (!existing.empty) return jsonError("You already reported this group", 409);

  await reportsCol().add({
    type: "group",
    groupId,
    groupName: g.name || "مجموعة",
    reportedBy: uid,
    reporterName: user.fullName || "Scholar",
    reason,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });

  // ── Notify all site admins ────────────────────────────────────
  try {
    const adminSnap = await usersCol().where("role", "==", "admin").get();
    const adminIds = adminSnap.docs.map((d) => d.id).filter((id) => id !== uid);

    if (adminIds.length > 0) {
      await notifyMany({
        userIds: adminIds,
        title: `إبلاغ جديد عن مجموعة`,
        body: `${user.fullName || "Scholar"} أبلغ عن "${g.name || "مجموعة"}" · ${REASON_LABELS[reason] || reason}`,
        link: `/admin?tab=reports`,
        type: "review",
      });
    }
  } catch (notifyErr) {
    console.error("[GROUP_REPORT_NOTIFY]", notifyErr);
  }

  return jsonOk({ ok: true }, 201);
}, "GROUP_REPORT");
