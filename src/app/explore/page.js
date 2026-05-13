"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, Zap, BookOpen, Code, Terminal, Globe, Sparkles, School, Compass, Lock, Filter, LayoutGrid } from "lucide-react";

// ─── المكونات الخارجية ───
import Sidebar from "@/components/Sidebar";
import TsswalLogo from "@/components/TsswalLogo";
import JoinNodeModal from "@/components/explore/JoinNodeModal";
import ActiveNodesSidebar from "@/components/chat/ActiveNodesSidebar";

// ─── دوال قاعدة البيانات ───
import { auth, firestore } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, doc, getDoc, where } from "firebase/firestore";
import { COL } from "@/lib/collections";

const ICON_MAP = { BookOpen, Code, Terminal, Globe, Sparkles, Compass };
const ACADEMIC_STAGES = ["All", "L1", "L2", "L3", "M1", "M2"]; // تطابق أزرار الصورة

export default function ExplorePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("All"); // الحالة الافتراضية

  const [groups, setGroups] = useState([]);
  const [userNodes, setUserNodes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const userSnap = await getDoc(doc(firestore, COL.USERS, u.uid));
        if (userSnap.exists()) {
          setCurrentUser({ id: u.uid, uid: u.uid, ...userSnap.data() });
        } else {
          setCurrentUser(u);
        }
        setLoading(false);
      } else {
        router.push("/auth");
      }
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    const q = query(collection(firestore, COL.GROUPS), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const currentId = currentUser?.uid || currentUser?.id;
    if (!currentId) return;

    const q = query(
      collection(firestore, COL.GROUPS),
      where("members", "array-contains", currentId)
    );

    const unsubNodes = onSnapshot(q,
      (snap) => {
        setUserNodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingNodes(false);
      },
      (error) => {
        console.error("Nodes Sync Error:", error);
        setLoadingNodes(false);
      }
    );

    return () => unsubNodes();
  }, [currentUser]);

  const filtered = useMemo(() => {
    return groups.filter(g => {
      const currentId = currentUser?.uid || currentUser?.id;
      const isNotMember = !g.members?.includes(currentId);

      const matchesSearch = g.name?.toLowerCase().includes(search.toLowerCase()) ||
        g.subject?.toLowerCase().includes(search.toLowerCase());

      const groupYear = g.year || "L1"; // افتراض L1 إذا لم يحدد
      const matchesYear = selectedYear === "All" || groupYear === selectedYear;

      return isNotMember && matchesSearch && matchesYear;
    });
  }, [groups, search, selectedYear, currentUser]);

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><TsswalLogo size={50} className="animate-pulse" /></div>;

  return (
    <div dir="ltr" className="min-h-screen bg-[#050505] text-[#F9FAFB] flex overflow-hidden font-sans relative">

      <Sidebar currentUser={currentUser} />

      <main className="flex-1 lg:ml-[280px] px-6 lg:px-14 py-12 flex flex-col xl:flex-row justify-between overflow-y-auto h-screen custom-scrollbar text-left relative z-10">

        <div className="flex-1 max-w-[1000px] pb-20">
          <header className="mb-12 flex items-end justify-between">
            <div>
              <h1 className="text-[48px] xl:text-[60px] font-serif font-black italic tracking-tighter leading-none text-white">Discovery.</h1>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mt-4 italic">Nodes waiting for your signal</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand-indigo bg-brand-indigo/10 px-4 py-2 rounded-full border border-brand-indigo/20 shadow-glow">
              <Zap size={12} className="animate-pulse" /> Live Network
            </div>
          </header>

          {/* شريط البحث المطور */}
          <div className="relative group mb-10">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-indigo transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search for academic sanctuaries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-5 pl-14 pr-8 bg-[#0A0A0B] border border-white/5 rounded-2xl outline-none focus:border-brand-indigo/30 transition-all text-sm text-white italic font-serif shadow-premium"
            />
          </div>

          {/* ─── قسم الفلترة الجديد (Academic Stage) من الصورة ─── */}
          <div className="mb-12 space-y-6">
            <div className="flex items-center gap-2">
              <LayoutGrid size={12} className="text-brand-indigo" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">Academic Stage</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {ACADEMIC_STAGES.map(stage => (
                <button
                  key={stage}
                  onClick={() => setSelectedYear(stage)}
                  className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-none cursor-pointer ${selectedYear === stage
                      ? "bg-brand-indigo text-white shadow-glow translate-y-[-2px]"
                      : "bg-[#0A0A0B] text-slate-600 hover:bg-white/5 hover:text-slate-300"
                    }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* شبكة العقد */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center text-slate-600">
                  <p className="text-[12px] font-black uppercase tracking-[0.3em]">No nodes found for {selectedYear} stage.</p>
                </motion.div>
              ) : (
                filtered.map((group) => {
                  const Icon = ICON_MAP[group.icon] || BookOpen;
                  return (
                    <motion.div key={group.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#0A0A0B] border border-white/5 rounded-[2.5rem] p-8 hover:border-brand-indigo/30 transition-all shadow-premium relative overflow-hidden group">
                      <div className="flex justify-between mb-8 relative z-10 text-left">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-indigo border border-white/5 group-hover:scale-110 transition-transform"><Icon size={22} /></div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-[8px] font-black uppercase bg-white/5 text-slate-500 px-3 py-1 rounded-full border border-white/5 flex items-center gap-1.5"><Lock size={10} /> Protocol Locked</span>
                          <span className="text-[8px] font-black uppercase bg-brand-indigo/10 text-brand-indigo px-3 py-1 rounded-full border border-brand-indigo/20">{group.year || "General"}</span>
                        </div>
                      </div>
                      <h3 className="font-serif font-black italic text-2xl text-white mb-2 leading-tight truncate">{group.name}</h3>
                      <div className="flex items-center gap-2 mb-6 text-slate-700 text-[9px] font-bold uppercase tracking-widest"><School size={12} /> {group.university || "University"}</div>
                      <p className="text-xs text-slate-500 italic mb-8 line-clamp-2 leading-relaxed font-serif">{group.description}</p>
                      <button onClick={() => setSelectedGroup(group)} className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-indigo hover:text-white transition-all border-none cursor-pointer shadow-glow">Request Sync</button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* القائمة الجانبية اليمنى */}
        <aside className="hidden xl:flex flex-col w-[320px] sticky top-10 h-fit ml-auto">
          <ActiveNodesSidebar nodes={userNodes} currentUser={currentUser} loading={loadingNodes} />
        </aside>
      </main>

      <JoinNodeModal isOpen={!!selectedGroup} onClose={() => setSelectedGroup(null)} group={selectedGroup} currentUser={currentUser} />

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.02); border-radius: 10px; }
      `}} />
    </div>
  );
}