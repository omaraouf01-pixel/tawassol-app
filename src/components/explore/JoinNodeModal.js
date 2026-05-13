"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Loader2, CheckCircle, Lock, HelpCircle, Calendar } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { COL } from "@/lib/collections";

export default function JoinNodeModal({ isOpen, onClose, group, currentUser }) {
    const [answers, setAnswers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestStatus, setRequestStatus] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setRequestStatus(null);
            if (group?.questions && group.questions.length > 0) {
                setAnswers(new Array(group.questions.length).fill(""));
            } else {
                setAnswers([]);
            }
        }
    }, [isOpen, group]);

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const handleJoinRequest = async (e) => {
        e.preventDefault();
        if (!group || !currentUser?.uid) return;

        setIsSubmitting(true);
        setRequestStatus(null);

        try {
            const q = query(
                collection(firestore, COL.JOIN_REQUESTS),
                where("groupId", "==", group.id),
                where("userId", "==", currentUser.uid),
                where("status", "==", "pending")
            );
            const existingReqs = await getDocs(q);

            if (!existingReqs.empty) {
                throw new Error("You already have a pending request for this node.");
            }

            await addDoc(collection(firestore, COL.JOIN_REQUESTS), {
                groupId: group.id,
                groupName: group.name,
                userId: currentUser.uid,
                userName: currentUser?.fullName || "Scholar",
                answers: answers,
                status: "pending",
                createdAt: serverTimestamp(),
            });

            setRequestStatus("success");
            setTimeout(() => onClose(), 2500);
        } catch (error) {
            console.error(error);
            setRequestStatus(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && group && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={!isSubmitting ? onClose : undefined}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="w-full max-w-4xl bg-[#0A0A0C] border border-white/5 rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                    >
                        {!isSubmitting && requestStatus !== "success" && (
                            <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors z-50 bg-transparent border-none cursor-pointer">
                                <X size={20} />
                            </button>
                        )}

                        {/* ─── LEFT: NODE INTELLIGENCE ─── */}
                        <div className="w-full md:w-1/2 p-10 bg-[#050505] border-b md:border-b-0 md:border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar">
                            <div className="w-14 h-14 bg-brand-indigo/10 border border-brand-indigo/20 rounded-2xl flex items-center justify-center text-brand-indigo mb-8 shadow-glow">
                                <Zap size={24} />
                            </div>

                            <h2 className="text-3xl font-serif font-black italic text-white leading-tight mb-4">{group.name}</h2>

                            <div className="flex items-center gap-3 mb-8">
                                <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand-indigo bg-brand-indigo/10 px-4 py-2 rounded-xl border border-brand-indigo/20">
                                    <Calendar size={12} /> {group.year || "All Years"}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                    {group.subject || "General"}
                                </span>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[1.5rem]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-indigo mb-4 flex items-center gap-2">
                                        <Lock size={14} /> Node Protocol Rules
                                    </p>
                                    <p className="text-[13px] text-slate-300 leading-relaxed italic font-serif">
                                        {group.rules || "No specific rules have been established for this node yet."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ─── RIGHT: SYNC FORM ─── */}
                        <div className="w-full md:w-1/2 p-10 bg-[#0A0A0C] flex flex-col justify-center relative overflow-y-auto custom-scrollbar">
                            {requestStatus === "success" ? (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                                    <CheckCircle size={60} className="text-emerald-500 mb-6 mx-auto shadow-glow rounded-full" />
                                    <h3 className="text-2xl font-serif font-black text-white italic mb-2">Signal Sent</h3>
                                    <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Request successfully transmitted</p>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="mb-10 text-center">
                                        <h3 className="text-[16px] font-black uppercase tracking-[0.3em] text-white mb-2">Initialize Link</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Answer the Overseer's requirements</p>
                                    </div>

                                    {requestStatus && requestStatus !== "success" && (
                                        <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-[11px] font-bold text-center">
                                            {requestStatus}
                                        </div>
                                    )}

                                    <form onSubmit={handleJoinRequest} className="space-y-6">
                                        {group.questions && group.questions.length > 0 ? (
                                            <div className="space-y-6">
                                                {group.questions.map((q, idx) => (
                                                    <div key={idx} className="space-y-3">
                                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <HelpCircle size={14} className="text-brand-indigo" /> {q}
                                                        </label>
                                                        <input
                                                            type="text" required value={answers[idx]} onChange={(e) => handleAnswerChange(idx, e.target.value)}
                                                            placeholder="Type your answer here..."
                                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-brand-indigo/40 transition-all font-serif italic"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-10 text-center">
                                                <p className="text-[12px] text-slate-500 italic font-serif">No additional questions required to join this node.</p>
                                            </div>
                                        )}

                                        <button
                                            type="submit" disabled={isSubmitting}
                                            className="w-full mt-8 py-5 bg-white text-black rounded-full font-black text-[12px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all border-none cursor-pointer flex items-center justify-center gap-3 shadow-glow"
                                        >
                                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Initialize Signal <Zap size={14} /></>}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}