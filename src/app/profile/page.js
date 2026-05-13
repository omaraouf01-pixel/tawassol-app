"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  User, School, GraduationCap, Edit3, Camera, Save, X, Loader2,
  Layers, MapPin, Sparkles, Search, Check, ChevronRight
} from "lucide-react";

// ─── الاستيرادات الخاصة بك ───
import Sidebar from "@/components/Sidebar";
import TsswalLogo from "@/components/TsswalLogo";
import ActiveNodesSidebar from "@/components/chat/ActiveNodesSidebar";
import { auth, firestore } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { COL } from "@/lib/collections";
import { useFileUpload } from "@/lib/useFileUpload";

const UNIVERSITIES = ["Université d'Oran 1 Ahmed Ben Bella", "Université d'Oran 2 Mohamed Ben Ahmed", "USTO-MB", "ESI Algiers", "USTHB"];
const SUBJECTS = ["Computer Science", "Artificial Intelligence", "Mathematics", "Medicine", "Physics"];

export default function ProfilePage() {
  const router = useRouter();
  const { upload, uploading } = useFileUpload();
  const fileInputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    major: "",
    university: "",
    academicYear: "L1"
  });

  // 1. التوثيق وجلب بيانات الهوية
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const userRef = doc(firestore, COL.USERS, u.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const identity = { id: u.uid, uid: u.uid, ...data };
          setCurrentUser(identity);

          setFormData({
            fullName: data.fullName || "",
            bio: data.bio || "Academic scholar navigating the node network.",
            major: data.major || "",
            university: data.university || "",
            academicYear: data.academicYear || "L1"
          });

          // مزامنة المجموعات لحظياً
          const qGroups = query(
            collection(firestore, COL.GROUPS),
            where("members", "array-contains", u.uid) // ✅ تصحيح المعامل
          );

          onSnapshot(qGroups, (snap) => {
            setJoinedGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoadingNodes(false);
          }, (err) => {
            console.error(err);
            setLoadingNodes(false);
          });

          // حساب عدد المنشورات
          const qPosts = query(collection(firestore, COL.POSTS), where("uid", "==", u.uid));
          const postsSnap = await getDocs(qPosts);
          setPostCount(postsSnap.size);
        }
        setLoading(false);
      } else {
        router.push("/auth");
      }
    });
    return unsubAuth;
  }, [router]);

  const handleSave = async () => {
    if (saveLoading) return;
    setSaveLoading(true);
    try {
      await updateDoc(doc(firestore, COL.USERS, auth.currentUser.uid), formData);
      setCurrentUser(prev => ({ ...prev, ...formData }));
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const SelectionModal = ({ type, list, current, onSelect }) => (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 text-left">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md bg-[#0A0A0B] border border-white/10 rounded-[2.5rem] p-8 relative z-[120]">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-slate-500">Select {type}</h3>
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
          <input placeholder="Search..." className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-brand-indigo/30" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
          {list.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
            <div key={item} onClick={() => { onSelect(item); setActiveModal(null); setSearchTerm(""); }} className="w-full text-left p-4 rounded-xl bg-white/[0.02] hover:bg-brand-indigo/10 flex justify-between items-center transition-all cursor-pointer">
              <span className={`text-xs ${current === item ? 'text-brand-indigo font-bold' : 'text-slate-400'}`}>{item}</span>
              {current === item && <Check size={14} className="text-brand-indigo" />}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><TsswalLogo size={40} className="animate-pulse" /></div>;

  return (
    <div dir="ltr" className="min-h-screen bg-[#050505] text-[#F9FAFB] flex overflow-hidden selection:bg-brand-indigo/30">

      <Sidebar currentUser={currentUser} />

      <AnimatePresence>
        {activeModal === 'uni' && <SelectionModal type="University" list={UNIVERSITIES} current={formData.university} onSelect={(v) => setFormData({ ...formData, university: v })} />}
        {activeModal === 'major' && <SelectionModal type="Major" list={SUBJECTS} current={formData.major} onSelect={(v) => setFormData({ ...formData, major: v })} />}
      </AnimatePresence>

      <main className="flex-1 lg:ml-[280px] overflow-y-auto h-screen custom-scrollbar pb-20 relative z-10 text-left">
        <div className="h-48 bg-gradient-to-b from-brand-indigo/10 to-transparent" />

        <div className="px-8 lg:px-16 -mt-16 flex flex-col xl:flex-row gap-12 max-w-[1600px] mx-auto">

          <div className="flex-1 flex flex-col lg:flex-row gap-12">

            {/* الجزء الأيسر: الصورة والإحصائيات */}
            <div className="w-full lg:w-72 shrink-0">
              <div className="relative group mb-8">
                <div className="w-44 h-44 rounded-[2.5rem] bg-[#0A0A0B] border-4 border-[#050505] shadow-premium overflow-hidden flex items-center justify-center relative">
                  {currentUser?.profilePicUrl ? <img src={currentUser.profilePicUrl} className="w-full h-full object-cover" /> : <span className="text-5xl font-serif italic text-brand-indigo">{currentUser?.fullName?.[0]}</span>}
                  <div onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm">
                    <Camera className="text-white" />
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={async (e) => {
                    const f = e.target.files[0]; if (f) { const r = await upload(f, `avatars/${auth.currentUser.uid}`); await updateDoc(doc(firestore, COL.USERS, auth.currentUser.uid), { profilePicUrl: r.url }); setCurrentUser({ ...currentUser, profilePicUrl: r.url }); }
                  }} />
                </div>
              </div>

              <div className="bg-[#0A0A0B] border border-white/5 rounded-[2rem] p-8 space-y-6 shadow-premium">
                <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Active Nodes</span><span className="text-xl font-serif italic text-brand-indigo">{joinedGroups.length.toString().padStart(2, '0')}</span></div>
                <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Post Signal</span><span className="text-xl font-serif italic text-white">{postCount.toString().padStart(2, '0')}</span></div>
              </div>
            </div>

            {/* الجزء الأوسط: البيانات */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
                <div className="flex-1 w-full">
                  {isEditing ? (
                    <input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="text-[32px] font-serif italic font-black bg-white/5 border-b-2 border-brand-indigo outline-none text-white w-full px-2 py-1"
                    />
                  ) : (
                    <h1 className="text-[42px] font-serif italic font-black text-white leading-none">{currentUser?.fullName}</h1>
                  )}
                  <p className="text-[9px] font-black text-brand-indigo uppercase tracking-[0.4em] mt-4 flex items-center gap-2 italic">
                    <MapPin size={10} /> {currentUser?.university}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className="px-8 py-3.5 bg-white text-black rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-brand-indigo hover:text-white transition-all shadow-glow flex items-center gap-2 border-none cursor-pointer relative z-[30]"
                >
                  {saveLoading ? <Loader2 size={12} className="animate-spin" /> : isEditing ? <Save size={12} /> : <Edit3 size={12} />}
                  {isEditing ? "Save Signal" : "Edit Identity"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className={`p-8 bg-[#0A0A0B] border border-white/5 rounded-[2rem] transition-all ${isEditing ? 'border-brand-indigo/40 cursor-pointer shadow-glow' : ''}`} onClick={() => isEditing && setActiveModal('major')}>
                  <div className="flex items-center gap-4 mb-4"><GraduationCap size={16} className="text-brand-indigo" /><span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Academic Major</span></div>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">{formData.major || "Select Major"}</p>
                </div>
                <div className={`p-8 bg-[#0A0A0B] border border-white/5 rounded-[2rem] transition-all ${isEditing ? 'border-brand-indigo/40 cursor-pointer shadow-glow' : ''}`} onClick={() => isEditing && setActiveModal('uni')}>
                  <div className="flex items-center gap-4 mb-4"><School size={16} className="text-brand-indigo" /><span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Sanctuary</span></div>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">{formData.university || "Select University"}</p>
                </div>
              </div>

              <div className="mb-12">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 mb-8 flex items-center gap-3 text-left">
                  <Layers size={14} className="text-brand-indigo" /> Protocol Status
                </h3>
                <p className="text-[13px] font-serif italic text-slate-400 max-w-xl leading-relaxed text-left">
                  {formData.bio}
                </p>
              </div>
            </div>
          </div>

          {/* العمود الأيمن: العقد النشطة */}
          <aside className="hidden xl:flex flex-col w-[320px] sticky top-10 h-fit ml-auto">
            <ActiveNodesSidebar
              nodes={joinedGroups}
              currentUser={currentUser}
              loading={loadingNodes}
            />
          </aside>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.02); border-radius: 10px; }
      `}} />
    </div>
  );
}