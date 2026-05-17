"use client";

import React from "react";
import { FileText, Download, ShieldCheck } from "lucide-react";

export default function ResourcesSidebar({ messages = [] }) {
    // Approved files only — pending stays in the moderation panel
    const resources = messages.filter(
        (m) => (m.fileUrl || m.file) && m.moderationStatus !== "pending",
    );

    return (
        <div className="flex flex-col h-full bg-transparent">
            <div className="px-6 pt-6 pb-4">
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-faint font-sans">Node resources</h3>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar px-3 space-y-1 pb-4">
                {resources.length === 0 ? (
                    <div className="py-8 text-center opacity-30 italic text-[10px] uppercase font-black tracking-widest">
                        No resources yet
                    </div>
                ) : (
                    resources.map((res, idx) => (
                        <div
                            key={idx}
                            className="group w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors duration-200 border-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                        >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-black/5 dark:bg-white/10 text-ink-faint group-hover:bg-accent group-hover:text-white">
                                <FileText size={16} />
                            </div>

                            <div className="flex-1 min-w-0 text-start">
                                <p className="text-[12px] font-bold truncate leading-tight text-ink dark:text-slate-200">
                                    {res.fileName || "Scholarly Asset"}
                                </p>
                                <span className="text-[7px] font-black uppercase tracking-widest mt-1 flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <ShieldCheck size={8} className="text-emerald-500" /> Verified
                                </span>
                            </div>

                            <a
                                href={res.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-ink-faint opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                                title="Download"
                                aria-label="Download"
                            >
                                <Download size={14} />
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
