"use client";
import { useState } from "react";
import { api } from "./apiClient";

/**
 * ════════════════════════════════════════════════════════════════
 *  useFileUpload — bridge upload + send message
 * ════════════════════════════════════════════════════════════════
 *  Pipeline :
 *    1. Upload du fichier sur Cloudinary (via /api/upload)
 *    2. Récupération de l'URL sécurisée (HTTPS)
 *    3. Création d'un message dans Firestore avec fileUrl/imageUrl
 *
 *  ⚠️ Pourquoi Cloudinary et pas Firebase Storage ?
 *     - Cloudinary : 25GB gratuit, pas de carte bancaire
 *     - Firebase Storage : nécessite Blaze plan (carte bancaire)
 *     - Notre setup utilise déjà Cloudinary, on garde la cohérence
 *
 *  Usage :
 *    const { uploadAndSend, uploading, progress, error } = useFileUpload();
 *
 *    <input type="file" onChange={(e) => {
 *      uploadAndSend(e.target.files[0], { groupId, replyTo });
 *    }} />
 * ════════════════════════════════════════════════════════════════
 */

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Upload simple — renvoie { url, public_id } sans créer de message.
   * Utile pour l'avatar onboarding par exemple.
   */
  const upload = async (file, folder = "tawassol/files") => {
    if (!file) throw new Error("Fichier manquant");
    if (file.size > MAX_SIZE) throw new Error("Fichier trop volumineux (max 10 MB)");

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload échoué");

      setProgress(100);
      return data; // { url, public_id }
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Upload + Send — pipeline complet pour les messages avec pièces jointes.
   *
   *   uploadAndSend(file, {
   *     groupId: "abc123",
   *     text: "Voici le PDF",     // optionnel
   *     replyTo: { ... },          // optionnel
   *   })
   */
  const uploadAndSend = async (file, { groupId, text = "", replyTo = null }) => {
    if (!groupId) throw new Error("groupId requis");
    if (!file) throw new Error("Fichier manquant");

    // 1. Upload
    const isImage = file.type.startsWith("image/");
    const folder = isImage ? "tawassol/messages/images" : "tawassol/messages/files";
    const { url } = await upload(file, folder);

    // 2. Build payload pour message
    const payload = {
      text,
      replyTo,
      ...(isImage
        ? { imageUrl: url }
        : {
            fileUrl: url,
            fileName: file.name,
            fileType: file.type,
          }),
    };

    // 3. Créer le message via API (real-time listener le verra apparaître)
    return api(`/api/groups/${groupId}/messages`, {
      method: "POST",
      body: payload,
    });
  };

  return { upload, uploadAndSend, uploading, progress, error };
}
