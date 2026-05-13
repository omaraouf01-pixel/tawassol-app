"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Book, Sparkles,
  Users, Gavel, HelpCircle, Plus, X, Loader2, School, Search, Check, Layers
} from "lucide-react";

// ─── الاستيرادات من مكتباتك الخاصة ───
import { auth, firestore } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { COL, buildGroupDoc } from "@/lib/collections";

// ─── القوائم المقترحة ───
const UNIVERSITIES = [
  "Université d'Oran 1 Ahmed Ben Bella",
  "Université d'Oran 2 Mohamed Ben Ahmed",
  "USTO-MB (Oran)",
  "ESI (Algiers)",
  "USTHB (Algiers)",
  "Université de Tlemcen",
];

const SUBJECTS = [
  "Computer Science",
  "Artificial Intelligence",
  "Cyber Security",
  "Mathematics",
  "Theoretical Physics",
  "Architecture & Urbanism",
  "General Medicine",
  "Pharmacy",
  "Civil Engineering",
  "Economic Sciences"
];

export default function CreateGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // حالات التحكم في النوافذ المنبثقة
  const [isUniModalOpen, setIsUniModalOpen] = useState(false);
  const [isSubjModalOpen, setIsSubjModalOpen] = useState(false);
  const [uniSearch, setUniSearch] = useState("");
  const [subjSearch, setSubjSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    subject: "", // الآن يتم اختياره من الـ Modal
    university: "",
    description: "",
    rules: "",
    questions: [""],
    academicYear: "L1",
  });

  // ─── منطق الحفظ في Firebase ───
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!formData.university || !formData.subject) {
      alert("Please select both University and Major.");
      return;
    }
    setLoading(true);

    try {
      const filteredQuestions = formData.questions.filter(q => q.trim() !== "");

      // بناء المستند باستخدام الـ Helper الخاص بك
      const groupData = buildGroupDoc({
        ...formData,
        questions: filteredQuestions,
        tags: [formData.academicYear, formData.subject, formData.university],
        leaderId: auth.currentUser.uid,
        leaderName: auth.currentUser.displayName || "Scholar",
      });

      // الإرسال لـ Firestore
      await addDoc(collection(firestore, COL.GROUPS), groupData);
      router.push(`/hub`);
    } catch (error) {
      console.error("Firebase Error:", error);
      alert("Error forging node: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── فلاتر البحث ───
  const filteredUnis = UNIVERSITIES.filter(u => u.toLowerCase().includes(uniSearch.toLowerCase()));
  const filteredSubjs = SUBJECTS.filter(s => s.toLowerCase().includes(subjSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center p-6 py-20 relative overflow-y-auto custom-scrollbar">

      {/* ─── Modal: اختيار الجامعة ─── */}
      <AnimatePresence>
        {isUniModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUniModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg bg-[#0A0A0B] border border-white/10 rounded-[2.5rem] p-8 relative z-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8"><h3 className="text-[12px] font-black uppercase tracking-[0.3em]">Select University</h3><button onClick={() => setIsUniModalOpen(false)} className="bg-transparent border-none text-slate-500 cursor-pointer"><X size={20} /></button></div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input autoFocus placeholder="Search Universities..." className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-white outline-none focus:border-brand-indigo/30 transition-all" onChange={(e) => setUniSearch(e.target.value)} />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
                {filteredUnis.map((uni) => (
                  <button key={uni} onClick={() => { setFormData({ ...formData, university: uni }); setIsUniModalOpen(false); }} className="w-full text-left px-6 py-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-brand-indigo/30 transition-all flex items-center justify-between cursor-pointer group">
                    <span className={`text-[12px] font-bold ${formData.university === uni ? 'text-brand-indigo' : 'text-slate-400'}`}>{uni}</span>
                    {formData.university === uni && <Check size={14} className="text-brand-indigo" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal: اختيار التخصص ─── */}
      <AnimatePresence>
        {isSubjModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSubjModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg bg-[#0A0A0B] border border-white/10 rounded-[2.5rem] p-8 relative z-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8"><h3 className="text-[12px] font-black uppercase tracking-[0.3em]">Select Major</h3><button onClick={() => setIsSubjModalOpen(false)} className="bg-transparent border-none text-slate-500 cursor-pointer"><X size={20} /></button></div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input autoFocus placeholder="Search Subjects..." className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm text-white outline-none focus:border-brand-indigo/30 transition-all" onChange={(e) => setSubjSearch(e.target.value)} />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
                {filteredSubjs.map((subj) => (
                  <button key={subj} onClick={() => { setFormData({ ...formData, subject: subj }); setIsSubjModalOpen(false); }} className="w-full text-left px-6 py-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-brand-indigo/30 transition-all flex items-center justify-between cursor-pointer group">
                    <span className={`text-[12px] font-bold ${formData.subject === subj ? 'text-brand-indigo' : 'text-slate-400'}`}>{subj}</span>
                    {formData.subject === subj && <Check size={14} className="text-brand-indigo" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* زر الرجوع */}
      <button onClick={() => router.back()} className="fixed top-10 left-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white bg-transparent border-none cursor-pointer z-50"><ArrowLeft size={14} /> Back to Hub</button>

      {/* الرأس */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
        <h1 className="text-[50px] xl:text-[64px] font-serif font-black italic tracking-tighter text-white">Forge Node.</h1>
        <div className="flex items-center justify-center gap-3"><Sparkles size={14} className="text-brand-indigo" /><p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500">Initialize A Collective Sanctuary</p></div>
      </motion.div>

      <motion.form onSubmit={handleCreate} className="w-full max-w-2xl bg-[#0A0A0B] border border-white/5 rounded-[2.5rem] p-10 shadow-premium space-y-16 mb-20">

        {/* 1. Core Intelligence */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 mb-6"><div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-brand-indigo"><Book size={18} /></div><h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Core Intelligence</h3></div>
          <div className="space-y-6">
            <input required placeholder="Node Name" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-[15px] outline-none focus:border-brand-indigo/30 text-white" onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <textarea required placeholder="Node Objective..." className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-[14px] outline-none focus:border-brand-indigo/30 text-white min-h-[100px] resize-none" onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
        </section>

        {/* 2. Node Protocol & Questions (دمج لتقليل الطول) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <section className="space-y-6">
            <div className="flex items-center gap-4"><Gavel size={16} className="text-brand-indigo" /><h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Protocol</h3></div>
            <textarea placeholder="Basic rules..." className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-4 text-[12px] outline-none text-white h-[120px] resize-none" onChange={(e) => setFormData({ ...formData, rules: e.target.value })} />
          </section>
          <section className="space-y-6">
            <div className="flex items-center justify-between"><div className="flex items-center gap-4"><HelpCircle size={16} className="text-brand-indigo" /><h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Questions</h3></div><button type="button" onClick={() => setFormData({ ...formData, questions: [...formData.questions, ""] })} className="p-1 bg-white/5 rounded border-none text-brand-indigo cursor-pointer"><Plus size={14} /></button></div>
            <div className="space-y-3 max-h-[120px] overflow-y-auto custom-scrollbar">
              {formData.questions.map((q, i) => (
                <input key={i} placeholder={`Q#${i + 1}`} className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-[11px] text-white outline-none" onChange={(e) => { const n = [...formData.questions]; n[i] = e.target.value; setFormData({ ...formData, questions: n }); }} />
              ))}
            </div>
          </section>
        </div>

        {/* 3. Academic Context (القسم المطلوب تعديله) */}
        <section className="space-y-10 pt-8 border-t border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-brand-indigo"><Users size={18} /></div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Academic Context</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* اختيار التخصص (Subject) بنفس طريقة الجامعة */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-2">Major / Discipline</label>
              <button type="button" onClick={() => setIsSubjModalOpen(true)} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-[13px] text-left flex items-center justify-between hover:border-brand-indigo/30 transition-all cursor-pointer">
                <span className={formData.subject ? "text-white font-bold" : "text-slate-700"}>{formData.subject || "Select Major"}</span>
                <Layers size={16} className="text-slate-700" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-2">Sanctuary (University)</label>
              <button type="button" onClick={() => setIsUniModalOpen(true)} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-[13px] text-left flex items-center justify-between hover:border-brand-indigo/30 transition-all cursor-pointer">
                <span className={formData.university ? "text-white font-bold" : "text-slate-700"}>{formData.university || "Select University"}</span>
                <School size={16} className="text-slate-700" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-2">Academic Level</label>
            <div className="grid grid-cols-5 gap-3">
              {["L1", "L2", "L3", "M1", "M2"].map((year) => (
                <button key={year} type="button" onClick={() => setFormData({ ...formData, academicYear: year })} className={`py-4 rounded-xl text-[10px] font-black border transition-all ${formData.academicYear === year ? "bg-brand-indigo border-brand-indigo text-white shadow-glow" : "bg-white/[0.02] border-white/5 text-slate-600 hover:border-white/10"}`}>{year}</button>
              ))}
            </div>
          </div>
        </section>

        <button type="submit" disabled={loading} className="w-full py-6 bg-white text-black rounded-full text-[12px] font-black uppercase tracking-[0.4em] shadow-glow hover:bg-brand-indigo hover:text-white transition-all duration-700 border-none cursor-pointer disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Forge Node."}
        </button>
      </motion.form>
    </div>
  );
}