"use client";
import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { firestore, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { COL } from "./collectionNames";

/**
 * ════════════════════════════════════════════════════════════════
 *  useMyGroups — liste real-time des groupes dont je suis membre
 * ════════════════════════════════════════════════════════════════
 *  Listener Firestore branché sur :
 *    where("members", "array-contains", uid)
 *    where("status", "==", "active")
 *    orderBy("updatedAt", "desc")
 *
 *  → Quand un nouveau message est posté dans un groupe (qui fait bump
 *    updatedAt), le groupe remonte automatiquement en haut de la liste
 *    sur tous les appareils connectés.
 * ════════════════════════════════════════════════════════════════
 */
export function useMyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let unsubscribeSnap = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Nettoyer un éventuel ancien listener
      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }

      if (!user) {
        if (mountedRef.current) {
          setGroups([]);
          setLoading(false);
        }
        return;
      }

      const q = query(
        collection(firestore, COL.GROUPS),
        where("members", "array-contains", user.uid),
        where("status", "==", "active"),
        orderBy("updatedAt", "desc")
      );

      unsubscribeSnap = onSnapshot(
        q,
        (snap) => {
          if (!mountedRef.current) return;
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              createdAt: data.createdAt?.toDate?.().toISOString() || null,
              updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
            };
          });
          setGroups(list);
          setLoading(false);
        },
        (err) => {
          console.error("[useMyGroups] listener error:", err);
          if (!mountedRef.current) return;
          setError(err.message);
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsubscribeSnap) unsubscribeSnap();
      unsubscribeAuth();
    };
  }, []);

  return { groups, loading, error };
}
