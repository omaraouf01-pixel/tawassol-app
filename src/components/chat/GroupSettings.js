"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Settings, Info, Lock, Edit3, Loader2 } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { COL } from "@/lib/collectionNames";
import { useLanguage } from "@/lib/useLanguage";

export default function GroupSettings({ isOpen, onClose, groupData, setToast }) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: groupData?.name || "",
        subject: groupData?.subject || "",
        description: groupData?.description || "",
        rules: groupData?.rules || ""
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const groupRef = doc(firestore, COL.GROUPS, groupData.id);
            await updateDoc(groupRef, formData);
            setToast(t("chat.settings.saved"));
            onClose();
        } catch (error) {
            console.error(error);
            setToast(t("chat.settings.saveError"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160]" />
                    <motion.aside
                        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed top-0 end-0 h-screen w-full sm:w-[420px] bg-[#050505] border-s border-white/10 z-[170] flex flex-col shadow-2xl"
                    >
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#0A0A0B]">
                            <div className="flex items-center gap-3">
                                <Settings className="text-brand-indigo" size={20} />
                                <div>
                                    <h3 className="text-lg font-serif font-black italic text-white leading-none">{t("chat.settings.title")}</h3>
                                    <p className="text-[7px] font-black uppercase text-slate-600 tracking-[0.3em] mt-2">{t("roles.overseer")}</p>
                                </div>
                            </div>
                            <button onClick={onClose} aria-label={t("common.close")} className="p-2 bg-white/5 text-slate-500 hover:text-white rounded-xl border-none cursor-pointer transition-colors"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><Edit3 size={10} /> {t("chat.settings.nameLabel")}</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-brand-indigo/40 transition-all font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{t("groupsCreate.fieldLabel")}</label>
                                <input
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-brand-indigo/40 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><Info size={10} /> {t("chat.settings.descLabel")}</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    placeholder={t("groupsCreate.descPlaceholder")}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-brand-indigo/40 transition-all italic font-serif resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><Lock size={10} /> {t("chat.settings.title")}</label>
                                <textarea
                                    value={formData.rules}
                                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                                    rows={4}
                                    placeholder={t("groupsCreate.descPlaceholder")}
                                    className="w-full bg-brand-indigo/5 border border-brand-indigo/10 rounded-xl py-3 px-4 text-slate-300 text-sm outline-none focus:border-brand-indigo/40 transition-all italic font-serif resize-none"
                                />
                            </div>
                        </form>

                        <div className="p-8 border-t border-white/5 bg-[#0A0A0B]">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-indigo hover:text-white transition-all border-none cursor-pointer flex items-center justify-center gap-2 shadow-glow"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {isSaving ? t("common.saving") : t("chat.settings.save")}
                            </button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
