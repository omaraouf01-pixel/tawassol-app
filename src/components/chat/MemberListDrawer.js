"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Users, Search, Loader2, GraduationCap,
  UserMinus, ShieldPlus, ShieldMinus, AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/apiClient";
import { firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { COL } from "@/lib/collectionNames";

const ACADEMIC_PURPLE = "#7c83f2";
const CREAM = "#F8F8F5";

// ─── حضور العضو ───────────────────────────────────────────────────
function isOnline(member) {
  if (typeof member?.online === "boolean") return member.online;
  const ts = member?.lastSeen?.toMillis?.() ?? member?.lastSeen;
  if (!ts) return false;
  return Date.now() - ts < 3 * 60 * 1000;
}

function PresenceDot({ online }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
        online ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-slate-400/60"
      }`}
      title={online ? "Online" : "Offline"}
    />
  );
}

// ─── نافذة تأكيد مخصصة (Framer Motion) ──────────────────────────
function ConfirmModal({ isOpen, onConfirm, onCancel, memberName, actionLabel, actionColor }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-full max-w-sm bg-white dark:bg-[#111] rounded-3xl p-7 shadow-2xl border border-black/5 dark:border-white/10"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `${actionColor}1A`, color: actionColor }}
              >
                <AlertTriangle size={26} />
              </div>
              <div>
                <h3 className="text-base font-serif italic font-black text-ink dark:text-white">
                  {actionLabel}؟
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  <span className="font-bold text-ink dark:text-white">{memberName}</span>
                </p>
              </div>
              <div className="flex w-full gap-3 mt-2">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-colors"
                  style={{ background: actionColor }}
                >
                  تأكيد
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── صف عضو واحد ──────────────────────────────────────────────────
function MemberRow({
  member, isOverseer, canKick, canPromote, canDemote,
  onKick, onPromote, onDemote, pendingId, onViewProfile,
}) {
  const initial = (member.fullName || member.displayName || "S")[0]?.toUpperCase();
  const isPending = pendingId === member.id;
  const avatarSrc = member.avatarUrl || member.photoURL;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
    >
      <button
        onClick={() => onViewProfile(member.id)}
        className="shrink-0 focus:outline-none"
        aria-label={`View ${member.fullName}'s profile`}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={member.fullName}
            className="w-10 h-10 rounded-xl object-cover border border-black/5 dark:border-white/10 hover:ring-2 hover:ring-[#7c83f2]/50 transition-all"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-serif italic font-black hover:ring-2 hover:ring-[#7c83f2]/50 transition-all"
            style={{
              background: isOverseer ? `${ACADEMIC_PURPLE}1A` : "rgba(0,0,0,0.05)",
              color: isOverseer ? ACADEMIC_PURPLE : "currentColor",
            }}
          >
            {initial}
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            onClick={() => onViewProfile(member.id)}
            className="text-sm font-bold truncate cursor-pointer hover:underline"
            style={isOverseer ? { color: ACADEMIC_PURPLE } : undefined}
          >
            {member.fullName || member.displayName || "Anonymous"}
          </p>
          {isOverseer && (
            <span
              className="px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest"
              style={{ background: `${ACADEMIC_PURPLE}1A`, color: ACADEMIC_PURPLE }}
            >
              Overseer
            </span>
          )}
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-ink-faint dark:text-slate-500 mt-1 truncate">
          {member.major || (isOverseer ? "Overseer" : "Scholar")}
        </p>
      </div>

      <PresenceDot online={isOnline(member)} />

      {/* أزرار الإجراءات — تظهر عند التحويم */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canPromote && (
          <button
            onClick={() => onPromote(member)}
            disabled={isPending}
            className="p-2 bg-[#7c83f2]/10 text-[#7c83f2] hover:bg-[#7c83f2] hover:text-white rounded-xl transition-all disabled:opacity-50"
            title="ترقية إلى مشرف مساعد"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldPlus size={14} />}
          </button>
        )}
        {canDemote && (
          <button
            onClick={() => onDemote(member)}
            disabled={isPending}
            className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
            title="إزالة صلاحية المشرف"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldMinus size={14} />}
          </button>
        )}
        {canKick && (
          <button
            onClick={() => onKick(member)}
            disabled={isPending}
            className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
            title="طرد من المجموعة"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── الدرج الرئيسي ────────────────────────────────────────────────
export default function MemberListDrawer({ isOpen, onClose, group, isLeader, isAdmin }) {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState(null);

  // حالة نافذة التأكيد
  const [confirm, setConfirm] = useState({
    open: false,
    member: null,
    type: null, // "kick" | "promote" | "demote"
  });

  const isPrimaryLeader = !!isLeader;
  const canModerate = !!(isLeader || isAdmin);

  // ─── جلب بيانات الأعضاء من Firestore ────────────────────────
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

    return () => { cancelled = true; };
  }, [isOpen, group?.members]);

  // ─── تحديد المشرفين والعلماء ─────────────────────────────────
  const { overseers, scholars } = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filter = (m) =>
      !term ||
      (m.fullName || m.displayName || "").toLowerCase().includes(term) ||
      (m.major || "").toLowerCase().includes(term);

    const visible = members.filter(filter);
    const leaderId = group?.leaderId;
    const coLeaderIds = group?.coLeaderIds || [];
    const isOver = (m) =>
      m.id === leaderId ||
      coLeaderIds.includes(m.id) ||
      m.role === "overseer" ||
      m.role === "admin";

    return {
      overseers: visible.filter(isOver),
      scholars: visible
        .filter((m) => !isOver(m))
        .sort((a, b) =>
          (a.fullName || a.displayName || "").localeCompare(b.fullName || b.displayName || "")
        ),
    };
  }, [members, search, group?.leaderId, group?.coLeaderIds]);

  const handleViewProfile = (uid) => {
    onClose();
    router.push(`/profile/${uid}`);
  };

  // ─── فتح نوافذ التأكيد ────────────────────────────────────────
  const openKickConfirm = (member) => setConfirm({ open: true, member, type: "kick" });
  const openPromoteConfirm = (member) => setConfirm({ open: true, member, type: "promote" });
  const openDemoteConfirm = (member) => setConfirm({ open: true, member, type: "demote" });
  const closeConfirm = () => setConfirm({ open: false, member: null, type: null });

  // ─── تنفيذ الإجراءات بعد التأكيد ────────────────────────────
  const handleConfirmed = async () => {
    const { member, type } = confirm;
    if (!member || !group?.id) return;
    closeConfirm();
    setPendingId(member.id);

    try {
      if (type === "kick") {
        await api(`/api/groups/${group.id}/members/${member.id}`, { method: "DELETE" });
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
      } else if (type === "promote") {
        await api(`/api/groups/${group.id}/members/${member.id}/role`, {
          method: "PATCH",
          body: { action: "promote" },
        });
        // تحديث coLeaderIds محلياً (group prop للقراءة فقط — سيُحدَّث عبر onSnapshot)
      } else if (type === "demote") {
        await api(`/api/groups/${group.id}/members/${member.id}/role`, {
          method: "PATCH",
          body: { action: "demote" },
        });
      }
    } catch (err) {
      console.error(`[MemberListDrawer] ${type} failed:`, err);
      alert(err.message || "حدث خطأ، حاول مرة أخرى.");
    } finally {
      setPendingId(null);
    }
  };

  // ─── إعداد نص/لون نافذة التأكيد ─────────────────────────────
  const confirmConfig = {
    kick: { label: "طرد العضو", color: "#ef4444" },
    promote: { label: "ترقية إلى مشرف مساعد", color: ACADEMIC_PURPLE },
    demote: { label: "إزالة صلاحية المشرف", color: "#f59e0b" },
  }[confirm.type] || { label: "", color: "#000" };

  return (
    <>
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
                      Node members
                    </h3>
                    <p className="text-[8px] font-black uppercase tracking-[0.28em] text-ink-faint mt-2">
                      {group?.members?.length || 0} Members
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-ink-faint hover:text-ink hover:bg-black/5 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search */}
              <div className="px-5 pt-4 pb-3">
                <div className="relative">
                  <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search"
                    className="w-full ps-9 pe-3 py-2.5 text-xs bg-white/70 border border-black/5 rounded-xl outline-none focus:border-[var(--ac)] transition-colors text-ink placeholder:text-ink-faint"
                    style={{ "--ac": ACADEMIC_PURPLE }}
                  />
                </div>
              </div>

              {/* قائمة الأعضاء */}
              <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin" size={22} style={{ color: ACADEMIC_PURPLE }} />
                  </div>
                ) : (
                  <>
                    {/* المشرفون */}
                    {overseers.length > 0 && (
                      <section className="mt-2">
                        <h4
                          className="px-3 mb-1 text-[10px] font-serif italic font-bold tracking-wide"
                          style={{ color: ACADEMIC_PURPLE }}
                        >
                          Overseers
                        </h4>
                        <AnimatePresence initial={false}>
                          {overseers.map((m) => {
                            const isThisPrimaryLeader = m.id === group?.leaderId;
                            return (
                              <MemberRow
                                key={m.id}
                                member={m}
                                isOverseer
                                canKick={false}
                                canDemote={isPrimaryLeader && !isThisPrimaryLeader}
                                canPromote={false}
                                onDemote={openDemoteConfirm}
                                pendingId={pendingId}
                                onViewProfile={handleViewProfile}
                              />
                            );
                          })}
                        </AnimatePresence>
                      </section>
                    )}

                    {/* العلماء */}
                    {scholars.length > 0 && (
                      <section className="mt-4">
                        <h4 className="px-3 mb-1 text-[10px] font-serif italic font-bold tracking-wide text-ink-muted flex items-center gap-1.5">
                          <GraduationCap size={11} />
                          Scholars
                        </h4>
                        <AnimatePresence initial={false}>
                          {scholars.map((m) => (
                            <MemberRow
                              key={m.id}
                              member={m}
                              isOverseer={false}
                              canKick={canModerate}
                              canPromote={isPrimaryLeader}
                              canDemote={false}
                              onKick={openKickConfirm}
                              onPromote={openPromoteConfirm}
                              pendingId={pendingId}
                              onViewProfile={handleViewProfile}
                            />
                          ))}
                        </AnimatePresence>
                      </section>
                    )}

                    {!loading && overseers.length === 0 && scholars.length === 0 && (
                      <p className="text-center text-xs font-serif italic text-ink-faint py-12">
                        No results
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* نافذة التأكيد — خارج الـ AnimatePresence الرئيسي */}
      <ConfirmModal
        isOpen={confirm.open}
        onConfirm={handleConfirmed}
        onCancel={closeConfirm}
        memberName={confirm.member?.fullName || confirm.member?.displayName || "؟"}
        actionLabel={confirmConfig.label}
        actionColor={confirmConfig.color}
      />
    </>
  );
}
