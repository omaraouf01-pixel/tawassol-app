"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, Check, X, Lock, MessageSquare,
  Compass, Zap, BookOpen, Code, Terminal, Globe,
  Sparkles, ArrowRight, Plus, AlertTriangle, Clock,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/apiClient";
import { useAllGroups } from "@/lib/useAllGroups";

/* ================================================================
   EXPLORE CIRCLES — Premium Discovery View
   3-column edge-to-edge layout with glassmorphic circle cards,
   filter chips, and staggered framer-motion entrance animations.
================================================================ */

const ICON_MAP = { BookOpen, Code, Terminal, Globe, Sparkles, Compass };
const ICON_KEYS = Object.keys(ICON_MAP);



/* ----------- Skeleton Loader ----------- */
function SkeletonCard() {
  return (
    <div className="relative bg-white/[0.04] border border-white/[0.08] rounded-[32px] overflow-hidden p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-indigo-500/15 rounded-xl" />
        <div className="w-14 h-5 bg-indigo-500/10 rounded-full" />
      </div>
      <div className="h-4 bg-indigo-500/12 rounded-full w-3/4 mb-2" />
      <div className="h-3 bg-indigo-500/8 rounded-full w-full mb-1.5" />
      <div className="h-3 bg-indigo-500/8 rounded-full w-5/6 mb-4" />
      <div className="flex gap-1.5 mb-4">
        <div className="h-5 w-16 bg-indigo-500/8 rounded-full" />
        <div className="h-5 w-12 bg-indigo-500/8 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div className="h-3 w-20 bg-indigo-500/10 rounded-full" />
        <div className="h-8 w-20 bg-indigo-500/15 rounded-[32px]" />
      </div>
    </div>
  );
}

/* ----------- Join Modal ----------- */
function JoinModal({ group, onClose }) {
  const [step, setStep] = useState("rules");
  const [answers, setAnswers] = useState((group.questions || []).map(() => ""));
  const [loading, setLoading] = useState(false);
  const hasQ = group.questions?.length > 0;
  const canSubmit = !hasQ || answers.every((a) => a.trim().length > 0);

  const send = async () => {
    setLoading(true);
    try {
      await api(`/api/groups/${group.id}/join-requests`, { method: "POST", body: { answers } });
      setStep("success");
    } catch (e) { alert(e.message || "Error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }} className="bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl shadow-black/40">
        <div className="h-24 bg-gradient-to-br from-indigo-500 to-violet-600 p-5 flex items-end justify-between relative">
          <div>
            <h2 className="text-lg font-black text-white">{group.name}</h2>
            <p className="text-white/80 text-xs">{group.members?.length || 0} members</p>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"><X size={15} /></button>
        </div>
        <div className="p-6 max-h-[65vh] overflow-y-auto text-white">
          <AnimatePresence mode="wait">
            {step === "rules" && (
              <motion.div key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-2 mb-3"><Lock size={14} className="text-indigo-400" /><h3 className="font-bold text-sm">Circle Rules</h3></div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 text-sm text-slate-300 leading-relaxed">{group.rules || "Be respectful. No plagiarism. Stay on topic."}</div>
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 py-3 rounded-[32px] border border-white/10 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors">Cancel</button>
                  <button onClick={() => hasQ ? setStep("questions") : send()} disabled={loading} className="flex-1 py-3 rounded-[32px] bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold hover:from-indigo-400 hover:to-violet-500 active:scale-95 shadow-lg shadow-indigo-500/40 ring-1 ring-white/20 disabled:opacity-40 transition-all">{loading ? "Sending..." : hasQ ? "I Accept" : "Join Circle"}</button>
                </div>
              </motion.div>
            )}
            {step === "questions" && (
              <motion.div key="q" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="font-bold text-sm mb-1">Answer the questions</h3>
                <p className="text-xs text-slate-500 mb-4">The circle leader will review your answers.</p>
                <div className="space-y-4 mb-5">
                  {(group.questions || []).map((q, i) => (
                    <div key={i}>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">{q}</label>
                      <textarea value={answers[i] || ""} onChange={(e) => { const n = [...answers]; n[i] = e.target.value; setAnswers(n); }} className="w-full p-3 bg-white/5 border border-white/10 rounded-2xl resize-none outline-none focus:border-indigo-400/50 text-sm h-20 text-white placeholder:text-slate-500" placeholder="Your answer..." />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("rules")} className="flex-1 py-3 rounded-[32px] border border-white/10 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors">Back</button>
                  <button onClick={send} disabled={!canSubmit || loading} className="flex-1 py-3 rounded-[32px] bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold active:scale-95 disabled:opacity-40 shadow-lg shadow-indigo-500/40 ring-1 ring-white/20 transition-all">{loading ? "Sending..." : "Submit"}</button>
                </div>
              </motion.div>
            )}
            {step === "success" && (
              <motion.div key="s" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400/30 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={28} className="text-emerald-400" /></div>
                <h3 className="font-black text-lg mb-2">Request Sent!</h3>
                <p className="text-sm text-slate-400 mb-5">The circle leader will review your request shortly.</p>
                <button onClick={onClose} className="px-8 py-3 rounded-[32px] bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm active:scale-95 shadow-lg shadow-indigo-500/40 ring-1 ring-white/20 transition-all">Done</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ----------- Main Page ----------- */
export default function ExplorePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const [joiningGroup, setJoiningGroup] = useState(null);

  const { groups, discoveryGroups, loading, error, currentUid, isMember, isEmpty } = useAllGroups();
  const joinedGroups = useMemo(() => groups.filter((g) => g.members?.includes(currentUid)), [groups, currentUid]);

  // Filter by search + active chip
  const filtered = useMemo(() => {
    return discoveryGroups.filter((g) => {
      const q = search.toLowerCase();
      const matchSearch = !q || g.name?.toLowerCase().includes(q) || g.subject?.toLowerCase().includes(q) || g.tags?.some((t) => t.toLowerCase().includes(q));
      return matchSearch;
    });
  }, [discoveryGroups, search]);

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[5%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/12 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[50%] left-[40%] w-[300px] h-[300px] bg-indigo-500/8 rounded-full blur-[100px]" />
      </div>

      <Sidebar />

      {/* Central content */}
      <main className="ml-60 flex-1 p-8 flex gap-7 justify-center">
        <div className="w-full max-w-3xl">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-black tracking-tight">Explore Circles</h1>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Zap size={11} className="text-emerald-400" />
                Live
              </div>
            </div>
            <p className="text-sm text-slate-500">Discover study groups, join circles, and start collaborating.</p>
          </motion.div>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative mb-5">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search for subjects, modules, or circles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-3.5 pl-12 pr-5 bg-white/[0.04] border border-white/10 rounded-[32px] outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm text-white placeholder:text-slate-500 backdrop-blur-md"
            />
          </motion.div>



          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3 bg-rose-500/10 border border-rose-400/20 rounded-[32px] p-4">
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              <p className="text-sm text-rose-300">{error}</p>
            </motion.div>
          )}

          {/* Loading — Skeleton Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>

            /* Empty state — no circles at all */
          ) : discoveryGroups.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
              <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-400/20 rounded-[32px] flex items-center justify-center mx-auto mb-5">
                <Compass size={32} className="text-indigo-400" />
              </div>
              <p className="text-lg font-black text-white mb-2">No new circles found for your department.</p>
              <p className="text-sm text-slate-400 mb-6">Why not create one?</p>
              <a
                href="/groups/create"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[32px] bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm hover:from-indigo-400 hover:to-violet-500 active:scale-[0.97] transition-all shadow-lg shadow-indigo-500/30 ring-1 ring-white/20"
              >
                <Plus size={14} /> Create a Circle
              </a>
            </motion.div>

            /* Empty search results (after filtering) */
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="w-16 h-16 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Compass size={28} className="text-slate-600" />
              </div>
              <p className="text-sm font-bold text-slate-400 mb-1">No circles found</p>
              <p className="text-xs text-slate-600">Try a different keyword or clear the filters.</p>
            </motion.div>

            /* Circle grid */
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AnimatePresence>
                {filtered.map((circle, idx) => {
                  const IconComponent = ICON_MAP[circle.icon] || BookOpen;
                  const member = isMember(circle);
                  const isPending = circle.pendingRequests?.some(r => r.userId === currentUid);
                  const memberCount = circle.members?.length || 0;

                  return (
                    <motion.div
                      key={circle.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx < 6 ? idx * 0.07 : 0, duration: 0.35 }}
                      whileHover={{ y: -4 }}
                      className="group/card relative bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-[32px] overflow-hidden hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-300"
                    >
                      {/* Card inner glow on hover */}
                      <div aria-hidden className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/0 group-hover/card:bg-indigo-500/10 rounded-full blur-3xl transition-all duration-500 pointer-events-none" />

                      <div className="relative p-5">
                        {/* Top row: icon + public badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                            <IconComponent size={18} className="text-indigo-400" />
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 px-2.5 py-1 rounded-full">
                            Public
                          </span>
                        </div>

                        {/* Name + description */}
                        <h3 className="font-black text-[15px] text-white mb-1.5 leading-tight">{circle.name}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">{circle.description}</p>

                        {/* Tags */}
                        {circle.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {circle.tags.slice(0, 3).map((t) => (
                              <span key={t} className="text-[10px] font-semibold bg-white/5 border border-white/[0.08] text-slate-400 px-2.5 py-0.5 rounded-full">{t}</span>
                            ))}
                          </div>
                        )}

                        {/* Bottom row: members + action */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Users size={12} />
                            <span className="font-semibold">{memberCount} members</span>
                          </div>

                          {member ? (
                            <button
                              onClick={() => router.push(`/hub/chat/${circle.id}`)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-[32px] text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500/20 active:scale-[0.97] transition-all"
                            >
                              <MessageSquare size={12} /> Open
                            </button>
                          ) : isPending ? (
                            <button
                              disabled
                              className="flex items-center gap-1.5 px-4 py-2 rounded-[32px] text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 opacity-80 cursor-not-allowed"
                            >
                              <Clock size={12} /> Pending...
                            </button>
                          ) : (
                            <button
                              onClick={() => setJoiningGroup(circle)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-[32px] text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-400 hover:to-violet-500 active:scale-[0.97] transition-all shadow-lg shadow-indigo-500/0 group-hover/card:shadow-indigo-500/30 ring-1 ring-white/20"
                            >
                              Join <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-72 flex-shrink-0 hidden xl:block">
          <div className="sticky top-8 space-y-4">

            {/* My Circles */}
            <div className="rounded-[32px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-5">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-4">My Circles</h3>
              {joinedGroups.length === 0 ? (
                <p className="text-xs text-slate-500 italic pb-2">No joined circles yet.</p>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {joinedGroups.slice(0, 5).map((g, i) => (
                      <motion.div
                        key={g.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => router.push(`/hub/chat/${g.id}`)}
                        className="group flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] p-1.5 -mx-1.5 rounded-2xl transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-indigo-400">{g.name?.[0]?.toUpperCase() || "C"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex w-1.5 h-1.5 shrink-0">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                              <span className="relative rounded-full w-1.5 h-1.5 bg-emerald-400" />
                            </span>
                            <p className="text-sm font-semibold text-white truncate">{g.name}</p>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-slate-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-indigo-400 transition-all duration-300 shrink-0" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Create CTA */}
            <div className="rounded-[32px] bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 backdrop-blur-xl p-5 relative overflow-hidden">
              <div aria-hidden className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center mb-3 ring-1 ring-white/20">
                  <BookOpen size={16} className="text-white" />
                </div>
                <h3 className="font-bold text-sm mb-1 text-white">Start a Circle</h3>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">Gather classmates and collaborate in real time.</p>
                <a href="/groups/create" className="block text-center py-2.5 rounded-[32px] bg-white text-slate-900 font-bold text-xs hover:bg-indigo-50 transition-all">
                  Create Circle
                </a>
              </div>
            </div>

            {/* Popular tags */}
            <div className="rounded-[32px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-5">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Trending Tags</h3>
              <div className="flex flex-wrap gap-2">
                {["Algorithms", "Python", "Exam Prep", "React", "Data Science", "UX"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setSearch(tag); }}
                    className="text-[11px] font-semibold bg-white/5 border border-white/[0.08] text-slate-300 px-2.5 py-1 rounded-full hover:bg-indigo-500/20 hover:border-indigo-400/30 hover:text-indigo-300 cursor-pointer transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Join Modal */}
      <AnimatePresence>
        {joiningGroup && <JoinModal group={joiningGroup} onClose={() => setJoiningGroup(null)} />}
      </AnimatePresence>
    </div>
  );
}
