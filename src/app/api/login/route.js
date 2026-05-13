import { NextResponse } from "next/server";
import { usersCol } from "@/lib/collections";
import { snapToObj, admin } from "@/lib/firestore";

/**
 * POST /api/login
 *
 * Resolves a Universal Identifier (email or matricule) to Firebase Auth details.
 * Implements a User-Doc-First approach to eliminate format guessing.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    
    // 1. Server-Side Input Sanitization
    // Trim and lowerCase immediately at the very first line to ensure consistent DB matching
    const identifier = (body.matricule || "").trim().toLowerCase();

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Login identifier required." },
        { status: 400 }
      );
    }

    // 2. Modern Firestore Query
    // Single efficient query using Filter.or
    const Filter = admin.firestore.Filter;
    const snap = await usersCol()
      .where(
        Filter.or(
          Filter.where("email", "==", identifier),
          Filter.where("matricule", "==", identifier)
        )
      )
      .limit(1)
      .get();

    // 3. Role-Based Extraction
    if (snap.empty) {
      return NextResponse.json(
        { success: false, message: "User not registered." },
        { status: 404 }
      );
    }

    const userRef = snap.docs[0].ref;
    const user = snapToObj(snap.docs[0]);
    const role = user.role || "student";
    let status = user.status || "pending";
    let onboarded = user.onboarded || false;

    // 4. Admin Bypass & Security Guarded Patching
    if (role === "admin") {
      // Explicit Block for Banned/Suspended Admins
      if (status === "banned" || status === "suspended") {
        return NextResponse.json(
          { success: false, message: "Account Suspended." },
          { status: 403 }
        );
      }

      onboarded = true; // Atomic Session Update

      // Conditional Self-Healing: ONLY if pending, null, or empty
      const isPendingState = status === "pending" || !status || status === "";
      if (user.onboarded === false || isPendingState) {
        status = "approved";
        // Logic Guard: Never patch if banned (early exit handled above)
        await userRef.update({ onboarded: true, status: "approved" }).catch(console.error);
      }
    } else if (status === "pending") {
      return NextResponse.json(
        { success: false, message: "Your account is pending admin approval. Please check back later." },
        { status: 403 }
      );
    } else if (status === "rejected" || status === "banned" || status === "suspended") {
      return NextResponse.json(
        { success: false, message: "Unauthorized Access. Account rejected or suspended." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User found.",
      user: {
        email: user.email,
        role: role,
        status: status,
        onboarded: onboarded,
      }
    });
  } catch (error) {
    console.error("[LOGIN LOOKUP ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Server error during lookup." },
      { status: 500 }
    );
  }
}
