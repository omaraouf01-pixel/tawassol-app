import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { usersCol, buildUserDoc } from "@/lib/collections";
import { adminAuth } from "@/lib/firestore";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/register
 *
 * ⚡ Inscription 100% côté serveur — ne touche PAS à la session du navigateur.
 *
 * Avantage : un admin peut créer plusieurs comptes étudiants depuis SON PROPRE
 * navigateur sans être déconnecté (contrairement à createUserWithEmailAndPassword
 * qui se connecte automatiquement avec le nouveau compte).
 *
 * Étapes :
 *   1. Validation des champs + fichier
 *   2. Vérification d'unicité (matricule, email)
 *   3. Upload de la carte d'étudiant sur Cloudinary
 *   4. Création silencieuse du compte Firebase Auth (admin.auth().createUser)
 *   5. Création du document user dans Firestore (doc ID = uid Firebase)
 *
 * Le client envoie un FormData (pas de token nécessaire — endpoint public).
 */
export async function POST(req) {
  let createdUid = null; // pour rollback en cas d'erreur

  try {
    const formData = await req.formData();

    const matricule = (formData.get("matricule") || "").toString().trim();
    const fullName = (formData.get("fullName") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim().toLowerCase();
    const password = (formData.get("password") || "").toString();
    const studentCard = formData.get("studentCard");

    // ── 1. Validation ──
    if (!matricule || !fullName || !email || !password) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (matricule, fullName, email, password)." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }
    if (!studentCard || typeof studentCard === "string") {
      return NextResponse.json(
        { error: "Carte d'étudiant manquante." },
        { status: 400 }
      );
    }
    if (studentCard.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10 MB)." },
        { status: 413 }
      );
    }

    // ── 2. Vérifier l'unicité (matricule, email dans Firestore) ──
    const col = usersCol();
    const [existsMatricule, existsEmail] = await Promise.all([
      col.where("matricule", "==", matricule).limit(1).get(),
      col.where("email", "==", email).limit(1).get(),
    ]);
    if (!existsMatricule.empty) {
      return NextResponse.json({ error: "Ce matricule est déjà utilisé." }, { status: 409 });
    }
    if (!existsEmail.empty) {
      return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
    }

    // ── 3. Upload Cloudinary ──
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

    // ── 4. Création silencieuse du compte Firebase Auth ──
    //    Ceci se passe entièrement sur le serveur → la session du navigateur
    //    actuel (admin) n'est PAS modifiée.
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false,
      disabled: false,
    });
    createdUid = userRecord.uid;

    // ── 5. Création du user document dans Firestore (doc ID = uid) ──
    await col.doc(createdUid).set(
      buildUserDoc({
        uid: createdUid,
        fullName,
        matricule,
        email,
        studentCardUrl,
        role: "student",
        status: "pending",
        groups: [],
        onboarded: false,
      })
    );

    return NextResponse.json({
      ok: true,
      uid: createdUid,
      message: "Inscription enregistrée. En attente de validation par un administrateur.",
      studentCardUrl,
    }, { status: 201 });

  } catch (error) {
    console.error("[REGISTER API ERROR]", error);

    // Rollback : si Auth créé mais Firestore échoué → supprimer le compte Auth
    if (createdUid) {
      try {
        await adminAuth.deleteUser(createdUid);
        console.log("[REGISTER] Rollback Auth user", createdUid);
      } catch (e) {
        console.error("[REGISTER] Rollback failed", e);
      }
    }

    // Mapping des erreurs Firebase Auth
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 409 });
    }
    if (error.code === "auth/invalid-email") {
      return NextResponse.json({ error: "Format d'email invalide." }, { status: 400 });
    }
    if (error.code === "auth/invalid-password") {
      return NextResponse.json({ error: "Mot de passe trop faible (min 6 caractères)." }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message || "Erreur serveur lors de l'inscription." },
      { status: 500 }
    );
  }
}
