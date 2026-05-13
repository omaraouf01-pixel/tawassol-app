"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid,
  Compass,
  User,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Plus
} from "lucide-react";

import { motion } from "framer-motion";

// ─── الاستيرادات الأساسية ───
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import TsswalLogo from "./TsswalLogo";

export default function Sidebar({ currentUser }) {
  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    { label: "The Hub", icon: LayoutGrid, href: "/hub" },
    { label: "Explore", icon: Compass, href: "/explore" },
    { label: "Profile", icon: User, href: "/profile" },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="w-[280px] h-screen bg-black border-r border-white/5 fixed left-0 top-0 flex flex-col z-40 p-8 text-left transition-all duration-500">

      {/* ─── الشعار ─── */}
      <div className="flex items-center gap-4 mb-16 group cursor-pointer" onClick={() => router.push('/hub')}>
        <div className="w-10 h-10 bg-brand-indigo/10 rounded-2xl flex items-center justify-center text-brand-indigo border border-brand-indigo/20 shadow-glow group-hover:scale-110 transition-transform">
          <TsswalLogo size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] font-black uppercase tracking-[0.3em] text-white leading-none">Twassel</span>
          <span className="text-[7px] font-bold text-brand-indigo/60 uppercase tracking-[0.2em] mt-1.5 italic">Node Network</span>
        </div>
      </div>

      {/* ─── القائمة (تم نزع العنوان منها) ─── */}
      <nav className="flex-1 space-y-3">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative border-none cursor-pointer ${isActive
                ? "bg-white/[0.03] text-white border border-white/5 shadow-premium"
                : "bg-transparent text-slate-600 hover:text-slate-200 hover:bg-white/[0.01]"
                }`}
            >
              <Icon size={18} className={isActive ? "text-brand-indigo" : "text-slate-800"} />
              <span className="relative z-10">{item.label}</span>

              {isActive && (
                <motion.div
                  layoutId="sidebarGlow"
                  className="absolute left-[-2px] w-1 h-5 bg-brand-indigo rounded-full shadow-glow"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ─── القسم السفلي ─── */}
      <div className="space-y-4 pt-8 border-t border-white/5">

        {/* زر إنشاء مجموعة (Forge Node) */}
        <button
          onClick={() => router.push('/groups/create')}
          className="w-full flex items-center justify-center gap-3 py-4 bg-brand-indigo text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-glow hover:bg-white hover:text-black transition-all duration-500 group border-none cursor-pointer"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" />
          <span>Forge New Node</span>
        </button>

        {currentUser?.role === "admin" && (
          <button
            onClick={() => router.push("/admin")}
            className="w-full flex items-center justify-between px-6 py-4 bg-brand-indigo/10 text-brand-indigo rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border border-brand-indigo/10 hover:bg-brand-indigo hover:text-white transition-all cursor-pointer shadow-glow"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} />
              <span>Overseer Panel</span>
            </div>
            <ChevronRight size={14} />
          </button>
        )}

        {/* كارت المستخدم */}
        <div
          onClick={() => router.push('/profile')}
          className="group p-5 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center gap-4 hover:border-white/10 transition-all cursor-pointer"
        >
          <div className="w-11 h-11 bg-white/5 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center shrink-0 group-hover:border-brand-indigo/30 transition-all">
            {currentUser?.profilePicUrl ? (
              <img src={currentUser.profilePicUrl} className="w-full h-full object-cover" alt="Avatar" />
            ) : (
              <span className="text-white font-serif italic font-black">{currentUser?.fullName?.[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[11px] font-black text-white truncate uppercase tracking-widest leading-none">
              {currentUser?.fullName}
            </p>
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-2 italic truncate">
              {currentUser?.major || "Scholar"}
            </p>
          </div>
        </div>

        {/* زر الخروج */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-2 text-slate-700 hover:text-rose-500 text-[9px] font-black uppercase tracking-[0.4em] bg-transparent border-none cursor-pointer transition-colors"
        >
          <LogOut size={14} />
          Terminate Link
        </button>
      </div>
    </aside>
  );
}