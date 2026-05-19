import { groupsCol, messagesCol } from "@/lib/collections";
import { FieldValue } from "@/lib/firebaseAdmin";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

/**
 * POST /api/groups/[id]/messages/[msgId]/react
 * Body: { emoji: string } — toggles the reaction (add if absent, remove if present)
 * Any group member can react.
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
  const emoji = body?.emoji;
  if (!ALLOWED_EMOJIS.includes(emoji)) return jsonError("Invalid emoji", 400);

  // reactions stored as: { "👍": ["uid1", "uid2"], "❤️": ["uid3"] }
  const reactions = mSnap.data().reactions || {};
  const current = reactions[emoji] || [];
  const alreadyReacted = current.includes(uid);

  const updateKey = `reactions.${emoji}`;
  await mSnap.ref.update({
    [updateKey]: alreadyReacted
      ? FieldValue.arrayRemove(uid)
      : FieldValue.arrayUnion(uid),
  });

  return jsonOk({ ok: true, added: !alreadyReacted });
}, "MSG_REACT");
