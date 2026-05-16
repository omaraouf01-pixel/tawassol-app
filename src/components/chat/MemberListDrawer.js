"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Search, Loader2, GraduationCap } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { COL } from "@/lib/collectionNames";
import { useLanguage } from "@/lib/useLanguage";

const ACADEMIC_PURPLE = "#7c83f2";
const CREAM = "#F8F8F5";

function isOnline(member) {
  if (typeof member?.online === "boolean") return member.online;
  const ts = member?.lastSeen?.toMillis?.() ?? member?.lastSeen;
  if (!ts) return false;
  return Date.now() - ts < 3 * 60 * 1000;
}

function PresenceDot({ online, t }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
        online ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-slate-400/60"
      }`}
      title={online ? t("chat.members.online") : t("chat.members.offline")}
    />
  );
}

function MemberRow({ member, isOverseer, t }) {
  const initial = (member.fullName || member.displayName || "S")[0]?.toUpperCase();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
    >
      {member.photoURL ? (
        <img
          src={member.photoURL}
          alt={member.fullName}
          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-black/5 dark:border-white/10"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-serif italic font-black shrink-0"
          style={{
            background: isOverseer ? `${ACADEMIC_PURPLE}1A` : "rgba(0,0,0,0.05)",
            color: isOverseer ? ACADEMIC_PURPLE : "currentColor",
          }}
        >
          {initial}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="text-sm font-bold truncate"
            style={isOverseer ? { color: ACADEMIC_PURPLE } : undefined}
          >
            {member.fullName || member.displayName || t("common.anonymous")}
          </p>
          {isOverseer && (
            <span
              className="px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest"
              style={{ background: `${ACADEMIC_PURPLE}1A`, color: ACADEMIC_PURPLE }}
            >
              {t("roles.overseer")}
            </span>
          )}
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-ink-faint dark:text-slate-500 mt-1 truncate">
          {member.major || (isOverseer ? t("roles.overseer") : t("roles.scholar"))}
        </p>
      </div>

      <PresenceDot online={isOnline(member)} t={t} />
    </motion.div>
  );
}

export default function MemberListDrawer({ isOpen, onClose, group }) {
  const { t } = useLanguage();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen || !group?.members?.length) {
      setMembers([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      group.members.map(async (uid) => {
        try {
          const snap = await getDoc(doc(firestore, COL.USERS, uid));
          return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        } catch {
          return null;
        }
      })
    )
      .then((rows) => {
        if (cancelled) return;
        setMembers(rows.filter(Boolean));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, group?.members]);

  const { overseers, scholars } = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filter = (m) =>
      !term ||
      (m.fullName || m.displayName || "").toLowerCase().includes(term) ||
      (m.major || "").toLowerCase().includes(term);

    const visible = members.filter(filter);
    const leaderId = group?.leaderId;
    const isOver = (m) => m.id === leaderId || m.role === "overseer" || m.role === "admin";

    return {
      overseers: visible.filter(isOver),
      scholars: visible
        .filter((m) => !isOver(m))
        .sort((a, b) =>
          (a.fullName || a.displayName || "").localeCompare(b.fullName || b.displayName || "")
        ),
    };
  }, [members, search, group?.leaderId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[160]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed top-0 end-0 h-screen w-full sm:w-[380px] z-[170] flex flex-col shadow-2xl border-s border-black/5 dark:border-white/10 text-ink dark:text-white"
            style={{ background: CREAM }}
          >
            {/* Header */}
            <div
              className="px-6 py-5 border-b border-black/5 flex items-center justify-between"
              style={{ background: `${ACADEMIC_PURPLE}0D` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${ACADEMIC_PURPLE}1A`, color: ACADEMIC_PURPLE }}
                >
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-serif italic font-black leading-none text-ink">
                    {t("chat.members.title")}
                  </h3>
                  <p className="text-[8px] font-black uppercase tracking-[0.28em] text-ink-faint mt-2">
                    {group?.members?.length || 0} {t("roles.members")}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-ink-faint hover:text-ink hover:bg-black/5 transition-colors"
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-3">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("common.search")}
                  className="w-full ps-9 pe-3 py-2.5 text-xs bg-white/70 border border-black/5 rounded-xl outline-none focus:border-[var(--ac)] transition-colors text-ink placeholder:text-ink-faint"
                  style={{ "--ac": ACADEMIC_PURPLE }}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin" size={22} style={{ color: ACADEMIC_PURPLE }} />
                </div>
              ) : (
                <>
                  {overseers.length > 0 && (
                    <section className="mt-2">
                      <h4
                        className="px-3 mb-1 text-[10px] font-serif italic font-bold tracking-wide"
                        style={{ color: ACADEMIC_PURPLE }}
                      >
                        {t("roles.overseer")}
                      </h4>
                      <AnimatePresence initial={false}>
                        {overseers.map((m) => (
                          <MemberRow key={m.id} member={m} isOverseer t={t} />
                        ))}
                      </AnimatePresence>
                    </section>
                  )}

                  {scholars.length > 0 && (
                    <section className="mt-4">
                      <h4 className="px-3 mb-1 text-[10px] font-serif italic font-bold tracking-wide text-ink-muted flex items-center gap-1.5">
                        <GraduationCap size={11} />
                        {t("roles.scholars")}
                      </h4>
                      <AnimatePresence initial={false}>
                        {scholars.map((m) => (
                          <MemberRow key={m.id} member={m} isOverseer={false} t={t} />
                        ))}
                      </AnimatePresence>
                    </section>
                  )}

                  {!loading && overseers.length === 0 && scholars.length === 0 && (
                    <p className="text-center text-xs font-serif italic text-ink-faint py-12">
                      {t("explore.noResults")}
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
