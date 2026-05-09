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

  const pending = group.pendingRequests || [];
  const reqDoc = pending.find(r => r.id === params.reqId);
  if (!reqDoc) return jsonError("Request not found", 404);

  if (action === "approve") {
    const members = group.members || [];
    if (members.length >= group.maxMembers) {
      return jsonError("Groupe complet", 400);
    }
    
    await groupRef.update({
      pendingRequests: FieldValue.arrayRemove(reqDoc),
      members: FieldValue.arrayUnion(reqDoc.userId),
      membersList: FieldValue.arrayUnion({ uid: reqDoc.userId, name: reqDoc.userName, role: "Membre" }),
      memberCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    // Reject: just remove from pending
    await groupRef.update({
      pendingRequests: FieldValue.arrayRemove(reqDoc)
    });
  }

  return jsonOk();
}, "JOIN_REQ_DECISION");
