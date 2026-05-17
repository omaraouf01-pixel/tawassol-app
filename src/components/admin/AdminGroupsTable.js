"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    ShieldCheck,
    Users,
    ExternalLink,
    ChevronRight,
    Trash2,
    UserMinus,
    Loader2,
    X,
    Shield,
} from "lucide-react";
import { firestore } from "@/lib/firebase";
import {
    doc,
    getDoc,
    deleteDoc,
    updateDoc,
    arrayRemove,
    increment,
} from "firebase/firestore";
import { COL } from "@/lib/collectionNames";

export default function AdminGroupsTable({ groups = [] }) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState(null);
    const [manageGroup, setManageGroup] = useState(null);

    const handleDelete = async (group) => {
        if (!group?.id || deletingId) return;
        if (!confirm(`Delete the node "${group.name || "Untitled"}"? This cannot be undone.`)) return;

        setDeletingId(group.id);
        try {
            await deleteDoc(doc(firestore, COL.GROUPS, group.id));
        } catch (err) {
            console.error("[AdminGroupsTable] Delete failed:", err);
            alert("Could not delete node.");
        } finally {
            setDeletingId(null);
        }
    };

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
        <>
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

                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                            <button
                                                onClick={() => setManageGroup(group)}
                                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-sand dark:border-white/10 text-ink dark:text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white hover:border-accent transition-all"
                                                title="Manage members"
                                            >
                                                <Users size={14} />
                                                Members
                                            </button>

                                            <button
                                                onClick={() => router.push(`/hub/chat/${group.id}?from=admin`)}
                                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-sand dark:border-white/10 text-ink dark:text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white hover:border-accent hover:shadow-lg hover:shadow-accent/20 transition-all group/btn"
                                            >
                                                <ShieldCheck size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                Visit
                                                <ChevronRight size={14} className="opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(group)}
                                                disabled={deletingId === group.id}
                                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-red-500/30"
                                                title="Delete node"
                                            >
                                                {deletingId === group.id
                                                    ? <Loader2 size={14} className="animate-spin" />
                                                    : <Trash2 size={14} />}
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {manageGroup && (
                    <ManageMembersModal
                        group={manageGroup}
                        onClose={() => setManageGroup(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

function ManageMembersModal({ group, onClose }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [kickingId, setKickingId] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const memberIds = Array.isArray(group?.members) ? group.members : [];
        if (!memberIds.length) {
            setMembers([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        Promise.all(
            memberIds.map(async (uid) => {
                try {
                    const snap = await getDoc(doc(firestore, COL.USERS, uid));
                    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
                } catch {
                    return null;
                }
            })
        )
            .then((rows) => {
                if (!cancelled) setMembers(rows.filter(Boolean));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [group?.id, group?.members]);

    const handleKick = async (memberId) => {
        if (!group?.id || kickingId) return;
        if (memberId === group.leaderId) return;
        if (!window.confirm("Are you sure you want to kick this member from the group?")) return;

        setKickingId(memberId);
        try {
            await updateDoc(doc(firestore, COL.GROUPS, group.id), {
                members: arrayRemove(memberId),
                memberCount: increment(-1),
            });
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
        } catch (err) {
            console.error("[AdminGroupsTable] Kick failed:", err);
            alert("Could not remove member.");
        } finally {
            setKickingId(null);
        }
    };

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
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="fixed inset-0 z-[210] flex items-center justify-center p-6 pointer-events-none"
            >
                <div className="pointer-events-auto bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-sand dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="px-6 py-5 border-b border-sand dark:border-white/5 bg-cream/40 dark:bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                                <Users size={18} />
                            </div>
                            <div>
                                <h3 className="font-display italic font-bold text-ink dark:text-white">
                                    {group.name}
                                </h3>
                                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-ink-faint mt-1">
                                    {members.length} Members
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-ink-faint hover:text-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin text-accent" size={24} />
                            </div>
                        ) : members.length === 0 ? (
                            <p className="text-center text-xs font-serif italic text-ink-faint py-10">
                                No members in this node.
                            </p>
                        ) : (
                            members.map((member) => {
                                const isLeader = member.id === group.leaderId;
                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-cream/60 dark:hover:bg-white/[0.03] transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-display italic font-bold shrink-0">
                                            {(member.fullName || "S")[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-ink dark:text-white flex items-center gap-2 truncate">
                                                {member.fullName || "Anonymous"}
                                                {isLeader && <Shield size={11} className="text-emerald-500 shrink-0" />}
                                            </p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-ink-faint mt-1">
                                                {isLeader ? "Overseer" : member.major || "Scholar"}
                                            </p>
                                        </div>

                                        {!isLeader && (
                                            <button
                                                onClick={() => handleKick(member.id)}
                                                disabled={kickingId === member.id}
                                                className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Remove member"
                                                aria-label="Remove member"
                                            >
                                                {kickingId === member.id
                                                    ? <Loader2 size={14} className="animate-spin" />
                                                    : <UserMinus size={14} />}
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
}
