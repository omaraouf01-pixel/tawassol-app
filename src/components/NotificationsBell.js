"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiBell, FiX } from "react-icons/fi";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "@/lib/apiClient";

const POLL_INTERVAL = 30_000; // 30s

export default function NotificationsBell() {
  const router = useRouter();
  const [uid, setUid] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid || null)), []);

  // Polling MongoDB toutes les 30s
  const fetchNotifs = async () => {
    if (!uid) return;
    try {
      const { notifications } = await api("/api/notifications");
      setNotifs(notifications || []);
    } catch (e) {
      console.error("[notifs]", e);
    }
  };

  useEffect(() => {
    if (!uid) return;
    fetchNotifs();
    const id = setInterval(fetchNotifs, POLL_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await api("/api/notifications", { method: "PATCH" });
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error("[markAllRead]", e);
    }
  };

  const handleClick = async (n) => {
    if (!n.read) {
      try { await api(`/api/notifications/${n.id}`, { method: "PATCH" }); } catch {}
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.link) router.push(n.link);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount) markAllRead(); }}
        className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
      >
        <FiBell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 max-h-[70vh] bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-black">Notifications</h3>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <FiX size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">Aucune notification</p>
              ) : (
                notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.read ? "bg-indigo-500/5" : ""}`}
                  >
                    <p className="text-xs font-bold text-white">{n.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.body}</p>
                    <p className="text-[9px] text-slate-600 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
