import { groupsCol } from "@/lib/collections";
import { FieldValue } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

// PATCH /api/groups/[id]/members/[uid]/role
// Body: { action: "promote" | "demote" }
// الصلاحية: القائد الأساسي فقط يمكنه تعيين/إزالة المشرفين المساعدين
export const PATCH = withAuth(async (req, { params }, { uid }) => {
  const ref = groupsCol().doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("Group not found", 404);
  const group = snap.data();

  // فقط القائد الأساسي يملك هذه الصلاحية
  if (group.leaderId !== uid) {
    return jsonError("Forbidden — primary leader only", 403);
  }

  const targetUid = params.uid;

  // لا يمكن تغيير دور القائد نفسه
  if (targetUid === uid) {
    return jsonError("Cannot change your own role");
  }

  // التأكد أن الهدف عضو في المجموعة
  if (!(group.members || []).includes(targetUid)) {
    return jsonError("User is not a member of this group", 404);
  }

  const body = await safeJson(req);
  const { action } = body;

  if (!["promote", "demote"].includes(action)) {
    return jsonError("Invalid action — use 'promote' or 'demote'");
  }

  const coLeaderIds = group.coLeaderIds || [];

  if (action === "promote") {
    if (coLeaderIds.includes(targetUid)) {
      return jsonError("Member is already a co-leader");
    }

    // تحديث coLeaderIds ومصفوفة membersList معاً
    const updatedMembersList = (group.membersList || []).map((m) =>
      m.uid === targetUid ? { ...m, role: "Co-leader" } : m
    );

    await ref.update({
      coLeaderIds: FieldValue.arrayUnion(targetUid),
      membersList: updatedMembersList,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return jsonOk({ action: "promoted", uid: targetUid });
  }

  // action === "demote"
  if (!coLeaderIds.includes(targetUid)) {
    return jsonError("Member is not a co-leader");
  }

  const updatedMembersList = (group.membersList || []).map((m) =>
    m.uid === targetUid ? { ...m, role: "Scholar" } : m
  );

  await ref.update({
    coLeaderIds: FieldValue.arrayRemove(targetUid),
    membersList: updatedMembersList,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return jsonOk({ action: "demoted", uid: targetUid });
}, "MEMBER_ROLE");
