"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Inbox,
  FileText,
  UserPlus,
  AtSign,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  limit,
  writeBatch,
} from "firebase/firestore";

import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/lib/useLanguage";

const PURPLE = "#7c83f2";
const CREAM = "#F8F8F5";

// Pick an icon for each notification type. Falls back to a generic file icon.
function iconFor(type) {
  switch (type) {
    case "review":      return ShieldCheck;
    case "file_update": return FileText;
    case "new_member":  return UserPlus;
    case "mention":     return AtSign;
    default:            return Bell;
  }
}

// Compact relative-time formatter. `lang` controls the unit suffixes and the
// fallback date locale so the chip never mixes scripts.
function formatWhen(createdAt, lang, t) {
  const justNow = t("common.justNow");
  if (!createdAt) return justNow;
  let d;
  try {
    if (createdAt?.toDate) d = createdAt.toDate();
    else if (createdAt?.seconds) d = new Date(createdAt.seconds * 1000);
    else d = new Date(createdAt);
    if (isNaN(d.getTime())) return justNow;
  } catch {
    return justNow;
  }
  const diff = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (diff < 60) return justNow;
  const locale = lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-US";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    if (lang === "ar") return `${m} د`;
    if (lang === "fr") return `il y a ${m} min`;
    return `${m} min ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    if (lang === "ar") return `${h} س`;
    if (lang === "fr") return `il y a ${h} h`;
    return `${h} h ago`;
  }
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export default function NotificationCenter() {
  const router = useRouter();
  const { userData } = useAuth();
  const { t, lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const wrapRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.read === false).length;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen]);

  // Real-time feed — onSnapshot, no refresh needed.
  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", userData.uid),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("[NOTIF_SUB]", err),
    );
    return () => unsub();
  }, [userData?.uid]);

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(firestore);
      unread.forEach((n) => batch.update(doc(firestore, "notifications", n.id), { read: true }));
      await batch.commit();
    } catch (err) {
      console.error("[NOTIF_MARK_ALL]", err);
    }
  };

  const handleClick = async (n) => {
    if (n.read === false) {
      updateDoc(doc(firestore, "notifications", n.id), { read: true })
        .catch((err) => console.error("[NOTIF_READ]", err));
    }
    setIsOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={wrapRef}>
      {/* ── Bell ───────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={t("notifications.title")}
        aria-expanded={isOpen}
        className="relative w-10 h-10 inline-flex items-center justify-center rounded-full
                   text-[color:var(--c)] hover:bg-[color:var(--c)]/10 transition-colors"
        style={{ "--c": PURPLE }}
      >
        <Bell size={18} strokeWidth={1.8} style={{ color: PURPLE }} />
        {unreadCount > 0 && (
          <span className="absolute top-2 end-2 inline-flex h-2.5 w-2.5">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping"
              style={{ backgroundColor: PURPLE }}
            />
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full ring-2"
              style={{ backgroundColor: PURPLE, boxShadow: `0 0 0 2px ${CREAM}` }}
            />
          </span>
        )}
      </button>

      {/* ── Dropdown ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="absolute end-0 mt-2 z-50 overflow-hidden rounded-2xl shadow-2xl
                       w-[calc(100vw-2rem)] max-w-[360px] sm:w-[360px]
                       border border-slate-200 dark:border-white/10"
            style={{ backgroundColor: CREAM }}
            role="menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="text-start">
                <h3 className="text-sm font-bold text-slate-800 leading-none">
                  {t("notifications.title")}
                </h3>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1.5">
                  {unreadCount > 0 ? `${unreadCount} ${t("status.pending")}` : t("notifications.empty")}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                             text-[11px] font-semibold transition-colors"
                  style={{ color: PURPLE, backgroundColor: `${PURPLE}14` }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${PURPLE}22`)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${PURPLE}14`)}
                >
                  <CheckCheck size={13} /> {t("notifications.markAllRead")}
                </button>
              )}
            </div>

            {/* List */}
            <ul className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto">
              {notifications.length === 0 ? (
                <li className="py-12 px-6 text-center flex flex-col items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl inline-flex items-center justify-center"
                    style={{ backgroundColor: `${PURPLE}14`, color: PURPLE }}
                  >
                    <Inbox size={20} strokeWidth={1.6} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{t("notifications.empty")}</p>
                  <p className="text-xs font-serif italic text-slate-400 leading-relaxed">
                    {t("notifications.title")}
                  </p>
                </li>
              ) : (
                notifications.map((n) => {
                  const Icon = iconFor(n.type);
                  const unread = n.read === false;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleClick(n)}
                        className={`w-full text-start flex gap-3 px-5 py-4 border-b border-slate-100
                                    last:border-b-0 transition-colors group
                                    ${unread ? "bg-white" : "bg-transparent hover:bg-white/60"}`}
                      >
                        {/* Type icon */}
                        <span
                          className="w-9 h-9 rounded-xl inline-flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: unread ? PURPLE : `${PURPLE}14`,
                            color: unread ? "#fff" : PURPLE,
                          }}
                        >
                          <Icon size={15} strokeWidth={1.8} />
                        </span>

                        {/* Text block */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-[13px] leading-snug truncate
                                          ${unread ? "font-semibold text-slate-800" : "font-medium text-slate-500"}`}
                            >
                              {n.title}
                            </p>
                            {unread && (
                              <span
                                className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: PURPLE }}
                              />
                            )}
                          </div>
                          {n.body && (
                            <p className="text-[12px] font-serif italic text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {n.body}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-medium text-slate-400">
                            <span>{formatWhen(n.createdAt, lang, t)}</span>
                            {n.link && (
                              <ChevronRight
                                size={11}
                                data-flip-rtl
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: PURPLE }}
                              />
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
