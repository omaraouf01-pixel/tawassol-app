import { NextResponse } from "next/server";
import { usersCol } from "@/lib/collections";
import { snapToObj } from "@/lib/firestore";

/**
 * POST /api/login
 *
 * Cherche un user par matricule et renvoie son email + statut/role
 * pour que le client puisse appeler signInWithEmailAndPassword.
 */
export async function POST(req) {
  try {
    const { matricule } = await req.json();

    if (!matricule || !matricule.trim()) {
      return NextResponse.json(
        { error: "Matricule requis." },
        { status: 400 }
      );
    }

    const snap = await usersCol()
      .where("matricule", "==", matricule.trim())
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: "Matricule introuvable." },
        { status: 404 }
      );
    }

    const user = snapToObj(snap.docs[0]);
    return NextResponse.json({
      email: user.email,
      role: user.role || "student",
      status: user.status || "pending",
      onboarded: user.onboarded || false,
    });
  } catch (error) {
    console.error("[LOGIN LOOKUP ERROR]", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la recherche." },
      { status: 500 }
    );
  }
}
