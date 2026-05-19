import { reportsCol } from "@/lib/collections";
import { FieldValue } from "@/lib/firebaseAdmin";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";
import { updateUserPoints } from "@/lib/rankingSystem";

const VALID_STATUSES = ["dismissed", "resolved"];

/**
 * PATCH /api/admin/reports/[reportId]
 * Body: { status: "dismissed" | "resolved" }
 * Admin only — update a report's status.
 */
export const PATCH = withAuth(async (req, { params }, { user }) => {
  if (user.role !== "admin") return jsonError("Admin only", 403);

  const { reportId } = params;

  const snap = await reportsCol().doc(reportId).get();
  if (!snap.exists) return jsonError("Report not found", 404);

  const body = await safeJson(req);
  const status = VALID_STATUSES.includes(body?.status) ? body.status : null;
  if (!status) return jsonError("Invalid status", 400);

  const report = snap.data();
  await reportsCol().doc(reportId).update({
    status,
    reviewedAt: FieldValue.serverTimestamp(),
  });

  // ── نقاط المساهمة: -30 للمُبلَّغ عنه عند إغلاق الإبلاغ كـ "resolved" ─
  if (status === "resolved" && report.targetUserId) {
    updateUserPoints(report.targetUserId, -30).catch(
      (e) => console.error("[rankingSystem] report resolved:", e.message)
    );
  }

  return jsonOk({ ok: true });
}, "ADMIN_REPORT_UPDATE");
