"use client";
import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit as fbLimit,
  onSnapshot,
} from "firebase/firestore";
import { firestore } from "./firebase";

/**
 * ════════════════════════════════════════════════════════════════
 *  useMessages — listener real-time pour les messages d'un groupe
 * ════════════════════════════════════════════════════════════════
 *  Branchement direct sur Firestore via onSnapshot. Pas de polling.
 *  Met à jour la liste automatiquement quand quelqu'un écrit un message.
 *
 *  Usage :
 *    const { messages, loading, error } = useMessages(groupId);
 *
 *  Notes :
 *   - Les Firestore Security Rules doivent autoriser le user à lire
 *     les messages de ses groupes (voir firestore.rules).
 *   - Quand le composant est démonté, le listener se désabonne
 *     automatiquement (return unsubscribe dans useEffect).
 * ════════════════════════════════════════════════════════════════
 */
export function useMessages(groupId, opts = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const max = opts.limit || 200;
    const q = query(
      collection(firestore, "messages"),
      where("groupId", "==", groupId),
      orderBy("createdAt", "asc"),
      fbLimit(max)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (!mountedRef.current) return;
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            // Convertir Timestamp Firestore en ISO string pour le frontend
            createdAt: data.createdAt?.toDate?.().toISOString() || null,
          };
        });
        setMessages(list);
        setLoading(false);
      },
      (err) => {
        console.error("[useMessages] listener error:", err);
        if (!mountedRef.current) return;
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId, opts.limit]);

  return { messages, loading, error };
}
