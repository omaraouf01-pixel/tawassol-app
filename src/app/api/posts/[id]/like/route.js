import { postsCol } from "@/lib/collections";
import { db, FieldValue } from "@/lib/firestore";
import { withAuth, jsonOk } from "@/lib/withAuth";
import { updateUserPoints } from "@/lib/rankingSystem";

// POST /api/posts/[id]/like — toggle (transaction)
export const POST = withAuth(async (_req, { params }, { uid }) => {
  const ref = postsCol().doc(params.id);
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw Object.assign(new Error("Post not found"), { status: 404 });
    const data  = snap.data();
    const likes = data.likes || [];
    const liked = !likes.includes(uid);
    tx.update(ref, {
      likes: liked ? FieldValue.arrayUnion(uid) : FieldValue.arrayRemove(uid),
    });
    return { likes: liked ? likes.length + 1 : likes.length - 1, liked, authorId: data.authorId };
  });

  // ── نقاط المساهمة: +2 لصاحب المنشور عند الإعجاب (ليس لنفسه) ────────
  if (result.liked && result.authorId && result.authorId !== uid) {
    updateUserPoints(result.authorId, 2).catch(
      (e) => console.error("[rankingSystem] post like:", e.message)
    );
  }

  return jsonOk({ likes: result.likes, liked: result.liked });
}, "POST_LIKE");
