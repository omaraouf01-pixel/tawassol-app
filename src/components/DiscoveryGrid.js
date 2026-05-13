"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, Check, X, Lock, MessageSquare,
  Compass, ArrowRight, Plus, BookOpen, Code, Terminal, Globe, Sparkles
} from "lucide-react";

// ─── CANVAS PREVIEW MOCKS ──────────────────────────────────────────
// ملاحظة لشريكي: هذه البدائل مخصصة لتعمل المعاينة هنا بدون أخطاء.
// عند نقل الكود لمشروعك، قم بإلغاء تعليق الاستيرادات الأصلية وحذف هذه البدائل.

/*
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
*/

const useRouter = () => ({ push: (path) => console.log("Navigating to:", path) });
const api = async () => ({});
// ─────────────────────────────────────────────────────────────────


/**
 * TWASSEL DISCOVERY GRID — PREMIUM EDITORIAL COMPONENT
 * ----------------------------------------------------
 * - Data: Strictly reliant on passed props (No Mocks).
 * - UI: Glassmorphic cards, human-rhythm hover effects, minimalist empty states.
 * - UX: Replaced complex SVG empty states with clean, typographic editorial messages.
 */

const GRADIENTS = [
  "from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/10",
  "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/10",
  "from-violet-500/20 to-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/10",
  "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/10",
  "from-pink-500/20 to-rose-500/20 text-rose-400 border-rose-500/10",
  "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/10",
];

const BUTTON_GRADIENTS = [
  "from-indigo-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-fuchsia-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
];

const ICON_MAP = { BookOpen, Code, Terminal, Globe, Sparkles, Compass };

/* ─── JOIN MODAL (Editorial Form) ─── */
function JoinModal({ group, onClose }) {
  const [step, setStep] = useState("rules");
  const [answers, setAnswers] = useState((group.questions || []).map(() => ""));
  const [loading, setLoading] = useState(false);

  const hasQuestions = group.questions?.length > 0;
  const canSubmit = !hasQuestions || answers.every((a) => a.trim().length > 0);

  const sendRequest = async () => {
    setLoading(true);
    try {
      await api(`/api/groups/${group.id}/join-requests`, {
        method: "POST",
        body: { answers },
      });
      setStep("success");
    } catch (e) {
      alert(e.message || "An error occurred during synchronization.");
    } finally {
      setLoading(false);
    }
  };

  const currentGradient = BUTTON_GRADIENTS[group._gradIdx || 0];

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-surface border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-premium"
      >
        {/* Header */}
        <div className={`p-8 border-b border-white/5 flex items-start justify-between relative overflow-hidden`}>
          <div className={`absolute top-[-50%] right-[-50%] w-full h-full bg-gradient-to-br ${currentGradient} opacity-10 blur-3xl rounded-full`} />
          <div className="relative z-10">
            <h2 className="text-[20px] font-serif font-black italic text-white leading-tight">{group.name}</h2>
            <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <Users size={12} /> {group.memberCount || 0} Scholars • {group.subject}
            </div>
          </div>
          <button onClick={onClose} className="relative z-10 w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all border-none cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar text-white">
          <AnimatePresence mode="wait">

            {step === "rules" && (
              <motion.div key="rules" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <div className="flex items-center gap-3 mb-4 text-brand-indigo">
                  <Lock size={14} strokeWidth={2} />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Sanctuary Rules</h3>
                </div>
                <p className="text-[13px] font-medium text-slate-400 leading-relaxed p-5 bg-white/[0.02] border border-white/5 rounded-2xl mb-8 italic">
                  "{group.rules || "Maintain academic integrity. Be respectful. Contribute to the collective intelligence."}"
                </p>
                <div className="flex gap-4">
                  <button onClick={onClose} className="flex-1 py-4 rounded-full border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all bg-transparent cursor-pointer">Decline</button>
                  <button
                    onClick={() => hasQuestions ? setStep("questions") : sendRequest()}
                    disabled={loading}
                    className={`flex-1 py-4 rounded-full bg-gradient-to-r ${currentGradient} text-white text-[11px] font-black uppercase tracking-widest shadow-glow active:scale-95 disabled:opacity-50 transition-all border-none cursor-pointer`}
                  >
                    {loading ? "Syncing..." : hasQuestions ? "Accept & Proceed" : "Join Node"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === "questions" && (
              <motion.div key="questions" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <h3 className="text-[14px] font-serif font-black italic text-white mb-2">Academic Inquiry</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6">The node leader requires context before approval.</p>

                <div className="space-y-6 mb-8">
                  {(group.questions || []).map((q, i) => (
                    <div key={i} className="space-y-3 group/input">
                      <label className="text-[11px] font-black text-slate-300 block group-focus-within:text-brand-indigo transition-colors">{q}</label>
                      <textarea
                        value={answers[i] || ""}
                        onChange={(e) => { const n = [...answers]; n[i] = e.target.value; setAnswers(n); }}
                        className="w-full bg-transparent border-b border-white/10 py-3 text-[14px] font-medium text-white outline-none focus:border-brand-indigo transition-all resize-none h-16 placeholder:text-slate-700"
                        placeholder="Your articulation..."
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep("rules")} className="flex-1 py-4 rounded-full border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all bg-transparent cursor-pointer">Back</button>
                  <button onClick={sendRequest} disabled={!canSubmit || loading} className={`flex-1 py-4 rounded-full bg-gradient-to-r ${currentGradient} text-white text-[11px] font-black uppercase tracking-widest active:scale-95 shadow-glow disabled:opacity-30 transition-all border-none cursor-pointer`}>
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                  <Check size={28} className="text-emerald-400" />
                </div>
                <h3 className="text-[20px] font-serif font-black italic text-white mb-2">Request Synchronized</h3>
                <p className="text-[12px] font-medium text-slate-400 mb-8 max-w-[200px] mx-auto">The node overseer will review your academic intent shortly.</p>
                <button onClick={onClose} className={`w-full py-4 rounded-full bg-gradient-to-r ${currentGradient} text-white text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all border-none cursor-pointer`}>
                  Done
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── EMPTY STATE (Lightweight Editorial Layout) ─── */
function EmptyStateIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.01]"
    >
      <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-slate-600">
        <Compass size={28} strokeWidth={1.5} />
      </div>
      <h3 className="text-[24px] font-serif font-black italic text-slate-300 mb-3">Uncharted Territory</h3>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
        There are currently no active nodes matching this criteria.
      </p>
    </motion.div>
  );
}

/* ─── DISCOVERY GRID (Main Export) ─── */
export default function DiscoveryGrid({ groups = [], currentUid, maxCards = 6, showSearch = false, compact = false, isEmpty = false }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(null);

  // Filter groups user hasn't joined
  const discoverable = groups.filter((g) => !g.members?.includes(currentUid));

  const filtered = discoverable.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.subject?.toLowerCase().includes(q) ||
      g.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const display = filtered.slice(0, maxCards);

  // If completely empty and not forced to show empty state, render nothing.
  if (discoverable.length === 0 && !isEmpty) return null;

  return (
    <>
      <div className="mb-8">

        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-indigo/10 border border-brand-indigo/20 rounded-xl flex items-center justify-center text-brand-indigo">
              <Compass size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-black text-[13px] uppercase tracking-widest text-white">Discover Nodes</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {isEmpty
                  ? "Initialize your first circle"
                  : `${discoverable.length} node${discoverable.length > 1 ? "s" : ""} available`
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/explore")}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-indigo hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="relative mb-6 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-indigo transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search for disciplines or subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-4 pl-14 pr-5 bg-surface border border-white/5 rounded-full outline-none focus:border-brand-indigo/50 transition-all text-[13px] font-medium text-white placeholder:text-slate-600 shadow-sm"
            />
          </div>
        )}

        {/* Conditional Rendering (Empty States vs Grid) */}
        {isEmpty && display.length === 0 && (
          <EmptyStateIllustration />
        )}

        {display.length === 0 && !isEmpty ? (
          <div className="text-center py-10 bg-white/[0.02] rounded-[2rem] border border-white/[0.05]">
            <Compass size={24} className="text-slate-700 mx-auto mb-3" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No matching nodes found</p>
          </div>
        ) : (
          <div className={compact ? "space-y-4" : "grid grid-cols-1 sm:grid-cols-2 gap-5"}>
            <AnimatePresence>
              {display.map((group, idx) => {
                const gradIdx = idx % GRADIENTS.length;
                const isStarter = !!group.isStarter;
                const pct = group.maxMembers ? Math.round(((group.memberCount || 0) / group.maxMembers) * 100) : 0;
                const IconComponent = ICON_MAP[group.icon] || BookOpen;

                return (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx < 4 ? idx * 0.05 : 0 }}
                    className={`bg-white/[0.02] border backdrop-blur-sm rounded-[2rem] overflow-hidden hover:bg-white/[0.04] transition-all duration-500 group/card ${isStarter ? "border-brand-indigo/30 hover:border-brand-indigo/50" : "border-white/5 hover:border-white/10"
                      }`}
                  >
                    {/* Card Header (Gradient background) */}
                    <div className={`p-4 bg-gradient-to-br ${GRADIENTS[gradIdx]} relative flex items-center gap-4`}>
                      <div className="w-10 h-10 bg-background/50 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/10 shadow-sm">
                        <IconComponent size={18} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-black italic text-[16px] text-white truncate leading-tight">{group.name}</h4>
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest truncate mt-0.5">{group.subject}</p>
                      </div>
                      {isStarter && (
                        <span className="text-[8px] font-black bg-white/20 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                          Starter
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      {group.description && (
                        <p className="text-[12px] text-slate-400 leading-relaxed mb-4 line-clamp-2">{group.description}</p>
                      )}

                      {group.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {group.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/5 text-slate-500 px-2.5 py-1 rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {!isStarter && (
                        <>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            <span className="flex items-center gap-1.5"><Users size={12} /> {group.memberCount || 0}/{group.maxMembers || "∞"}</span>
                            {group.maxMembers && <span>{pct}%</span>}
                          </div>
                          {group.maxMembers && (
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                              <div className={`h-full rounded-full bg-gradient-to-r ${BUTTON_GRADIENTS[gradIdx]} transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </>
                      )}

                      {/* Card Action */}
                      {isStarter ? (
                        <button
                          onClick={() => router.push("/groups/create")}
                          className="w-full py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white text-black flex items-center justify-center gap-2 hover:bg-brand-indigo hover:text-white active:scale-95 transition-all shadow-sm border-none cursor-pointer"
                        >
                          <Plus size={14} /> Forge this Node
                        </button>
                      ) : (
                        <button
                          onClick={() => setJoiningGroup({ ...group, _gradIdx: gradIdx })}
                          className={`w-full py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r ${BUTTON_GRADIENTS[gradIdx]} text-white hover:opacity-90 active:scale-95 transition-all shadow-sm border-none cursor-pointer`}
                        >
                          Join Node
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {joiningGroup && (
          <JoinModal group={joiningGroup} onClose={() => setJoiningGroup(null)} />
        )}
      </AnimatePresence>
    </>
  );
}