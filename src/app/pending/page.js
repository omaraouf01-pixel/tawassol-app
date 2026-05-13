"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Clock, ShieldCheck, LogOut, Loader2 } from "lucide-react";

// ─── الاستيرادات الحقيقية ───
import { auth, firestore } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

// ─── الشعار الموحد ───
import TsswalLogo from "@/components/TsswalLogo";

export default function PendingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // ─── المستشعر اللحظي (Real-time Watcher) ───
        // يراقب أي تغيير في حالة المستخدم داخل Firestore
        const unsubDoc = onSnapshot(doc(firestore, "users", user.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setLoading(false);

            // منطق التوجيه بناءً على الحالة الجديدة (State Machine)
            if (data.status === "approved_onboarding") {
              // إذا وافق الآدمين، نرسله لإكمال بروفايله فوراً
              router.push("/onboarding");
            }
            else if (data.status === "active") {
              // إذا كان عضواً نشطاً بالفعل
              router.push("/hub");
            }
            else if (data.role === "admin") {
              // إذا دخل الآدمين لهذه الصفحة بالخطأ
              router.push("/admin");
            }
            // إذا كانت الحالة لا تزال pending، سيبقى الطالب في هذه الصفحة
          }
        });

        return () => unsubDoc();
      } else {
        // إذا لم يكن مسجلاً، نرسله لصفحة الدخول
        router.push("/auth");
      }
    });

    return () => unsubAuth();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-brand-indigo animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div dir="ltr" className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 selection:bg-brand-indigo/30 relative overflow-hidden font-sans">

      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-indigo/5 blur-[120px] pointer-events-none rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-white/[0.01] border border-white/5 rounded-[4rem] p-12 lg:p-20 shadow-premium text-center relative z-10"
      >
        <TsswalLogo size={48} className="mb-12 mx-auto" />

        <div className="relative">
          {/* Animated Clock / Radar Icon */}
          <div className="w-24 h-24 bg-brand-indigo/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 relative group">
            <Clock size={36} className="text-brand-indigo animate-pulse" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-brand-indigo/20 rounded-[2.5rem]"
            />
          </div>

          <h1 className="text-4xl lg:text-5xl font-serif font-black italic text-white leading-tight mb-6">
            Identity <br /><span className="text-brand-indigo/80">Syncing.</span>
          </h1>

          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed">
            Your academic credentials have been received. We are currently verifying your node within the sanctuary network.
          </p>

          <div className="mt-14 pt-10 border-t border-white/5 flex flex-col items-center gap-8">
            {/* Status Badge */}
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-brand-indigo bg-brand-indigo/5 px-6 py-3 rounded-full border border-brand-indigo/10">
              <ShieldCheck size={16} /> Status: Awaiting Overseer Approval
            </div>

            {/* Logout Option */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 hover:text-rose-500 transition-all bg-transparent border-none cursor-pointer group"
            >
              <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
              Terminate Link
            </button>
          </div>
        </div>
      </motion.div>

      <footer className="mt-12 text-[9px] font-black uppercase text-slate-800 tracking-[0.6em] italic">
        Oran University Node • Twassel Protocol
      </footer>
    </div>
  );
}