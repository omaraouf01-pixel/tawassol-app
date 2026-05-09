"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAlertCircle, FiEye, FiEyeOff, FiArrowLeft,
  FiCamera, FiCheckCircle, FiUploadCloud, FiHash, FiUser,
  FiMail, FiLock, FiSend,
} from "react-icons/fi";
import TsswalLogo from "@/components/TsswalLogo";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [toast, setToast] = useState(null); // {type, text}

  // Login fields (matricule + password)
  const [loginMatricule, setLoginMatricule] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regMatricule, setRegMatricule] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regIdCard, setRegIdCard] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─────── LOGIN by matricule ─────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1. Ask the backend to resolve the matricule → email + user data
      const lookupRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricule: loginMatricule.trim() }),
      });
      const lookupData = await lookupRes.json();
      if (!lookupRes.ok) {
        setError(lookupData.error || "Matricule introuvable.");
        setLoading(false);
        return;
      }

      // 2. Sign in with the resolved email
      await signInWithEmailAndPassword(auth, lookupData.email, loginPassword);

      // 3. Route based on role / status
      if (lookupData.role === "admin") return router.push("/admin");
      if (lookupData.status === "pending") return router.push("/pending");
      if (lookupData.status === "rejected") {
        setError("Votre compte a été rejeté par l'administrateur.");
        auth.signOut();
        setLoading(false);
        return;
      }
      if (lookupData.status === "active") return router.push(lookupData.onboarded ? "/hub" : "/onboarding");
    } catch {
      setError("Matricule ou mot de passe invalide.");
    }
    setLoading(false);
  };

  /* ─────── REGISTER (100% server-side — ne touche pas la session) ─────── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!regIdCard) { setError("Veuillez téléverser votre carte d'étudiant."); return; }
    if (regPassword.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    setLoading(true);
    try {
      // ── Tout est envoyé en UN SEUL appel au serveur ──
      //   Le serveur (firebase-admin) crée le compte Auth + Firestore en silence.
      //   La session du navigateur (admin) n'est PAS modifiée.
      const formData = new FormData();
      formData.append("matricule", regMatricule.trim());
      formData.append("fullName", regName.trim());
      formData.append("email", regEmail.trim());
      formData.append("password", regPassword);
      formData.append("studentCard", regIdCard);

      const registerRes = await fetch("/api/register", {
        method: "POST",
        body: formData,
        // Pas de Content-Type : le navigateur définit le boundary FormData.
      });

      const data = await registerRes.json().catch(() => ({}));
      if (!registerRes.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement.");
      }

      // ── Succès : vider le formulaire + toast ──
      setRegMatricule("");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegIdCard(null);

      setToast({ type: "success", text: "Compte créé. En attente de validation par un administrateur." });

      // Si l'utilisateur courant est DÉJÀ connecté (cas admin), on reste sur la page.
      // Sinon (visiteur public), on le redirige vers /pending après 1.5s.
      if (!auth.currentUser) {
        setTimeout(() => router.push("/pending"), 1500);
      }
    } catch (err) {
      console.error("[REGISTER ERROR]", err);
      setError(err.message || "Erreur inconnue lors de l'inscription.");
    }
    setLoading(false);
  };

  /* ─────── Drag & Drop handlers ─────── */
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) setRegIdCard(file);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white relative overflow-hidden flex flex-col">
      {/* ═══ Ambient lighting ═══ */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/25 rounded-full blur-[160px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[20%] w-[500px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* ═══ Top bar ═══ */}
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl w-full mx-auto relative z-10">
        <Link href="/" className="group">
          <TsswalLogo size={32} lockup glow className="hover:opacity-90 transition-opacity" />
        </Link>
        <Link
          href="/"
          className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <FiArrowLeft size={13} /> Retour à l'accueil
        </Link>
      </header>

      {/* ═══ Centered glass card ═══ */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12 relative z-10">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-2xl p-8 shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Card top border highlight */}
            <div aria-hidden className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
            {/* Inner glow */}
            <div aria-hidden className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div aria-hidden className="absolute -bottom-20 -left-20 w-48 h-48 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              {/* Centered logo (présence forte) */}
              <div className="flex justify-center mb-5">
                <TsswalLogo size={56} glow />
              </div>

              {/* Heading */}
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-black tracking-tight mb-1">
                  {mode === "login" ? "Bon retour 👋" : "Créer un compte"}
                </h1>
                <p className="text-sm text-slate-400">
                  {mode === "login"
                    ? "Connectez-vous avec votre matricule."
                    : "Rejoignez TSSWAL en quelques secondes."}
                </p>
              </div>

              {/* ─── ELEGANT TOGGLE SLIDER ─── */}
              <div className="relative bg-white/5 border border-white/10 rounded-full p-1 mb-7 flex">
                <motion.div
                  layoutId="auth-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/50 ring-1 ring-white/20"
                  style={{
                    left: mode === "login" ? "4px" : "calc(50% + 0px)",
                    width: "calc(50% - 4px)",
                  }}
                />
                {[
                  { id: "login", label: "Connexion" },
                  { id: "register", label: "Inscription" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setMode(t.id); setError(""); }}
                    className={`relative flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                      mode === t.id ? "text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 bg-rose-500/10 border border-rose-400/30 text-rose-300 text-xs font-semibold px-4 py-3 rounded-xl mb-5"
                  >
                    <FiAlertCircle size={14} className="shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── FORMS ─── */}
              <AnimatePresence mode="wait">
                {mode === "login" ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
                    <FieldWithIcon icon={FiHash} label="Matricule">
                      <input
                        type="text"
                        placeholder="2024-CS-001"
                        value={loginMatricule}
                        onChange={(e) => setLoginMatricule(e.target.value)}
                        required
                        className="auth-input"
                      />
                    </FieldWithIcon>

                    <FieldWithIcon icon={FiLock} label="Mot de passe">
                      <div className="relative">
                        <input
                          type={showPwd ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="auth-input pr-11"
                        />
                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                        </button>
                      </div>
                    </FieldWithIcon>

                    <div className="flex items-center justify-end -mt-1">
                      <button type="button" className="text-xs text-slate-500 hover:text-indigo-300 transition-colors font-medium">
                        Mot de passe oublié ?
                      </button>
                    </div>

                    <SubmitButton loading={loading}>Se connecter</SubmitButton>

                    <p className="text-xs text-slate-500 text-center pt-2">
                      Pas encore inscrit ?{" "}
                      <button type="button" onClick={() => setMode("register")} className="text-indigo-300 hover:text-indigo-200 font-semibold">
                        Créer un compte
                      </button>
                    </p>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleRegister}
                    className="space-y-4"
                  >
                    <FieldWithIcon icon={FiHash} label="Matricule">
                      <input
                        type="text"
                        placeholder="2024-CS-001"
                        value={regMatricule}
                        onChange={(e) => setRegMatricule(e.target.value)}
                        required
                        className="auth-input"
                      />
                    </FieldWithIcon>

                    <FieldWithIcon icon={FiUser} label="Nom complet">
                      <input
                        type="text"
                        placeholder="Ahmed Benali"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        className="auth-input"
                      />
                    </FieldWithIcon>

                    <FieldWithIcon icon={FiMail} label="Email">
                      <input
                        type="email"
                        placeholder="vous@univ.dz"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        className="auth-input"
                      />
                    </FieldWithIcon>

                    <FieldWithIcon icon={FiLock} label="Mot de passe">
                      <div className="relative">
                        <input
                          type={showPwd ? "text" : "password"}
                          placeholder="Minimum 6 caractères"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          className="auth-input pr-11"
                        />
                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                          {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                        </button>
                      </div>
                    </FieldWithIcon>

                    {/* ─── DRAG & DROP ZONE ─── */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                        Carte d'étudiant <span className="text-violet-400">*</span>
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => setRegIdCard(e.target.files[0] || null)}
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        className={`relative cursor-pointer rounded-xl border-2 border-dashed px-5 py-6 transition-all overflow-hidden ${
                          regIdCard
                            ? "border-emerald-400/40 bg-emerald-500/5"
                            : dragOver
                            ? "border-indigo-400/70 bg-indigo-500/10 scale-[1.01]"
                            : "border-white/15 bg-white/[0.02] hover:border-indigo-400/40 hover:bg-white/[0.04]"
                        }`}
                      >
                        {regIdCard ? (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                              <FiCheckCircle size={18} className="text-emerald-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white truncate">{regIdCard.name}</p>
                              <p className="text-[11px] text-slate-500">
                                {(regIdCard.size / 1024).toFixed(0)} KB · Cliquez pour changer
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <div className="relative mb-3">
                              <div className="absolute inset-0 bg-indigo-500 blur-md opacity-30" />
                              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center ring-1 ring-white/20 shadow-lg shadow-indigo-500/40">
                                <FiCamera size={20} className="text-white" />
                              </div>
                            </div>
                            <p className="text-sm font-bold text-white">
                              Télécharger la carte d'étudiant
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                              <FiUploadCloud size={11} />
                              Glissez-déposez ou cliquez pour parcourir
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <SubmitButton loading={loading}>Créer mon compte</SubmitButton>

                    <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-1">
                      Votre compte sera vérifié par un administrateur avant activation.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Trust footer */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Authentification sécurisée · Firebase
          </div>
        </div>
      </main>

      {/* ═══ BOTTOM TOAST NOTIFICATION ═══ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)]"
          >
            <div className="relative">
              <div aria-hidden className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur-lg opacity-50" />
              <div className="relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0F172A]/90 border border-indigo-400/30 backdrop-blur-xl shadow-2xl">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 ring-1 ring-white/20">
                  <FiSend size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">Inscription transmise</p>
                  <p className="text-[11px] text-slate-400 truncate">{toast.text}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse [animation-delay:200ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse [animation-delay:400ms]" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local input styling */}
      <style jsx global>{`
        .auth-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition: all 0.2s ease;
        }
        .auth-input::placeholder { color: rgba(148, 163, 184, 0.5); }
        .auth-input:focus {
          border-color: rgba(99, 102, 241, 0.6);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
        }
      `}</style>
    </div>
  );
}

/* ──────────── Helper components ──────────── */
function FieldWithIcon({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none" />
        {children}
      </div>
    </div>
  );
}

function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="relative group w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden mt-2"
    >
      <span aria-hidden className="absolute -inset-1 bg-indigo-500 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Patientez...
          </>
        ) : children}
      </span>
    </button>
  );
}
