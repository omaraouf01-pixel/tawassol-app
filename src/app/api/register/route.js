import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { db, adminAuth } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/register
 *
 * تسجيل المستخدم 100% من جهة السيرفر باستخدام Firebase Admin SDK.
 * 1. تحقق من الحقول والملف
 * 2. تحقق من تفرّد (matricule, email)
 * 3. رفع بطاقة الطالب إلى Cloudinary
 * 4. إنشاء حساب Firebase Auth (admin)
 * 5. إنشاء مستند المستخدم في Firestore
 */
export async function POST(req) {
  let createdUid = null; // للـ rollback عند الفشل

  try {
    const formData = await req.formData();

    const matricule = (formData.get("matricule") || "").toString().trim();
    const fullName = (formData.get("fullName") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim().toLowerCase();
    const password = (formData.get("password") || "").toString();
    const studentCard = formData.get("studentCard");

    // ── 1. التحقق من الحقول ──
    if (!matricule || !fullName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields (matricule, fullName, email, password)." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }
    if (!studentCard || typeof studentCard === "string") {
      return NextResponse.json(
        { error: "Student ID card is required." },
        { status: 400 }
      );
    }
    if (studentCard.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 10 MB)." },
        { status: 413 }
      );
    }

    // ── 2. تحقق التفرّد عبر Admin SDK ──
    const usersRef = db.collection("users");
    const matriculeLower = matricule.toLowerCase();

    const [existsMatricule, existsEmail] = await Promise.all([
      usersRef.where("matricule", "==", matriculeLower).limit(1).get(),
      usersRef.where("email", "==", email).limit(1).get(),
    ]);

    if (!existsMatricule.empty) {
      return NextResponse.json({ error: "This matricule is already in use." }, { status: 409 });
    }
    if (!existsEmail.empty) {
      return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
    }

    // ── 3. رفع البطاقة إلى Cloudinary ──
    const bytes = await studentCard.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "tawassol/idCards", resource_type: "auto" },
          (error, result) => (error ? reject(error) : resolve(result))
        )
        .end(buffer);
    });
    const studentCardUrl = uploadResult.secure_url;

    // ── 4. إنشاء حساب Firebase Auth بصمت من السيرفر ──
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false,
      disabled: false,
    });
    createdUid = userRecord.uid;

    // ── 5. إنشاء مستند المستخدم في Firestore (Admin SDK + FieldValue الإداري) ──
    const FieldValue = admin.firestore.FieldValue;
    await usersRef.doc(createdUid).set({
      uid: createdUid,
      email,
      fullName,
      matricule: matriculeLower, // نخزّنه بحالة موحّدة لضمان دقة البحث لاحقاً
      studentCardUrl,
      role: "student",
      status: "pending",
      groups: [],
      onboarded: false,
      university: "University of Oran 1",
      department: null,
      major: null,
      bio: "",
      avatarUrl: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        ok: true,
        uid: createdUid,
        message: "Registration recorded. Awaiting admin approval.",
        studentCardUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER API ERROR]", error);

    // Rollback في حال إنشاء Auth ثم فشل Firestore
    if (createdUid) {
      try {
        await adminAuth.deleteUser(createdUid);
        console.log("[REGISTER] Rollback Auth user", createdUid);
      } catch (e) {
        console.error("[REGISTER] Rollback failed", e);
      }
    }

    if (error.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
    }
    if (error.code === "auth/invalid-email") {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }
    if (error.code === "auth/invalid-password") {
      return NextResponse.json({ error: "Password too weak (min 6 chars)." }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || "Server error during registration." },
      { status: 500 }
    );
  }
}
