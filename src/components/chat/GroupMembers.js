"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, UserMinus, Shield, Loader2 } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayRemove, increment } from "firebase/firestore";
import { COL } from "@/lib/collectionNames";

export default function GroupMembers({ isOpen, onClose, group, isLeader, setToast }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [kickingId, setKickingId] = useState(null);

    useEffect(() => {
        if (!isOpen || !group?.members) return;

        const fetchMembers = async () => {
            setLoading(true);
            try {
                const fetchedMembers = [];
                for (const uid of group.members) {
                    const uSnap = await getDoc(doc(firestore, COL.USERS, uid));
                    if (uSnap.exists()) {
                        fetchedMembers.push({ id: uSnap.id, ...uSnap.data() });
                    }
                }
                setMembers(fetchedMembers);
            } catch (error) {
                console.error("Error fetching members:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [isOpen, group?.members]);

    const handleKick = async (memberId) => {
        if (!isLeader || memberId === group.leaderId) return;
        if (!window.confirm("Are you sure you want to kick this member from the group?")) return;

        setKickingId(memberId);
        try {
            const groupRef = doc(firestore, COL.GROUPS, group.id);
            await updateDoc(groupRef, {
                members: arrayRemove(memberId),
                memberCount: increment(-1)
            });
            setMembers(prev => prev.filter(m => m.id !== memberId));
            setToast("Member removed");
        } catch (error) {
            console.error(error);
            setToast("Could not remove");
        } finally {
            setKickingId(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160]" />
                    <motion.aside
                        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed top-0 end-0 h-screen w-full sm:w-[400px] bg-[#050505] border-s border-white/10 z-[170] flex flex-col shadow-2xl"
                    >
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#0A0A0B]">
                            <div className="flex items-center gap-3">
                                <Users className="text-brand-indigo" size={20} />
                                <div>
                                    <h3 className="text-lg font-serif font-black italic text-white leading-none">Node members</h3>
                                    <p className="text-[7px] font-black uppercase text-slate-600 tracking-[0.3em] mt-2">Active</p>
                                </div>
                            </div>
                            <button onClick={onClose} aria-label="Close" className="p-2 bg-white/5 text-slate-500 hover:text-white rounded-xl border-none cursor-pointer transition-colors"><X size={18} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {loading ? (
                                <div className="flex justify-center py-10"><Loader2 className="text-brand-indigo animate-spin" size={24} /></div>
                            ) : (
                                members.map((member) => {
                                    const isNodeLeader = member.id === group.leaderId;

                                    return (
                                        <motion.div layout key={member.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-brand-indigo/10 rounded-xl flex items-center justify-center text-brand-indigo font-serif font-black italic shrink-0">
                                                    {member.fullName?.[0] || "S"}
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                        {member.fullName}
                                                        {isNodeLeader && <Shield size={10} className="text-emerald-500" />}
                                                    </p>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                        {isNodeLeader ? "Overseer" : "Scholar"}
                                                    </p>
                                                </div>
                                            </div>

                                            {isLeader && !isNodeLeader && (
                                                <button
                                                    onClick={() => handleKick(member.id)}
                                                    disabled={kickingId === member.id}
                                                    className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all border-none cursor-pointer"
                                                    title="Remove member"
                                                    aria-label="Remove member"
                                                >
                                                    {kickingId === member.id ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
                                                </button>
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-6 border-t border-white/5 bg-[#0A0A0B]">
                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest text-center">
                                {members.length} Members
                            </p>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
