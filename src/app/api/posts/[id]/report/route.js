import { postsCol, reportsCol, usersCol } from "@/lib/collections";
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
 * POST /api/posts/[id]/report
 * Body: { reason: string }
 * Any active user can report a post (once per user, cannot report own post).
 */
export const POST = withAuth(async (req, { params }, { uid, user }) => {
  const { id: postId } = params;

  const postSnap = await postsCol().doc(postId).get();
  if (!postSnap.exists) return jsonError("Post not found", 404);

  const post = postSnap.data();
  if (post.authorId === uid) return jsonError("Cannot report your own post", 403);

  const body = await safeJson(req);
  const reason = VALID_REASONS.includes(body?.reason) ? body.reason : "other";

  // Prevent duplicate reports from the same user
  const existing = await reportsCol()
    .where("postId", "==", postId)
    .where("reportedBy", "==", uid)
    .limit(1)
    .get();
  if (!existing.empty) return jsonError("You already reported this post", 409);

  const postText = (post.content || "").slice(0, 120);

  await reportsCol().add({
    type: "post",
    postId,
    reportedBy: uid,
    reporterName: user.fullName || "Scholar",
    authorId: post.authorId,
    authorName: post.authorName || "Scholar",
    reason,
    postText,
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
        title: `إبلاغ جديد عن منشور`,
        body: `${user.fullName || "Scholar"} أبلغ عن منشور · ${REASON_LABELS[reason] || reason}`,
        link: `/admin?tab=reports`,
        type: "review",
      });
    }
  } catch (notifyErr) {
    console.error("[POST_REPORT_NOTIFY]", notifyErr);
  }

  return jsonOk({ ok: true }, 201);
}, "POST_REPORT");
