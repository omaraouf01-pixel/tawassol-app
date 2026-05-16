"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/useLanguage";

const ACADEMIC_PURPLE = "#7c83f2";

export default function ActiveNodesSidebar({ nodes = [], activeId, currentUser }) {
    const router = useRouter();
    const { t } = useLanguage();

    // حارس واجهة: لا نرندر أي عقدة لا ينتمي إليها المستخدم (عضو أو قائد).
    const uid = currentUser?.uid;
    const myNodes = uid
        ? nodes.filter(
            (n) => Array.isArray(n.members) && (n.members.includes(uid) || n.leaderId === uid)
        )
        : [];

    return (
        <div className="flex flex-col h-full bg-transparent">
            <div className="px-6 pt-6 pb-4">
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-faint font-sans">{t("nav.myCommunities")}</h3>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar px-3 space-y-1">
                {myNodes.length === 0 && (
                    <p className="px-3 py-2 text-[9px] text-ink-faint italic">{t("nav.noClusters")}</p>
                )}
                {myNodes.map((node) => {
                    const isActive = node.id === activeId;
                    const isLeader = node.leaderId === currentUser?.uid;

                    return (
                        <button
                            key={node.id}
                            onClick={() => router.push(`/hub/chat/${node.id}`)}
                            /* الحاوية: إزالة الحدود والظلال، الاعتماد على الشفافية وتأثير Hover ناعم */
                            className={`
                                group w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors duration-200 border-none cursor-pointer text-start
                                ${isActive
                                    ? "text-white"
                                    : "bg-transparent text-ink-muted dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"
                                }
                            `}
                            style={isActive ? { background: ACADEMIC_PURPLE } : undefined}
                        >
                            {/* أيقونة الحرف الأول: مسطحة تماماً بدون إطارات، تتفاعل مع الـ Hover الخاص بالزر */}
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-display font-black italic text-sm shrink-0 transition-colors ${isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-black/5 dark:bg-white/10 text-ink-faint group-hover:text-ink dark:group-hover:text-white"
                                }`}>
                                {node.name?.[0]?.toUpperCase() || "N"}
                            </div>

                            <div className="flex-1 min-w-0 text-start">
                                <p className="text-[12px] font-bold truncate leading-tight">
                                    {node.name}
                                </p>
                                <span className={`text-[7px] font-black uppercase tracking-widest mt-1 block ${isActive ? "text-white/70" : "opacity-50"}`}>
                                    {isLeader ? t("roles.overseer") : t("roles.scholar")}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}