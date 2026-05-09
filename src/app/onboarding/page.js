"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Camera, GraduationCap, Building2,
  ChevronLeft, ArrowRight, Rocket, Sparkles,
  BookOpen, Users, Cloud, Zap,
} from "lucide-react";
import TsswalLogo from "@/components/TsswalLogo";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "@/lib/apiClient";

/* ═══════════════════════════════════════════════════════════════
   DEV MODE — set false to re-enable auth guards for production
   ⚠️ Doit rester FALSE en production sinon les données ne sont pas
   sauvegardées dans Firestore !
   ═══════════════════════════════════════════════════════════════ */
const DEV_MODE = false;

const UNIVERSITIES = [
  "Université Oran 1 (Ahmed Ben Bella)",
  "Université Oran 2 (Mohamed Ben Ahmed)",
  "USTO (Université des Sciences et de la Technologie d'Oran)",
  "Université Alger 1 (Benyoucef Benkhedda)",
  "Université Constantine 1 (Frères Mentouri)",
  "Université de Tlemcen (Abou Bekr Belkaïd)",
  "Université de Sidi Bel Abbès (Djillali Liabès)",
  "Autre",
];

const DEPARTMENTS = [
  "Informatique (Computer Science)",
  "Mathématiques",
  "Physique",
  "Chimie",
  "Biologie",
  "Électronique",
  "Génie Civil",
  "Génie Mécanique",
  "Sciences Économiques",
  "Droit",
  "Médecine",
  "Autre",
];

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(!DEV_MODE);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [university, setUniversity] = useState(UNIVERSITIES[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (DEV_MODE) { setLoading(false); return; }
    return onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/auth"); return; }
      try {
        // ─── Profil utilisateur depuis MongoDB ───
        const profile = await api("/api/user/profile");
        if (profile.onboarded) { router.push("/hub"); return; }
        if (profile.status !== "active") { router.push("/pending"); return; }
        setCurrentUser(u);
        setLoading(false);
      } catch {
        router.push("/auth");
      }
    });
  }, [router]);

  const go = (n) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };
  const next = () => go(Math.min(step + 1, TOTAL_STEPS));
  const back = () => go(Math.max(step - 1, 1));

  const handleAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    const r = new FileReader();
    r.onloadend = () => setAvatarPreview(r.result);
    r.readAsDataURL(f);
  };

  const [errorMsg, setErrorMsg] = useState("");

  const handleFinish = async () => {
    if (DEV_MODE) { router.push("/hub"); return; }
    if (!currentUser) return;

    // Validation côté client (avant l'appel réseau)
    if (!university || university === UNIVERSITIES[UNIVERSITIES.length - 1] && !university.trim()) {
      setErrorMsg("Veuillez sélectionner votre université.");
      return;
    }
    if (!department) {
      setErrorMsg("Veuillez sélectionner votre département.");
      return;
    }

    setErrorMsg("");
    setSaving(true);

    try {
      const payload = {
        university,
        department,
        bio: bio.trim(),
      };

      // ─── 1. Upload avatar (Cloudinary) ───
      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        fd.append("folder", "tawassol/avatars");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const { url } = await res.json();
          payload.avatarUrl = url;
        }
      }

      // ─── 2. Persistence Firestore via endpoint dédié ───
      //     Le serveur force onboarded: true en interne.
      const result = await api("/api/user/setup", {
        method: "POST",
        body: payload,
      });

      // ─── 3. Redirection UNIQUEMENT si success: true confirmé ───
      if (result?.success === true && result?.user?.onboarded === true) {
        router.push("/hub");
      } else {
        // Cas improbable : 200 OK mais pas de success: true
        setErrorMsg("Sauvegarde incomplète. Réessayez.");
      }
    } catch (err) {
      console.error("[ONBOARDING ERROR]", err);
      setErrorMsg(err.message || "Erreur lors de la sauvegarde. Réessayez.");
    } finally {
      // ⚡ GARANTI : le spinner s'éteint dans 100% des cas
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const variants = {
    enter: (d) => ({ opacity: 0, x: d * 60 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d * -60 }),
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans antialiased selection:bg-indigo-500/40">
      {/* ── Ambient blobs ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[160px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[30%] w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Logo ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <TsswalLogo size={38} lockup glow />
      </motion.div>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="relative w-full max-w-lg rounded-[32px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden"
      >
        {/* Top highlight line */}
        <div
          aria-hidden
          className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-24 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
        />

        {/* ── Progress bar ── */}
        <div className="h-1 bg-white/[0.06]">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-r-full"
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          />
        </div>

        {/* ── Step content ── */}
        <div className="relative px-8 pt-7 pb-8 min-h-[460px] flex flex-col">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              {step === 1 && <StepWelcome />}
              {step === 2 && <StepCollaborate />}
              {step === 3 && (
                <StepAcademic
                  university={university}
                  setUniversity={setUniversity}
                  department={department}
                  setDepartment={setDepartment}
                />
              )}
              {step === 4 && (
                <StepProfile
                  bio={bio}
                  setBio={setBio}
                  avatarPreview={avatarPreview}
                  avatarFile={avatarFile}
                  fileRef={fileRef}
                  handleAvatar={handleAvatar}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Error banner ── */}
          {errorMsg && (
            <div className="mt-3 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-400/30 text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="flex items-center gap-3 mt-auto pt-6">
            {step > 1 && (
              <button
                onClick={back}
                className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-200 transition-colors"
              >
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <div className="flex-1" />
            {step < TOTAL_STEPS ? (
              <button
                onClick={next}
                className="relative group flex items-center gap-2 px-7 py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold transition-colors active:scale-[0.97]"
              >
                <span
                  aria-hidden
                  className="absolute -inset-1 bg-indigo-500 blur-xl opacity-40 group-hover:opacity-70 transition-opacity rounded-full"
                />
                <span className="relative flex items-center gap-2">
                  {step <= 2 ? "Next" : "Next Step"}
                  <ArrowRight size={15} />
                </span>
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="relative group flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
              >
                <span
                  aria-hidden
                  className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 blur-xl opacity-40 group-hover:opacity-70 transition-opacity rounded-full"
                />
                <span className="relative flex items-center gap-2.5">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Rocket size={16} />
                      Get Started — C'est parti !
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── Step dots ── */}
        <div className="flex justify-center gap-2 pb-6">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <button
              key={i}
              onClick={() => go(i + 1)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? "w-6 bg-indigo-500 shadow-md shadow-indigo-500/50"
                  : i + 1 < step
                  ? "w-1.5 bg-indigo-500/50"
                  : "w-1.5 bg-white/10"
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Footer ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-[11px] text-slate-600 mt-5"
      >
        You can update these details later in your profile settings.
      </motion.p>

      {/* ── DEV badge ── */}
      {DEV_MODE && (
        <div className="fixed top-4 right-4 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-bold text-amber-400 uppercase tracking-widest z-50">
          Dev Mode
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 1 — WELCOME
   ═══════════════════════════════════════════════════════════════ */
function StepWelcome() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      {/* Isometric Portal Illustration */}
      <div className="relative w-48 h-48 mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full h-full"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Base platform */}
            <motion.path
              d="M100 160 L40 130 L100 100 L160 130 Z"
              fill="url(#platform)"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            />
            {/* Portal frame left */}
            <motion.path
              d="M65 120 L65 55 L75 50 L75 115 Z"
              fill="#6366f1"
              fillOpacity="0.8"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{ transformOrigin: "70px 120px" }}
            />
            {/* Portal frame right */}
            <motion.path
              d="M125 115 L125 50 L135 55 L135 120 Z"
              fill="#8b5cf6"
              fillOpacity="0.8"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              style={{ transformOrigin: "130px 120px" }}
            />
            {/* Portal arch */}
            <motion.path
              d="M65 55 Q100 25 135 55"
              stroke="#a78bfa"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            />
            {/* Portal glow inside */}
            <motion.ellipse
              cx="100"
              cy="85"
              rx="28"
              ry="35"
              fill="url(#portalGlow)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0.6] }}
              transition={{ delay: 0.7, duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
            />
            {/* Sparkle particles */}
            {[
              { cx: 85, cy: 70, delay: 0.8 },
              { cx: 115, cy: 75, delay: 1.0 },
              { cx: 100, cy: 60, delay: 1.2 },
              { cx: 92, cy: 90, delay: 0.9 },
              { cx: 108, cy: 65, delay: 1.1 },
            ].map((p, i) => (
              <motion.circle
                key={i}
                cx={p.cx}
                cy={p.cy}
                r="2"
                fill="white"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: [0, -8, -16] }}
                transition={{ delay: p.delay, duration: 2, repeat: Infinity }}
              />
            ))}
            {/* Gradients */}
            <defs>
              <linearGradient id="platform" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.15" />
              </linearGradient>
              <radialGradient id="portalGlow">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>
        {/* Floating glow behind */}
        <div
          aria-hidden
          className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl -z-10"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl font-black tracking-tight mb-2">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            TSSWAL
          </span>
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
          Your gateway to collaborative learning. Let&apos;s set up your profile
          in a few quick steps.
        </p>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 2 — COLLABORATE
   ═══════════════════════════════════════════════════════════════ */
function StepCollaborate() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      {/* Isometric Students + Cloud Illustration */}
      <div className="relative w-52 h-48 mb-8">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full h-full"
        >
          <svg viewBox="0 0 220 200" className="w-full h-full">
            {/* Base platform */}
            <motion.path
              d="M110 170 L30 135 L110 100 L190 135 Z"
              fill="url(#collabPlatform)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            />

            {/* Student 1 — left */}
            <motion.g
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <circle cx="70" cy="105" r="10" fill="#6366f1" />
              <circle cx="70" cy="97" r="5" fill="#c7d2fe" />
              <rect x="66" y="107" width="8" height="14" rx="3" fill="#6366f1" />
            </motion.g>

            {/* Student 2 — center */}
            <motion.g
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <circle cx="110" cy="95" r="11" fill="#8b5cf6" />
              <circle cx="110" cy="86" r="5.5" fill="#ddd6fe" />
              <rect x="105.5" y="98" width="9" height="15" rx="3" fill="#8b5cf6" />
            </motion.g>

            {/* Student 3 — right */}
            <motion.g
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <circle cx="150" cy="105" r="10" fill="#a78bfa" />
              <circle cx="150" cy="97" r="5" fill="#ede9fe" />
              <rect x="146" y="107" width="8" height="14" rx="3" fill="#a78bfa" />
            </motion.g>

            {/* Connection lines */}
            {[
              { x1: 80, y1: 102, x2: 100, y2: 95 },
              { x1: 120, y1: 95, x2: 140, y2: 102 },
              { x1: 82, y1: 108, x2: 138, y2: 108 },
            ].map((line, i) => (
              <motion.line
                key={i}
                {...line}
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
              />
            ))}

            {/* Cloud above */}
            <motion.g
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: [0, -4, 0] }}
              transition={{
                opacity: { delay: 0.7, duration: 0.4 },
                y: { delay: 0.7, duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <ellipse cx="110" cy="52" rx="32" ry="16" fill="#6366f1" fillOpacity="0.25" />
              <ellipse cx="100" cy="48" rx="18" ry="12" fill="#6366f1" fillOpacity="0.2" />
              <ellipse cx="124" cy="48" rx="15" ry="10" fill="#8b5cf6" fillOpacity="0.2" />
              {/* Cloud icon inside */}
              <Cloud
                x={100}
                y={40}
                size={20}
                className="text-indigo-400"
                strokeWidth={1.5}
              />
            </motion.g>

            {/* Data particles floating up */}
            {[
              { cx: 90, cy: 80, delay: 1.0 },
              { cx: 110, cy: 75, delay: 1.3 },
              { cx: 130, cy: 80, delay: 1.6 },
            ].map((p, i) => (
              <motion.rect
                key={i}
                x={p.cx - 2}
                y={p.cy}
                width="4"
                height="4"
                rx="1"
                fill="#a78bfa"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0], y: [p.cy, p.cy - 25] }}
                transition={{ delay: p.delay, duration: 2, repeat: Infinity }}
              />
            ))}

            <defs>
              <linearGradient id="collabPlatform" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 bg-violet-500/15 rounded-full blur-3xl -z-10"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl font-black tracking-tight mb-2">
          Study{" "}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Smarter
          </span>{" "}
          Together
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
          Form dynamic study groups, share resources through the pedagogical
          cloud, and connect with classmates in real-time.
        </p>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap justify-center gap-2 mt-5"
      >
        {[
          { icon: Users, label: "Dynamic Groups", color: "indigo" },
          { icon: Cloud, label: "Cloud Resources", color: "violet" },
          { icon: Zap, label: "Live Messaging", color: "fuchsia" },
        ].map(({ icon: Icon, label, color }) => (
          <span
            key={label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border
              ${color === "indigo" ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" : ""}
              ${color === "violet" ? "bg-violet-500/10 text-violet-300 border-violet-500/20" : ""}
              ${color === "fuchsia" ? "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20" : ""}
            `}
          >
            <Icon size={12} />
            {label}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 3 — ACADEMIC IDENTITY
   ═══════════════════════════════════════════════════════════════ */
function StepAcademic({ university, setUniversity, department, setDepartment }) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 bg-indigo-500/15 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
          <GraduationCap size={20} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight">
            Select Your Academic Path
          </h1>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">
            Step 3 of 4
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-400 mt-4 mb-6 leading-relaxed">
        Help us personalize your experience by choosing your university and
        department.
      </p>

      <div className="space-y-5">
        {/* University */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
            University
          </label>
          <div className="relative">
            <Building2
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10"
            />
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full appearance-none bg-white/[0.04] border border-white/10 text-sm text-white py-3.5 pl-11 pr-10 rounded-[20px] outline-none transition-all focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer hover:border-white/20"
            >
              {UNIVERSITIES.map((u) => (
                <option key={u} value={u} className="bg-[#1e1e2e] text-white">
                  {u}
                </option>
              ))}
            </select>
            <ChevronLeft
              size={14}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 -rotate-90 pointer-events-none"
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
            Department
          </label>
          <div className="relative">
            <BookOpen
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10"
            />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full appearance-none bg-white/[0.04] border border-white/10 text-sm text-white py-3.5 pl-11 pr-10 rounded-[20px] outline-none transition-all focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer hover:border-white/20"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} className="bg-[#1e1e2e] text-white">
                  {d}
                </option>
              ))}
            </select>
            <ChevronLeft
              size={14}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 -rotate-90 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Quick info card */}
      <div className="mt-auto pt-5">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
          <Sparkles size={16} className="text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            This helps us recommend study groups and resources matching your
            field.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 4 — PERSONAL PROFILE
   ═══════════════════════════════════════════════════════════════ */
function StepProfile({ bio, setBio, avatarPreview, avatarFile, fileRef, handleAvatar }) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 bg-violet-500/15 border border-violet-500/20 rounded-2xl flex items-center justify-center">
          <User size={20} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight">
            Tell us about yourself
          </h1>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">
            Step 4 of 4 — Final step
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-400 mt-4 mb-6 leading-relaxed">
        Add a photo and a short bio so your classmates can get to know you.
      </p>

      {/* Avatar upload */}
      <div className="flex flex-col items-center mb-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatar}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="relative group w-28 h-28 rounded-full overflow-hidden transition-all"
        >
          {/* Background ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 border-dashed transition-colors ${
              avatarPreview
                ? "border-indigo-500/40"
                : "border-white/15 group-hover:border-indigo-400/50"
            }`}
          />
          {/* Inner */}
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="absolute inset-1 rounded-full bg-indigo-500/10 flex flex-col items-center justify-center gap-1.5">
              <Camera
                size={24}
                className="text-indigo-400/60 group-hover:text-indigo-400 transition-colors"
              />
              <span className="text-[9px] font-bold text-indigo-400/60 group-hover:text-indigo-400 uppercase tracking-wider transition-colors">
                Upload
              </span>
            </div>
          )}
          {/* Hover overlay */}
          {avatarPreview && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
              <Camera size={18} className="text-white" />
            </div>
          )}
          {/* Glow */}
          <div
            aria-hidden
            className="absolute -inset-2 bg-indigo-500/10 rounded-full blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </button>
        {avatarFile && (
          <p className="text-[11px] text-indigo-400 mt-2.5 font-semibold">
            {avatarFile.name}
          </p>
        )}
      </div>

      {/* Bio textarea */}
      <div>
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="Write a short bio... (e.g., Passionate about Web Dev)"
          className="w-full bg-white/[0.04] border border-white/10 text-sm text-white px-5 py-4 rounded-[20px] outline-none transition-all focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 resize-none placeholder:text-slate-600 hover:border-white/20"
        />
        <div className="flex justify-between items-center mt-1.5 px-1">
          <p className="text-[10px] text-slate-600">
            Keep it short and memorable
          </p>
          <p
            className={`text-[10px] font-bold tabular-nums ${
              bio.length > 180 ? "text-amber-400" : "text-slate-600"
            }`}
          >
            {bio.length}/200
          </p>
        </div>
      </div>
    </div>
  );
}
