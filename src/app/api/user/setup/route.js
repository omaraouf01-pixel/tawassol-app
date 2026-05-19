import { usersCol, groupsCol } from "@/lib/collections";
import { adminDb, FieldValue, snapToObj } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";
import { NextResponse } from "next/server";

// ─── Helpers ────────────────────────────────────────────────────────────────

function sanitizePayload(obj) {
  if (typeof obj === "string") return obj.trim();
  if (Array.isArray(obj)) return obj.map(sanitizePayload);
  if (obj !== null && typeof obj === "object") {
    const out = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        out[key] = sanitizePayload(obj[key]);
      }
    }
    return out;
  }
  return obj;
}

/** Generates a stable, deterministic Firestore document ID for official groups. */
function slugify(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 40);
}

function officialGroupId(type, university, major = "", level = "") {
  if (type === "university") return `off_uni_${slugify(university)}`;
  if (type === "major")      return `off_maj_${slugify(university)}_${slugify(major)}`;
  return                            `off_yr_${slugify(university)}_${slugify(major)}_${level}`;
}

// ─── Official Community Auto-Join ────────────────────────────────────────────
/**
 * Called after onboarding. Creates the 3 official academic communities if they
 * don't exist yet (with the platform admin as leader), then adds the student
 * as a member in each one using a single Firestore transaction.
 *
 * Uses deterministic doc IDs so we can reference them directly inside the
 * transaction (queries are not allowed inside Admin SDK transactions).
 *
 * Wrapped in try/catch — a failure here must NOT break onboarding.
 */
async function autoJoinOfficialCommunities(uid, studentName, { university, major, level }) {
  try {
    // 1. Find the admin UID (query must run outside the transaction)
    const adminSnap = await usersCol().where("role", "==", "admin").limit(1).get();
    if (adminSnap.empty) {
      console.warn("[autoJoin] No admin account found — skipping official communities.");
      return;
    }
    const adminData = adminSnap.docs[0].data();
    const adminUid  = adminData.uid || adminSnap.docs[0].id;
    const adminName = adminData.fullName || "Admin";

    // 2. Define the 3 official communities
    const communities = [
      {
        id:           officialGroupId("university", university),
        officialType: "university",
        name:         university,
        subject:      "University Community",
        description:  `The official announcements channel for all students of ${university}.`,
        // University channel is read-only for students (announcements only)
        isReadOnly:   true,
        major:        null,
        level:        null,
      },
      {
        id:           officialGroupId("major", university, major),
        officialType: "major",
        name:         `${major}`,
        subject:      "Major Community",
        description:  `The official community for ${major} students at ${university}.`,
        isReadOnly:   false,
        major,
        level:        null,
      },
      {
        id:           officialGroupId("year", university, major, level),
        officialType: "year",
        name:         `${major} · ${level.toUpperCase()}`,
        subject:      "Year Community",
        description:  `The official community for ${major} students in year ${level} at ${university}.`,
        isReadOnly:   false,
        major,
        level,
      },
    ];

    // 3. Transaction: read all 3 doc refs, then create-or-update atomically
    await adminDb.runTransaction(async (tx) => {
      const refs  = communities.map((c) => groupsCol().doc(c.id));
      const snaps = await Promise.all(refs.map((r) => tx.get(r)));
      const now   = FieldValue.serverTimestamp();

      for (let i = 0; i < communities.length; i++) {
        const comm = communities[i];
        const ref  = refs[i];
        const snap = snaps[i];

        if (!snap.exists) {
          // First student in this community → create it with admin as leader
          tx.set(ref, {
            name:         comm.name,
            subject:      comm.subject,
            description:  comm.description,
            rules:        "",
            tags:         [],
            questions:    [],
            accessType:   "open",
            maxMembers:   1000,
            leaderId:     adminUid,
            leaderName:   adminName,
            coLeaderIds:  [],
            members:      [adminUid, uid],
            membersList:  [
              { uid: adminUid, name: adminName, role: "Leader" },
              { uid, name: studentName, role: "Member" },
            ],
            memberCount:  2,
            status:       "active",
            isPublic:     true,
            // Official community markers
            isOfficial:   true,
            officialType: comm.officialType,
            university,
            major:        comm.major,
            level:        comm.level,
            isReadOnly:   comm.isReadOnly,
            createdAt:    now,
            updatedAt:    now,
          });
        } else {
          // Community already exists → add student if not already a member
          const data = snap.data();
          if (!Array.isArray(data.members) || !data.members.includes(uid)) {
            tx.update(ref, {
              members:     FieldValue.arrayUnion(uid),
              memberCount: FieldValue.increment(1),
              updatedAt:   now,
            });
          }
        }
      }
    });

    console.log(`[autoJoin] Student ${uid} joined official communities for ${university} / ${major} / ${level}.`);
  } catch (err) {
    // Non-fatal: log and continue — onboarding must not fail because of this
    console.error("[autoJoin] Official community setup failed:", err.message);
  }
}

// ─── POST /api/user/setup ────────────────────────────────────────────────────
/**
 * Finalizes the onboarding process:
 *   1. Validates & saves academic profile (university, major, level, bio, avatar).
 *   2. Auto-joins the student to the 3 official academic communities.
 *
 * RBAC: admins bypass the strict field requirements.
 */
export const POST = withAuth(async (req, _ctx, { uid }) => {
  const rawBody = await safeJson(req);
  const body    = sanitizePayload(rawBody);

  const university = body.university || null;
  const major      = body.major      || body.department || null; // accept both field names
  const level      = body.level      || null;
  const bio        = body.bio        || "";
  const avatarUrl  = body.avatarUrl  || null;

  // ── 1. Fetch user doc ──
  const directRef = usersCol().doc(uid);
  const direct    = await directRef.get();

  let ref;
  let userRole     = "student";
  let studentName  = "";

  if (direct.exists) {
    ref         = directRef;
    userRole    = direct.data().role     || "student";
    studentName = direct.data().fullName || "";
  } else {
    const snap = await usersCol().where("uid", "==", uid).limit(1).get();
    if (snap.empty) {
      return NextResponse.json({ success: false, message: "User record not found." }, { status: 404 });
    }
    ref         = snap.docs[0].ref;
    userRole    = snap.docs[0].data().role     || "student";
    studentName = snap.docs[0].data().fullName || "";
  }

  const isAdmin = userRole === "admin";

  // ── 2. Validate required fields for students ──
  if (!isAdmin) {
    if (!university) return NextResponse.json({ success: false, message: "University is required." }, { status: 400 });
    if (!major)      return NextResponse.json({ success: false, message: "Major is required."      }, { status: 400 });
    if (!level)      return NextResponse.json({ success: false, message: "Level is required."      }, { status: 400 });
  }

  if (bio.length > 500) {
    return NextResponse.json({ success: false, message: "Bio exceeds 500 characters." }, { status: 400 });
  }

  // ── 3. Build update payload ──
  const updates = {
    bio,
    onboarded: true,
    status:    isAdmin ? "active" : "active",
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (isAdmin) {
    updates.university = university || "N/A";
    updates.major      = major      || "N/A";
    updates.level      = level      || "N/A";
  } else {
    updates.university = university;
    updates.major      = major;
    updates.level      = level;
    // Keep department in sync for backward compatibility
    updates.department = major;
  }

  if (avatarUrl) updates.avatarUrl = avatarUrl;

  // ── 4. Persist user update ──
  await ref.update(updates);

  // ── 5. Auto-join official communities (non-fatal) ──
  if (!isAdmin && university && major && level) {
    await autoJoinOfficialCommunities(uid, studentName, { university, major, level });
  }

  // ── 6. Verify & respond ──
  const fresh = await ref.get();
  const user  = snapToObj(fresh);

  if (!user.onboarded) {
    return NextResponse.json({ success: false, message: "Update failed. Please retry." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Setup completed successfully.",
    user: {
      uid:        user.uid,
      fullName:   user.fullName,
      university: user.university || null,
      major:      user.major      || null,
      level:      user.level      || null,
      bio:        user.bio,
      avatarUrl:  user.avatarUrl,
      onboarded:  user.onboarded,
    },
  });
}, "USER_SETUP");
