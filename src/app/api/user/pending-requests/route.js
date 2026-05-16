import { joinRequestsCol } from "@/lib/collections";
import { withAuth, jsonOk } from "@/lib/withAuth";

// GET /api/user/pending-requests
// يرجع قائمة بمعرفات المجموعات التي للمستخدم الحالي طلب انضمام معلق فيها.
export const GET = withAuth(async (_req, _ctx, { uid }) => {
  const snap = await joinRequestsCol()
    .where("userId", "==", uid)
    .where("status", "==", "pending")
    .get();

  const groupIds = snap.docs.map((d) => d.data().groupId).filter(Boolean);
  return jsonOk({ groupIds });
}, "USER_PENDING_REQS");
