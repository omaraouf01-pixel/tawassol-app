import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/collectionNames";
import { getRank } from "@/lib/rankingSystem";
import { verifyAdmin } from "@/lib/verifyAdmin";

// POST /api/admin/backfill-points
// One-time migration: calculates contribution points for all existing users
// based on their historical activity and writes points + rank to each user doc.
export async function POST(request) {
  const auth = await verifyAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 403 });
  }

  try {
    // 1. Load all data in parallel
    const [usersSnap, postsSnap, groupsSnap, resourcesSnap] = await Promise.all([
      adminDb.collection(COL.USERS).get(),
      adminDb.collection(COL.POSTS).get(),
      adminDb.collection(COL.GROUPS).get(),
      adminDb.collection(COL.RESOURCES).where("status", "==", "approved").get(),
    ]);

    // 2. Build lookup maps keyed by uid
    // points[uid] = running total
    const points = {};

    const ensureUser = (uid) => {
      if (points[uid] === undefined) points[uid] = 0;
    };

    // Seed every known user at 0 so users with no activity are still updated
    usersSnap.docs.forEach((d) => ensureUser(d.id));

    // Posts: +5 per post + +2 per like received + +3 per comment received
    postsSnap.docs.forEach((d) => {
      const { authorId, likes = 0, commentsCount = 0 } = d.data();
      if (!authorId) return;
      ensureUser(authorId);
      points[authorId] += 5 + likes * 2 + commentsCount * 3;
    });

    // Groups created (leaderId): +15 per group
    groupsSnap.docs.forEach((d) => {
      const { leaderId } = d.data();
      if (!leaderId) return;
      ensureUser(leaderId);
      points[leaderId] += 15;
    });

    // Approved resources: +20 per resource
    resourcesSnap.docs.forEach((d) => {
      const { uid } = d.data();
      if (!uid) return;
      ensureUser(uid);
      points[uid] += 20;
    });

    // 3. Batch-write all updates (Firestore limit: 500 writes per batch)
    const uids = Object.keys(points);
    const BATCH_SIZE = 400;
    let batchCount = 0;

    for (let i = 0; i < uids.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      uids.slice(i, i + BATCH_SIZE).forEach((uid) => {
        const p = Math.max(0, points[uid]);
        const rank = getRank(p);
        batch.update(adminDb.collection(COL.USERS).doc(uid), { points: p, rank });
      });
      await batch.commit();
      batchCount++;
    }

    // 4. Build a summary for the response
    const rankCounts = { "مُبادِر": 0, "مُساهِم": 0, "باحِث": 0, "مَرجِع": 0 };
    Object.values(points).forEach((p) => {
      const r = getRank(Math.max(0, p));
      rankCounts[r] = (rankCounts[r] ?? 0) + 1;
    });

    return NextResponse.json({
      ok: true,
      usersUpdated: uids.length,
      batchesCommitted: batchCount,
      rankBreakdown: rankCounts,
    });
  } catch (err) {
    console.error("[backfill-points]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
