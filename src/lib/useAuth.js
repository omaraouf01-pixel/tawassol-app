"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { auth, firestore as db } from "./firebase";
import { onIdTokenChanged } from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation"; // استيراد أدوات التوجيه

const AuthContext = createContext({ user: null, userData: null, loading: true });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // ─── 1. مراقبة حالة الجلسة والتوكن (كما هي) ───
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data());
            console.log("[Auth] Data Initialized:", docSnap.data().status);
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
        // إذا لم يكن هناك مستخدم وهو ليس في صفحة عامة، يتم توجيهه للـ Auth
        if (pathname !== "/" && pathname !== "/auth") {
          router.replace("/auth");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // ─── 2. المستمع اللحظي + إجبار تحديث التوكن عند تغير الحالة ───
  useEffect(() => {
    if (!user) return;

    let lastStatus = null;

    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      async (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        setUserData(data);
        console.log("[Auth] Real-time Update:", data.status);

        // إذا تغيرت الحالة (مثلاً pending → active بعد موافقة الـ Admin)،
        // اطلب توكن جديد لتتزامن الـ Custom Claims مع وثيقة Firestore.
        if (lastStatus !== null && lastStatus !== data.status) {
          try {
            await auth.currentUser?.getIdToken(true);
          } catch (e) {
            console.warn("[Auth] Token refresh failed:", e.message);
          }
        }
        lastStatus = data.status;
      },
      (error) => {
        console.error("[Auth] Snapshot Error:", error);
      }
    );

    return () => unsub();
  }, [user]);

  // ─── 3. منطق التوجيه الذكي (الإصلاح الجوهري هنا) ───
  useEffect(() => {
    if (loading || !userData) return;

    const status = userData.status;
    const onboarded = !!userData.onboarded;
    const path = pathname;

    // 🛡️ السماح للمستخدم بالبقاء في /onboarding لرؤية رسالة النجاح بعد الإنهاء.
    if (status === "active" && onboarded && path === "/onboarding") {
      return;
    }

    // حالة Onboarding القديمة: التأكد من بقاء المستخدم في الصفحة
    if (status === "onboarding" && path !== "/onboarding") {
      router.replace("/onboarding");
    }

    // حالة Pending: المستخدم لم يُعتمد بعد
    else if (status === "pending" && path !== "/pending" && path !== "/onboarding") {
      router.replace("/pending");
    }

    // ✅ الإصلاح: مستخدم مُعتمد لكنه لم يكمل التهيئة بعد → دائماً إلى /onboarding
    //    حتى لو كان حالياً في /pending (وهذا هو سيناريو لحظة موافقة الـ Admin)
    else if (status === "active" && !onboarded && path !== "/onboarding") {
      router.replace("/onboarding");
    }

    // حالة Active + Onboarded: التوجيه للـ Hub من صفحات الدخول/الانتظار
    else if (status === "active" && onboarded && (path === "/auth" || path === "/pending")) {
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