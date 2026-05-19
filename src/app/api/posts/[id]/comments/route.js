import { adminDb, FieldValue, snapToObj, listSnap } from "@/lib/firebaseAdmin";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";
import { updateUserPoints } from "@/lib/rankingSystem";

/**
 * GET /api/posts/[id]/comments?limit=100
 */
export const GET = withAuth(async (req, { params }) => {
  const postId = params.id;
  if (!postId) return jsonError("Missing post id", 400);

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 200);

  const postRef = adminDb.collection("posts").doc(postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) return jsonError("Post not found", 404);

  const snap = await postRef
    .collection("comments")
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();

  return jsonOk({ comments: listSnap(snap) });
}, "COMMENTS_GET");

/**
 * POST /api/posts/[id]/comments
 * Body: { content: string, replyToCommentId?: string }
 */
export const POST = withAuth(async (req, { params }, { uid, user }) => {
  const postId = params.id;
  if (!postId) return jsonError("Missing post id", 400);

  const body = await safeJson(req);
  const content = (body.content || "").trim();
  if (!content) return jsonError("Comment is empty", 400);
  if (content.length > 1000) return jsonError("Comment is too long", 400);

  const replyToCommentId = body.replyToCommentId || null;

  const postRef = adminDb.collection("posts").doc(postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) return jsonError("Post not found", 404);

  // Validate parent comment if replying
  let replyToAuthorName = null;
  if (replyToCommentId) {
    const parentSnap = await postRef.collection("comments").doc(replyToCommentId).get();
    if (!parentSnap.exists) return jsonError("Parent comment not found", 404);
    replyToAuthorName = parentSnap.data().authorName || null;
  }

  const commentRef = postRef.collection("comments").doc();

  await adminDb.runTransaction(async (tx) => {
    tx.set(commentRef, {
      content,
      authorId: uid,
      authorName: user.fullName || "Scholar",
      authorAvatar: user.avatarUrl || "",
      authorRole: user.major || "",
      replyToCommentId,
      replyToAuthorName,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(postRef, { commentsCount: FieldValue.increment(1) });
  });

  // ── نقاط المساهمة: +3 لصاحب المنشور عند التعليق (ليس لنفسه) ─────────
  const postAuthorId = postSnap.data().authorId;
  if (postAuthorId && postAuthorId !== uid) {
    updateUserPoints(postAuthorId, 3).catch(
      (e) => console.error("[rankingSystem] post comment:", e.message)
    );
  }

  const fresh = await commentRef.get();
  return jsonOk(snapToObj(fresh), 201);
}, "COMMENTS_POST");
