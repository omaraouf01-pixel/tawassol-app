"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, LogOut, Loader2, Mail } from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/lib/useLanguage";

import TsswalLogo from "@/components/TsswalLogo";

export default function PendingPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/auth");
        return;
      }

      if (userData) {
        if (userData.role === "admin") {
          router.replace("/admin");
        } else if (userData.status === "approved_onboarding" || (userData.status === "active" && !userData.onboarded)) {
          router.replace("/onboarding");
        } else if (userData.status === "active" && userData.onboarded) {
          router.replace("/hub");
        }
      }
    }
  }, [user, userData, authLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/auth");
  };

  const pageBg = "bg-[#F8F8F5] dark:bg-[#0a0a0b] transition-colors duration-700";

  if (authLoading || (user && !userData) || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pageBg}`}>
        <Loader2 className="text-[#7c83f2] animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${pageBg}`}>
      <header className="max-w-[1360px] w-full mx-auto px-6 lg:px-10 py-6 flex justify-between items-center relative z-20">
        <button onClick={() => router.push("/")} className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white
                          bg-[#7c83f2] shadow-lg shadow-[#7c83f2]/20 group-hover:scale-105 transition-all">
            <TsswalLogo size={20} />
          </div>
          <div className="flex flex-col text-start border-s-[1.5px] border-slate-200 dark:border-slate-800 ps-3.5">
            <span className="font-serif text-[18px] italic font-bold tracking-[0.04em] text-slate-800 dark:text-slate-100">
              {t("common.appName")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7c83f2]">
              {t("auth.gatewayPortal")}
            </span>
          </div>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[500px] rounded-[32px] p-10 sm:p-14 text-center
                     bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800"
        >
          <div className="relative w-24 h-24 mx-auto mb-10">
            <div className="absolute inset-0 rounded-3xl bg-[#7c83f2]/10 flex items-center justify-center">
              <Clock size={40} className="text-[#7c83f2] animate-pulse" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-3xl border-2 border-dashed border-[#7c83f2]/30"
            />
          </div>

          <h1 className="font-serif text-[32px] font-semibold leading-tight text-slate-800 dark:text-slate-50 mb-4">
            {t("pending.title")}
          </h1>

          <p className="text-[15px] leading-relaxed text-slate-500 dark:text-slate-400 mb-8">
            {t("pending.body")}
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                          text-[13px] font-medium bg-[#F8F8F5] dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-8">
            <Mail size={14} className="opacity-60" />
            <span>{user.email}</span>
          </div>

          <div className="flex flex-col gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
            <div className="flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 py-3 rounded-2xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t("status.pending")}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl text-[13px] font-bold
                         text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
            >
              <LogOut size={16} data-flip-rtl />
              {t("pending.logout")}
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="text-center py-8 relative z-10">
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
          {t("auth.universityNetwork")} · {t("common.appName")}
        </p>
      </footer>
    </div>
  );
}
