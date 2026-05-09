"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiUsers, FiCheck, FiX, FiLock,
  FiCompass, FiArrowRight, FiPlus,
} from "react-icons/fi";
import { api } from "@/lib/apiClient";

/* ================================================================
   DISCOVERY GRID - Reusable group-discovery component
   Shows groups the user hasn't joined, with search + join flow.
   When isEmpty=true, renders starter groups with "Create" CTA.
================================================================ */

const GRADIENTS = [
  "from-indigo-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-fuchsia-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
];

/* ----------- Join Modal ----------- */
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
      alert(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/40"
      >
        <div className={`h-24 bg-gradient-to-br ${GRADIENTS[group._gradIdx || 0]} p-5 flex items-end justify-between relative`}>
          <div>
            <h2 className="text-lg font-black text-white">{group.name}</h2>
            <p className="text-white/80 text-xs">{group.memberCount || 0} membres - {group.subject}</p>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors">
            <FiX size={15} />
          </button>
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto text-white">
          <AnimatePresence mode="wait">
            {step === "rules" && (
              <motion.div key="rules" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="flex items-center gap-2 mb-3">
                  <FiLock size={14} className="text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Regles du groupe</h3>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 text-sm text-slate-300 leading-relaxed">
                  {group.rules || "Respect des membres. Pas de plagiat. Restez sur le sujet."}
                </div>
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 py-3 rounded-[32px] border border-white/10 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors">Annuler</button>
                  <button
                    onClick={() => hasQuestions ? setStep("questions") : sendRequest()}
                    disabled={loading}
                    className="flex-1 py-3 rounded-[32px] bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold hover:from-indigo-400 hover:to-violet-500 active:scale-95 shadow-lg shadow-indigo-500/40 ring-1 ring-white/20 disabled:opacity-40 transition-all"
                  >
                    {loading ? "Envoi..." : hasQuestions ? "J'accepte ->" : "Rejoindre ->"}
                  </button>
                </div>
              </motion.div>
            )}
            {step === "questions" && (
              <motion.div key="questions" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <h3 className="font-bold text-sm text-white mb-1">Repondez aux questions</h3>
                <p className="text-xs text-slate-500 mb-4">Le responsable du groupe examinera vos reponses.</p>
                <div className="space-y-4 mb-5">
                  {(group.questions || []).map((q, i) => (
                    <div key={i}>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">{q}</label>
                      <textarea
                        value={answers[i] || ""}
                        onChange={(e) => { const n = [...answers]; n[i] = e.target.value; setAnswers(n); }}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-2xl resize-none outline-none focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 text-sm h-20 transition-all text-white placeholder:text-slate-500"
                        placeholder="Votre reponse..."
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("rules")} className="flex-1 py-3 rounded-[32px] border border-white/10 text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors">Retour</button>
                  <button onClick={sendRequest} disabled={!canSubmit || loading}
                    className="flex-1 py-3 rounded-[32px] bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold hover:from-indigo-400 hover:to-violet-500 active:scale-95 disabled:opacity-40 shadow-lg shadow-indigo-500/40 ring-1 ring-white/20 transition-all">
                    {loading ? "Envoi..." : "Envoyer"}
                  </button>
                </div>
              </motion.div>
            )}
            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck size={28} className="text-emerald-400" />
                </div>
                <h3 className="font-black text-white text-lg mb-2">Demande envoyee !</h3>
                <p className="text-sm text-slate-400 mb-5">Le responsable examinera votre demande sous peu.</p>
                <button onClick={onClose} className="px-8 py-3 rounded-[32px] bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm hover:from-indigo-400 hover:to-violet-500 active:scale-95 shadow-lg shadow-indigo-500/40 ring-1 ring-white/20 transition-all">Termine</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

/* ----------- Empty State Illustration ----------- */
function EmptyStateIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-10"
    >
      <div className="relative w-36 h-36 mx-auto mb-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full h-full"
        >
          <svg viewBox="0 0 160 160" className="w-full h-full">
            <motion.circle
              cx="80" cy="80" r="60"
              fill="none"
              stroke="url(#emptyGrad)"
              strokeWidth="2"
              strokeDasharray="6 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <motion.g
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{ transformOrigin: "80px 80px" }}
            >
              <circle cx="80" cy="80" r="22" fill="#6366f1" fillOpacity="0.15" />
              <circle cx="80" cy="80" r="14" fill="#6366f1" fillOpacity="0.25" />
              <motion.path
                d="M80 66 L84 80 L80 94 L76 80 Z"
                fill="#818cf8"
                animate={{ rotate: [0, 15, -10, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                style={{ transformOrigin: "80px 80px" }}
              />
            </motion.g>
            {[0, 120, 240].map((angle, i) => (
              <motion.circle
                key={i}
                cx={80 + 45 * Math.cos((angle * Math.PI) / 180)}
                cy={80 + 45 * Math.sin((angle * Math.PI) / 180)}
                r="5"
                fill={["#6366f1", "#8b5cf6", "#a78bfa"][i]}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0.6, 1, 0.6], scale: [0.8, 1.1, 0.8] }}
                transition={{ delay: 0.5 + i * 0.2, duration: 2.5, repeat: Infinity }}
              />
            ))}
            <defs>
              <linearGradient id="emptyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        <div aria-hidden className="absolute inset-0 bg-indigo-500/15 rounded-full blur-3xl -z-10" />
      </div>

      <h3 className="font-black text-base text-white mb-2">
        Welcome to{" "}
        <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          Twassel
        </span>
        !
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed max-w-[240px] mx-auto mb-5">
        Join your first circle to get started. Discover study groups, collaborate with classmates, and grow together.
      </p>
    </motion.div>
  );
}

/* ----------- Discovery Grid ----------- */
export default function DiscoveryGrid({ groups, currentUid, maxCards = 6, showSearch = false, compact = false, isEmpty = false }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(null);

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

  if (discoverable.length === 0 && !isEmpty) return null;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center ring-1 ring-white/20 shadow-lg shadow-indigo-500/30">
              <FiCompass size={15} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Decouvrir des groupes</h3>
              <p className="text-[11px] text-slate-500">
                {isEmpty
                  ? "Creez ou rejoignez votre premier cercle"
                  : `${discoverable.length} groupe${discoverable.length > 1 ? "s" : ""} a rejoindre`
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/explore")}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Voir tout <FiArrowRight size={12} />
          </button>
        </div>

        {showSearch && (
          <div className="relative mb-4">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Rechercher un groupe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2.5 pl-10 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm text-white placeholder:text-slate-500"
            />
          </div>
        )}

        {isEmpty && display.length > 0 && (
          <EmptyStateIllustration />
        )}

        {display.length === 0 ? (
          isEmpty ? (
            <EmptyStateIllustration />
          ) : (
            <div className="text-center py-8 bg-white/[0.03] rounded-3xl border border-white/[0.06]">
              <FiCompass size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Aucun groupe trouve</p>
            </div>
          )
        ) : (
          <div className={compact ? "space-y-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
            <AnimatePresence>
              {display.map((group, idx) => {
                const gradIdx = idx % GRADIENTS.length;
                const isStarter = !!group.isStarter;
                const pct = group.maxMembers ? Math.round(((group.memberCount || 0) / group.maxMembers) * 100) : 0;
                return (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx < 4 ? idx * 0.05 : 0 }}
                    className={`bg-white/[0.04] border backdrop-blur-md rounded-2xl overflow-hidden hover:bg-white/[0.07] transition-all group/card ${
                      isStarter
                        ? "border-indigo-500/20 hover:border-indigo-400/30"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className={`h-14 bg-gradient-to-br ${GRADIENTS[gradIdx]} relative px-3.5 flex items-center gap-3`}>
                      <div className="w-8 h-8 bg-white/25 backdrop-blur-sm rounded-lg flex items-center justify-center text-white text-sm font-black ring-1 ring-white/20">
                        {group.name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{group.name}</h4>
                        <p className="text-[10px] text-white/70 truncate">{group.subject}</p>
                      </div>
                      {isStarter && (
                        <span className="text-[9px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                          Starter
                        </span>
                      )}
                    </div>

                    <div className="p-3.5">
                      {group.description && (
                        <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5 line-clamp-2">{group.description}</p>
                      )}

                      {group.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {group.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[9px] font-semibold bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}

                      {!isStarter && (
                        <>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                            <span className="flex items-center gap-1"><FiUsers size={9} /> {group.memberCount || 0}/{group.maxMembers || "inf"}</span>
                            {group.maxMembers && <span>{pct}%</span>}
                          </div>
                          {group.maxMembers && (
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-3">
                              <div className={`h-full rounded-full bg-gradient-to-r ${GRADIENTS[gradIdx]} transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </>
                      )}

                      {isStarter ? (
                        <button
                          onClick={() => router.push("/groups/create")}
                          className="w-full py-2.5 rounded-[32px] text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex items-center justify-center gap-1.5 hover:from-indigo-400 hover:to-violet-500 active:scale-[0.97] transition-all shadow-lg shadow-indigo-500/30 ring-1 ring-white/20"
                        >
                          <FiPlus size={12} /> Create this circle
                        </button>
                      ) : (
                        <button
                          onClick={() => setJoiningGroup({ ...group, _gradIdx: gradIdx })}
                          className={`w-full py-2 rounded-[32px] text-xs font-bold bg-gradient-to-r ${GRADIENTS[gradIdx]} text-white hover:opacity-90 active:scale-[0.97] transition-all shadow-md ring-1 ring-white/20`}
                        >
                          Rejoindre
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
