import { groupsCol, resourcesCol } from "@/lib/collections";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";
import { notifyUser } from "@/lib/serverNotify";

async function leaderGuard(uid, params) {
  const gSnap = await groupsCol().doc(params.id).get();
  if (!gSnap.exists) return { error: "Group not found", status: 404 };
  if (gSnap.data().leaderId !== uid) return { error: "Forbidden — leader only", status: 403 };
  return {};
}

// PATCH /api/groups/[id]/resources/[resId]
// Body (optional): { action: "approve" | "reject" } — defaults to approve.
export const PATCH = withAuth(async (req, { params }, { uid }) => {
  const guard = await leaderGuard(uid, params);
  if (guard.error) return jsonError(guard.error, guard.status);

  const body = await safeJson(req).catch(() => ({}));
  const action = body?.action === "reject" ? "reject" : "approve";

  const ref = resourcesCol().doc(params.resId);
  const snap = await ref.get();
  if (!snap.exists || snap.data().groupId !== params.id) return jsonError("Resource not found", 404);

  const resource = snap.data();
  const nextStatus = action === "approve" ? "approved" : "rejected";
  await ref.update({ status: nextStatus });

  // File Updates — notify the uploader.
  if (resource.uid && resource.uid !== uid) {
    if (action === "approve") {
      notifyUser({
        userId: resource.uid,
        type: "file_update",
        title: "Good news! Your file was accepted.",
        body: `"${resource.name}" is now visible to the node.`,
        link: `/hub/chat/${params.id}`,
      });
    } else {
      notifyUser({
        userId: resource.uid,
        type: "file_update",
        title: "Update: Your file was not accepted.",
        body: `"${resource.name}" did not pass the check. Please try again.`,
        link: `/hub/chat/${params.id}`,
      });
    }
  }

  return jsonOk({ status: nextStatus });
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
