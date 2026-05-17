"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  CheckCheck,
  Inbox,
  Circle
} from "lucide-react";

import { useRouter } from "next/navigation";
import { auth, firestore } from "@/lib/firebase";
import { COL } from "@/lib/collectionNames";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

// ── Editorial Time Format (Translated to English) ────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export default function NotificationsBell() {
  const router = useRouter();
  const [uid, setUid] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Auth Logic (Untouched logic, mapped to mock for preview)
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUid(u?.uid || null));
  }, []);

  // 2. Firestore Listener (Untouched logic, mapped to mock for preview)
  useEffect(() => {
    if (!uid) { setNotifs([]); return; }
    const q = query(
      collection(firestore, COL.NOTIFICATIONS),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate?.().toISOString() || null,
        };
      });
      setNotifs(list);
    }, (err) => console.error("[NotificationsBell] error:", err));

    return () => unsubscribe();
  }, [uid]);

  // 3. Click Outside Handler (Untouched)
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  // 4. Update Data Logic (Untouched)
  const markAllRead = useCallback(async () => {
    const unread = notifs.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(firestore);
      unread.forEach((n) => { batch.update(doc(firestore, COL.NOTIFICATIONS, n.id), { read: true }); });
      await batch.commit();

      // Update local state for the preview
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.error("[markAllRead]", e); }
  }, [notifs]);

  const markOneRead = useCallback(async (notif) => {
    if (notif.read) return;
    try {
      await updateDoc(doc(firestore, COL.NOTIFICATIONS, notif.id), { read: true });
      // Update local state for the preview
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    catch (e) { console.error("[markOneRead]", e); }
  }, []);

  const handleClick = useCallback((n) => {
    markOneRead(n);
    if (n.link) router.push(n.link);
    setOpen(false);
  }, [markOneRead, router]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Button (Editorial Glass Style) ── */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((o) => !o)}
        className={`relative p-3 rounded-full transition-all duration-500 outline-none group ${open || unreadCount > 0
          ? 'bg-brand-indigo/10 text-brand-indigo shadow-glow border border-brand-indigo/20'
          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={1.5} className={open ? 'scale-110' : 'group-hover:rotate-12 transition-transform duration-300'} />

        {/* Unread Indicator Pulse */}
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-indigo opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-indigo border border-background"></span>
          </span>
        )}
      </motion.button>

      {/* ── Dropdown Panel (Human Rhythm Animation) ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(5px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-4 w-[380px] max-h-[520px] glass-panel rounded-[2rem] overflow-hidden z-50 flex flex-col origin-top-right"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
              <div className="text-left">
                <h3 className="text-[16px] font-serif font-black italic text-white/90 leading-none tracking-wide">The Node Pulse.</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Recent Activity</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-2 text-slate-500 hover:text-brand-indigo hover:bg-brand-indigo/10 rounded-xl transition-all"
                    title="Mark all as read"
                  >
                    <CheckCheck size={18} strokeWidth={1.5} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="flex flex-col items-center justify-center py-20 px-8 text-center"
                >
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6 text-slate-800">
                    <Inbox size={28} strokeWidth={1} />
                  </div>
                  <p className="text-[15px] font-serif italic text-slate-500">Silence is profound.</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-3">No current notifications</p>
                </motion.div>
              ) : (
                notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full relative px-8 py-5 border-b border-white/[0.03] transition-all text-left group flex items-start gap-5 ${n.read
                      ? "opacity-60 hover:opacity-100"
                      : "bg-brand-indigo/[0.02] hover:bg-brand-indigo/[0.05]"
                      }`}
                  >
                    {/* Unread indicator dot (Asymmetric touch) */}
                    <div className="pt-1.5 shrink-0">
                      {!n.read ? (
                        <div className="w-2 h-2 rounded-full bg-brand-indigo shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                      ) : (
                        <Circle size={8} className="text-slate-800" strokeWidth={2} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[13px] font-bold truncate leading-snug ${n.read ? "text-slate-400" : "text-white"}`}>
                        {n.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-medium">
                        {n.body || n.message}
                      </p>

                      <div className="flex items-center justify-start gap-4 mt-4">
                        {!n.read && <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-indigo">New</span>}
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 tabular-nums">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/[0.01] border-t border-white/[0.05] text-center shrink-0">
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-700">
                Synchronized with Cloud Node
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}