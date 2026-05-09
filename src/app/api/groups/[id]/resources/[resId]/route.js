import { groupsCol, resourcesCol } from "@/lib/collections";
import { withAuth, jsonOk, jsonError } from "@/lib/withAuth";

async function leaderGuard(uid, params) {
  const gSnap = await groupsCol().doc(params.id).get();
  if (!gSnap.exists) return { error: "Group not found", status: 404 };
  if (gSnap.data().leaderId !== uid) return { error: "Forbidden — leader only", status: 403 };
  return {};
}

// PATCH /api/groups/[id]/resources/[resId]
export const PATCH = withAuth(async (_req, { params }, { uid }) => {
  const guard = await leaderGuard(uid, params);
  if (guard.error) return jsonError(guard.error, guard.status);

  const ref = resourcesCol().doc(params.resId);
  const snap = await ref.get();
  if (!snap.exists || snap.data().groupId !== params.id) return jsonError("Resource not found", 404);

  await ref.update({ status: "approved" });
  return jsonOk();
}, "RESOURCE_PATCH");

// DELETE /api/groups/[id]/resources/[resId]
export const DELETE = withAuth(async (_req, { params }, { uid }) => {
  const guard = await leaderGuard(uid, params);
  if (guard.error) return jsonError(guard.error, guard.status);

  const ref = resourcesCol().doc(params.resId);
  const snap = await ref.get();
  if (snap.exists && snap.data().groupId === params.id) await ref.delete();
  return jsonOk();
}, "RESOURCE_DELETE");
