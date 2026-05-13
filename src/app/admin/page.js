"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users, AlertTriangle, BookOpen, Trash2, ArrowLeft,
  ZoomIn, X, Plus, LayoutGrid, ExternalLink, ShieldAlert, Loader2
} from "lucide-react";

import { auth, firestore } from "@/lib/firebase";
import { onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection, doc, updateDoc, deleteDoc, query,
  orderBy, setDoc, serverTimestamp, onSnapshot, getDoc
} from "firebase/firestore";

import TsswalLogo from "@/components/TsswalLogo";
import { COL } from "@/lib/collections";

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState("users");
  const [allUsers, setAllUsers] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [previewCard, setPreviewCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- Authentication & Real-time Listeners ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userSnap = await getDoc(doc(firestore, COL.USERS, u.uid));
        if (userSnap.exists() && userSnap.data().role === "admin") {
          setIsAdmin(true);

          const unsubUsers = onSnapshot(
            query(collection(firestore, COL.USERS), orderBy("createdAt", "desc")),
            (snap) => {
              setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
              setLoading(false);
            }
          );

          const unsubGroups = onSnapshot(
            query(collection(firestore, COL.GROUPS), orderBy("createdAt", "desc")),
            (snap) => {
              setAllGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
          );

          return () => { unsubUsers(); unsubGroups(); };
        } else {
          router.push("/hub");
        }
      } else {
        router.push("/auth");
      }
    });
    return () => unsubAuth();
  }, [router]);

  // --- Handlers ---
  const handleApprove = async (uid) => {
    try {
      await updateDoc(doc(firestore, COL.USERS, uid), { status: "approved_onboarding" });
      setPreviewCard(null);
    } catch (e) { console.error(e); }
  };

  const handleReject = async (uid) => {
    if (confirm("Reject and delete this identity request?")) {
      await deleteDoc(doc(firestore, COL.USERS, uid));
      setPreviewCard(null);
    }
  };

  const handleDeleteUser = async (uid) => {
    if (confirm("Permanently delete this scholar?")) {
      await deleteDoc(doc(firestore, COL.USERS, uid));
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (confirm("Terminate this Knowledge Node permanently?")) {
      await deleteDoc(doc(firestore, COL.GROUPS, groupId));
    }
  };

  const handleEnterNode = (groupId) => {
    // Direct administrative access to any node chat
    router.push(`/hub/chat/${groupId}`);
  };

  const pendingUsers = useMemo(() => allUsers.filter(u => u.status === "pending"), [allUsers]);
  const activeStudents = useMemo(() => allUsers.filter(u => (u.status === "active" || u.status === "approved_onboarding") && u.role !== "admin"), [allUsers]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
      <TsswalLogo size={50} className="animate-pulse" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-800">Synchronizing Command Console</p>
    </div>
  );

  return (
    <div dir="ltr" className="min-h-screen bg-[#050505] text-[#F9FAFB] font-sans selection:bg-brand-indigo/30 flex flex-col overflow-hidden">

      {/* --- Top Command Navbar --- */}
      <header className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <TsswalLogo size={28} />
          <div className="flex flex-col border-l border-white/10 pl-6 text-left">
            <span className="text-[14px] font-black tracking-[0.2em] leading-none text-white uppercase font-serif italic">Command</span>
            <span className="text-[7px] font-bold text-brand-indigo uppercase tracking-widest mt-1.5 italic">Global Overseer</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center bg-white/[0.02] border border-white/5 p-1 rounded-full">
          <button onClick={() => setTab("users")} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-none cursor-pointer flex items-center gap-2 ${tab === "users" ? "bg-white/10 text-white" : "bg-transparent text-slate-500 hover:text-slate-300"}`}>
            <Users size={14} /> Scholars <span className="opacity-40 ml-1">{activeStudents.length}</span>
          </button>
          <button onClick={() => setTab("groups")} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-none cursor-pointer flex items-center gap-2 ${tab === "groups" ? "bg-white/10 text-white" : "bg-transparent text-slate-500 hover:text-slate-300"}`}>
            <BookOpen size={14} /> Nodes <span className="opacity-40 ml-1">{allGroups.length}</span>
          </button>
          <button onClick={() => setTab("pending")} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-none cursor-pointer flex items-center gap-2 ${tab === "pending" ? "bg-white/10 text-white" : "bg-transparent text-slate-500 hover:text-slate-300"}`}>
            <AlertTriangle size={14} className={pendingUsers.length > 0 ? "text-amber-500" : ""} /> Requests
            {pendingUsers.length > 0 && <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full ml-1 animate-pulse">{pendingUsers.length}</span>}
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/hub")} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white hover:bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border-none cursor-pointer">
            <LayoutGrid size={14} /> Hub
          </button>
          <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-transparent border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer">
            <ArrowLeft size={14} />
          </button>
        </div>
      </header>

      {/* --- Main Workspace --- */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
        <div className="max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">

            {/* 1. Scholars Tab */}
            {tab === "users" && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="bg-[#0A0A0B] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-premium">
                  <table className="w-full text-left">
                    <thead className="bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 border-b border-white/5">
                      <tr><th className="p-8">Scholar</th><th className="p-8">Matricule</th><th className="p-8">Status</th><th className="p-8 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {activeStudents.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="p-8 flex items-center gap-4">
                            <div className="w-10 h-10 bg-brand-indigo/10 rounded-xl flex items-center justify-center font-serif italic font-black text-brand-indigo">{u.fullName[0]}</div>
                            <span className="font-bold text-sm text-white">{u.fullName}</span>
                          </td>
                          <td className="p-8 font-mono text-[12px] text-slate-500">{u.matricule || "N/A"}</td>
                          <td className="p-8">
                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                              {u.status === 'active' ? 'Active Frequency' : 'Awaiting Profile'}
                            </span>
                          </td>
                          <td className="p-8 text-right">
                            <button onClick={() => handleDeleteUser(u.id)} className="p-3 bg-white/5 text-slate-700 hover:text-rose-500 rounded-xl transition-all border-none cursor-pointer"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 2. Knowledge Nodes Tab (تعديل: إضافة زر الدخول) */}
            {tab === "groups" && (
              <motion.div key="groups" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {allGroups.map(group => (
                  <div key={group.id} className="bg-[#0A0A0B] border border-white/5 p-8 rounded-[2.5rem] hover:border-brand-indigo/30 transition-all group relative overflow-hidden text-left">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-indigo/5 blur-2xl rounded-full" />

                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-brand-indigo border border-white/5 font-black italic text-xl">{group.name?.[0]}</div>
                      <span className="text-[8px] font-black uppercase bg-brand-indigo/10 text-brand-indigo px-3 py-1.5 rounded-full border border-brand-indigo/20 flex items-center gap-2">
                        <Users size={10} /> {group.memberCount || 0} Scholars
                      </span>
                    </div>

                    <h3 className="font-serif font-black italic text-2xl text-white mb-2 truncate">{group.name}</h3>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-8">{group.subject || "General Academic"}</p>

                    <div className="flex gap-3 relative z-10">
                      {/* زر الدخول المباشر المخصص للأدمن */}
                      <button
                        onClick={() => handleEnterNode(group.id)}
                        className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-brand-indigo hover:text-white transition-all border-none cursor-pointer flex items-center justify-center gap-2 shadow-glow"
                      >
                        <ExternalLink size={14} /> Enter Node
                      </button>

                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border-none cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* 3. Pending Requests Tab */}
            {tab === "pending" && (
              <motion.div key="pending" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pendingUsers.map(u => (
                  <div key={u.id} className="bg-[#0A0A0B] border border-white/5 p-10 rounded-[3rem] shadow-premium hover:border-brand-indigo/30 transition-all group text-left">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center font-black text-2xl italic text-white group-hover:bg-brand-indigo transition-all">{u.fullName[0]}</div>
                      <button onClick={() => setPreviewCard(u)} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white border-none cursor-pointer transition-all"><ZoomIn size={20} /></button>
                    </div>
                    <h3 className="font-bold text-xl text-white mb-1">{u.fullName}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-indigo mb-10">{u.matricule || "No Matricule"}</p>
                    <div className="flex gap-4">
                      <button onClick={() => handleApprove(u.id)} className="flex-1 py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-indigo hover:text-white transition-all border-none cursor-pointer shadow-glow">Authorize</button>
                      <button onClick={() => handleReject(u.id)} className="flex-1 py-5 border border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all border-none cursor-pointer">Decline</button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* --- Identity Preview Modal --- */}
      <AnimatePresence>
        {previewCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#0A0A0B] border border-white/10 rounded-[3.5rem] p-12 max-w-2xl w-full shadow-premium relative text-left">
              <button onClick={() => setPreviewCard(null)} className="absolute top-10 right-10 p-4 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all border-none cursor-pointer"><X size={24} /></button>
              <h2 className="text-4xl font-serif font-black italic text-white mb-10 pr-16">{previewCard.fullName} Sync.</h2>
              <div className="aspect-[16/10] bg-black/50 rounded-[2.5rem] border border-white/5 overflow-hidden mb-12">
                <img src={previewCard.studentCardUrl} className="w-full h-full object-contain" alt="Identity Asset" />
              </div>
              <button onClick={() => handleApprove(previewCard.id)} className="w-full py-6 bg-brand-indigo text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-glow border-none cursor-pointer">Verify & Grant Access</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.3); }
      `}} />
    </div>
  );
}