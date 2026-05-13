"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, Compass, Shield, GraduationCap } from "lucide-react";

export default function ActiveNodesSidebar({ nodes = [], currentUser, loading = false }) {
    const router = useRouter();

    // إذا كان التحميل جارياً أو لا يوجد مستخدم بعد، نعرض حالة البحث
    if (loading || !currentUser) {
        return (
            <div className="w-full max-w-[320px] bg-[#0A0A0B] border border-white/5 rounded-[2.5rem] p-8 flex flex-col shadow-2xl h-fit sticky top-10">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-brand-indigo/10 rounded-lg flex items-center justify-center text-brand-indigo shadow-glow">
                        <Users size={16} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Active Nodes</h3>
                </div>
                <div className="py-10 flex flex-col items-center justify-center text-slate-800 animate-pulse">
                    <div className="w-6 h-6 border-2 border-brand-indigo/20 border-t-brand-indigo rounded-full animate-spin mb-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Scanning Network...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[320px] bg-[#0A0A0B] border border-white/5 rounded-[2.5rem] p-8 flex flex-col shadow-2xl overflow-hidden h-fit sticky top-10">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-8 h-8 bg-brand-indigo/10 rounded-lg flex items-center justify-center text-brand-indigo shadow-glow">
                    <Users size={16} />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Active Nodes</h3>
            </div>

            <div className="flex-1 space-y-4 mb-10 overflow-y-auto custom-scrollbar max-h-[450px] pr-2">
                {nodes.length === 0 ? (
                    <div className="py-12 text-center opacity-30">
                        <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed text-slate-500 italic">
                            No active clusters detected.
                        </p>
                    </div>
                ) : (
                    nodes.map((node) => {
                        // دعم كلاً من id و uid لضمان التوافق
                        const isOverseer = node.leaderId === (currentUser?.uid || currentUser?.id);

                        return (
                            <motion.button
                                key={node.id}
                                whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.03)" }}
                                onClick={() => router.push(`/hub/chat/${node.id}`)}
                                className="w-full p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center gap-4 transition-all cursor-pointer group relative overflow-hidden text-left border-none"
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-serif font-black italic text-lg transition-all border ${isOverseer ? "bg-brand-indigo/10 border-brand-indigo/30 text-brand-indigo" : "bg-white/5 border-white/5 text-slate-500 group-hover:text-white"
                                    }`}>
                                    {node.name?.[0] || "N"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[12px] font-bold text-white truncate leading-none">{node.name}</p>
                                        {node.isActive && (
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        {isOverseer ? (
                                            <span className="flex items-center gap-1 text-[7px] font-black uppercase tracking-widest text-brand-indigo">
                                                <Shield size={8} /> Overseer
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[7px] font-black uppercase tracking-widest text-slate-600">
                                                <GraduationCap size={8} /> Scholar
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })
                )}
            </div>

            <div className="pt-6 border-t border-white/5">
                <button onClick={() => router.push("/explore")} className="w-full py-4 bg-white/[0.02] hover:bg-white text-slate-500 hover:text-black rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border border-white/5 hover:border-white cursor-pointer flex items-center justify-center gap-3 shadow-sm border-none">
                    Explore Ecosystem
                    <Compass size={14} />
                </button>
            </div>
        </div>
    );
}