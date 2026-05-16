"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Book, School, GraduationCap, Check,
  Search, X, ArrowRight, ArrowLeft, Loader2,
  Sparkles, User, CheckCircle2
} from "lucide-react";

// Firebase
import { auth, firestore } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/lib/useLanguage";

// Academic Data — Single Source of Truth
import { UNIVERSITIES, MAJORS, LEVELS } from "@/lib/academicData";

// Components
import TsswalLogo from "@/components/TsswalLogo";

const SelectionModal = ({ isOpen, onClose, title, options, onSelect, selectedValue, t }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-[#F8F8F5] dark:bg-[#0a0a0b] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative"
          >
            <button onClick={onClose} aria-label={t("common.close")} className="absolute top-8 end-8 text-slate-400 hover:text-[#7c83f2] transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#7c83f2] mb-6">{t("common.select")} — {title}</h2>

            <div className="relative mb-6">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text" placeholder={t("common.search")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 ps-12 pe-4 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-[#7c83f2]/20 transition-all"
              />
            </div>

            <div className="max-h-[250px] overflow-y-auto space-y-2 pe-2 custom-scrollbar">
              {filtered.map((opt) => (
                <button
                  key={opt} onClick={() => { onSelect(opt); onClose(); setSearchTerm(""); }}
                  className={`w-full text-start p-4 rounded-xl text-sm font-semibold transition-all flex justify-between items-center ${selectedValue === opt
                    ? "bg-[#7c83f2] text-white shadow-lg"
                    : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                >
                  {opt} {selectedValue === opt && <Check size={16} />}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 🛡️ علم ثابت يمنع أي توجيه تلقائي بمجرد أن يبدأ المستخدم عملية الحفظ النهائي.
  //    يستعمل ref لأنه لا يجب أن يتسبّب في إعادة render، ويُحصّن ضدّ سباق onSnapshot.
  const finalizingRef = useRef(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [modal, setModal] = useState({ open: false, type: "", title: "", options: [] });

  const [form, setForm] = useState({
    university: "",
    major: "",
    level: "",
    bio: ""
  });

  // ─── 1. منطق التوجيه (محصّن ضدّ سباق onSnapshot) ───
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/auth");
      return;
    }

    // 🛡️ القاعدة الذهبية: إذا بدأ المستخدم بالفعل عملية الإنهاء، أو وصل لمرحلة النجاح،
    //    لا نسمح بأي توجيه تلقائي. الـ ref حقيقة ثابتة لا يلامسها السباق.
    if (finalizingRef.current || step === 3) return;

    if (!userData) return;

    if (userData.role === "admin") {
      router.replace("/admin");
    } else if (userData.status === "pending") {
      router.replace("/pending");
    } else if (userData.onboarded && userData.status === "active") {
      // مستخدم Active دخل الصفحة من قبل ولم يكن في عملية التسجيل → الـ Hub مباشرة
      router.replace("/hub");
    }
  }, [user, userData, authLoading, router, step]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ─── 2. دالة الحفظ النهائية ───
  const handleFinalize = async () => {
    // 🔒 ارفع العلم قبل أيّ كتابة في Firestore: من هذه اللحظة لا يحقّ لأيّ effect توجيه المستخدم.
    finalizingRef.current = true;
    setIsSubmitting(true);
    try {
      const uid = auth.currentUser.uid;
      let photoUrl = userData?.avatarUrl || "";

      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        fd.append("folder", "tawassol/avatars");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: fd
        });

        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          photoUrl = uploadData.url;
        } else {
          throw new Error(t("hub.uploadFailed"));
        }
      }

      // تحديث البيانات في Firestore
      const userRef = doc(firestore, "users", uid);
      await updateDoc(userRef, {
        university: form.university,
        major: form.major,
        level: form.level,
        bio: form.bio,
        avatarUrl: photoUrl,
        onboarded: true,
        status: "active", // تغيير الحالة إلى نشط
        updatedAt: new Date()
      });

      // بمجرد انتهاء التحديث، ننتقل للمرحلة 3
      // بفضل التعديلات في useAuth.js وهذا المكون، لن يتم توجيهك تلقائياً
      setStep(3);
    } catch (error) {
      console.error("Onboarding Sync Error:", error);
      alert(t("onboarding.errorSaving") + ": " + error.message);
      finalizingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const pageBg = "bg-[#F8F8F5] dark:bg-[#0a0a0b] transition-colors duration-700";

  if (authLoading || (user && !userData)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pageBg}`}>
        <Loader2 className="text-[#7c83f2] animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${pageBg}`}>

      {/* ── Header ── */}
      <header className="max-w-[1360px] w-full mx-auto px-6 lg:px-10 py-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[12px] bg-[#7c83f2] flex items-center justify-center text-white shadow-lg shadow-[#7c83f2]/20">
            <TsswalLogo size={20} />
          </div>
          <span className="font-serif text-[18px] italic font-bold text-slate-800 dark:text-slate-100">{t("common.appName")}</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10 relative">
        <div className="w-full max-w-[550px]">
          <AnimatePresence mode="wait">

            {/* المرحلة 1: الأكاديميا */}
            {step === 1 && (
              <motion.div
                key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 sm:p-14 shadow-xl border border-slate-100 dark:border-slate-800"
              >
                <div className="w-16 h-16 bg-[#7c83f2]/10 rounded-2xl flex items-center justify-center text-[#7c83f2] mb-8">
                  <School size={32} />
                </div>
                <h1 className="font-serif text-3xl font-bold text-slate-800 dark:text-slate-50 mb-3">{t("onboarding.title")}</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-10 text-sm">{t("onboarding.subtitle")}</p>

                <div className="space-y-4">
                  {[
                    { key: "university", label: t("groupsCreate.fieldLabel"), val: form.university, opts: UNIVERSITIES, icon: School, placeholder: t("onboarding.majorPlaceholder") },
                    { key: "major", label: t("profile.major"), val: form.major, opts: MAJORS, icon: Book, placeholder: t("onboarding.majorPlaceholder") },
                    { key: "level", label: t("profile.year"), val: form.level, opts: LEVELS, icon: GraduationCap, placeholder: t("onboarding.yearPlaceholder") },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setModal({ open: true, type: f.key, title: f.label, options: f.opts })}
                      className="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-[#7c83f2] transition-all text-start group"
                    >
                      <div className="flex items-center gap-4">
                        <f.icon size={18} className="text-slate-400 group-hover:text-[#7c83f2]" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{f.label}</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{f.val || f.placeholder}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-300" data-flip-rtl />
                    </button>
                  ))}
                </div>

                <button
                  disabled={!form.university || !form.major || !form.level}
                  onClick={() => setStep(2)}
                  className="w-full mt-10 py-5 bg-[#7c83f2] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-[#7c83f2]/30 hover:bg-[#686ee0] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {t("common.continue")} <ArrowRight size={16} data-flip-rtl />
                </button>
              </motion.div>
            )}

            {/* المرحلة 2: الصورة والـ Bio */}
            {step === 2 && (
              <motion.div
                key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 sm:p-14 shadow-xl border border-slate-100 dark:border-slate-800"
              >
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 dark:hover:text-white mb-8 transition-colors text-xs font-bold uppercase tracking-widest">
                  <ArrowLeft size={14} data-flip-rtl /> {t("common.back")}
                </button>

                <div className="flex flex-col items-center mb-10">
                  <div className="relative cursor-pointer group" onClick={() => fileInputRef.current.click()}>
                    <div className="w-28 h-28 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-[#7c83f2]/30 overflow-hidden transition-all group-hover:border-[#7c83f2]">
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <User size={40} className="text-slate-300" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -end-2 w-10 h-10 bg-[#7c83f2] text-white rounded-xl flex items-center justify-center shadow-lg"><Camera size={18} /></div>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                  </div>
                  <p className="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{t("profile.avatarUpdate")}</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ms-2">{t("profile.bio")}</label>
                  <textarea
                    placeholder={t("onboarding.bioPlaceholder")}
                    value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm outline-none focus:border-[#7c83f2]/50 transition-all min-h-[120px] resize-none dark:text-white"
                  />
                </div>

                <button
                  disabled={isSubmitting || !form.bio}
                  onClick={handleFinalize}
                  className="w-full mt-10 py-5 bg-[#7c83f2] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-[#7c83f2]/30 hover:bg-[#686ee0] transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : t("onboarding.submit")}
                </button>
              </motion.div>
            )}

            {/* المرحلة 3: ترحيب النجاح */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 sm:p-14 shadow-xl border border-slate-100 dark:border-slate-800 text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-8">
                  <CheckCircle2 size={40} />
                </div>

                <h1 className="font-serif text-4xl font-bold text-slate-800 dark:text-slate-50 mb-4">{t("onboarding.welcome")}</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-10 text-sm leading-relaxed">
                  {t("profile.saved")}
                  <span className="font-bold text-[#7c83f2] mt-2 block">{t("onboarding.welcome")}</span>
                </p>

                <button
                  onClick={() => {
                    window.location.replace("/hub");
                  }}
                  className="w-full py-5 bg-[#7c83f2] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-[#7c83f2]/30 hover:bg-[#686ee0] transition-all flex items-center justify-center gap-3"
                >
                  <Sparkles size={16} /> {t("nav.hub")}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* مودال الاختيار (كما هو) */}
      <SelectionModal
        isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })}
        title={modal.title} options={modal.options} selectedValue={form[modal.type]}
        onSelect={(val) => setForm({ ...form, [modal.type]: val })}
        t={t}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(124, 131, 242, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}