"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  Download,
  File,
  ExternalLink,
  ChevronRight,
  Monitor
} from "lucide-react";

/**
 * TWASSEL MESSAGE ATTACHMENT — THE DIGITAL ASSET NODE
 * -------------------------------------------
 * - UI: Editorial catalog style with human-centered spacing.
 * - Logic: Dynamic icon selection based on file frequency/extension.
 * - Interaction: Tactile hover states with subtle depth.
 */

export default function MessageAttachment({ imageUrl, fileUrl, fileName, fileType }) {

  // ─── Case: Visual Insight (Image) ───
  if (imageUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        className="group relative block max-w-sm rounded-[2rem] overflow-hidden border border-white/[0.05] shadow-premium bg-surface/50 transition-all duration-700"
      >
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative aspect-video sm:aspect-auto"
        >
          {/* Layered Gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

          <img
            src={imageUrl}
            alt="Scholarly Insight"
            className="w-full h-auto max-h-80 object-cover transition-transform duration-1000 group-hover:scale-110"
            loading="lazy"
          />

          {/* Interactive Overlay */}
          <div className="absolute top-4 right-4 z-20">
            <div className="p-2.5 bg-background/60 backdrop-blur-md rounded-xl border border-white/10 text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
              <ExternalLink size={16} strokeWidth={2.5} />
            </div>
          </div>
        </a>
      </motion.div>
    );
  }

  // ─── Case: Knowledge Asset (Generic File) ───
  if (fileUrl) {
    const ext = (fileName?.split(".").pop() || "").toLowerCase();
    const Icon = pickLucideIcon(fileType, ext);
    const label = fileName || "Academic_Document";

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 4 }}
        className="max-w-xs"
      >
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={fileName || true}
          className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.05] hover:border-brand-indigo/30 hover:bg-brand-indigo/[0.03] transition-all duration-500 group no-underline"
        >
          {/* Asset Icon Node */}
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-brand-indigo group-hover:text-white transition-all duration-500">
            <Icon size={20} strokeWidth={1.5} className="transition-transform group-hover:scale-110" />
          </div>

          {/* Asset Metadata */}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-white truncate leading-tight tracking-tight group-hover:text-brand-indigo transition-colors">
              {label}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">
                {ext || "Bin"} Frequency
              </span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="p-2 rounded-lg text-slate-700 group-hover:text-white transition-colors">
            <Download size={14} strokeWidth={2.5} />
          </div>
        </a>
      </motion.div>
    );
  }

  return null;
}

/**
 * Helper: Refined Icon Selection logic using Lucide Node System
 */
function pickLucideIcon(mime, ext) {
  if (!mime && !ext) return File;

  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  if (mime?.startsWith("image/") || imageExts.includes(ext)) return ImageIcon;

  const docExts = ["pdf", "doc", "docx", "txt", "md", "rtf"];
  if (docExts.includes(ext)) return FileText;

  const codeExts = ["js", "jsx", "ts", "tsx", "py", "cpp", "html", "css", "json"];
  if (codeExts.includes(ext)) return Monitor;

  return File;
}