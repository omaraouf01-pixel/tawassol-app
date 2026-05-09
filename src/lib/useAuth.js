"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth } from "./firebase";

/**
 * useAuth — écoute Firebase Auth + récupère le profil depuis Firestore via API.
 *
 * onIdTokenChanged (au lieu de onAuthStateChanged) se déclenche aussi quand
 * le token est rafraîchi → on reçoit immédiatement les nouveaux Custom Claims
 * (ex: admin: true posé sur le serveur).
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [claims, setClaims] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Récupérer les claims (admin, role, etc.)
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          setClaims(tokenResult.claims);
        } catch {
          setClaims(null);
        }

        // Récupérer le profil complet via API
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch("/api/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setUserData(await res.json());
          } else {
            setUserData(null);
          }
        } catch (e) {
          console.error("[useAuth] Failed to fetch user data:", e);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
        setClaims(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, userData, claims, loading };
}
