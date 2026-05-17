"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  Mail,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Users,
  Send,
} from "lucide-react";

import { auth, firestore } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { COL } from "@/lib/collectionNames";

// ─── Shared modal shell ──────────────────────────────────────────
function ModalShell({ open, onClose, children, labelledBy }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[120] flex items-end md:items-center justify-center
                     bg-black/45 backdrop-blur-md p-0 md:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="w-full md:max-w-md bg-paper dark:bg-[#1c1a26]
                       border border-sand dark:border-white/10
                       rounded-t-3xl md:rounded-3xl shadow-warm overflow-hidden"
            style={{ backgroundColor: undefined }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Flash({ flash }) {
  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={`mx-6 mb-2 flex items-start gap-2 rounded-xl px-3 py-2 text-xs
                      ${flash.tone === "ok"
                        ? "bg-accent/10 text-accent border border-accent/20"
                        : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}
        >
          {flash.tone === "ok"
            ? <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
            : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
          <span className="font-serif italic leading-snug">{flash.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Security Modal ──────────────────────────────────────────────
export function SecurityModal({ open, onClose, currentUser }) {
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (!open) {
      setFlash(null);
      setSending(false);
    }
  }, [open]);

  const email = currentUser?.email || auth.currentUser?.email;

  const handleSend = async () => {
    if (sending) return;
    if (!email) {
      setFlash({ tone: "error", text: "Academic email unavailable — please sign in again." });
      return;
    }
    setSending(true);
    setFlash(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setFlash({ tone: "ok", text: "Reset link sent to your email." });
      setTimeout(() => { onClose?.(); }, 1600);
    } catch (err) {
      console.error("[SECURITY_MODAL]", err);
      setFlash({ tone: "error", text: "Could not send the link. Try again later." });
      setSending(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="security-modal-title">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-start gap-4 border-b border-sand dark:border-white/10">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent
                        inline-flex items-center justify-center flex-shrink-0">
          <Shield size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 id="security-modal-title"
              className="text-lg font-display italic font-bold text-ink dark:text-white">
            Security Update
          </h2>
          <p className="text-xs text-ink-faint mt-1 font-serif italic leading-relaxed">
            Send a secure link to reset your password
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 inline-flex items-center justify-center rounded-full
                     hover:bg-sand/40 dark:hover:bg-white/5
                     text-ink-muted dark:text-slate-400 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-ink-muted dark:text-slate-300 leading-relaxed text-start">
          A secure password reset link will be sent to your academic email. Open the link on the same device within one hour to complete the process.
        </p>

        {email && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl
                          bg-cream dark:bg-white/5
                          border border-sand dark:border-white/10">
            <span className="w-8 h-8 inline-flex items-center justify-center rounded-lg
                             bg-accent/10 text-accent flex-shrink-0">
              <Mail size={14} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                Destination
              </p>
              <p className="text-sm text-ink dark:text-white truncate">{email}</p>
            </div>
          </div>
        )}
      </div>

      <Flash flash={flash} />

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4
                      border-t border-sand dark:border-white/10
                      bg-cream/50 dark:bg-white/[0.02]">
        <button
          type="button"
          onClick={onClose}
          disabled={sending}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold
                     text-ink-muted dark:text-slate-300
                     hover:bg-sand/40 dark:hover:bg-white/5
                     transition disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !email}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     text-sm font-semibold bg-accent text-white shadow-soft
                     hover:brightness-110 transition
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sending
            ? <Loader2 size={15} className="animate-spin" />
            : <Send size={15} data-flip-rtl />}
          {sending ? "Sending…" : "Send link"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Privacy Modal ───────────────────────────────────────────────
const PRIVACY_OPTIONS = [
  {
    value: "public",
    icon: Globe,
    title: "Public",
    desc: "Your profile and academic links are visible to all university scholars.",
  },
  {
    value: "scholars_only",
    icon: Users,
    title: "Node members only",
    desc: "Your profile is only visible to peers in your shared nodes.",
  },
];

export function PrivacyModal({ open, onClose, currentUser }) {
  const initial = currentUser?.profileVisibility === "scholars_only" ? "scholars_only" : "public";
  const [choice, setChoice] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (open) {
      setChoice(currentUser?.profileVisibility === "scholars_only" ? "scholars_only" : "public");
      setFlash(null);
      setSaving(false);
    }
  }, [open, currentUser?.profileVisibility]);

  const handleSave = async () => {
    if (saving) return;
    if (!currentUser?.uid) {
      setFlash({ tone: "error", text: "Could not identify user." });
      return;
    }
    setSaving(true);
    setFlash(null);
    try {
      await updateDoc(doc(firestore, COL.USERS, currentUser.uid), {
        profileVisibility: choice,
      });
      setFlash({
        tone: "ok",
        text: choice === "scholars_only"
          ? "Saved — your profile is visible to node peers only."
          : "Saved — your profile is visible to all university scholars.",
      });
      setTimeout(() => { onClose?.(); }, 1400);
    } catch (err) {
      console.error("[PRIVACY_MODAL]", err);
      setFlash({ tone: "error", text: "Could not update privacy settings." });
      setSaving(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="privacy-modal-title">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-start gap-4 border-b border-sand dark:border-white/10">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent
                        inline-flex items-center justify-center flex-shrink-0">
          <Lock size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 id="privacy-modal-title"
              className="text-lg font-display italic font-bold text-ink dark:text-white">
            Privacy Level
          </h2>
          <p className="text-xs text-ink-faint mt-1 font-serif italic leading-relaxed">
            Control who can see your academic profile
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 inline-flex items-center justify-center rounded-full
                     hover:bg-sand/40 dark:hover:bg-white/5
                     text-ink-muted dark:text-slate-400 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body — radio cards */}
      <div className="px-6 py-5 space-y-3" role="radiogroup" aria-label="Privacy level">
        {PRIVACY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = choice === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setChoice(opt.value)}
              disabled={saving}
              className={`w-full text-start flex items-start gap-3 px-4 py-3 rounded-2xl border transition
                          ${active
                            ? "border-accent bg-accent/5 shadow-soft"
                            : "border-sand dark:border-white/10 hover:border-accent/40 hover:bg-accent/5"}
                          disabled:opacity-60`}
            >
              <span className={`w-9 h-9 inline-flex items-center justify-center rounded-xl flex-shrink-0 transition
                                 ${active
                                   ? "bg-accent text-white"
                                   : "bg-accent/10 text-accent"}`}>
                <Icon size={16} />
              </span>

              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-ink dark:text-white">
                  {opt.title}
                </span>
                <span className="block text-xs text-ink-muted dark:text-slate-400 mt-0.5 leading-relaxed">
                  {opt.desc}
                </span>
              </span>

              <span className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition
                                 ${active
                                   ? "border-accent"
                                   : "border-sand dark:border-white/20"}`}>
                {active && <span className="w-2.5 h-2.5 rounded-full bg-accent" />}
              </span>
            </button>
          );
        })}
      </div>

      <Flash flash={flash} />

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4
                      border-t border-sand dark:border-white/10
                      bg-cream/50 dark:bg-white/[0.02]">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold
                     text-ink-muted dark:text-slate-300
                     hover:bg-sand/40 dark:hover:bg-white/5
                     transition disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || choice === initial}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     text-sm font-semibold bg-accent text-white shadow-soft
                     hover:brightness-110 transition
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving
            ? <Loader2 size={15} className="animate-spin" />
            : <CheckCircle2 size={15} />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </ModalShell>
  );
}
