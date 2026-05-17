"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, ArrowRight, Sparkles, Clock } from "lucide-react";

/**
 * NodeShelf — شبكة عمودية متجاوبة لعرض المجموعات.
 *
 * التوزيع:
 *   • موبايل: عمود واحد (grid-cols-1)
 *   • متوسط (sm): عمودان
 *   • كبير (lg): 3 أعمدة
 *   • عريض جداً (xl): 4 أعمدة
 *
 * كل كارت يأخذ عرض عموده بالكامل (w-full) بدلاً من العرض الثابت السابق.
 */
export default function NodeShelf({
  title,
  subtitle,
  icon: Icon,
  nodes,
  onNodeClick,
  onViewAll,
  accent = "#7c83f2",
  pendingGroupIds,
}) {
  if (!nodes || nodes.length === 0) return null;

  return (
    <section className="mb-14">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 px-1 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {Icon && (
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${accent}15`, color: accent }}
            >
              <Icon size={18} strokeWidth={2.5} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-bold font-serif italic text-slate-800 dark:text-white leading-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-slate-400">
            {`Showing ${nodes.length} nodes`}
          </span>

          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all hover:text-white"
              style={{
                color: accent,
                backgroundColor: `${accent}10`,
                borderColor: `${accent}30`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${accent}10`;
              }}
            >
              View all
              <ArrowRight size={11} data-flip-rtl />
            </button>
          )}
        </div>
      </div>

      {/* Vertical responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {nodes.map((node, idx) => (
          <CompactNodeCard
            key={node.id}
            node={node}
            accent={accent}
            onClick={() => onNodeClick(node)}
            delay={idx * 0.04}
            isPending={pendingGroupIds?.has(node.id)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── بطاقة مدمجة (Compact Card) — تأخذ عرض العمود بالكامل ────────
function CompactNodeCard({ node, onClick, accent, delay = 0, isPending = false }) {
  const router = useRouter();

  return (
    <motion.button
      onClick={isPending ? undefined : onClick}
      disabled={isPending}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      whileHover={isPending ? undefined : { y: -4 }}
      className={`w-full text-start bg-white dark:bg-white/5 rounded-[2rem] p-6 border border-slate-200 dark:border-white/10 shadow-sm transition-all duration-500 group relative overflow-hidden ${
        isPending ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center font-serif font-black italic text-xl border transition-all duration-500 group-hover:text-white"
          style={{
            backgroundColor: `${accent}15`,
            color: accent,
            borderColor: `${accent}30`,
          }}
        >
          {node.name?.[0]?.toUpperCase() || "N"}
        </div>
        <span
          className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.18em] border"
          style={{
            color: accent,
            backgroundColor: `${accent}10`,
            borderColor: `${accent}25`,
          }}
        >
          {node.level || "Academic Node"}
        </span>
      </div>

      {/* Title + subject */}
      <h3 className="text-base font-bold font-serif italic text-slate-800 dark:text-white mb-1.5 line-clamp-1">
        {node.name}
      </h3>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-4 line-clamp-1">
        {node.subject || node.major || "Major"}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Users size={13} style={{ color: `${accent}99` }} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {node.memberCount || node.members?.length || 1}
          </span>
        </div>
        {isPending ? (
          <div
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
            style={{ color: accent }}
          >
            <Clock size={12} /> Pending…
          </div>
        ) : (
          <div
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity"
            style={{ color: accent }}
          >
            Join{" "}
            <ArrowRight
              size={12}
              data-flip-rtl
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        )}
      </div>

      {/* Hover decoration */}
      <div className="absolute -top-1 -end-1 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <Sparkles size={20} style={{ color: `${accent}30` }} />
      </div>
    </motion.button>
  );
}
