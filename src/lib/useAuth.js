"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { auth, firestore as db } from "./firebase";
import { onIdTokenChanged } from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { COL } from "./collectionNames";
import { useRouter, usePathname } from "next/navigation"; // استيراد أدوات التوجيه

const AuthContext = createContext({ user: null, userData: null, loading: true });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // ─── 1. مراقبة حالة الجلسة والتوكن ───
  // يعمل مرة واحدة فقط — لا يعتمد على pathname/router لتجنب إعادة التسجيل عند كل تنقل
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, COL.USERS, firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            const token = await firebaseUser.getIdToken();
            const response = await fetch("/api/user/profile", {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              const data = await response.json();
              setUserData(data);
            }
          }
        } catch (error) {
          console.error("[Auth] Initialization Error:", error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 2. المستمع اللحظي + إجبار تحديث التوكن عند تغير الحالة ───
  useEffect(() => {
    if (!user) return;

    let lastStatus = null;
    let unsub;

    // نجبر استرجاع التوكن أولاً حتى تتعرف Firestore على الجلسة قبل بدء الـ listener
    user.getIdToken().then(() => {
      unsub = onSnapshot(
        doc(db, COL.USERS, user.uid),
        async (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();

          // إذا تغيرت الحالة (مثلاً pending → active بعد موافقة الـ Admin)،
          // اطلب توكن جديد لتتزامن الـ Custom Claims قبل تحديث userData
          // حتى لا يطلق منطق التوجيه قبل أن تكون قواعد Firestore جاهزة.
          if (lastStatus !== null && lastStatus !== data.status) {
            try {
              await auth.currentUser?.getIdToken(true);
            } catch (e) {
              console.warn("[Auth] Token refresh failed:", e.message);
            }
          }
          lastStatus = data.status;
          setUserData(data);
        },
        (error) => {
          console.error("[Auth] Snapshot Error:", error);
        }
      );
    });

    return () => unsub?.();
  }, [user]);

  // ─── 3. منطق التوجيه الذكي ───
  useEffect(() => {
    if (loading) return;

    const path = pathname;
    const PUBLIC_PATHS = ["/", "/auth"];

    // لا مستخدم → توجيه لصفحة الدخول إن لم يكن في صفحة عامة
    if (!userData) {
      if (!PUBLIC_PATHS.includes(path)) {
        router.replace("/auth");
      }
      return;
    }

    const status = userData.status;
    const onboarded = !!userData.onboarded;

    // 🛡️ السماح بالبقاء في /onboarding بعد الإنهاء مباشرةً
    if (status === "active" && onboarded && path === "/onboarding") return;

    if (status === "onboarding" && path !== "/onboarding") {
      router.replace("/onboarding");
    } else if (status === "pending" && path !== "/pending" && path !== "/onboarding") {
      router.replace("/pending");
    } else if (status === "active" && !onboarded && path !== "/onboarding") {
      router.replace("/onboarding");
    } else if (status === "active" && onboarded && (path === "/auth" || path === "/pending")) {
      router.replace("/hub");
    }
  }, [userData, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);