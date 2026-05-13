"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, FolderOpen, Image as ImageIcon } from "lucide-react";

export default function ResourcesSidebar({ isOpen, onClose, messages }) {
    // تصفية الرسائل لجلب الملفات والصور المعتمدة فقط
    const resources = messages.filter(m => m.file && m.moderationStatus !== "pending");

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* خلفية التعتيم تظهر فقط في الجوال */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[140]"
                    />

                    {/* الشريط الجانبي (يسار) */}
                    <motion.aside
                        initial={{ width: 0, opacity: 0, x: -50 }}
                        animate={{ width: 320, opacity: 1, x: 0 }}
                        exit={{ width: 0, opacity: 0, x: -50 }}
                        transition={{ type: "spring", damping: 25, stiffness: 250 }}
                        className="fixed lg:relative top-0 left-0 h-full bg-[#050505] border-r border-white/5 z-[150] lg:z-10 flex flex-col shrink-0 shadow-2xl lg:shadow-none overflow-hidden"
                    >
                        {/* Header الخاص بالشريط */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0A0A0B] w-[320px]">
                            <div>
                                <h3 className="text-sm font-serif font-black italic text-white flex items-center gap-2">
                                    <FolderOpen size={16} className="text-brand-indigo" />
                                    Shared Assets
                                </h3>
                                <p className="text-[7px] font-black uppercase text-slate-500 tracking-[0.3em] mt-1">Node Repository</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-white/5 text-slate-500 hover:text-white rounded-xl border-none cursor-pointer transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* قائمة الملفات */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar w-[320px]">
                            {resources.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-6">
                                    <FolderOpen size={40} className="mb-4 text-slate-600" />
                                    <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed text-slate-400">No files shared yet in this node.</p>
                                </div>
                            ) : (
                                resources.map((res) => (
                                    <div key={res.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group flex items-start gap-3">
                                        <div className="w-10 h-10 bg-brand-indigo/10 rounded-xl flex items-center justify-center text-brand-indigo shrink-0">
                                            {res.file.type?.startsWith("image/") ? <ImageIcon size={16} /> : <FileText size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-[11px] font-bold text-white truncate">{res.file.name}</p>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">By {res.authorName}</p>
                                        </div>
                                        <a href={res.file.url} target="_blank" className="p-2 text-slate-500 hover:text-brand-indigo transition-colors opacity-0 group-hover:opacity-100 border-none bg-transparent cursor-pointer">
                                            <Download size={14} />
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}