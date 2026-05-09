import { groupsCol } from "@/lib/collections";
import { FieldValue } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError } from "@/lib/withAuth";

// DELETE /api/groups/[id]/members/[uid] — leader kick
export const DELETE = withAuth(async (_req, { params }, { uid }) => {
  const ref = groupsCol().doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("Group not found", 404);
  const group = snap.data();

  if (group.leaderId !== uid) return jsonError("Forbidden — leader only", 403);
  if (params.uid === group.leaderId) return jsonError("Cannot remove the leader");

  const newMembers = (group.members || []).filter((m) => m !== params.uid);
  const newMembersList = (group.membersList || []).filter((m) => m.uid !== params.uid);

  await ref.update({
    members: newMembers,
    membersList: newMembersList,
    memberCount: newMembers.length,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return jsonOk();
}, "MEMBER_KICK");
