"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Loader2, CheckCircle,
  Mail, GraduationCap, Hash, Code2 as Github, Briefcase as Linkedin, Globe,
  Pencil, X, Save, ChevronRight, CalendarDays,
  Layers, FileText, AlertCircle,
} from "lucide-react";

import { useAuth } from "@/lib/useAuth";
import { firestore, auth } from "@/lib/firebase";
import {
  doc, updateDoc, collection, query, where,
  getCountFromServer, onSnapshot,
} from "firebase/firestore";

import Sidebar from "@/components/Sidebar";
import LinkField from "@/components/LinkField";
import { COL } from "@/lib/collectionNames";

// ─── Helpers ─────────────────────────────────────────────────────
function formatJoinDate(createdAt) {
  if (!createdAt) return "—";
  try {
    let d;
    if (typeof createdAt === "string") d = new Date(createdAt);
    else if (createdAt?.toDate) d = createdAt.toDate();
    else if (createdAt?._seconds) d = new Date(createdAt._seconds * 1000);
    else if (createdAt?.seconds) d = new Date(createdAt.seconds * 1000);
    else d = new Date(createdAt);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

// ─── Stat card ───────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-paper dark:bg-white/[0.04] border border-sand dark:border-white/10
                 rounded-2xl p-5 shadow-soft transition-colors duration-500"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
          {label}
        </p>
        <span className={`w-8 h-8 inline-flex items-center justify-center rounded-xl
                         ${accent
                           ? "bg-accent/10 text-accent"
                           : "bg-sand/40 dark:bg-white/5 text-ink-muted dark:text-slate-400"}`}>
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold font-display text-ink dark:text-white">
        {value}
      </p>
    </motion.div>
  );
}

// ─── Edit Profile Modal ──────────────────────────────────────────
function EditProfileModal({ open, onClose, userData, onSaved }) {
  const [form, setForm] = useState({
    fullName: "",
    major: "",
    bio: "",
    github: "",
    linkedin: "",
    portfolio: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !userData) return;
    setError("");
    setForm({
      fullName: userData.fullName || "",
      major: userData.major || "",
      bio: userData.bio || "",
      github: userData.socialLinks?.github || "",
      linkedin: userData.socialLinks?.linkedin || "",
      portfolio: userData.socialLinks?.portfolio || "",
    });
  }, [open, userData]);

  const handleChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError("");

    if (form.fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }
    if (form.bio.length > 500) {
      setError("Bio must be 500 characters or less.");
      return;
    }

    const validateUrl = (u, label) => {
      if (!u) return null;
      if (!/^https?:\/\//i.test(u.trim())) return `${label} — must start with https://`;
      return null;
    };
    const urlErr =
      validateUrl(form.github, "GitHub") ||
      validateUrl(form.linkedin, "LinkedIn") ||
      validateUrl(form.portfolio, "Portfolio");
    if (urlErr) {
      setError(urlErr);
      return;
    }

    setSaving(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          major: form.major.trim(),
          bio: form.bio.trim(),
          socialLinks: {
            github: form.github.trim(),
            linkedin: form.linkedin.trim(),
            portfolio: form.portfolio.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Could not save");
        return;
      }
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Profile save error:", err);
      setError("Network error. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-6"
          onClick={onClose}
        >
          <motion.form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="w-full md:max-w-xl bg-paper dark:bg-[#1c1a26] border border-sand dark:border-white/10
                       rounded-t-3xl md:rounded-3xl shadow-warm overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-sand dark:border-white/10">
              <div>
                <h2 className="text-xl font-display font-bold italic text-ink dark:text-white">
                  Edit Profile
                </h2>
                <p className="text-xs text-ink-faint mt-1">
                  My Academic Profile
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 inline-flex items-center justify-center rounded-full
                           hover:bg-sand/40 dark:hover:bg-white/5 text-ink-muted dark:text-slate-400 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <Field label="Full name">
                <input
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  className={inputCls}
                  placeholder="Enter your full name"
                />
              </Field>

              <Field label="Major">
                <input
                  value={form.major}
                  onChange={handleChange("major")}
                  className={inputCls}
                  placeholder="Major"
                />
              </Field>

              <Field label="Bio" hint={`${form.bio.length}/500`}>
                <textarea
                  value={form.bio}
                  onChange={handleChange("bio")}
                  rows={4}
                  maxLength={500}
                  className={`${inputCls} font-display italic leading-relaxed resize-none`}
                  placeholder="Tell us about your academic interests…"
                />
              </Field>

              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent mb-3">
                  Professional links
                </p>
                <div className="space-y-3">
                  <LinkField iconName="github"   label="GitHub"    value={form.github}    onChange={handleChange("github")}    placeholder="https://..." />
                  <LinkField iconName="linkedin" label="LinkedIn"  value={form.linkedin}  onChange={handleChange("linkedin")}  placeholder="https://..." />
                  <LinkField iconName="globe"    label="Portfolio" value={form.portfolio} onChange={handleChange("portfolio")} placeholder="https://..." />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-rose-500 bg-rose-500/5 border border-rose-500/20 rounded-xl px-3 py-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-sand dark:border-white/10 bg-cream/40 dark:bg-white/[0.02]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-ink-muted dark:text-slate-300
                           hover:bg-sand/40 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                           bg-accent text-white shadow-soft
                           hover:brightness-110 transition disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls =
  "w-full px-4 py-3 rounded-xl bg-cream dark:bg-white/5 " +
  "border border-sand dark:border-white/10 " +
  "text-sm text-ink dark:text-white placeholder:text-ink-faint " +
  "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 " +
  "transition";

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
          {label}
        </span>
        {hint && <span className="text-[10px] text-ink-faint">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);

  const [stats, setStats] = useState({ groupsCount: 0, resourcesCount: 0 });
  const [groups, setGroups] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState(false);

  // 1. Realtime user groups (for sidebar)
  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(
      collection(firestore, COL.GROUPS),
      where("members", "array-contains", userData.uid)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => setGroups(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("[Profile] groups listener:", err)
    );
    return () => unsub();
  }, [userData?.uid]);

  // 2. Live counts (Nodes joined + Resources contributed)
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const groupsQuery = query(
          collection(firestore, COL.GROUPS),
          where("members", "array-contains", user.uid)
        );
        const groupsSnap = await getCountFromServer(groupsQuery);

        let resourcesCount = 0;
        try {
          const resQuery = query(
            collection(firestore, COL.RESOURCES),
            where("uploadedBy", "==", user.uid)
          );
          const resSnap = await getCountFromServer(resQuery);
          resourcesCount = resSnap.data().count;
        } catch {
          // collection may not exist or rules may block — degrade silently to 0
        }

        if (!cancelled) {
          setStats({
            groupsCount: groupsSnap.data().count,
            resourcesCount,
          });
        }
      } catch (e) {
        console.error("Stats fetch error:", e);
      }
    };

    fetchStats();
    return () => { cancelled = true; };
  }, [user?.uid]);

  // 3. Avatar upload — Cloudinary via existing /api/upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      console.warn("Avatar must be an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      console.warn("Avatar too large (max 5MB).");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "tawassol/avatars");

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();

      if (data.url) {
        await updateDoc(doc(firestore, COL.USERS, user.uid), { avatarUrl: data.url });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const social = userData?.socialLinks || {};
  const hasAnyLink = !!(social.github || social.linkedin || social.portfolio);
  const joinDate = useMemo(() => formatJoinDate(userData?.createdAt), [userData?.createdAt]);
  const academicTitle = userData?.major || userData?.department || "Scholar";

  if (authLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-[#0e0d14] transition-colors duration-500">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cream dark:bg-[#0e0d14] font-sans
                    text-ink dark:text-white transition-colors duration-500">

      <Sidebar currentUser={userData} groups={groups} />

      <main className="flex-1 lg:ms-[280px] h-screen overflow-y-auto hide-scrollbar
                       pb-24 px-5 pt-6 md:px-10 md:pt-10 lg:px-14">
        <div className="max-w-5xl mx-auto">

          {/* ─── Top quick controls ──────────────────────────── */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
                Academic Node
              </p>
              <h1 className="text-2xl md:text-3xl font-display italic font-bold mt-1 text-ink dark:text-white">
                My Academic Profile
              </h1>
            </div>
          </div>

          {/* ─── Identity Header Card ────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-sand dark:border-white/10
                       bg-paper dark:bg-white/[0.04] shadow-soft p-8 md:p-10
                       transition-colors duration-500"
          >
            {/* soft purple aura */}
            <div className="absolute -top-24 -end-24 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                <div
                  className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden
                             ring-4 ring-accent/80 ring-offset-4 ring-offset-paper dark:ring-offset-[#1a1820]
                             bg-cream dark:bg-white/5 relative"
                  style={{ boxShadow: "0 0 0 1px rgba(124,131,242,0.15), 0 12px 30px -10px rgba(124,131,242,0.35)" }}
                >
                  {userData.avatarUrl ? (
                    <img src={userData.avatarUrl} alt={userData.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-accent
                                    bg-accent/10 font-display italic font-bold text-5xl">
                      {(userData.fullName?.[0] || "S").toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center
                               opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Update photo"
                  >
                    <Camera size={24} className="text-white" />
                  </button>
                </div>

                {uploading && (
                  <div className="absolute -bottom-1 -end-1 bg-paper dark:bg-[#1c1a26] p-2 rounded-full
                                  shadow-warm border border-sand dark:border-white/10">
                    <Loader2 className="animate-spin text-accent" size={16} />
                  </div>
                )}
                {success && (
                  <div className="absolute -bottom-1 -end-1 bg-accent p-2 rounded-full shadow-warm text-white">
                    <CheckCircle size={16} />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* Identity text */}
              <div className="flex-1 text-center md:text-start">
                <h2 className="text-3xl md:text-4xl font-display italic font-bold leading-tight text-ink dark:text-white">
                  {userData.fullName}
                </h2>
                <p className="mt-2 text-sm md:text-base text-accent font-semibold">
                  {academicTitle}
                </p>

                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2 text-xs text-ink-muted dark:text-slate-400 rtl:justify-end">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={13} className="text-accent" />{userData.email}
                  </span>
                  {userData.matricule && (
                    <span className="inline-flex items-center gap-1.5">
                      <Hash size={13} className="text-accent" />{userData.matricule}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-accent" />
                    {userData.university || "University of Oran 1"}
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                               bg-accent text-white text-sm font-semibold shadow-soft
                               hover:brightness-110 transition"
                  >
                    <Pencil size={14} /> Edit Profile
                  </button>
                  {hasAnyLink && (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                                    bg-accent/10 text-accent border border-accent/20">
                      {social.github && (
                        <a href={social.github} target="_blank" rel="noopener noreferrer"
                           aria-label="GitHub"
                           className="hover:opacity-80 transition">
                          <Github size={16} />
                        </a>
                      )}
                      {social.linkedin && (
                        <a href={social.linkedin} target="_blank" rel="noopener noreferrer"
                           aria-label="LinkedIn"
                           className="hover:opacity-80 transition">
                          <Linkedin size={16} />
                        </a>
                      )}
                      {social.portfolio && (
                        <a href={social.portfolio} target="_blank" rel="noopener noreferrer"
                           aria-label="Portfolio"
                           className="hover:opacity-80 transition">
                          <Globe size={16} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* ─── Stats Grid ──────────────────────────────────── */}
          <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={Layers} label="Nodes Joined" value={stats.groupsCount} accent />
            <StatCard icon={FileText} label="Resources" value={stats.resourcesCount} />
            <StatCard icon={CalendarDays} label="Joined" value={joinDate} />
          </section>

          {/* ─── Bio + Links Grid ────────────────────────────── */}
          <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bio */}
            <div className="lg:col-span-2 rounded-3xl border border-sand dark:border-white/10
                            bg-paper dark:bg-white/[0.04] p-7 shadow-soft transition-colors duration-500">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                  Academic Bio
                </p>
                <button
                  onClick={() => setEditing(true)}
                  className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint
                             hover:text-accent transition"
                >
                  Edit
                </button>
              </div>
              {userData.bio ? (
                <p className="font-display italic text-base md:text-lg leading-relaxed text-ink dark:text-slate-200">
                  “{userData.bio}”
                </p>
              ) : (
                <p className="font-display italic text-ink-faint">
                  No bio yet. Add a short note about your research interests, projects, and what you're studying.
                </p>
              )}
            </div>

            {/* Professional Links */}
            <div className="rounded-3xl border border-sand dark:border-white/10
                            bg-paper dark:bg-white/[0.04] p-7 shadow-soft transition-colors duration-500">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent mb-5">
                Professional Links
              </p>

              {hasAnyLink ? (
                <ul className="space-y-2">
                  {social.github && (
                    <SocialRow href={social.github} icon={Github} label="GitHub" host="github.com" />
                  )}
                  {social.linkedin && (
                    <SocialRow href={social.linkedin} icon={Linkedin} label="LinkedIn" host="linkedin.com" />
                  )}
                  {social.portfolio && (
                    <SocialRow href={social.portfolio} icon={Globe} label="Portfolio" host="web" />
                  )}
                </ul>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full text-left text-sm text-ink-faint hover:text-accent transition"
                >
                  Add GitHub, LinkedIn, or a portfolio link to showcase your work.
                </button>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Edit Modal */}
      <EditProfileModal
        open={editing}
        onClose={() => setEditing(false)}
        userData={userData}
      />

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function SocialRow({ href, icon: Icon, label, host }) {
  let display = host;
  try {
    display = new URL(href).hostname.replace(/^www\./, "");
  } catch { /* keep fallback */ }

  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-3 rounded-2xl
                   border border-sand dark:border-white/10
                   hover:border-accent/50 hover:bg-accent/5
                   transition group"
      >
        <span className="w-9 h-9 inline-flex items-center justify-center rounded-xl
                         bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition">
          <Icon size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink dark:text-white">{label}</p>
          <p className="text-xs text-ink-faint truncate">{display}</p>
        </div>
        <ChevronRight size={14} className="text-ink-faint group-hover:text-accent transition" />
      </a>
    </li>
  );
}
