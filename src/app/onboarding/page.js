"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, GraduationCap, Camera, Search,
  Loader2, CheckCircle2, ArrowRight, X, Rocket, Check, ChevronRight
} from "lucide-react";

import { auth, firestore } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import TsswalLogo from "@/components/TsswalLogo";

// ─── مصفوفات البيانات (تطابق الصور) ───
const UNIVERSITIES = [
  "Université d'Oran 1 Ahmed Ben Bella",
  "Université d'Oran 2 Mohamed Ben Ahmed",
  "USTO-MB (Oran)",
  "ESI (Algiers)",
  "USTHB (Algiers)",
  "Université de Constantine 1",
  "Université de Tlemcen"
];

const MAJORS = [
  "Computer Science",
  "Artificial Intelligence",
  "Cyber Security",
  "Mathematics",
  "Theoretical Physics",
  "Medicine",
  "Architecture"
];

const YEARS = ["L1", "L2", "L3", "M1", "M2"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userUid, setUserUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'uni' or 'major'
  const [searchTerm, setSearchTerm] = useState("");
  const fileRef = useRef(null);

  const [formData, setFormData] = useState({
    university: "",
    major: "",
    year: "",
    bio: ""
  });
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userDoc = await getDoc(doc(firestore, "users", u.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.status === "active" && data.onboarded) {
            router.push("/hub");
          } else {
            setUserUid(u.uid);
            setLoading(false);
          }
        }
      } else {
        router.push("/auth");
      }
    });
    return unsub;
  }, [router]);

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let profilePicUrl = "";
      if (profilePic) {
        const fd = new FormData();
        fd.append("file", profilePic);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        profilePicUrl = uploadData.url;
      }

      await updateDoc(doc(firestore, "users", userUid), {
        university: formData.university,
        major: formData.major,
        year: formData.year,
        bio: formData.bio,
        profilePicUrl: profilePicUrl || "",
        status: "active",
        onboarded: true
      });
      setStep(3);
    } catch (error) {
      console.error(error);
      alert("Error finalizing sync.");
    } finally {
      setSaving(false);
    }
  };

  // --- مكون المودال (Selection Modal) ---
  const SelectionModal = ({ title, list, searchPlaceholder, current, onSelect }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setActiveModal(null)}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-md bg-[#0A0A0B] border border-white/10 rounded-[2.5rem] p-8 relative z-[110] shadow-premium"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">{title}</h3>
          <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white bg-transparent border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
          <input
            autoFocus
            placeholder={searchPlaceholder}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-brand-indigo/30 transition-all font-serif italic"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
          {list.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
            <button
              key={item}
              onClick={() => { onSelect(item); setActiveModal(null); setSearchTerm(""); }}
              className={`w-full text-left p-4 rounded-xl border border-white/5 transition-all cursor-pointer flex justify-between items-center group ${current === item ? 'bg-brand-indigo/10 border-brand-indigo/30' : 'bg-transparent hover:bg-white/[0.03]'}`}
            >
              <span className={`text-xs font-bold ${current === item ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{item}</span>
              {current === item && <Check size={14} className="text-brand-indigo" />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><TsswalLogo className="animate-pulse" /></div>;

  return (
    <div dir="ltr" className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 selection:bg-brand-indigo/30 font-sans overflow-hidden">

      {/* مودالات الاختيار */}
      <AnimatePresence>
        {activeModal === 'uni' && (
          <SelectionModal
            title="Select University"
            list={UNIVERSITIES}
            searchPlaceholder="Search Universities..."
            current={formData.university}
            onSelect={(val) => setFormData({ ...formData, university: val })}
          />
        )}
        {activeModal === 'major' && (
          <SelectionModal
            title="Select Major"
            list={MAJORS}
            searchPlaceholder="Search Subjects..."
            current={formData.major}
            onSelect={(val) => setFormData({ ...formData, major: val })}
          />
        )}
      </AnimatePresence>

      <main className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">

          {/* ─── المرحلة 1: البيانات الأكاديمية ─── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white/[0.02] border-2 border-white/10 rounded-[3.5rem] p-12 lg:p-16 shadow-premium space-y-12">
              <div className="text-center">
                <TsswalLogo size={32} className="mx-auto mb-6 text-brand-indigo" />
                <h2 className="text-4xl font-serif font-black italic tracking-tighter">Academic Node.</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-4">Step 01: Education Protocols</p>
              </div>

              <div className="space-y-8">
                {/* مشغل مودال الجامعة */}
                <div className="space-y-3 group">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">Select University</label>
                  <button
                    onClick={() => setActiveModal('uni')}
                    className="w-full bg-transparent border-none border-b-2 border-white/10 py-4 flex items-center justify-between text-left cursor-pointer group-hover:border-brand-indigo transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <Building2 size={18} className="text-slate-700 group-hover:text-brand-indigo" />
                      <span className={`text-base font-bold ${formData.university ? 'text-white' : 'text-slate-800 italic font-serif'}`}>
                        {formData.university || 'Choose Institution...'}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-slate-800" />
                  </button>
                </div>

                {/* مشغل مودال التخصص */}
                <div className="space-y-3 group">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">Select Major</label>
                  <button
                    onClick={() => setActiveModal('major')}
                    className="w-full bg-transparent border-none border-b-2 border-white/10 py-4 flex items-center justify-between text-left cursor-pointer group-hover:border-brand-indigo transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <GraduationCap size={18} className="text-slate-700 group-hover:text-brand-indigo" />
                      <span className={`text-base font-bold ${formData.major ? 'text-white' : 'text-slate-800 italic font-serif'}`}>
                        {formData.major || 'Choose Field...'}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-slate-800" />
                  </button>
                </div>

                {/* السنة الدراسية */}
                <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">Academic Stage</label>
                  <div className="grid grid-cols-5 gap-3">
                    {YEARS.map(y => (
                      <button key={y} type="button" onClick={() => setFormData({ ...formData, year: y })} className={`py-4 rounded-2xl text-[11px] font-black transition-all border-none cursor-pointer ${formData.year === y ? "bg-brand-indigo text-white shadow-glow" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={!formData.university || !formData.major || !formData.year}
                  onClick={() => setStep(2)}
                  className="w-full py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-brand-indigo hover:text-white transition-all shadow-glow disabled:opacity-20 border-none cursor-pointer flex items-center justify-center gap-3"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* المرحلة 2 و 3 كما هي في الكود السابق... */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white/[0.02] border-2 border-white/10 rounded-[3.5rem] p-12 lg:p-16 shadow-premium space-y-12">
              <div className="text-center">
                <TsswalLogo size={32} className="mx-auto mb-6 text-brand-indigo" />
                <h2 className="text-4xl font-serif font-black italic tracking-tighter">Vessel Identity.</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-4">Step 02: Personality Sync</p>
              </div>
              <form onSubmit={handleFinalSubmit} className="space-y-10">
                <div className="flex flex-col items-center">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setProfilePic(e.target.files[0])} />
                  <div onClick={() => fileRef.current.click()} className="w-32 h-32 rounded-[2.5rem] bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-brand-indigo transition-all overflow-hidden group">
                    {profilePic ? <img src={URL.createObjectURL(profilePic)} className="w-full h-full object-cover" /> : <Camera size={32} className="text-slate-700" />}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mt-4">Portrait Upload</span>
                </div>
                <div className="space-y-3 group">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">Intellectual Bio</label>
                  <textarea required maxLength={150} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full bg-white/[0.02] border-2 border-white/5 p-6 rounded-3xl text-sm font-medium focus:border-brand-indigo outline-none transition-all h-32 resize-none placeholder:text-slate-900" placeholder="Reflect your academic frequency..." />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-5 bg-transparent border-2 border-white/5 text-slate-600 rounded-[2rem] text-[9px] font-black uppercase tracking-widest hover:text-white transition-all cursor-pointer">Back</button>
                  <button disabled={saving || !formData.bio} type="submit" className="flex-[2] py-5 bg-white text-black rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-indigo hover:text-white transition-all shadow-glow border-none cursor-pointer flex items-center justify-center gap-3">
                    {saving ? <Loader2 className="animate-spin" size={16} /> : "Finalize Sync"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/[0.02] border-2 border-white/10 rounded-[3.5rem] p-16 shadow-premium text-center space-y-10">
              <div className="w-24 h-24 bg-brand-indigo rounded-[2rem] flex items-center justify-center mx-auto shadow-glow"><Check size={48} className="text-white" strokeWidth={4} /></div>
              <h1 className="text-5xl font-serif font-black italic text-white tracking-tighter">SUCCESS.</h1>
              <button onClick={() => router.push("/hub")} className="px-12 py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.5em] text-[11px] hover:bg-brand-indigo hover:text-white transition-all shadow-premium border-none cursor-pointer">Enter Sanctuary</button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <div className="fixed bottom-12 text-[9px] font-black text-slate-900 uppercase tracking-[0.8em] italic">Identity Management System • Twassel Node</div>

      {/* ستايل مخصص للسكرول بار داخل المودال */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}} />
    </div>
  );
}