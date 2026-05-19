"use client";

import { motion } from "framer-motion";
import {
    X, Mail, Hash, GraduationCap, CalendarDays,
    Code2 as Github, Briefcase as Linkedin, Globe, Trophy,
} from "lucide-react";
import UserBadge from "@/components/UserBadge";

function formatJoinDate(createdAt) {
    if (!createdAt) return "—";
    try {
        let d;
        if (typeof createdAt === "string") d = new Date(createdAt);
        else if (createdAt?.toDate) d = createdAt.toDate();
        else if (createdAt?._seconds) d = new Date(createdAt._seconds * 1000);
        else if (createdAt?.seconds) d = new Date(createdAt.seconds * 1000);
        else d = new Date(createdAt);
        if (isNaN(d.getTime())) return "—";
        return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
        return "—";
    }
}

export default function UserProfileModal({ user: u, onClose }) {
    if (!u) return null;
    const social = u.socialLinks || {};

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none"
            >
                <div className="pointer-events-auto w-full max-w-md bg-paper dark:bg-slate-900 rounded-3xl border border-sand dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                    {/* Header */}
                    <div className="relative px-6 pt-8 pb-6 bg-accent/5 border-b border-sand dark:border-white/5 shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full text-ink-faint hover:text-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-accent/10 ring-2 ring-accent/30 shrink-0 flex items-center justify-center font-display italic font-bold text-2xl text-accent">
                                {u.avatarUrl
                                    ? <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                                    : (u.fullName?.[0]?.toUpperCase() || "?")}
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h2 className="font-display italic font-bold text-lg text-ink dark:text-white truncate">
                                        {u.fullName}
                                    </h2>
                                    <UserBadge rank={u.rank} size="sm" />
                                </div>
                                <p className="text-xs text-accent font-semibold truncate">
                                    {u.major || u.department || "Scholar"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">

                        {/* Points */}
                        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <Trophy size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Contribution Points</span>
                            </div>
                            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                {u.points ?? 0}
                            </span>
                        </div>

                        {/* Info rows */}
                        <div className="space-y-2.5">
                            <InfoRow icon={Mail} label="Email" value={u.email} />
                            {u.matricule && <InfoRow icon={Hash} label="Matricule" value={u.matricule} />}
                            <InfoRow icon={GraduationCap} label="University" value={u.university || "University of Oran 1"} />
                            <InfoRow icon={CalendarDays} label="Academic Year" value={u.academicYear || u.level || "—"} />
                            <InfoRow icon={CalendarDays} label="Member Since" value={formatJoinDate(u.createdAt)} />
                        </div>

                        {/* Bio */}
                        {u.bio && (
                            <div className="px-4 py-3 rounded-2xl bg-cream dark:bg-white/5 border border-sand dark:border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-ink-faint mb-2">Bio</p>
                                <p className="text-sm font-display italic leading-relaxed text-ink dark:text-slate-200">
                                    "{u.bio}"
                                </p>
                            </div>
                        )}

                        {/* Social links */}
                        {(social.github || social.linkedin || social.portfolio) && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-ink-faint">Links</p>
                                {social.github && (
                                    <SocialLink href={social.github} icon={Github} label="GitHub" />
                                )}
                                {social.linkedin && (
                                    <SocialLink href={social.linkedin} icon={Linkedin} label="LinkedIn" />
                                )}
                                {social.portfolio && (
                                    <SocialLink href={social.portfolio} icon={Globe} label="Portfolio" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <Icon size={14} className="text-accent shrink-0" />
            <span className="text-ink-faint text-xs w-24 shrink-0">{label}</span>
            <span className="text-ink dark:text-white font-medium truncate">{value}</span>
        </div>
    );
}

function SocialLink({ href, icon: Icon, label }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-sand dark:border-white/10 hover:border-accent/50 hover:bg-accent/5 transition group"
        >
            <Icon size={14} className="text-accent" />
            <span className="text-sm font-semibold text-ink dark:text-white">{label}</span>
        </a>
    );
}
