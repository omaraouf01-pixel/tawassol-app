"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Loader2, Plus, Users, Compass,
  School, Book, GraduationCap, SlidersHorizontal,
  RotateCcw, Zap, Lock, Clock, ChevronRight,
  X, Check,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import JoinNodeModal from "@/components/explore/JoinNodeModal";
import { useAuth } from "@/lib/useAuth";
import { useAllGroups } from "@/lib/useAllGroups";
import { firestore } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { COL } from "@/lib/collectionNames";
import { api } from "@/lib/apiClient";
import {
  UNIVERSITIES, MAJORS, LEVELS, ALL,
  UNIVERSITY_LABELS, MAJOR_LABELS,
} from "@/lib/academicData";

const PURPLE = "#7c83f2";

// ─── Filter helpers ───────────────────────────────────────────────
const matchesUniversity = (node, uni) =>
  uni === ALL || node.university === uni || node.tags?.includes(uni);

const matchesMajor = (node, major) =>
  major === ALL ||
  node.subject === major ||
  node.major === major ||
  node.tags?.includes(major);

const matchesLevel = (node, level) =>
  level === ALL || node.level === level || node.tags?.includes(level);

// ─── Dropdown Filter ──────────────────────────────────────────────
function FilterDropdown({ icon: Icon, label, options, labelMap, selected, isOpen, onToggle, onSelect, allLabel = "All" }) {
  const displayLabel = selected === ALL ? allLabel : (labelMap?.[selected] ?? selected);
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all"
        style={{
          backgroundColor: selected !== ALL ? `${PURPLE}12` : "transparent",
          borderColor: selected !== ALL ? PURPLE : "rgba(124,131,242,0.2)",
          color: selected !== ALL ? PURPLE : "rgb(var(--c-ink-faint,100 100 120))",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={15} strokeWidth={2.5} />
          <span className="truncate text-[12px] font-bold uppercase tracking-widest">{displayLabel}</span>
        </div>
        {selected !== ALL
          ? <X size={14} onClick={(e) => { e.stopPropagation(); onSelect(ALL); }} />
          : <ChevronRight size={14} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
        }
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute top-full mt-2 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl overflow-hidden max-h-56 overflow-y-auto"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => onSelect(opt)}
                className="w-full flex items-center justify-between px-4 py-3 text-[12px] font-bold uppercase tracking-widest transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                style={{ color: selected === opt ? PURPLE : undefined }}
              >
                <span>{opt === ALL ? allLabel : (labelMap?.[opt] ?? opt)}</span>
                {selected === opt && <Check size={13} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Node Card ────────────────────────────────────────────────────
function NodeCard({ node, isPending, isMember, onClick }) {
  const accessOpen = node.accessType === "open";
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      disabled={isMember}
      className="w-full text-left p-6 rounded-[2rem] border bg-white dark:bg-white/[0.03] border-slate-100 dark:border-white/10 hover:border-[#7c83f2]/40 hover:shadow-lg transition-all group disabled:opacity-60 disabled:cursor-default"
    >
      {/* Badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
          style={{
            backgroundColor: accessOpen ? `${PURPLE}15` : "rgba(100,100,120,0.08)",
            color: accessOpen ? PURPLE : "rgb(var(--c-ink-faint,100 100 120))",
          }}
        >
          {accessOpen ? <Zap size={10} /> : <Lock size={10} />}
          {accessOpen ? "Open" : "Protected"}
        </span>

        {isPending && (
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-500">
            <Clock size={10} /> Pending
          </span>
        )}
        {isMember && (
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest" style={{ color: PURPLE }}>
            <Check size={10} /> Joined
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="font-serif font-black italic text-[17px] text-slate-800 dark:text-white mb-2 leading-tight group-hover:text-[#7c83f2] transition-colors line-clamp-2">
        {node.name}
      </h3>

      {/* Description */}
      {node.description && (
        <p className="text-[12px] text-slate-400 leading-relaxed mb-4 line-clamp-2">{node.description}</p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[node.tags?.[0], node.subject || node.tags?.[1], node.tags?.[2] || node.level]
          .filter(Boolean)
          .map((tag, i) => (
            <span
              key={i}
              className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-50 dark:bg-white/5 text-slate-400"
            >
              {tag}
            </span>
          ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-white/5">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
          <Users size={13} />
          <span>{node.memberCount ?? node.members?.length ?? 0} members</span>
        </div>
        {!isMember && (
          <span
            className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all"
            style={{ color: PURPLE }}
          >
            {isPending ? "View" : accessOpen ? "Join" : "Request"} <ChevronRight size={12} />
          </span>
        )}
      </div>
    </motion.button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function GroupsJoinPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const { groups: allGroups, loading: groupsLoading } = useAllGroups();

  const [myGroups, setMyGroups] = useState([]);
  const [pendingGroupIds, setPendingGroupIds] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ university: ALL, major: ALL, level: ALL });
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // ─── Redirect if not authenticated ───
  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth");
  }, [authLoading, user, router]);

  // ─── My groups (real-time for Sidebar) ───
  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(
      collection(firestore, COL.GROUPS),
      where("members", "array-contains", userData.uid)
    );
    const unsub = onSnapshot(q, (snap) =>
      setMyGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [userData?.uid]);

  // ─── Pending requests ───
  const refreshPending = useCallback(async () => {
    if (!userData?.uid) return;
    try {
      const res = await api("/api/user/pending-requests");
      setPendingGroupIds(new Set(res.groupIds || []));
    } catch {
      // silent fail
    }
  }, [userData?.uid]);

  useEffect(() => { refreshPending(); }, [refreshPending]);

  // ─── Derived sets ───
  const memberOfIds = useMemo(
    () => new Set(allGroups.filter((g) => g.members?.includes(userData?.uid)).map((g) => g.id)),
    [allGroups, userData?.uid]
  );

  // ─── Filtered nodes (excludes already-joined) ───
  const filteredNodes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allGroups.filter((node) => {
      if (memberOfIds.has(node.id)) return false;
      const okSearch =
        !q ||
        node.name?.toLowerCase().includes(q) ||
        node.subject?.toLowerCase().includes(q) ||
        node.major?.toLowerCase().includes(q) ||
        node.description?.toLowerCase().includes(q);
      return (
        okSearch &&
        matchesUniversity(node, filters.university) &&
        matchesMajor(node, filters.major) &&
        matchesLevel(node, filters.level)
      );
    });
  }, [allGroups, memberOfIds, searchQuery, filters]);

  const activeFilterCount =
    (filters.university !== ALL ? 1 : 0) +
    (filters.major !== ALL ? 1 : 0) +
    (filters.level !== ALL ? 1 : 0);

  const resetFilters = () => { setFilters({ university: ALL, major: ALL, level: ALL }); setOpenDropdown(null); };

  if (authLoading || groupsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-black">
        <Loader2 className="animate-spin" size={36} style={{ color: PURPLE }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cream dark:bg-black font-sans text-ink dark:text-white transition-colors duration-500">
      <Sidebar currentUser={userData} groups={myGroups} />

      <main className="flex-1 md:ms-[280px] h-screen overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <header className="px-8 py-6 bg-cream/80 dark:bg-black/60 backdrop-blur-2xl border-b border-sand dark:border-white/5 z-30 shrink-0">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Compass size={22} style={{ color: PURPLE }} />
                <h1 className="text-2xl font-bold font-serif italic">Join a Node</h1>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                Discover academic nodes and request to join
              </p>
            </div>

            <button
              onClick={() => router.push("/groups/create")}
              className="shrink-0 inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white shadow-lg shadow-[#7c83f2]/20 hover:brightness-110 active:scale-[0.98] transition-all"
              style={{ backgroundColor: PURPLE }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Forge New Node
            </button>
          </div>
        </header>

        {/* ── Search + Filters ── */}
        <div className="px-8 py-4 border-b border-sand dark:border-white/5 bg-cream/50 dark:bg-black/30 shrink-0">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 bg-white dark:bg-white/5 px-5 py-3 rounded-2xl border border-sand dark:border-white/10 shadow-sm">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search nodes by name, major, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400 text-ink dark:text-white"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className="relative shrink-0 p-3.5 rounded-2xl border shadow-sm transition-all"
              style={{
                backgroundColor: showFilters ? PURPLE : "transparent",
                borderColor: showFilters ? PURPLE : "rgba(124,131,242,0.2)",
                color: showFilters ? "#fff" : "rgb(var(--c-ink-faint,100 100 120))",
              }}
              title="Filter"
            >
              <SlidersHorizontal size={17} />
              {activeFilterCount > 0 && !showFilters && (
                <span
                  className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white"
                  style={{ backgroundColor: PURPLE }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Collapsible filters */}
          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                key="filters"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-visible"
              >
                <div className="max-w-5xl mx-auto mt-4 p-5 rounded-[1.5rem] border border-slate-100 dark:border-white/10 bg-white dark:bg-white/[0.03]" style={{ borderColor: "rgba(124,131,242,0.15)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {filteredNodes.length} {filteredNodes.length === 1 ? "node" : "nodes"} available
                    </span>
                    {(activeFilterCount > 0 || searchQuery) && (
                      <button
                        onClick={() => { resetFilters(); setSearchQuery(""); }}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors hover:underline"
                        style={{ color: PURPLE }}
                      >
                        <RotateCcw size={11} /> Reset all
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FilterDropdown
                      icon={School} label="Field"
                      options={[ALL, ...UNIVERSITIES]} labelMap={UNIVERSITY_LABELS}
                      selected={filters.university}
                      isOpen={openDropdown === "university"}
                      onToggle={() => setOpenDropdown(openDropdown === "university" ? null : "university")}
                      onSelect={(v) => { setFilters((f) => ({ ...f, university: v })); setOpenDropdown(null); }}
                    />
                    <FilterDropdown
                      icon={Book} label="Major"
                      options={[ALL, ...MAJORS]} labelMap={MAJOR_LABELS}
                      selected={filters.major}
                      isOpen={openDropdown === "major"}
                      onToggle={() => setOpenDropdown(openDropdown === "major" ? null : "major")}
                      onSelect={(v) => { setFilters((f) => ({ ...f, major: v })); setOpenDropdown(null); }}
                    />
                    <FilterDropdown
                      icon={GraduationCap} label="Level"
                      options={[ALL, ...LEVELS]}
                      selected={filters.level}
                      isOpen={openDropdown === "level"}
                      onToggle={() => setOpenDropdown(openDropdown === "level" ? null : "level")}
                      onSelect={(v) => { setFilters((f) => ({ ...f, level: v })); setOpenDropdown(null); }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Nodes Grid ── */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-8">
          <div className="max-w-5xl mx-auto">

            {filteredNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${PURPLE}12`, color: PURPLE }}
                >
                  <Compass size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-serif font-black italic text-slate-700 dark:text-slate-200 mb-2">
                  No nodes found
                </h3>
                <p className="text-[12px] text-slate-400 font-medium mb-6 max-w-xs leading-relaxed">
                  {searchQuery || activeFilterCount > 0
                    ? "Try adjusting your search or filters."
                    : "No public nodes available yet. Be the first to forge one."}
                </p>
                <button
                  onClick={() => router.push("/groups/create")}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: PURPLE }}
                >
                  <Plus size={15} /> Forge New Node
                </button>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                  {filteredNodes.length} {filteredNodes.length === 1 ? "node" : "nodes"} available
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNodes.map((node) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      isPending={pendingGroupIds.has(node.id)}
                      isMember={memberOfIds.has(node.id)}
                      onClick={() => setSelectedNode(node)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Join Modal ── */}
      <JoinNodeModal
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        group={selectedNode}
        isPending={selectedNode ? pendingGroupIds.has(selectedNode.id) : false}
        onRequestSent={() => {
          refreshPending();
          setSelectedNode(null);
        }}
      />
    </div>
  );
}
