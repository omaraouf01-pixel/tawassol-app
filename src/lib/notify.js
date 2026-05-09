"use client";
import { api } from "./apiClient";

/**
 * Crée une notification pour un utilisateur (via API MongoDB).
 * Le caller doit être authentifié (Firebase Auth client).
 *
 * @param {object} args
 * @param {string} args.userId - UID destinataire
 * @param {string} args.title  - Titre court
 * @param {string} [args.body] - Corps de la notification
 * @param {string} [args.link] - Lien interne (ex: /hub/chat/<id>)
 */
export async function notify({ userId, title, body, link }) {
  if (!userId || !title) return;
  try {
    await api("/api/notifications", {
      method: "POST",
      body: { userId, title, body: body || "", link: link || null },
    });
  } catch (e) {
    console.error("[NOTIFY ERROR]", e);
  }
}
