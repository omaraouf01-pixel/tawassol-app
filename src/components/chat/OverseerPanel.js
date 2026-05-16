"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Settings, UserCheck, FileCheck2, X, Check, Loader2,
  Edit3, Info, Lock, Save, FileText, AlertCircle, Globe, KeyRound,
} from "lucide-react";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, deleteDoc, arrayUnion, increment,
  addDoc, serverTimestamp,
} from "firebase/firestore";
import { firestore as db, auth } from "@/lib/firebase";
import { COL } from "@/lib/collectionNames";
import { useJoinRequests } from "@/lib/useJoinRequests";
import { useLanguage } from "@/lib/useLanguage";

// ════════════════════════════════════════════════════════════════
// OverseerPanel — لوحة تحكم المشرف داخل الشات
// زر إدارة + لوحة جانبية بثلاث تبويبات (طلبات، ملفات، إعدادات)
// الهوية: كريمي #F8F8F5 — أرجواني #7c83f2 — Serif Italic للعناوين
// ════════════════════════════════════════════════════════════════

export default function OverseerPanel({ groupId, group, isLeader }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("requests");
  const [toast, setToast] = useState("");

  // ── طلبات الانضمام (لحظي) ─────────────────────────────────
  const { requests: joinRequests } = useJoinRequests(groupId, isLeader);

  // ── الملفات المعلقة في رسائل المجموعة (لحظي) ──────────────
  const [pendingFiles, setPendingFiles] = useState([]);
  useEffect(() => {
    if (!groupId || !isLeader) {
      setPendingFiles([]);
      return;
    }
    const q = query(
      collection(db, COL.MESSAGES),
      where("groupId", "==", groupId),
      where("moderationStatus", "==", "pending"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const onlyFiles = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.fileUrl);
      setPendingFiles(onlyFiles);
    });
    return () => unsub();
  }, [groupId, isLeader]);

  const pendingCount = joinRequests.length + pendingFiles.length;

  // ── تنبيه عابر ────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  if (!isLeader) return null;

  return (
    <>
      {/* ─── الزر العائم (Trigger) ─── */}
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 text-ink-faint hover:text-accent hover:bg-accent-soft rounded-xl transition-all"
        title={t("chat.moderation.title")}
        aria-label={t("chat.moderation.title")}
      >
        <Shield size={18} />
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-black flex items-center justify-center shadow-soft border-2 border-paper"
            >
              {pendingCount > 9 ? "9+" : pendingCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ─── اللوحة الجانبية ─── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-[180]"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="fixed top-0 end-0 h-screen w-full sm:w-[460px] bg-cream dark:bg-paper border-s border-sand z-[190] flex flex-col shadow-warm"
              style={{ backgroundColor: "rgb(var(--c-cream))" }}
            >
              <PanelHeader group={group} onClose={() => setOpen(false)} t={t} />

              <Tabs
                tab={tab}
                setTab={setTab}
                joinCount={joinRequests.length}
                fileCount={pendingFiles.length}
                t={t}
              />

              <div className="flex-1 overflow-y-auto p-6">
                {tab === "requests" && (
                  <JoinRequestsTab
                    groupId={groupId}
                    requests={joinRequests}
                    setToast={setToast}
                    t={t}
                  />
                )}
                {tab === "files" && (
                  <FilesTab files={pendingFiles} setToast={setToast} t={t} />
                )}
                {tab === "settings" && (
                  <SettingsTab group={group} setToast={setToast} t={t} />
                )}
              </div>

              <div className="px-6 py-3 border-t border-sand bg-paper/60 text-center">
                <p className="text-[8px] font-black text-ink-faint uppercase tracking-[0.25em]">
                  {t("roles.overseer")} · {group?.name}
                </p>
              </div>
            </motion.aside>

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="fixed bottom-6 end-6 z-[200] bg-ink text-cream px-5 py-3 rounded-xl shadow-warm text-sm font-semibold italic font-display"
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// Header
// ════════════════════════════════════════════════════════════════
function PanelHeader({ group, onClose, t }) {
  return (
    <div className="px-6 py-5 border-b border-sand bg-paper flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-accent-soft border border-accent/20 rounded-2xl flex items-center justify-center text-accent">
          <Shield size={20} />
        </div>
        <div>
          <h3 className="text-lg font-display italic font-bold text-ink leading-none">
            {t("chat.moderation.title")}
          </h3>
          <p className="text-[8px] font-black uppercase text-ink-faint tracking-[0.28em] mt-2">
            {t("roles.overseer")}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        aria-label={t("common.close")}
        className="p-2 text-ink-faint hover:text-ink bg-sand/40 hover:bg-sand rounded-xl transition-all"
      >
        <X size={18} />
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tabs
// ════════════════════════════════════════════════════════════════
function Tabs({ tab, setTab, joinCount, fileCount, t }) {
  const items = [
    { key: "requests", label: t("chat.joinRequests.title"), icon: UserCheck, count: joinCount },
    { key: "files",    label: t("chat.resources.title"),    icon: FileCheck2, count: fileCount },
    { key: "settings", label: t("chat.settings.title"),     icon: Settings, count: 0 },
  ];
  return (
    <div className="px-4 pt-4 bg-paper border-b border-sand">
      <div className="flex gap-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.key;
          return (
            <button
              key={it.key}
              onClick={() => setTab(it.key)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all
                ${active
                  ? "text-accent bg-cream border-x border-t border-sand"
                  : "text-ink-faint hover:text-ink"}`}
            >
              <Icon size={13} />
              <span>{it.label}</span>
              {it.count > 0 && (
                <span className="ms-1 min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-white text-[9px] flex items-center justify-center">
                  {it.count}
                </span>
              )}
              {active && (
                <motion.div
                  layoutId="tabUnderline"
                  className="absolute -bottom-px start-2 end-2 h-[2px] bg-accent rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab 1 — Join Requests
// ════════════════════════════════════════════════════════════════
function JoinRequestsTab({ groupId, requests, setToast, t }) {
  const [busyId, setBusyId] = useState(null);

  const decide = async (req, approve) => {
    setBusyId(req.id);
    try {
      if (approve) {
        const groupRef = doc(db, COL.GROUPS, groupId);
        await updateDoc(groupRef, {
          members: arrayUnion(req.userId),
          memberCount: increment(1),
        });

        // Welcome system message — uses the overseer's real UID so the rule
        //   request.auth.uid == resource.data.uid
        // is satisfied. Marked isSystem so the chat renders it as a pill.
        const overseerUid = auth?.currentUser?.uid;
        if (overseerUid) {
          await addDoc(collection(db, COL.MESSAGES), {
            groupId,
            uid: overseerUid,
            role: "overseer",
            senderName: "Node Protocol",
            content: t("chat.system.memberJoined", { name: req.userName || t("common.anonymous") }),
            isSystem: true,
            moderationStatus: "approved",
            createdAt: serverTimestamp(),
          });
        }
      }
      const reqRef = doc(db, COL.JOIN_REQUESTS, req.id);
      await updateDoc(reqRef, { status: approve ? "approved" : "rejected" });
      setToast(approve ? t("chat.joinRequests.accepted") : t("chat.joinRequests.declined"));
    } catch (e) {
      console.error(e);
      setToast(t("chat.joinRequests.actionError"));
    } finally {
      setBusyId(null);
    }
  };

  if (!requests.length) {
    return <EmptyState icon={UserCheck} message={t("chat.joinRequests.empty")} />;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {requests.map((req) => (
          <motion.div
            key={req.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-paper border border-sand rounded-2xl p-4 hover:border-accent/30 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink italic font-display truncate">
                  {req.userName || t("common.anonymous")}
                </p>
                {req.matricule && (
                  <p className="text-[10px] text-ink-faint font-mono mt-0.5">
                    #{req.matricule}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => decide(req, false)}
                  disabled={busyId === req.id}
                  className="p-2 bg-sand/40 text-ink-faint hover:bg-ink hover:text-cream rounded-lg transition-all disabled:opacity-50"
                  title={t("chat.joinRequests.decline")}
                  aria-label={t("chat.joinRequests.decline")}
                >
                  {busyId === req.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <X size={14} />}
                </button>
                <button
                  onClick={() => decide(req, true)}
                  disabled={busyId === req.id}
                  className="p-2 bg-accent-soft text-accent hover:bg-accent hover:text-white rounded-lg transition-all disabled:opacity-50"
                  title={t("chat.joinRequests.accept")}
                  aria-label={t("chat.joinRequests.accept")}
                >
                  {busyId === req.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Check size={14} />}
                </button>
              </div>
            </div>

            {Array.isArray(req.answers) && req.answers.length > 0 && (
              <div className="mt-3 pt-3 border-t border-sand/70 space-y-2">
                {req.answers.map((a, i) => (
                  <div key={i} className="text-[11px]">
                    <p className="text-ink-faint italic font-serif leading-relaxed">
                      &ldquo;{a}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab 2 — File / Resource Approval
// ════════════════════════════════════════════════════════════════
function FilesTab({ files, setToast, t }) {
  const [busyId, setBusyId] = useState(null);

  const decide = async (msg, approve) => {
    setBusyId(msg.id);
    try {
      const ref = doc(db, COL.MESSAGES, msg.id);
      if (approve) {
        await updateDoc(ref, { moderationStatus: "approved" });
        setToast(t("chat.moderation.approved"));
      } else {
        await deleteDoc(ref);
        setToast(t("chat.moderation.rejected"));
      }
    } catch (e) {
      console.error(e);
      setToast(t("chat.moderation.actionError"));
    } finally {
      setBusyId(null);
    }
  };

  if (!files.length) {
    return <EmptyState icon={FileCheck2} message={t("chat.moderation.noPending")} />;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {files.map((msg) => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-paper border border-sand rounded-2xl p-4 hover:border-accent/30 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-accent-soft text-accent rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink truncate">
                    {msg.fileName || t("common.untitled")}
                  </p>
                  <p className="text-[10px] text-ink-faint italic font-serif mt-0.5 truncate">
                    {msg.senderName || msg.authorName || t("common.anonymous")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => decide(msg, false)}
                  disabled={busyId === msg.id}
                  className="p-2 bg-sand/40 text-ink-faint hover:bg-ink hover:text-cream rounded-lg transition-all disabled:opacity-50"
                  title={t("chat.moderation.reject")}
                  aria-label={t("chat.moderation.reject")}
                >
                  {busyId === msg.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <X size={14} />}
                </button>
                <button
                  onClick={() => decide(msg, true)}
                  disabled={busyId === msg.id}
                  className="p-2 bg-accent-soft text-accent hover:bg-accent hover:text-white rounded-lg transition-all disabled:opacity-50"
                  title={t("chat.moderation.approve")}
                  aria-label={t("chat.moderation.approve")}
                >
                  {busyId === msg.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Check size={14} />}
                </button>
              </div>
            </div>

            {(msg.content || msg.text) && (
              <p className="text-[11px] text-ink-faint italic font-serif mt-3 pt-3 border-t border-sand/70 leading-relaxed line-clamp-2">
                &ldquo;{msg.content || msg.text}&rdquo;
              </p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab 3 — Node Settings
// ════════════════════════════════════════════════════════════════
function SettingsTab({ group, setToast, t }) {
  const [form, setForm] = useState({
    name: group?.name || "",
    description: group?.description || "",
    rules: group?.rules || "",
    accessType: group?.accessType || "open",
  });
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => {
    if (!group) return false;
    return (
      form.name !== (group.name || "") ||
      form.description !== (group.description || "") ||
      form.rules !== (group.rules || "") ||
      form.accessType !== (group.accessType || "open")
    );
  }, [form, group]);

  const save = async (e) => {
    e?.preventDefault();
    if (!group?.id) return;
    setSaving(true);
    try {
      const ref = doc(db, COL.GROUPS, group.id);
      await updateDoc(ref, {
        name: form.name.trim(),
        description: form.description,
        rules: form.rules,
        accessType: form.accessType === "protected" ? "protected" : "open",
      });
      setToast(t("chat.settings.saved"));
    } catch (e) {
      console.error(e);
      setToast(t("chat.settings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <Field icon={Edit3} label={t("chat.settings.nameLabel")}>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-paper border border-sand rounded-xl py-3 px-4 text-ink text-sm outline-none focus:border-accent transition-all font-semibold"
        />
      </Field>

      <Field icon={Info} label={t("chat.settings.descLabel")}>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          placeholder={t("groupsCreate.descPlaceholder")}
          className="w-full bg-paper border border-sand rounded-xl py-3 px-4 text-ink text-sm outline-none focus:border-accent transition-all italic font-serif resize-none"
        />
      </Field>

      <Field icon={Lock} label={t("chat.settings.title")}>
        <textarea
          value={form.rules}
          onChange={(e) => setForm({ ...form, rules: e.target.value })}
          rows={3}
          placeholder={t("groupsCreate.descPlaceholder")}
          className="w-full bg-accent-soft/50 border border-accent/15 rounded-xl py-3 px-4 text-ink text-sm outline-none focus:border-accent transition-all italic font-serif resize-none"
        />
      </Field>

      <div className="space-y-3">
        <label className="text-[9px] font-black uppercase text-ink-faint tracking-[0.2em] flex items-center gap-2">
          <Shield size={11} /> {t("groupsCreate.visibilityLabel")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <AccessOption
            active={form.accessType === "open"}
            onClick={() => setForm({ ...form, accessType: "open" })}
            icon={Globe}
            title={t("privacy.public")}
            sub={t("groupsCreate.visibilityPublic")}
          />
          <AccessOption
            active={form.accessType === "protected"}
            onClick={() => setForm({ ...form, accessType: "protected" })}
            icon={KeyRound}
            title={t("privacy.scholarsOnly")}
            sub={t("groupsCreate.visibilityPrivate")}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!dirty || saving}
        className="w-full py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-ink transition-all flex items-center justify-center gap-2 shadow-soft disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving
          ? <Loader2 size={14} className="animate-spin" />
          : <Save size={14} />}
        {saving ? t("common.saving") : t("chat.settings.save")}
      </button>
    </form>
  );
}

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════
function Field({ icon: Icon, label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black uppercase text-ink-faint tracking-[0.2em] flex items-center gap-2">
        <Icon size={11} /> {label}
      </label>
      {children}
    </div>
  );
}

function AccessOption({ active, onClick, icon: Icon, title, sub }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-start p-4 rounded-xl border transition-all
        ${active
          ? "bg-accent-soft border-accent text-accent shadow-soft"
          : "bg-paper border-sand text-ink-faint hover:border-accent/40 hover:text-ink"}`}
    >
      <Icon size={16} className="mb-2" />
      <div className="text-xs font-bold italic font-display">{title}</div>
      <div className="text-[9px] uppercase tracking-wider mt-1 opacity-80">{sub}</div>
    </button>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-ink-faint opacity-60">
      <div className="w-14 h-14 bg-accent-soft/60 rounded-2xl flex items-center justify-center text-accent">
        <Icon size={22} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em]">
        {message}
      </p>
    </div>
  );
}
