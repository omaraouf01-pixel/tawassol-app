import {
  groupsCol,
  messagesCol,
  resourcesCol,
  joinRequestsCol,
} from "@/lib/collections";
import { db, FieldValue, snapToObj } from "@/lib/firestore";
import { withAuth, withPublic, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

// GET /api/groups/[id]
export const GET = withPublic(async (_req, { params }) => {
  const snap = await groupsCol().doc(params.id).get();
  if (!snap.exists) return jsonError("Group not found", 404);
  const g = snapToObj(snap);
  return jsonOk({ ...g, id: snap.id });
}, "GROUP_GET");

// PATCH /api/groups/[id] — leader-only
export const PATCH = withAuth(async (req, { params }, { uid }) => {
  const ref = groupsCol().doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("Group not found", 404);
  const group = snap.data();
  if (group.leaderId !== uid) return jsonError("Forbidden — leader only", 403);

  const body = await safeJson(req);
  const ALLOWED = ["name", "subject", "description", "rules", "tags", "questions", "maxMembers"];
  const updates = {};
  for (const k of ALLOWED) if (body[k] !== undefined) updates[k] = body[k];

  if (Object.keys(updates).length === 0) return jsonError("No valid fields");
  updates.updatedAt = FieldValue.serverTimestamp();

  await ref.update(updates);
  return jsonOk();
}, "GROUP_PATCH");

// DELETE /api/groups/[id] — leader OR admin
export const DELETE = withAuth(async (_req, { params }, { uid, user }) => {
  const ref = groupsCol().doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return jsonError("Group not found", 404);
  const group = snap.data();

  const isLeader = group.leaderId === uid;
  const isAdmin = user?.role === "admin";
  if (!isLeader && !isAdmin) return jsonError("Forbidden", 403);

  const batch = db.batch();
  batch.delete(ref);

  const [msgs, ress, jrs] = await Promise.all([
    messagesCol().where("groupId", "==", params.id).get(),
    resourcesCol().where("groupId", "==", params.id).get(),
    joinRequestsCol().where("groupId", "==", params.id).get(),
  ]);
  msgs.docs.forEach((d) => batch.delete(d.ref));
  ress.docs.forEach((d) => batch.delete(d.ref));
  jrs.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
  return jsonOk();
}, "GROUP_DELETE");
