import { usersCol } from "@/lib/collections";
import { FieldValue, snapToObj } from "@/lib/firestore";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

import { NextResponse } from "next/server";

/**
 * Recursively trims all string values within an object or array.
 */
function sanitizePayload(obj) {
  if (typeof obj === "string") return obj.trim();
  if (Array.isArray(obj)) return obj.map(sanitizePayload);
  if (obj !== null && typeof obj === "object") {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizePayload(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
}

/**
 * POST /api/user/setup
 * 
 * Finalizes the onboarding process.
 * Applies RBAC schema validation:
 * - Admins can bypass university and department.
 * - Students must provide them.
 */
export const POST = withAuth(async (req, _ctx, { uid }) => {
  const rawBody = await safeJson(req);
  
  // 1. Universal Data Sanitization (Recursive)
  const body = sanitizePayload(rawBody);

  const university = body.university || null;
  const department = body.department || null;
  const bio = body.bio || "";
  const avatarUrl = body.avatarUrl || null;

  // 2. Fetch the User Document securely by UID
  const directRef = usersCol().doc(uid);
  const direct = await directRef.get();

  let ref;
  let userRole = "student";
  
  if (direct.exists) {
    ref = directRef;
    userRole = direct.data().role || "student";
  } else {
    const snap = await usersCol().where("uid", "==", uid).limit(1).get();
    if (snap.empty) {
      return NextResponse.json(
        { success: false, message: "User Record Incomplete." },
        { status: 404 }
      );
    }
    ref = snap.docs[0].ref;
    userRole = snap.docs[0].data().role || "student";
  }

  // 3. Flexible Schema & RBAC Validation
  const isAdmin = userRole === "admin";

  if (!isAdmin) {
    if (!university) return NextResponse.json({ success: false, message: "University is required." }, { status: 400 });
    if (!department) return NextResponse.json({ success: false, message: "Department is required." }, { status: 400 });
  }

  if (bio.length > 500) {
    return NextResponse.json({ success: false, message: "Bio is too long (max 500 characters)." }, { status: 400 });
  }

  // 4. Update Document
  // For admins, bypass strict schema by using N/A and force approved status
  const updates = {
    bio,
    onboarded: true,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (isAdmin) {
    updates.status = "approved";
    updates.university = university || "N/A";
    updates.department = department || "N/A";
  } else {
    if (university) updates.university = university;
    if (department) updates.department = department;
  }

  if (avatarUrl) updates.avatarUrl = avatarUrl;

  await ref.update(updates);

  // 5. Verification Check
  const fresh = await ref.get();
  const user = snapToObj(fresh);

  if (!user.onboarded) {
    return NextResponse.json(
      { success: false, message: "Update failed. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Setup completed successfully.",
    user: {
      uid: user.uid,
      fullName: user.fullName,
      university: user.university || null,
      department: user.department || null,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      onboarded: user.onboarded,
    },
  });
}, "USER_SETUP");
