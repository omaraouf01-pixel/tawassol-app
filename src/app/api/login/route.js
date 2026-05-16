import { NextResponse } from "next/server";
import { db, snapToObj } from "@/lib/firebaseAdmin";

/**
 * POST /api/login
 * يبحث عن المستخدم بالرقم الجامعي (أو البريد) ويرجع البريد المرتبط بالحساب
 * لاستخدامه في signInWithEmailAndPassword من جهة العميل.
 *
 * ملاحظة: يستخدم Firebase Admin SDK مباشرة لتجاوز قواعد Firestore (rules)،
 * لأن الزائر غير مسجل دخول بعد وقت البحث.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const identifier = (body.matricule || body.email || "").toString().trim().toLowerCase();

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Academic identifier is required." },
        { status: 400 }
      );
    }

    const usersRef = db.collection("users");

    // ابحث بالرقم الجامعي أولاً
    let snap = await usersRef.where("matricule", "==", identifier).limit(1).get();

    // إن لم نجد، ابحث بالبريد الإلكتروني
    if (snap.empty) {
      snap = await usersRef.where("email", "==", identifier).limit(1).get();
    }

    // مطابقة إضافية للحالات التي خُزّن فيها الرقم الجامعي بحالة الأحرف الأصلية
    if (snap.empty) {
      snap = await usersRef.where("matricule", "==", body.matricule || "").limit(1).get();
    }

    if (snap.empty) {
      return NextResponse.json(
        { success: false, message: "No academic account found with this credential." },
        { status: 404 }
      );
    }

    const user = snapToObj(snap.docs[0]);

    return NextResponse.json({
      success: true,
      user: {
        uid: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        onboarded: user.onboarded || false,
      },
    });
  } catch (error) {
    console.error("[Login API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error during lookup",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
