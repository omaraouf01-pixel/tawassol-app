import { notificationsCol } from "@/lib/collections";
import { withAuth, jsonOk, jsonError } from "@/lib/withAuth";

// PATCH /api/notifications/[id] — mark single as read
export const PATCH = withAuth(async (_req, { params }, { uid }) => {
  const ref = notificationsCol().doc(params.id);
  const snap = await ref.get();
  if (!snap.exists || snap.data().userId !== uid) return jsonError("Not found", 404);
  await ref.update({ read: true });
  return jsonOk();
}, "NOTIF_MARK_ONE");
