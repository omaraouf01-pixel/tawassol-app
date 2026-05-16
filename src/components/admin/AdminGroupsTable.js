"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    ShieldCheck,
    Users,
    Hash,
    ExternalLink,
    ChevronRight
} from "lucide-react";

export default function AdminGroupsTable({ groups = [] }) {
    const router = useRouter();

    // حالة عدم وجود مجموعات (سواء في البداية أو عند البحث)
    if (!groups || groups.length === 0) {
        return (
            <div className="py-32 text-center bg-white/50 dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-sand dark:border-white/10 transition-all">
                <div className="w-16 h-16 bg-cream dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="text-ink-faint/30" size={32} />
                </div>
                <h3 className="text-lg font-display italic font-bold text-ink dark:text-white mb-1">No Nodes Detected</h3>
                <p className="text-[10px] text-ink-faint font-black uppercase tracking-[0.2em]">The academic infrastructure is currently empty.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-sand dark:border-white/10 overflow-hidden shadow-sm transition-all duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-sand dark:border-white/5 bg-cream/30 dark:bg-white/[0.02]">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-ink-faint">Node Identity</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-ink-faint">Academic Sector</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-ink-faint">Overseer (Leader)</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-ink-faint text-right">Command</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sand dark:divide-white/5">
                        {groups.map((group) => (
                            <tr
                                key={group.id}
                                className="group hover:bg-cream/50 dark:hover:bg-white/[0.03] transition-colors"
                            >
                                {/* 1. هوية المجموعة */}
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/5 dark:bg-accent/10 flex items-center justify-center font-display italic font-bold text-xl text-accent border border-accent/10 group-hover:bg-accent group-hover:text-white transition-all duration-500 shadow-sm">
                                            {group.name ? group.name[0].toUpperCase() : "N"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-ink dark:text-white group-hover:text-accent transition-colors">
                                                {group.name}
                                            </p>
                                            <p className="text-[10px] text-ink-faint font-black uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                                <Users size={12} className="text-accent/40" />
                                                {group.memberCount || 1} Scholars
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* 2. التخصص والمستوى */}
                                <td className="px-8 py-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-accent uppercase tracking-wider bg-accent/5 self-start px-2 py-0.5 rounded-md border border-accent/10">
                                            {group.major || "Computer Science"}
                                        </span>
                                        <span className="text-[10px] text-ink-faint font-medium italic">
                                            Level: {group.level || "Any"}
                                        </span>
                                    </div>
                                </td>

                                {/* 3. القائد (المنشئ) */}
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-sand dark:bg-white/10 flex items-center justify-center text-[10px] font-black uppercase text-ink-faint">
                                            {group.leaderName ? group.leaderName[0] : "?"}
                                        </div>
                                        <p className="text-sm font-medium text-ink-muted dark:text-slate-300">
                                            {group.leaderName || "Unknown"}
                                        </p>
                                    </div>
                                </td>

                                {/* 4. الإجراءات (دخول مباشر للأدمن) */}
                                <td className="px-8 py-5 text-right">
                                    <button
                                        onClick={() => router.push(`/hub/chat/${group.id}`)}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-white/5 border border-sand dark:border-white/10 text-ink dark:text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white hover:border-accent hover:shadow-lg hover:shadow-accent/20 transition-all group/btn"
                                    >
                                        <ShieldCheck size={14} className="group-hover/btn:scale-110 transition-transform" />
                                        Visit Node
                                        <ChevronRight size={14} className="opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}