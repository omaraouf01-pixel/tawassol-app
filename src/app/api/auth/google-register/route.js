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
 * POST /api/auth/google-register
 *
 * يُستدعى بعد signInWithPopup(Google/GitHub/...) من العميل،
 * مع FormData يحتوي matricule + fullName + studentCard.
 * ينشئ مستند Firestore بحالة "pending" لينتظر موافقة الأدمن.
 */
export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const email = (decoded.email || "").toLowerCase();
    const avatarUrl = decoded.picture || null;
    const signInProvider = decoded.firebase?.sign_in_provider || "";
    const provider =
      signInProvider === "google.com" ? "google" :
      signInProvider === "github.com" ? "github" :
      signInProvider || "oauth";

    if (!email) {
      return NextResponse.json(
        { error: "Account has no email. Please make your email public in your provider settings." },
        { status: 400 }
      );
    }

    // ── قراءة FormData ──
    const formData = await req.formData();
    const matriculeRaw = (formData.get("matricule") || "").toString().trim();
    const fullName = (formData.get("fullName") || "").toString().trim();
    const studentCard = formData.get("studentCard");

    if (!matriculeRaw) {
      return NextResponse.json({ error: "Matricule is required." }, { status: 400 });
    }
    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: "Full name is required (min 2 chars)." }, { status: 400 });
    }
    if (!studentCard || typeof studentCard === "string") {
      return NextResponse.json({ error: "Student ID card is required." }, { status: 400 });
    }
    if (studentCard.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10 MB)." }, { status: 413 });
    }

    const matricule = matriculeRaw.toLowerCase();
    const usersRef = db.collection("users");
    const userRef = usersRef.doc(uid);

    // إذا كان المستند موجوداً، فهذا تسجيل دخول لا تسجيل جديد
    const existing = await userRef.get();
    if (existing.exists) {
      return NextResponse.json({ ok: true, created: false, status: existing.data().status }, { status: 200 });
    }

    // تحقق من تفرّد matricule والإيميل
    const [dupMatricule, dupEmail] = await Promise.all([
      usersRef.where("matricule", "==", matricule).limit(1).get(),
      usersRef.where("email", "==", email).limit(1).get(),
    ]);
    if (!dupMatricule.empty) {
      return NextResponse.json({ error: "This matricule is already in use." }, { status: 409 });
    }
    if (!dupEmail.empty) {
      return NextResponse.json({ error: "This email is already linked to another account." }, { status: 409 });
    }

    // رفع بطاقة الطالب إلى Cloudinary
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

    const FieldValue = admin.firestore.FieldValue;
    await userRef.set({
      uid,
      email,
      fullName,
      matricule,
      provider,
      studentCardUrl,
      role: "student",
      status: "pending",
      groups: [],
      onboarded: false,
      university: "University of Oran 1",
      department: null,
      major: null,
      bio: "",
      avatarUrl,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { ok: true, created: true, message: "Account registered. Awaiting admin approval." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[OAUTH-REGISTER API ERROR]", error);
    if (error.code === "auth/id-token-expired" || error.code === "auth/argument-error") {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Server error during registration." },
      { status: 500 }
    );
  }
}
