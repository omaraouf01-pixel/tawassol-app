import { groupsCol, joinRequestsCol } from "@/lib/collections";
import { db, FieldValue } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

// PATCH /api/groups/[id]/join-requests/[reqId] — body: { action: "approve"|"reject" }
export const PATCH = withAuth(async (req, { params }, { uid }) => {
  const { action } = await safeJson(req);
  if (!["approve", "reject"].includes(action)) return jsonError("Invalid action");

  const groupRef = groupsCol().doc(params.id);
  const gSnap = await groupRef.get();
  if (!gSnap.exists) return jsonError("Group not found", 404);
  const group = gSnap.data();
  if (group.leaderId !== uid) return jsonError("Forbidden — leader only", 403);

  const reqRef = joinRequestsCol().doc(params.reqId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) return jsonError("Request not found", 404);
  
  const reqData = reqSnap.data();
  if (reqData.groupId !== params.id) return jsonError("Bad Request", 400);

  if (action === "approve") {
    const members = group.members || [];
    if (members.length >= group.maxMembers) {
      return jsonError("Groupe complet", 400);
    }
    
    await groupRef.update({
      members: FieldValue.arrayUnion(reqData.userId),
      membersList: FieldValue.arrayUnion({ uid: reqData.userId, name: reqData.userName, role: "Membre" }),
      memberCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    await reqRef.update({ status: "approved" });
  } else {
    // Reject: update status
    await reqRef.update({ status: "rejected" });
  }

  return jsonOk();
}, "JOIN_REQ_DECISION");
