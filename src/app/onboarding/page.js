"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Book, School, GraduationCap,
  ArrowRight, ArrowLeft, Loader2,
  Sparkles, User, CheckCircle2
} from "lucide-react";

// Firebase
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

// Academic Data — Single Source of Truth
import { UNIVERSITIES, MAJORS, LEVELS } from "@/lib/academicData";

// Components
import TsswalLogo from "@/components/TsswalLogo";
import SelectionModal from "@/components/SelectionModal";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
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
          throw new Error("Upload failed.");
        }
      }

      // استدعاء API لحفظ البيانات وإنشاء المجتمعات الأكاديمية الرسمية تلقائياً
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/user/setup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          university: form.university,
          major:      form.major,
          level:      form.level,
          bio:        form.bio,
          avatarUrl:  photoUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Setup failed. Please try again.");
      }

      // بمجرد نجاح الـ API، ننتقل للمرحلة 3
      setStep(3);
    } catch (error) {
      console.error("Onboarding Sync Error:", error);
      alert("Could not save: " + error.message);
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
          <span className="font-serif text-[18px] italic font-bold text-slate-800 dark:text-slate-100">Twassel</span>
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
                <h1 className="font-serif text-3xl font-bold text-slate-800 dark:text-slate-50 mb-3">Complete your academic profile</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-10 text-sm">Tell us a bit more about you for a tailored experience.</p>

                <div className="space-y-4">
                  {[
                    { key: "university", label: "Field", val: form.university, opts: UNIVERSITIES, icon: School, placeholder: "Choose your major" },
                    { key: "major", label: "Major", val: form.major, opts: MAJORS, icon: Book, placeholder: "Choose your major" },
                    { key: "level", label: "Academic year", val: form.level, opts: LEVELS, icon: GraduationCap, placeholder: "Choose your year" },
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
                  Continue <ArrowRight size={16} data-flip-rtl />
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
                  <ArrowLeft size={14} data-flip-rtl /> Back
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
                  <p className="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Update photo</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ms-2">Bio</label>
                  <textarea
                    placeholder="A short bio…"
                    value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm outline-none focus:border-[#7c83f2]/50 transition-all min-h-[120px] resize-none dark:text-white"
                  />
                </div>

                <button
                  disabled={isSubmitting || !form.bio}
                  onClick={handleFinalize}
                  className="w-full mt-10 py-5 bg-[#7c83f2] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-[#7c83f2]/30 hover:bg-[#686ee0] transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Finish"}
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

                <h1 className="font-serif text-4xl font-bold text-slate-800 dark:text-slate-50 mb-4">Welcome to Twassel</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-10 text-sm leading-relaxed">
                  Saved
                  <span className="font-bold text-[#7c83f2] mt-2 block">Welcome to Twassel</span>
                </p>

                <button
                  onClick={() => {
                    window.location.replace("/hub");
                  }}
                  className="w-full py-5 bg-[#7c83f2] text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-[#7c83f2]/30 hover:bg-[#686ee0] transition-all flex items-center justify-center gap-3"
                >
                  <Sparkles size={16} /> The Hub
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
      />

    </div>
  );
}