import { groupsCol, resourcesCol } from "@/lib/collections";
import { withAuth, jsonOk, jsonError } from "@/lib/withAuth";

export const GET = withAuth(async (req, _ctx, { uid }) => {
  try {
    const [groupsSnap, resourcesSnap] = await Promise.all([
      groupsCol().where("members", "array-contains", uid).count().get(),
      resourcesCol().where("uploadedBy", "==", uid).count().get(),
    ]);

    return jsonOk({
      groupsCount: groupsSnap.data().count,
      resourcesCount: resourcesSnap.data().count,
    });
  } catch (e) {
    console.error("profile/stats error:", e);
    return jsonError("فشل جلب الإحصائيات", 500);
  }
});
