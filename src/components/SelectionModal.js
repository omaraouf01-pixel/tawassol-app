"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check } from "lucide-react";

/**
 * SelectionModal — shared picker modal for university / major / level.
 * Uses GLOBALCSC design tokens (bg-paper, border-sand, text-ink, bg-accent …).
 */
export default function SelectionModal({
  isOpen,
  onClose,
  title,
  options,
  onSelect,
  selectedValue,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSelect = (opt) => {
    onSelect(opt);
    onClose();
    setSearchTerm("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-paper border border-sand rounded-[2.5rem] p-8 shadow-warm relative"
          >
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-8 end-8 text-ink-faint hover:text-accent transition-colors"
            >
              <X size={20} />
            </button>

            {/* Title */}
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-accent mb-6">
              Select — {title}
            </h2>

            {/* Search */}
            <div className="relative mb-5">
              <Search
                className="absolute start-4 top-1/2 -translate-y-1/2 text-ink-faint"
                size={16}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-cream border border-sand rounded-2xl py-3.5 ps-11 pe-4
                           text-ink text-sm outline-none
                           focus:border-accent/40 focus:ring-2 focus:ring-accent/10
                           placeholder:text-ink-faint transition-all"
              />
            </div>

            {/* Options */}
            <div className="max-h-[260px] overflow-y-auto space-y-2 pe-1">
              {filtered.length === 0 && (
                <p className="text-center text-ink-faint text-sm py-6">No results</p>
              )}
              {filtered.map((opt) => {
                const isSelected = selectedValue === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-start px-4 py-3.5 rounded-2xl text-sm font-semibold
                                flex items-center justify-between gap-3 transition-all
                                ${
                                  isSelected
                                    ? "bg-accent text-white shadow-soft"
                                    : "bg-cream text-ink hover:bg-sand/50"
                                }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check size={15} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
