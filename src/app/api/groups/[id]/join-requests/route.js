import { groupsCol, joinRequestsCol, buildJoinRequestDoc } from "@/lib/collections";
import { listSnap, FieldValue } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

// GET /api/groups/[id]/join-requests — leader-only
export const GET = withAuth(async (_req, { params }, { uid }) => {
  const gSnap = await groupsCol().doc(params.id).get();
  if (!gSnap.exists) return jsonError("Group not found", 404);
  const group = gSnap.data();
  if (group.leaderId !== uid) return jsonError("Forbidden", 403);

  const reqsSnap = await joinRequestsCol()
    .where("groupId", "==", params.id)
    .where("status", "==", "pending")
    .get();

  const requests = reqsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return jsonOk({ requests });
}, "JOIN_REQ_LIST");

// POST /api/groups/[id]/join-requests
export const POST = withAuth(async (req, { params }, { uid, user }) => {
  const groupRef = groupsCol().doc(params.id);
  const gSnap = await groupRef.get();
  if (!gSnap.exists) return jsonError("Group not found", 404);
  const group = gSnap.data();
  if ((group.members || []).includes(uid)) return jsonError("Already a member", 409);
  if (!user) return jsonError("User not found", 404);

  // ── Open Access: bypass approval, join immediately ──
  if (group.accessType === "open") {
    if ((group.memberCount || 0) >= (group.maxMembers || 200)) {
      return jsonError("Node has reached its capacity", 409);
    }

    const newMember = { uid, name: user.fullName, role: "Scholar" };
    await groupRef.update({
      members: FieldValue.arrayUnion(uid),
      membersList: FieldValue.arrayUnion(newMember),
      memberCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return jsonOk({ status: "joined", accessType: "open" }, 201);
  }

  // ── Protected Access: standard pending request flow ──
  const existingReqs = await joinRequestsCol()
    .where("groupId", "==", params.id)
    .where("userId", "==", uid)
    .where("status", "==", "pending")
    .get();

  if (!existingReqs.empty) {
    return jsonError("Demande déjà en cours", 409);
  }

  const body = await safeJson(req);
  const answers = Array.isArray(body.answers) ? body.answers : [];

  const newReqRef = joinRequestsCol().doc();
  const newReq = buildJoinRequestDoc({
    groupId: params.id,
    groupName: group.name,
    userId: uid,
    userName: user.fullName,
    matricule: user.matricule || "",
    answers,
  });

  await newReqRef.set(newReq);

  return jsonOk({ id: newReqRef.id, status: "pending", accessType: "protected" }, 201);
}, "JOIN_REQ_CREATE");
