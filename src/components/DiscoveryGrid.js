"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users, BookOpen, GraduationCap,
  ShieldCheck, ArrowRight, Sparkles, Zap, Clock
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";

export default function DiscoveryGrid({ nodes, onNodeClick, pendingGroupIds }) {
  const router = useRouter();
  const { userData } = useAuth();

  // مصفوفة الحركات للأنيميشن (Stagger Effect)
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {nodes.map((node) => {
        const isAdmin = userData?.role === "admin";
        const isPending = pendingGroupIds?.has(node.id);

        return (
          <motion.div
            key={node.id}
            variants={item}
            className="group relative bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden"
          >
            {/* Header: Node Icon & Level */}
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-[#7c83f2]/10 rounded-2xl flex items-center justify-center font-serif font-black italic text-2xl text-[#7c83f2] border border-[#7c83f2]/20 group-hover:bg-[#7c83f2] group-hover:text-white transition-all duration-500 shadow-sm">
                {node.name ? node.name[0].toUpperCase() : "N"}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-4 py-1.5 bg-[#F8F8F5] dark:bg-black/20 text-slate-500 dark:text-slate-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-slate-200 dark:border-white/5">
                  {node.level || "Academic Node"}
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-1 text-[8px] font-black text-[#7c83f2] uppercase tracking-widest animate-pulse">
                    <ShieldCheck size={10} /> Admin
                  </div>
                )}
              </div>
            </div>

            {/* Content: Title & Major */}
            <div className="flex-1">
              <h3 className="text-xl font-bold font-serif italic text-slate-800 dark:text-white mb-2 line-clamp-1">
                {node.name}
              </h3>
              <p className="text-[11px] font-black text-[#7c83f2] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <GraduationCap size={14} strokeWidth={2.5} />
                {node.subject || node.major || "Major"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-6 font-medium italic font-serif">
                {node.description || "What will you discuss in this node?"}
              </p>
            </div>

            {/* Footer: Stats & Action */}
            <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2 text-slate-400">
                <Users size={16} className="text-[#7c83f2]/40" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {node.memberCount || 1} Scholars
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/hub/chat/${node.id}`);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-[#7c83f2] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#7c83f2]/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Zap size={14} fill="currentColor" /> Open
                  </button>
                ) : isPending ? (
                  <button
                    disabled
                    className="flex items-center gap-2 px-6 py-3 bg-[#7c83f2]/10 border border-[#7c83f2]/30 text-[#7c83f2] rounded-full text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                    title="Your request is pending"
                  >
                    <Clock size={14} /> Pending…
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNodeClick(node);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#7c83f2] hover:text-white hover:border-[#7c83f2] transition-all group/btn shadow-sm"
                  >
                    Join <ArrowRight size={14} data-flip-rtl className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            {/* Decorative Sparkle */}
            <div className="absolute -top-2 -end-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <Sparkles className="text-[#7c83f2]/20" size={32} />
            </div>
          </motion.div>
        );
      })}

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-30">
          <BookOpen size={48} className="mb-4 text-slate-400" strokeWidth={1} />
          <p className="font-serif italic text-lg text-slate-500">No results</p>
        </div>
      )}
    </motion.div>
  );
}