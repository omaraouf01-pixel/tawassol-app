"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Mail, Lock, User, Hash, Eye, EyeOff,
  AlertCircle, Loader2, CheckCircle, ChevronLeft, ChevronDown, Phone,
} from "lucide-react";

// Firebase & Auth
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { useAuth } from "@/lib/useAuth";
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

  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({ matricule: "", password: "", fullName: "", email: "" });
  const [idCard, setIdCard] = useState(null);
  const fileRef = useRef(null);

  // ── OAuth completion modal state ──
  const [oauthModal, setOauthModal] = useState(null); // { idToken, prefillName, prefillEmail }
  const [oauthForm, setOauthForm] = useState({ matricule: "", fullName: "" });
  const [oauthCard, setOauthCard] = useState(null);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const oauthFileRef = useRef(null);

  // ── More options toggle ──
  const [showMore, setShowMore] = useState(false);

  // ── Phone sign-in state ──
  const [phoneModal, setPhoneModal] = useState(false);
  const [phoneStep, setPhoneStep] = useState("input"); // "input" | "otp"
  const [phoneCountry, setPhoneCountry] = useState("+213"); // الجزائر افتراضياً
  const [phoneLocal, setPhoneLocal] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneConfirmation, setPhoneConfirmation] = useState(null);
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const recaptchaRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  const COUNTRIES = [
    { code: "+213", flag: "🇩🇿", name: "Algeria" },
    { code: "+216", flag: "🇹🇳", name: "Tunisia" },
    { code: "+212", flag: "🇲🇦", name: "Morocco" },
    { code: "+33",  flag: "🇫🇷", name: "France" },
    { code: "+44",  flag: "🇬🇧", name: "UK" },
    { code: "+1",   flag: "🇺🇸", name: "USA / Canada" },
    { code: "+49",  flag: "🇩🇪", name: "Germany" },
    { code: "+34",  flag: "🇪🇸", name: "Spain" },
    { code: "+39",  flag: "🇮🇹", name: "Italy" },
    { code: "+90",  flag: "🇹🇷", name: "Turkey" },
    { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
    { code: "+971", flag: "🇦🇪", name: "UAE" },
    { code: "+20",  flag: "🇪🇬", name: "Egypt" },
  ];

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

  const handleOAuthSignIn = async (providerName) => {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      let provider;
      if (providerName === "google") {
        provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
      } else if (providerName === "github") {
        provider = new GithubAuthProvider();
        provider.addScope("user:email");
      } else {
        throw new Error("Unsupported provider.");
      }

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const prefillName = result.user.displayName || "";
      const prefillEmail = result.user.email || "";

      // افحص هل لديه مستند مسبقاً (تسجيل دخول لا تسجيل جديد)
      const checkRes = await fetch("/api/user/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (checkRes.ok) {
        // مستخدم موجود — useAuth سيتولى التوجيه
        return;
      }

      // مستخدم جديد — افتح modal لاستكمال البيانات
      setOauthModal({ idToken, prefillName, prefillEmail });
      setOauthForm({ matricule: "", fullName: prefillName });
      setOauthCard(null);
      setLoading(false);
    } catch (err) {
      console.error("OAuth Error:", err);
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(mapAuthError(err));
      }
      setLoading(false);
    }
  };

  // ── Phone sign-in handlers ──
  const ensureRecaptcha = () => {
    if (recaptchaVerifierRef.current) return recaptchaVerifierRef.current;
    const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, { size: "invisible" });
    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const buildFullPhone = () => {
    const local = phoneLocal.replace(/\D/g, "").replace(/^0+/, "");
    return `${phoneCountry}${local}`;
  };

  const handlePhoneStart = async (e) => {
    e.preventDefault();
    if (phoneSubmitting) return;
    setError("");

    const full = buildFullPhone();
    if (!/^\+\d{8,15}$/.test(full)) {
      setError("Enter a valid phone number (digits only, without leading 0).");
      return;
    }

    setPhoneSubmitting(true);
    try {
      const verifier = ensureRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, full, verifier);
      setPhoneConfirmation(confirmation);
      setPhoneStep("otp");
    } catch (err) {
      console.error("Phone start error:", err);
      setError(mapAuthError(err));
      try { recaptchaVerifierRef.current?.clear(); } catch {}
      recaptchaVerifierRef.current = null;
    } finally {
      setPhoneSubmitting(false);
    }
  };

  const handlePhoneVerify = async (e) => {
    e.preventDefault();
    if (phoneSubmitting || !phoneConfirmation) return;
    setError("");

    if (!/^\d{6}$/.test(phoneOtp)) {
      setError("Enter the 6-digit code.");
      return;
    }

    setPhoneSubmitting(true);
    try {
      const result = await phoneConfirmation.confirm(phoneOtp);
      const idToken = await result.user.getIdToken();

      // فحص هل لديه مستند مسبقاً
      const checkRes = await fetch("/api/user/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (checkRes.ok) {
        // مستخدم موجود — useAuth يُوجِّه تلقائياً
        setPhoneModal(false);
        return;
      }

      // مستخدم جديد — أغلق phone modal وافتح oauth completion modal
      setPhoneModal(false);
      setOauthModal({ idToken, prefillName: "", prefillEmail: result.user.phoneNumber || "" });
      setOauthForm({ matricule: "", fullName: "" });
      setOauthCard(null);
    } catch (err) {
      console.error("Phone verify error:", err);
      setError(mapAuthError(err));
    } finally {
      setPhoneSubmitting(false);
    }
  };

  const handlePhoneCancel = async () => {
    try { recaptchaVerifierRef.current?.clear(); } catch {}
    recaptchaVerifierRef.current = null;
    setPhoneModal(false);
    setPhoneStep("input");
    setPhoneLocal("");
    setPhoneOtp("");
    setPhoneConfirmation(null);
    setError("");
  };

  const handleOAuthCancel = async () => {
    try { await signOut(auth); } catch {}
    setOauthModal(null);
    setOauthForm({ matricule: "", fullName: "" });
    setOauthCard(null);
  };

  const handleOAuthComplete = async (e) => {
    e.preventDefault();
    if (oauthSubmitting || !oauthModal) return;
    setError("");

    if (!oauthForm.matricule.trim()) { setError("Matricule is required."); return; }
    if (!oauthForm.fullName.trim() || oauthForm.fullName.trim().length < 2) {
      setError("Full name is required."); return;
    }
    if (!oauthCard) { setError("Please upload your student ID card."); return; }

    setOauthSubmitting(true);
    try {
      // اطلب توكن طازج لتفادي انتهاء الصلاحية
      const freshToken = await auth.currentUser?.getIdToken(true);
      const fd = new FormData();
      fd.append("matricule", oauthForm.matricule.trim());
      fd.append("fullName", oauthForm.fullName.trim());
      fd.append("studentCard", oauthCard);

      const res = await fetch("/api/auth/google-register", {
        method: "POST",
        headers: { Authorization: `Bearer ${freshToken}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Registration failed.");

      setOauthModal(null);
      // useAuth سيلتقط المستند الجديد ويوجّه إلى /pending
    } catch (err) {
      console.error("OAuth Complete Error:", err);
      setError(err.message || "Registration failed.");
      setOauthSubmitting(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!idCard) throw new Error("Please upload your student ID card.");

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
        if (!res.ok) throw new Error(result.error || "Registration failed.");

        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matricule: formData.matricule }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Academic account not found.");

        await signInWithEmailAndPassword(auth, result.user.email, formData.password);
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setError(mapAuthError(err));
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
            <span className="font-serif text-[18px] italic font-bold text-slate-800 dark:text-slate-100">Twassel</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7c83f2]">Gateway Portal</span>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200/80 text-slate-600 dark:text-slate-400">
            <ChevronLeft size={14} data-flip-rtl /> Back to Home
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 lg:px-10 pb-16 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Branding */}
        <div className="hidden lg:flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#7c83f2] mb-[18px]">Oran University Network</p>
              <h1 className="font-serif text-[clamp(42px,5vw,72px)] font-semibold leading-[1.1] text-slate-800 dark:text-slate-50 tracking-tight">
                {mode === "login" ? (
                  <>Welcome back to <span className="italic text-[#7c83f2]">Twassel</span></>
                ) : (
                  <>Join the university community</>
                )}
              </h1>
              <WaveLine />
              <p className="text-[15px] leading-[1.75] max-w-[340px] mt-7 text-slate-500 dark:text-slate-400">
                {mode === "login"
                  ? "Sign in with your academic matricule to access your hub."
                  : "Create your account to connect with peers at Oran 1 University."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-[440px] mx-auto lg:mx-0 lg:ms-auto">
          <div className="rounded-[24px] p-9 sm:p-10 bg-white dark:bg-slate-900 shadow-2xl border border-black/5">
            {/* Tabs */}
            <div className="flex gap-1.5 p-1 rounded-full mb-8 bg-[#F8F8F5] dark:bg-slate-800/80 border dark:border-slate-700/50">
              {[{ key: "login", label: "Sign In" }, { key: "register", label: "Register" }].map((tab) => (
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
              <Field label="Academic Matricule" icon={Hash}>
                <input type="text" name="matricule" required value={formData.matricule} onChange={handleInputChange} placeholder="2026-ST-XXX" className="flex-1 bg-transparent border-0 outline-none text-sm font-medium dark:text-white" />
              </Field>

              {mode === "register" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-col gap-4 overflow-hidden">
                  <Field label="Full Name" icon={User}><input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} placeholder="Enter your full name" className="flex-1 bg-transparent border-0 outline-none text-sm font-medium dark:text-white" /></Field>
                  <Field label="Institutional Email" icon={Mail}><input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="scholar@univ.dz" className="flex-1 bg-transparent border-0 outline-none text-sm font-medium dark:text-white" /></Field>
                </motion.div>
              )}

              <Field label="Password" icon={Lock}>
                <input type={showPwd ? "text" : "password"} name="password" required value={formData.password} onChange={handleInputChange} placeholder="••••••••" className="flex-1 bg-transparent border-0 outline-none text-sm font-medium dark:text-white" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? "Hide password" : "Show password"} className="text-slate-400 hover:text-[#7c83f2]">{showPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </Field>

              {mode === "register" && (
                <div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setIdCard(e.target.files[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()} className={`w-full flex items-center justify-between px-4 py-4 rounded-xl mt-2 border-2 border-dashed transition-all ${idCard ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 text-indigo-600" : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 text-slate-400"}`}>
                    <div className="flex flex-col text-start"><span className="text-[10px] font-bold uppercase tracking-widest">ID Verification</span><span className="text-[12px] font-semibold truncate max-w-[200px]">{idCard ? idCard.name : "Upload Student ID"}</span></div>
                    {idCard ? <CheckCircle size={18} className="text-emerald-500" /> : <Camera size={18} />}
                  </button>
                </div>
              )}

              <button disabled={loading} type="submit" className="w-full mt-4 py-4 rounded-full text-sm font-bold text-white bg-[#7c83f2] hover:bg-[#686ee0] shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : mode === "login" ? "Sign In" : "Register Now"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Or</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading}
              className="w-full py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-[1.5px] border-slate-200 dark:border-slate-700 hover:border-[#7c83f2]/50 text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-all shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
              </svg>
              Continue with Gmail
            </button>

            {/* More options toggle */}
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="w-full mt-3 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-[#7c83f2] transition-colors"
            >
              {showMore ? "Hide" : "More sign-in options"}
              <ChevronDown size={14} className={`transition-transform ${showMore ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-2.5 mt-3">
                    {/* GitHub */}
                    <button
                      type="button"
                      onClick={() => handleOAuthSignIn("github")}
                      disabled={loading}
                      className="w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-3 bg-[#24292f] hover:bg-[#1b1f24] text-white disabled:opacity-50 transition-all shadow-sm"
                    >
                      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                      </svg>
                      Continue with GitHub
                    </button>

                    {/* Phone */}
                    <button
                      type="button"
                      onClick={() => { setPhoneModal(true); setPhoneStep("input"); setError(""); }}
                      disabled={loading}
                      className="w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-[1.5px] border-slate-200 dark:border-slate-700 hover:border-[#7c83f2]/50 text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-all shadow-sm"
                    >
                      <Phone size={16} className="text-[#7c83f2]" />
                      Continue with Phone (SMS)
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* reCAPTCHA invisible container */}
      <div ref={recaptchaRef} />

      {/* ── Phone Sign-in Modal ── */}
      <AnimatePresence>
        {phoneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget && !phoneSubmitting) handlePhoneCancel(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-[440px] rounded-[24px] bg-white dark:bg-slate-900 shadow-2xl border border-black/5 p-8"
            >
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#7c83f2] mb-2">
                  {phoneStep === "input" ? "Phone Sign-In" : "Verify Code"}
                </p>
                <h2 className="font-serif text-[24px] font-semibold text-slate-800 dark:text-slate-50">
                  {phoneStep === "input" ? "Enter your phone number" : "Enter the 6-digit code"}
                </h2>
                {phoneStep === "otp" && (
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2">
                    Code sent to <span className="font-semibold text-slate-700 dark:text-slate-300">{buildFullPhone()}</span>
                  </p>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 text-[12px] font-medium text-rose-600">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {phoneStep === "input" ? (
                <form onSubmit={handlePhoneStart} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Country</label>
                    <select
                      value={phoneCountry}
                      onChange={(e) => setPhoneCountry(e.target.value)}
                      className="px-3.5 py-3 rounded-xl bg-white dark:bg-slate-800/60 border-[1.5px] border-slate-200 dark:border-slate-700 text-sm font-medium dark:text-white outline-none focus:border-[#7c83f2]/50 transition-all"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Field label="Phone Number" icon={Phone}>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 me-1">{phoneCountry}</span>
                    <input
                      type="tel"
                      required
                      value={phoneLocal}
                      onChange={(e) => setPhoneLocal(e.target.value.replace(/\D/g, ""))}
                      placeholder="668202110"
                      className="flex-1 bg-transparent border-0 outline-none text-sm font-medium dark:text-white"
                    />
                  </Field>
                  <p className="text-[11px] text-slate-400">Enter digits only, without the leading 0.</p>

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={handlePhoneCancel} disabled={phoneSubmitting} className="flex-1 py-3.5 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={phoneSubmitting} className="flex-[2] py-3.5 rounded-full text-sm font-bold text-white bg-[#7c83f2] hover:bg-[#686ee0] disabled:opacity-50 flex items-center justify-center gap-2">
                      {phoneSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Send Code"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePhoneVerify} className="flex flex-col gap-4">
                  <Field label="Verification Code" icon={Hash}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="flex-1 bg-transparent border-0 outline-none text-base font-bold tracking-[0.5em] dark:text-white"
                    />
                  </Field>

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => { setPhoneStep("input"); setPhoneOtp(""); setError(""); }} disabled={phoneSubmitting} className="flex-1 py-3.5 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 disabled:opacity-50">Back</button>
                    <button type="submit" disabled={phoneSubmitting} className="flex-[2] py-3.5 rounded-full text-sm font-bold text-white bg-[#7c83f2] hover:bg-[#686ee0] disabled:opacity-50 flex items-center justify-center gap-2">
                      {phoneSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Verify & Continue"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── OAuth Completion Modal ── */}
      <AnimatePresence>
        {oauthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget && !oauthSubmitting) handleOAuthCancel(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-[460px] rounded-[24px] bg-white dark:bg-slate-900 shadow-2xl border border-black/5 p-8"
            >
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#7c83f2] mb-2">Final Step</p>
                <h2 className="font-serif text-[26px] font-semibold text-slate-800 dark:text-slate-50">Complete Your Registration</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2">
                  Signed in as <span className="font-semibold text-slate-700 dark:text-slate-300">{oauthModal.prefillEmail}</span>
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 text-[12px] font-medium text-rose-600">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleOAuthComplete} className="flex flex-col gap-4">
                <Field label="Full Name" icon={User}>
                  <input
                    type="text"
                    required
                    value={oauthForm.fullName}
                    onChange={(e) => setOauthForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="flex-1 bg-transparent border-0 outline-none text-sm font-medium dark:text-white"
                  />
                </Field>

                <Field label="Academic Matricule" icon={Hash}>
                  <input
                    type="text"
                    required
                    value={oauthForm.matricule}
                    onChange={(e) => setOauthForm((p) => ({ ...p, matricule: e.target.value }))}
                    placeholder="2026-ST-XXX"
                    className="flex-1 bg-transparent border-0 outline-none text-sm font-medium dark:text-white"
                  />
                </Field>

                <div>
                  <input ref={oauthFileRef} type="file" accept="image/*" hidden onChange={(e) => setOauthCard(e.target.files[0])} />
                  <button
                    type="button"
                    onClick={() => oauthFileRef.current?.click()}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 border-dashed transition-all ${oauthCard ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 text-indigo-600" : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 text-slate-400"}`}
                  >
                    <div className="flex flex-col text-start">
                      <span className="text-[10px] font-bold uppercase tracking-widest">ID Verification</span>
                      <span className="text-[12px] font-semibold truncate max-w-[260px]">{oauthCard ? oauthCard.name : "Upload Student ID"}</span>
                    </div>
                    {oauthCard ? <CheckCircle size={18} className="text-emerald-500" /> : <Camera size={18} />}
                  </button>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleOAuthCancel}
                    disabled={oauthSubmitting}
                    className="flex-1 py-3.5 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={oauthSubmitting}
                    className="flex-[2] py-3.5 rounded-full text-sm font-bold text-white bg-[#7c83f2] hover:bg-[#686ee0] shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {oauthSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Complete Sign Up"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
