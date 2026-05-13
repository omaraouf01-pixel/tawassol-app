"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShieldCheck, UserCheck, UserX, Check, Trash2,
  FileText, ImageIcon, Loader2, Zap, AlertCircle
} from "lucide-react";
import { firestore } from "@/lib/firebase";
import {
  doc, updateDoc, arrayUnion, deleteDoc,
  collection, increment, serverTimestamp
} from "firebase/firestore";
import { COL } from "@/lib/collections";

export default function ModerationPanel({
  showModeration,
  setShowModeration,
  pendingMessages = [],
  joinRequests = [],
  id,
  setToast
}) {
  const [processingId, setProcessingId] = useState(null);

  // --- Handle Join Request Decisions ---
  const handleJoinDecision = async (request, isApproved) => {
    setProcessingId(request.id);
    try {
      if (isApproved) {
        // 1. Add user to group members array
        const groupRef = doc(firestore, COL.GROUPS, id);
        await updateDoc(groupRef, {
          members: arrayUnion(request.userId),
          memberCount: increment(1)
        });
      }

      // 2. Update request status
      const requestRef = doc(firestore, COL.JOIN_REQUESTS, request.id);
      await updateDoc(requestRef, { status: isApproved ? "approved" : "rejected" });

      setToast(isApproved ? "Scholar admission synchronized." : "Entry request denied.");
    } catch (err) {
      console.error(err);
      setToast("Protocol synchronization failed.");
    } finally {
      setProcessingId(null);
    }
  };

  // --- Handle File Verification Decisions ---
  const handleFileDecision = async (msgId, isApproved) => {
    setProcessingId(msgId);
    try {
      const msgRef = doc(firestore, COL.GROUPS, id, "messages", msgId);
      if (isApproved) {
        await updateDoc(msgRef, { moderationStatus: "approved" });
        setToast("Academic asset verified and released.");
      } else {
        await deleteDoc(msgRef);
        setToast("Asset rejected and purged.");
      }
    } catch (err) {
      console.error(err);
      setToast("Asset verification failed.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AnimatePresence>
      {showModeration && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowModeration(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[180]"
          />

          {/* Sidebar Panel */}
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-[#050505] border-l border-white/10 z-[190] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#0A0A0B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-indigo/10 rounded-xl flex items-center justify-center text-brand-indigo shadow-glow">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-black italic text-white leading-none">Overseer Command</h3>
                  <p className="text-[7px] font-black uppercase text-slate-600 tracking-[0.3em] mt-2">Node Governance Protocol</p>
                </div>
              </div>
              <button onClick={() => setShowModeration(false)} className="p-2 bg-white/5 text-slate-500 hover:text-white rounded-xl border-none cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">

              {/* Section 1: Scholar Join Requests */}
              <section>
                <div className="flex items-center justify-between mb-6 px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-indigo flex items-center gap-2">
                    <UserCheck size={12} /> Pending Scholars
                  </h4>
                  <span className="bg-white/5 text-slate-500 text-[9px] px-2 py-0.5 rounded-full font-bold">{joinRequests.length}</span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {joinRequests.length === 0 ? (
                      <EmptyState key="empty-scholars" message="No pending frequencies." />
                    ) : (
                      joinRequests.map((req) => (
                        <ModerationCard
                          key={req.id}
                          type="scholar"
                          item={req}
                          onAccept={() => handleJoinDecision(req, true)}
                          onReject={() => handleJoinDecision(req, false)}
                          isProcessing={processingId === req.id}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Section 2: Asset (File) Verification */}
              <section>
                <div className="flex items-center justify-between mb-6 px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                    <Zap size={12} /> Asset Verification
                  </h4>
                  <span className="bg-white/5 text-slate-500 text-[9px] px-2 py-0.5 rounded-full font-bold">{pendingMessages.length}</span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {pendingMessages.length === 0 ? (
                      <EmptyState key="empty-assets" message="No assets requiring sync." />
                    ) : (
                      pendingMessages.map((msg) => (
                        <ModerationCard
                          key={msg.id}
                          type="asset"
                          item={msg}
                          onAccept={() => handleFileDecision(msg.id, true)}
                          onReject={() => handleFileDecision(msg.id, false)}
                          isProcessing={processingId === msg.id}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </section>

            </div>

            <div className="p-6 border-t border-white/5 bg-[#0A0A0B] text-center">
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">
                Authorized Overseer Level Access Only
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// --- Sub-Component: Moderation Card ---
const ModerationCard = React.forwardRef(({ item, type, onAccept, onReject, isProcessing }, ref) => {
  const isScholar = type === "scholar";

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white truncate italic">
            {isScholar ? item.userName : (item.file?.name || "Shared Asset")}
          </p>
          <div className="mt-2 text-[10px] text-slate-500 leading-relaxed font-serif">
            {isScholar ? (
              item.answers?.[0] || "No protocol statement provided."
            ) : (
              <span className="flex items-center gap-2">
                <FileText size={10} /> {item.authorName}'s Upload
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onReject}
            disabled={isProcessing}
            className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border-none cursor-pointer"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          </button>
          <button
            onClick={onAccept}
            disabled={isProcessing}
            className="p-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all border-none cursor-pointer"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
});
ModerationCard.displayName = "ModerationCard";

// --- Sub-Component: EmptyState (Now with forwardRef) ---
const EmptyState = React.forwardRef(({ message }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="py-10 text-center opacity-20 flex flex-col items-center gap-3"
  >
    <AlertCircle size={32} />
    <p className="text-[9px] font-black uppercase tracking-widest">{message}</p>
  </motion.div>
));
EmptyState.displayName = "EmptyState"; 