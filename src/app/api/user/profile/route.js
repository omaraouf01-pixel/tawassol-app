import { db, snapToObj } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";
import { withAuth, jsonOk, jsonError, safeJson } from "@/lib/withAuth";

const FieldValue = admin.firestore.FieldValue;
const usersCol = () => db.collection("users");

/** * ─── سيريلايزر (serialize) ───
 * تجهيز البيانات لتناسب واجهة المستخدم، مع ضمان دعم الرتب (Roles)
 */
function serialize(u) {
  if (!u) return null;
  return {
    uid: u.uid,
    fullName: u.fullName || u.name || "Scholar",
    email: u.email || "",
    matricule: u.matricule || "",
    role: u.role || "student",
    status: u.status || "pending",
    onboarded: !!u.onboarded,
    university: u.university || "",
    department: u.department || "",
    bio: u.bio || "",
    avatarUrl: u.avatarUrl || "",
    studentCardUrl: u.studentCardUrl || "",
    major: u.major || "",
    socialLinks: u.socialLinks && typeof u.socialLinks === "object" ? u.socialLinks : {},
    createdAt: u.createdAt,
  };
}

// تطهير وتنظيف روابط التواصل (https-only, length cap)
function sanitizeSocialLinks(input) {
  if (!input || typeof input !== "object") return null;
  const ALLOWED_KEYS = ["github", "linkedin", "portfolio"];
  const out = {};
  for (const key of ALLOWED_KEYS) {
    const raw = input[key];
    if (raw === "" || raw === null || raw === undefined) {
      out[key] = "";
      continue;
    }
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim().slice(0, 300);
    if (!trimmed) {
      out[key] = "";
      continue;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      const err = new Error(`Invalid URL for ${key}`);
      err.code = "INVALID_URL";
      throw err;
    }
    out[key] = trimmed;
  }
  return out;
}

/** * ─── GET /api/user/profile ───
 * جلب بيانات الحساب الحالي (سواء كان أدمن أو طالب)
 */
export const GET = withAuth(async (req, ctx, { uid, user }) => {
  // الحارس withAuth قام بالفعل بالتحقق من التوكن وجلب الـ user من Firestore
  if (!user) {
    return jsonError("User profile not found in database", 404);
  }

  return jsonOk(serialize({ uid: user.uid || uid, ...user }));
}, "PROFILE_GET");

/** * ─── PATCH /api/user/profile ───
 * تحديث البيانات الشخصية للمستخدم
 */
export const PATCH = withAuth(async (req, ctx, { uid }) => {
  const body = await safeJson(req);

  // الحقول المسموح بتعديلها من قبل المستخدم نفسه
  const ALLOWED = ["fullName", "bio", "avatarUrl", "university", "department", "major", "onboarded", "socialLinks"];

  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED.includes(k))
  );

  // تنظيف الروابط الاجتماعية
  if ("socialLinks" in updates) {
    try {
      updates.socialLinks = sanitizeSocialLinks(updates.socialLinks) || {};
    } catch (err) {
      if (err.code === "INVALID_URL") {
        return jsonError(err.message + " (must start with http:// or https://)", 400);
      }
      throw err;
    }
  }

  // تصحيح الاسم إذا تم إرساله بمفتاح مختلف
  if (body?.name && !updates.fullName) {
    updates.fullName = body.name;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("No valid fields provided for update", 400);
  }

  // قيود التحقق (Validation)
  if (updates.bio && updates.bio.length > 500) {
    return jsonError("Bio is too long (max 500 chars)", 400);
  }

  if (updates.fullName && updates.fullName.trim().length < 2) {
    return jsonError("Full name must be at least 2 characters", 400);
  }

  // إضافة وقت التحديث من السيرفر
  updates.updatedAt = FieldValue.serverTimestamp();

  try {
    const userRef = usersCol().doc(uid);
    const userDoc = await userRef.get();

    // التأكد من وجود المستند قبل التحديث
    if (!userDoc.exists) {
      // محاولة البحث بالـ UID في حال كان الـ Document ID مختلفاً
      const snap = await usersCol().where("uid", "==", uid).limit(1).get();
      if (snap.empty) return jsonError("Account record not found", 404);

      const ref = snap.docs[0].ref;
      await ref.update(updates);
      const fresh = await ref.get();
      return jsonOk(serialize(snapToObj(fresh)));
    }

    // التحديث المباشر باستخدام ID المستند
    await userRef.update(updates);
    const freshData = await userRef.get();

    return jsonOk(serialize(snapToObj(freshData)));

  } catch (error) {
    console.error("Profile API Update Error:", error);
    return jsonError("Internal server error during update", 500);
  }
}, "PROFILE_PATCH");