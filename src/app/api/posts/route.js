import { postsCol, buildPostDoc } from "@/lib/collections";
import { snapToObj, listSnap } from "@/lib/firestore";
import { withAuth, withPublic, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

// GET /api/posts?limit=50
export const GET = withPublic(async (req) => {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
  const snap = await postsCol().orderBy("createdAt", "desc").limit(limit).get();
  return jsonOk({ posts: listSnap(snap) });
}, "POSTS_LIST");

// POST /api/posts
export const POST = withAuth(async (req, _ctx, { uid, user }) => {
  const body = await safeJson(req);
  const text = (body.text || "").trim();
  const tag = body.tag || "General";
  if (!text) return jsonError("Texte requis");
  if (text.length > 2000) return jsonError("Texte trop long (max 2000)");
  if (!user) return jsonError("User not found", 404);

  const ref = await postsCol().add(
    buildPostDoc({
      uid,
      authorName: user.fullName,
      major: user.department || "",
      text,
      tag,
    })
  );
  const fresh = await ref.get();
  return jsonOk(snapToObj(fresh), 201);
}, "POSTS_CREATE");
