import { notificationsCol, buildNotificationDoc } from "@/lib/collections";
import { db, snapToObj, listSnap } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

// GET /api/notifications
export const GET = withAuth(async (_req, _ctx, { uid }) => {
  const snap = await notificationsCol()
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  return jsonOk({ notifications: listSnap(snap) });
}, "NOTIF_LIST");

// POST /api/notifications
export const POST = withAuth(async (req) => {
  const body = await safeJson(req);
  const { userId, title, link } = body;
  const notifBody = body.body || "";
  if (!userId || !title) return jsonError("Missing userId or title");

  const ref = await notificationsCol().add(
    buildNotificationDoc({ userId, title, body: notifBody, link })
  );
  const fresh = await ref.get();
  return jsonOk(snapToObj(fresh), 201);
}, "NOTIF_CREATE");

// PATCH /api/notifications — mark all as read
export const PATCH = withAuth(async (_req, _ctx, { uid }) => {
  const snap = await notificationsCol()
    .where("userId", "==", uid)
    .where("read", "==", false)
    .get();

  if (snap.empty) return jsonOk();

  const batch = db.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
  return jsonOk();
}, "NOTIF_MARK_ALL");
