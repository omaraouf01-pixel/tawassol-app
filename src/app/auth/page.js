"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Mail, Lock, User, Hash, Eye, EyeOff,
  AlertCircle, Loader2, CheckCircle, ChevronLeft,
} from "lucide-react";

// Firebase & Auth
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/lib/useLanguage";
import { mapAuthError } from "@/lib/authErrors";

import TsswalLogo from "@/components/TsswalLogo";

/* ─── Decorative components ─── */
const WaveLine = () => (
  <svg width="100" height="10" viewBox="0 0 160 12" fill="none" className="mt-1">
    <motion.path
      d="M2 9 C30 2, 60 10, 90 4 C120 -2, 140 8, 158 5"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      className="text-[#7c83f2] dark:text-[#7c83f2]"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
    />
  </svg>
);

function Field({ label, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-1.5 group">
      <label className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 group-focus-within:text-[#7c83f2] transition-colors">
        {label}
      </label>
      <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white dark:bg-slate-800/60 border-[1.5px] border-slate-200 dark:border-slate-700 group-focus-within:border-[#7c83f2]/50 transition-all shadow-sm">
        {Icon && <Icon size={15} className="text-slate-400 group-focus-within:text-[#7c83f2] transition-colors shrink-0" />}
        {children}
      </div>
    </div>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userData, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({ matricule: "", password: "", fullName: "", email: "" });
  const [idCard, setIdCard] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!authLoading && user && userData) {
      if (userData.role === "admin") router.replace("/admin");
      else if (userData.status === "pending") router.replace("/pending");
      else if (!userData.onboarded) router.replace("/onboarding");
      else router.replace("/hub");
    }
  }, [user, userData, authLoading, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!idCard) throw new Error(t("auth.uploadIdError"));

        const fd = new FormData();
        fd.append("matricule", formData.matricule);
        fd.append("fullName", formData.fullName);
        fd.append("email", formData.email);
        fd.append("password", formData.password);
        fd.append("studentCard", idCard);

        const res = await fetch("/api/register", {
          method: "POST",
          body: fd,
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || t("auth.registrationFailed"));

        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matricule: formData.matricule }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || t("auth.accountNotFound"));

        await signInWithEmailAndPassword(auth, result.user.email, formData.password);
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setError(mapAuthError(err, t));
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F5] dark:bg-[#0a0a0b]">
        <Loader2 className="animate-spin text-[#7c83f2]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8F8F5] dark:bg-[#0a0a0b] transition-colors duration-700">
      <header className="max-w-[1360px] w-full mx-auto px-6 lg:px-10 py-6 flex justify-between items-center relative z-20">
        <button onClick={() => router.push("/")} className="flex items-center gap-3.5 group text-start">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white bg-[#7c83f2] shadow-lg">
            <TsswalLogo size={20} />
          </div>
          <div className="border-s-[1.5px] border-slate-200 dark:border-slate-800 ps-3.5 flex flex-col">
            <span className="font-serif text-[18px] italic font-bold text-slate-800 dark:text-slate-100">{t("common.appName")}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7c83f2]">{t("auth.gatewayPortal")}</span>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200/80 text-slate-600 dark:text-slate-400">
            <ChevronLeft size={14} data-flip-rtl /> {t("nav.backToHome")}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 lg:px-10 pb-16 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Branding */}
        <div className="hidden lg:flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#7c83f2] mb-[18px]">{t("auth.universityNetwork")}</p>
              <h1 className="font-serif text-[clamp(42px,5vw,72px)] font-semibold leading-[1.1] text-slate-800 dark:text-slate-50 tracking-tight">
                {mode === "login" ? (
                  <>{t("auth.welcomeBack")} <span className="italic text-[#7c83f2]">{t("common.appName")}</span></>
                ) : (
                  <>{t("auth.joinCommunity")}</>
                )}
              </h1>
              <WaveLine />
              <p className="text-[15px] leading-[1.75] max-w-[340px] mt-7 text-slate-500 dark:text-slate-400">
                {mode === "login" ? t("auth.signInDesc") : t("auth.registerDesc")}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-[440px] mx-auto lg:mx-0 lg:ms-auto">
          <div className="rounded-[24px] p-9 sm:p-10 bg-white dark:bg-slate-900 shadow-2xl border border-black/5">
            {/* Tabs */}
            <div className="flex gap-1.5 p-1 rounded-full mb-8 bg-[#F8F8F5] dark:bg-slate-800/80 border dark:border-slate-700/50">
              {[{ key: "login", label: t("auth.signIn") }, { key: "register", label: t("auth.register") }].map((tab) => (
                <button key={tab.key} type="button" onClick={() => { setMode(tab.key); setError(""); }} className={`flex-1 py-2.5 rounded-full text-[13px] font-bold transition-all ${mode === tab.key ? "bg-slate-800 dark:bg-[#7c83f2] text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 text-[12px] font-medium text-rose-600">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <Field label={t("auth.matricule")} icon={Hash}>
                <input type="text" name="matricule" required value={formData.matricule} onChange={handleInputChange} placeholder={t("auth.matriculePlaceholder")} className="flex-1 bg-transparent border-0 outline-none text-sm font-medium dark:text-white" />
              </Field>

              {mode === "register" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-col gap-4 overflow-hidden">
                  <Field label={t("auth.fullName")} icon={User}><input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} placeholder={t("auth.fullNamePlaceholder")} className="flex-1 bg-transparent border-0 outline-none text-sm font-medium dark:text-white" /></Field>
                  <Field label={t("auth.email")} icon={Mail}><input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder={t("auth.emailPlaceholder")} className="flex-1 bg-transparent border-0 outline-none text-sm font-medium dark:text-white" /></Field>
                </motion.div>
              )}

              <Field label={t("auth.password")} icon={Lock}>
                <input type={showPwd ? "text" : "password"} name="password" required value={formData.password} onChange={handleInputChange} placeholder="••••••••" className="flex-1 bg-transparent border-0 outline-none text-sm font-medium dark:text-white" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? t("auth.hidePassword") : t("auth.showPassword")} className="text-slate-400 hover:text-[#7c83f2]">{showPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </Field>

              {mode === "register" && (
                <div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setIdCard(e.target.files[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()} className={`w-full flex items-center justify-between px-4 py-4 rounded-xl mt-2 border-2 border-dashed transition-all ${idCard ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 text-indigo-600" : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 text-slate-400"}`}>
                    <div className="flex flex-col text-start"><span className="text-[10px] font-bold uppercase tracking-widest">{t("auth.idVerification")}</span><span className="text-[12px] font-semibold truncate max-w-[200px]">{idCard ? idCard.name : t("auth.uploadStudentId")}</span></div>
                    {idCard ? <CheckCircle size={18} className="text-emerald-500" /> : <Camera size={18} />}
                  </button>
                </div>
              )}

              <button disabled={loading} type="submit" className="w-full mt-4 py-4 rounded-full text-sm font-bold text-white bg-[#7c83f2] hover:bg-[#686ee0] shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : mode === "login" ? t("auth.signIn") : t("auth.registerNow")}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AuthPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F8F5] dark:bg-[#0a0a0b] flex items-center justify-center"><Loader2 className="animate-spin text-[#7c83f2]" size={32} /></div>}>
      <AuthContent />
    </Suspense>
  );
}
