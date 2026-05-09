import { postsCol } from "@/lib/collections";
import { withAuth, jsonOk, jsonError } from "@/lib/withAuth";

// DELETE /api/posts/[id] — auteur ou admin
export const DELETE = withAuth(async (_req, { params }, { uid, user }) => {
  const ref = postsCol().doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("Post not found", 404);

  const post = snap.data();
  const isAdmin = user?.role === "admin";
  if (post.uid !== uid && !isAdmin) return jsonError("Forbidden", 403);

  await ref.delete();
  return jsonOk();
}, "POST_DELETE");
