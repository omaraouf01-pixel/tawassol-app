"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Settings, Users, FolderOpen, MoreVertical } from "lucide-react";

export default function ChatHeader({
  roomData,
  isLeader,
  pendingCount,
  onOpenModeration,
  onOpenSettings,
  onOpenMembers,
  onToggleResources
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-20 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl flex items-center justify-between px-6 sm:px-10 shrink-0 z-30 sticky top-0 w-full">

      {/* ─── اليسار: معلومات العقدة ─── */}
      <div className="flex items-center gap-4 text-left">
        <div className="w-10 h-10 bg-brand-indigo/10 rounded-xl flex items-center justify-center text-brand-indigo font-black italic border border-brand-indigo/20 shadow-glow shrink-0">
          {roomData?.name?.[0] || "N"}
        </div>
        <div>
          <h2 className="text-md font-serif italic font-black text-white leading-tight truncate max-w-[150px] sm:max-w-xs">
            {roomData?.name || "Node"}
          </h2>
          <p className="text-[7px] font-black uppercase tracking-[0.3em] text-emerald-500 mt-1 flex items-center gap-1.5">
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Active Protocol
          </p>
        </div>
      </div>

      {/* ─── اليمين: أدوات التحكم ─── */}
      <div className="flex items-center gap-2 sm:gap-3 relative">

        {/* زر المصادر (Resources) */}
        <button
          onClick={onToggleResources}
          className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.08] text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 cursor-pointer flex items-center gap-2"
        >
          <FolderOpen size={12} />
          <span className="hidden sm:inline">Resources</span>
        </button>

        <div className="h-6 w-px bg-white/5 mx-1" />

        {/* ─── الزر الموحد الجديد (Dropdown Menu Trigger) ─── */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`relative p-2.5 rounded-xl transition-all cursor-pointer border flex items-center justify-center ${isMenuOpen ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white"}`}
          title="Node Menu"
        >
          <MoreVertical size={18} />

          {/* النقطة الحمراء تظهر للقائد إذا كان هناك مهام معلقة */}
          {isLeader && pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 w-3 h-3 rounded-full border-2 border-[#050505] animate-pulse shadow-glow" />
          )}
        </button>

        {/* ─── القائمة المنسدلة (The Dropdown) ─── */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* طبقة شفافة لإغلاق القائمة عند النقر خارجها */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-14 right-0 w-56 bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-2 flex flex-col gap-1">

                  {/* زر الأعضاء (يظهر للجميع) */}
                  <button
                    onClick={() => { onOpenMembers(); setIsMenuOpen(false); }}
                    className="flex items-center gap-3 w-full p-3 text-left text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all border-none bg-transparent cursor-pointer"
                  >
                    <Users size={14} /> Scholars List
                  </button>

                  {/* خيارات القائد (تظهر للقائد فقط) */}
                  {isLeader && (
                    <>
                      <div className="h-px bg-white/5 my-1 w-full" />

                      {/* زر الموافقات */}
                      <button
                        onClick={() => { onOpenModeration(); setIsMenuOpen(false); }}
                        className="flex items-center justify-between w-full p-3 text-left text-[11px] font-bold text-brand-indigo hover:bg-brand-indigo/10 rounded-xl transition-all border-none bg-transparent cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Shield size={14} className="group-hover:rotate-12 transition-transform" />
                          Moderation
                        </div>
                        {/* الرقم الأحمر بداخل القائمة */}
                        {pendingCount > 0 && (
                          <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black shadow-glow">
                            {pendingCount}
                          </span>
                        )}
                      </button>

                      {/* زر الإعدادات */}
                      <button
                        onClick={() => { onOpenSettings(); setIsMenuOpen(false); }}
                        className="flex items-center gap-3 w-full p-3 text-left text-[11px] font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all border-none bg-transparent cursor-pointer"
                      >
                        <Settings size={14} /> Node Settings
                      </button>
                    </>
                  )}

                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}