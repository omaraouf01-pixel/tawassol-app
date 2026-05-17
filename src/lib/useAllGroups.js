"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { firestore, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { COL } from "./collectionNames";

/**
 * ════════════════════════════════════════════════════════════════
 *  useAllGroups — Real-time Discovery hook (onSnapshot)
 * ════════════════════════════════════════════════════════════════
 *  Listens to the `groups` collection via Firestore onSnapshot:
 *    where("isPublic", "==", true)
 *    orderBy("createdAt", "desc")
 *    limit(30)
 *
 *  When Firestore returns 0 documents, provides a set of curated
 *  "starter circles" so the UI is never blank.
 *
 *  Returns:
 *    - groups:          all public groups (up to 30), or starter groups
 *    - discoveryGroups: groups the user hasn't joined
 *    - loading:         true until first snapshot arrives
 *    - error:           error message if listener fails
 *    - isEmpty:         true when showing fallback starter groups
 * ════════════════════════════════════════════════════════════════
 */

// STARTER_GROUPS removed: Real data only.

export function useAllGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUid, setCurrentUid] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let unsubSnap = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous Firestore listener on auth change
      if (unsubSnap) {
        unsubSnap();
        unsubSnap = null;
      }

      if (!user) {
        if (mountedRef.current) {
          setCurrentUid(null);
          setGroups([]);
          setIsEmpty(false);
          setLoading(false);
        }
        return;
      }

      if (mountedRef.current) {
        setCurrentUid(user.uid);
      }

      const q = query(
        collection(firestore, COL.GROUPS),
        where("isPublic", "==", true),
        orderBy("createdAt", "desc"),
        limit(30)
      );

      unsubSnap = onSnapshot(
        q,
        (snap) => {
          if (!mountedRef.current) return;

          // جلب البيانات الحقيقية فقط (سواء كانت فارغة أم لا)
          const list = snap.docs.reduce((acc, d) => {
            try {
              const data = d.data();
              acc.push({
                id: d.id,
                ...data,
                createdAt: typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : null),
                updatedAt: typeof data.updatedAt?.toDate === 'function' ? data.updatedAt.toDate().toISOString() : (typeof data.updatedAt === 'string' ? data.updatedAt : null),
              });
            } catch (err) {
              console.warn(`[useAllGroups] Skipping malformed group doc ${d.id}`, err);
            }
            return acc;
          }, []);

          setGroups(list);
          setIsEmpty(snap.size === 0);
          setError(null);
          setLoading(false);
        },
        (err) => {
          if (!mountedRef.current) return;

          // Specific error logging for permission-denied
          if (err.code === "permission-denied") {
            console.error(
              "[useAllGroups] 🔒 PERMISSION DENIED — check firestore.rules:",
              "groups collection must allow read for authenticated users.",
              err.message
            );
          } else if (err.code === "failed-precondition") {
            console.error(
              "🔥 FIRESTORE ERROR (INDEX REQUIRED):",
              err.message,
              "\n👉 You need a Composite Index for this query. Click the link in the error message above to create it in the Firebase Console!"
            );
          } else {
            console.error("[useAllGroups] 🔴 Listener error:", err.code, err.message);
          }

          // On error, clear groups so UI doesn't crash or show fake data
          setGroups([]);
          setIsEmpty(true);
          setError(err.message);
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsubSnap) unsubSnap();
      unsubAuth();
    };
  }, []);

  // Client-side filter: remove groups the user already belongs to
  const discoveryGroups = useMemo(
    () => currentUid
      ? groups.filter((g) => !g.members?.includes(currentUid))
      : groups,
    [groups, currentUid]
  );

  const isMember = useCallback(
    (group) => currentUid && group.members?.includes(currentUid),
    [currentUid]
  );

  return { groups, discoveryGroups, loading, error, currentUid, isMember, isEmpty };
}
