"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Camera, Mail, Lock, User, Hash, Eye,
  EyeOff, AlertCircle, Loader2, CheckCircle, ChevronLeft
} from "lucide-react";

import { auth, firestore } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";

import TsswalLogo from "@/components/TsswalLogo";

/* ─── Animated underline decoration ─── */
const WaveLine = () => (
  <svg width="100" height="10" viewBox="0 0 160 12" fill="none" className="mt-1">
    <motion.path
      d="M2 9 C30 2, 60 10, 90 4 C120 -2, 140 8, 158 5"
      stroke="#6366f1" strokeWidth="3" strokeLinecap="round" fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
    />
  </svg>
);

/* ─── Single input field ─── */
function Field({ label, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-1.5 group">
      <label className="text-xs font-semibold text-slate-500 group-focus-within:text-indigo-500 transition-colors tracking-wide">
        {label}
      </label>
      <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 gap-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
        {Icon && <Icon size={16} className="text-slate-400 flex-shrink-0" />}
        {children}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    matricule: "",
    password: "",
    fullName: "",
    email: ""
  });
  const [idCard, setIdCard] = useState(null);
  const fileRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!idCard) throw new Error("يرجى رفع صورة البطاقة الجامعية للتحقق.");

        const mQuery = query(collection(firestore, "users"), where("matricule", "==", formData.matricule));
        const mSnap = await getDocs(mQuery);
        if (!mSnap.empty) throw new Error("هذا الرقم الجامعي مسجل مسبقاً.");

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        const fd = new FormData();
        fd.append("file", idCard);
        fd.append("folder", "tawassol/idCards");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadData.url) throw new Error("فشل في مزامنة وثيقة الهوية.");

        await setDoc(doc(firestore, "users", user.uid), {
          uid: user.uid,
          fullName: formData.fullName,
          email: formData.email,
          matricule: formData.matricule,
          studentCardUrl: uploadData.url,
          role: 'student',
          status: 'pending',
          onboarded: false,
          createdAt: serverTimestamp()
        });

        router.push("/pending");

      } else {
        const q = query(collection(firestore, "users"), where("matricule", "==", formData.matricule));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) throw new Error("لم يتم العثور على حساب مرتبط بهذا الرقم.");

        const userData = querySnapshot.docs[0].data();
        await signInWithEmailAndPassword(auth, userData.email, formData.password);

        if (userData.role === "admin") router.push("/admin");
        else if (userData.status === "pending") router.push("/pending");
        else if (userData.status === "approved_onboarding") router.push("/onboarding");
        else if (userData.status === "active") router.push("/hub");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .auth-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #eef2ff 50%, #fdf4ff 100%);
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }

        .auth-logo-name {
          font-family: 'Lora', serif;
          font-weight: 600;
          font-style: italic;
          font-size: 18px;
          color: #1e1b4b;
          letter-spacing: 0.04em;
        }
        .auth-logo-sub {
          font-size: 10px;
          font-weight: 700;
          color: #6366f1;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .auth-card {
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 4px 6px -1px rgba(99,102,241,0.04),
                      0 20px 50px -10px rgba(99,102,241,0.10),
                      0 0 0 1px rgba(99,102,241,0.06);
          padding: 40px 36px;
          width: 100%;
          max-width: 440px;
        }

        .auth-heading {
          font-family: 'Lora', serif;
          font-weight: 600;
          font-size: 26px;
          color: #1e1b4b;
          line-height: 1.3;
        }
        .auth-sub {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 6px;
          line-height: 1.6;
        }

        .tab-btn {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 20px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
        }
        .tab-btn.active {
          background: #1e1b4b;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(30,27,75,0.18);
        }
        .tab-btn.inactive {
          background: transparent;
          color: #94a3b8;
        }
        .tab-btn.inactive:hover {
          color: #475569;
          background: #f1f5f9;
        }

        .field-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }
        .field-input::placeholder {
          color: #cbd5e1;
          font-weight: 400;
        }

        .error-box {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 12px;
          font-weight: 500;
          color: #e11d48;
          line-height: 1.5;
        }

        .upload-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-radius: 14px;
          border: 2px dashed #e2e8f0;
          background: #fafbff;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .upload-btn:hover {
          border-color: #a5b4fc;
          background: #f5f3ff;
        }
        .upload-btn.has-file {
          border-color: #818cf8;
          background: #f5f3ff;
          color: #4f46e5;
        }
        .upload-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.02em;
        }
        .upload-btn.has-file .upload-label {
          color: #4f46e5;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(79,70,229,0.30);
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(79,70,229,0.38);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0px);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .left-headline {
          font-family: 'Lora', serif;
          font-size: clamp(42px, 5vw, 72px);
          font-weight: 600;
          color: #1e1b4b;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .left-headline em {
          font-style: italic;
          color: #6366f1;
        }
        .left-desc {
          font-size: 15px;
          color: #64748b;
          line-height: 1.75;
          max-width: 340px;
          margin-top: 28px;
        }

        .trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 100px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #16a34a;
          margin-top: 32px;
        }
        .trust-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .divider-tag {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 600;
          color: #cbd5e1;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: #f1f5f9;
        }

        .field-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-wrapper label {
          font-size: 11.5px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          transition: color 0.2s;
        }
        .field-wrapper:focus-within label {
          color: #4f46e5;
        }
        .field-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          transition: all 0.2s ease;
        }
        .field-inner:focus-within {
          border-color: #a5b4fc;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(165,180,252,0.2);
        }
        .field-icon {
          color: #94a3b8;
          flex-shrink: 0;
          transition: color 0.2s;
        }
        .field-inner:focus-within .field-icon {
          color: #6366f1;
        }
        .eye-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: #475569; }

        @media (max-width: 1024px) {
          .auth-left { display: none; }
          .auth-main { justify-content: center; }
        }
      `}</style>

      <div className="auth-root" dir="ltr">

        {/* ─── Header ─── */}
        <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1360, width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => router.push('/')}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TsswalLogo size={18} style={{ color: 'white' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1.5px solid #e2e8f0', paddingLeft: 14 }}>
              <span className="auth-logo-name">Twassel</span>
              <span className="auth-logo-sub">Gateway Portal</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 100, padding: '8px 16px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <ChevronLeft size={14} /> Back to Home
          </button>
        </header>

        {/* ─── Main ─── */}
        <main
          className="auth-main"
          style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1360, width: '100%', margin: '0 auto', padding: '20px 40px 60px', gap: 60 }}
        >

          {/* Left: Brand copy */}
          <div className="auth-left" style={{ flex: 1, paddingRight: 40 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 18 }}>
                  Oran University Network
                </p>

                <h1 className="left-headline">
                  {mode === "login" ? (
                    <>Welcome<br />back to<br /><em>Twassel</em></>
                  ) : (
                    <>Join the<br />university<br /><em>community</em></>
                  )}
                </h1>

                <WaveLine />

                <p className="left-desc">
                  {mode === "login"
                    ? "Sign in with your academic matricule to access your student dashboard, resources, and university network."
                    : "Create your student account to connect with peers, access resources, and be part of the Oran University ecosystem."}
                </p>

                <div className="trust-badge">
                  <span className="trust-dot" />
                  Secure University Portal
                </div>

                <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { icon: "01", text: "Access your academic resources" },
                    { icon: "02", text: "Connect with fellow students" },
                    { icon: "03", text: "Manage your university profile" },
                  ].map(item => (
                    <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: '#f0f4ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#4f46e5', flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Auth Card */}
          <div style={{ flexShrink: 0, width: '100%', maxWidth: 440 }}>
            <div className="auth-card">

              {/* Tab switcher */}
              <div style={{ display: 'flex', gap: 6, background: '#f8fafc', borderRadius: 100, padding: 4, marginBottom: 28 }}>
                <button className={`tab-btn ${mode === 'login' ? 'active' : 'inactive'}`} onClick={() => setMode("login")} style={{ flex: 1 }}>
                  Sign In
                </button>
                <button className={`tab-btn ${mode === 'register' ? 'active' : 'inactive'}`} onClick={() => setMode("register")} style={{ flex: 1 }}>
                  Register
                </button>
              </div>

              {/* Heading */}
              <AnimatePresence mode="wait">
                <motion.div key={mode + "-heading"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ marginBottom: 24 }}>
                  <h2 className="auth-heading">
                    {mode === "login" ? "Sign in to your account" : "Create your account"}
                  </h2>
                  <p className="auth-sub">
                    {mode === "login"
                      ? "Enter your academic matricule and password to continue."
                      : "Fill in your details to get started with Twassel."}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div className="error-box" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: 20 }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Matricule */}
                <div className="field-wrapper">
                  <label>Academic Matricule</label>
                  <div className="field-inner">
                    <Hash size={15} className="field-icon" />
                    <input
                      type="text" name="matricule" required
                      value={formData.matricule} onChange={handleInputChange}
                      className="field-input" placeholder="2026-ST-XXX"
                    />
                  </div>
                </div>

                {/* Register-only fields */}
                <AnimatePresence>
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}
                    >
                      <div className="field-wrapper">
                        <label>Full Name</label>
                        <div className="field-inner">
                          <User size={15} className="field-icon" />
                          <input
                            type="text" name="fullName" required
                            value={formData.fullName} onChange={handleInputChange}
                            className="field-input" placeholder="Your full name"
                          />
                        </div>
                      </div>

                      <div className="field-wrapper">
                        <label>Institutional Email</label>
                        <div className="field-inner">
                          <Mail size={15} className="field-icon" />
                          <input
                            type="email" name="email" required
                            value={formData.email} onChange={handleInputChange}
                            className="field-input" placeholder="scholar@univ.dz"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password */}
                <div className="field-wrapper">
                  <label>Password</label>
                  <div className="field-inner">
                    <Lock size={15} className="field-icon" />
                    <input
                      type={showPwd ? "text" : "password"} name="password" required
                      value={formData.password} onChange={handleInputChange}
                      className="field-input" placeholder="Enter your password"
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* ID Card Upload */}
                <AnimatePresence>
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setIdCard(e.target.files[0])} style={{ display: 'none' }} />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className={`upload-btn ${idCard ? 'has-file' : ''}`}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            University ID Card
                          </span>
                          <span className="upload-label">
                            {idCard ? idCard.name : "Click to upload your student ID"}
                          </span>
                        </div>
                        {idCard
                          ? <CheckCircle size={18} style={{ color: '#6366f1', flexShrink: 0 }} />
                          : <Camera size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        }
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Divider */}
                <div className="divider-tag" style={{ margin: '4px 0' }}>
                  <div className="divider-line" />
                  <span>{mode === "login" ? "Access" : "Submit"}</span>
                  <div className="divider-line" />
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                    : mode === "login" ? "Sign In to Twassel" : "Create My Account"
                  }
                </button>

                {/* Mode switch hint */}
                <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 700, cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {mode === "login" ? "Register here" : "Sign in instead"}
                  </button>
                </p>

              </form>
            </div>

            {/* Footer note */}
            <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16, lineHeight: 1.6 }}>
              By continuing, you agree to Twassel's terms of service and privacy policy.
            </p>
          </div>

        </main>
      </div>
    </>
  );
}