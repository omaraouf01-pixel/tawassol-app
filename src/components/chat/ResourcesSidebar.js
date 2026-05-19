"use client";

import React, { useState } from "react";
import { FileText, Download, ShieldCheck, Image, Video, Link, LayoutGrid, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CalendarSidebar from "./CalendarSidebar";

// ── تبويبات الوضع العلوي (الموارد ↔ الرزنامة) ──────────────────
const MODE_TABS = [
  { id: "resources", label: "الموارد",  Icon: LayoutGrid },
  { id: "calendar",  label: "الرزنامة", Icon: Calendar },
];

// ── تبويبات فلترة الملفات (تظهر فقط في وضع الموارد) ────────────
const FILE_TABS = [
  { id: "all",   label: "الكل",   Icon: LayoutGrid },
  { id: "media", label: "وسائط",  Icon: Image },
  { id: "files", label: "ملفات",  Icon: FileText },
  { id: "links", label: "روابط",  Icon: Link },
];

function classifyType(msg) {
  const mime = (msg.fileType || "").toLowerCase();
  if (mime.startsWith("image/") || mime.startsWith("video/")) return "media";
  if (mime === "" && msg.fileUrl) return "files";
  return "files";
}

export default function ResourcesSidebar({
  messages = [],
  groupId,
  isLeader = false,
  isAdmin = false,
}) {
  const [mode, setMode] = useState("resources");
  const [fileTab, setFileTab] = useState("all");

  const approved = messages.filter(
    (m) => (m.fileUrl || m.file) && m.moderationStatus !== "pending"
  );
  const filtered = approved.filter((res) =>
    fileTab === "all" ? true : classifyType(res) === fileTab
  );

  return (
    <div className="flex flex-col h-full bg-transparent">

      {/* ── تبويبات الوضع الرئيسية ──────────────────────────────── */}
      <div className="px-4 pt-5 pb-0">
        <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 mb-3">
          {MODE_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                mode === id
                  ? "bg-white dark:bg-white/10 text-accent shadow-sm"
                  : "text-ink-faint hover:text-ink dark:hover:text-white/70"
              }`}
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── المحتوى حسب الوضع ───────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {mode === "resources" ? (
          <motion.div
            key="resources"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* ── Header ────────────────────────────────────────── */}
            <div className="px-4 pb-2">
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-ink-faint font-sans mb-3">
                Node resources
              </h3>

              {/* ── تبويبات الفلترة ───────────────────────────── */}
              <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                {FILE_TABS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setFileTab(id)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                      fileTab === id
                        ? "bg-white dark:bg-white/10 text-accent shadow-sm"
                        : "text-ink-faint hover:text-ink dark:hover:text-white/70"
                    }`}
                  >
                    <Icon size={11} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── قائمة الملفات ─────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-3 space-y-1 pb-4">
              {filtered.length === 0 ? (
                <div className="py-8 text-center opacity-30 italic text-[10px] uppercase font-black tracking-widest">
                  No resources yet
                </div>
              ) : (
                filtered.map((res, idx) => {
                  const isImage = (res.fileType || "").startsWith("image/");
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors duration-200 border-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-black/5 dark:bg-white/10 text-ink-faint group-hover:bg-accent group-hover:text-white overflow-hidden">
                        {isImage && res.fileUrl ? (
                          <img src={res.fileUrl} alt={res.fileName} className="w-full h-full object-cover" />
                        ) : (
                          <FileText size={16} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-start">
                        <p className="text-[12px] font-bold truncate leading-tight text-ink dark:text-slate-200">
                          {res.fileName || "Scholarly Asset"}
                        </p>
                        <span className="text-[7px] font-black uppercase tracking-widest mt-1 flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <ShieldCheck size={8} className="text-emerald-500" /> Verified
                        </span>
                      </div>

                      <a
                        href={res.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-ink-faint opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                        title="Download"
                        aria-label="Download"
                      >
                        <Download size={14} />
                      </a>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.18 }}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <CalendarSidebar
              groupId={groupId}
              isLeader={isLeader}
              isAdmin={isAdmin}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
