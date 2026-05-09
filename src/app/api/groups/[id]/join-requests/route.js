import { groupsCol, joinRequestsCol, buildJoinRequestDoc } from "@/lib/collections";
import { listSnap, FieldValue } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

// GET /api/groups/[id]/join-requests — leader-only
export const GET = withAuth(async (_req, { params }, { uid }) => {
  const gSnap = await groupsCol().doc(params.id).get();
  if (!gSnap.exists) return jsonError("Group not found", 404);
  const group = gSnap.data();
  if (group.leaderId !== uid) return jsonError("Forbidden", 403);

  return jsonOk({ requests: group.pendingRequests || [] });
}, "JOIN_REQ_LIST");

// POST /api/groups/[id]/join-requests
export const POST = withAuth(async (req, { params }, { uid, user }) => {
  const groupRef = groupsCol().doc(params.id);
  const gSnap = await groupRef.get();
  if (!gSnap.exists) return jsonError("Group not found", 404);
  const group = gSnap.data();
  if ((group.members || []).includes(uid)) return jsonError("Already a member", 409);
  if (!user) return jsonError("User not found", 404);

  const pending = group.pendingRequests || [];
  if (pending.some(r => r.userId === uid)) {
    return jsonError("Demande déjà en cours", 409);
  }

  const body = await safeJson(req);
  const answers = Array.isArray(body.answers) ? body.answers : [];

  const newReq = {
    id: `req_${Date.now()}_${uid}`,
    userId: uid,
    userName: user.fullName,
    matricule: user.matricule || "",
    answers,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await groupRef.update({
    pendingRequests: FieldValue.arrayUnion(newReq)
  });

  return jsonOk({ id: newReq.id, status: "pending" }, 201);
}, "JOIN_REQ_CREATE");
