"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Languages, Check } from "lucide-react";

import { useLanguage } from "@/lib/useLanguage";

/**
 * Dropdown picker for app language. Two visual modes:
 *  - variant="menu"   → fits inline inside SettingsMenu list (full-width row)
 *  - variant="pill"   → standalone trigger (e.g. in a header)
 */
export default function LanguageSwitcher({ variant = "menu" }) {
  const { t, lang, setLanguage, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = languages.find((l) => l.code === lang) || languages[0];

  const handlePick = async (code) => {
    setOpen(false);
    if (code !== lang) await setLanguage(code);
  };

  if (variant === "menu") {
    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-2.5
                     text-ink dark:text-slate-200
                     hover:bg-accent/10 hover:text-accent
                     transition-colors duration-200"
        >
          <span className="w-7 h-7 inline-flex items-center justify-center rounded-lg
                           bg-accent/10 text-accent flex-shrink-0">
            <Languages size={14} />
          </span>
          <span className="flex-1 text-start">
            <span className="block font-medium">{t("settings.language")}</span>
            <span className="block text-[10px] font-serif italic text-ink-faint mt-0.5">
              {current.nativeLabel}
            </span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            {current.code}
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
              className="absolute inset-inline-end-2 top-full mt-1 w-44 rounded-xl overflow-hidden z-50
                         bg-paper dark:bg-[#1c1a26]
                         border border-accent/20 dark:border-white/10
                         shadow-warm"
            >
              {languages.map((l) => {
                const active = l.code === lang;
                return (
                  <li key={l.code}>
                    <button
                      type="button"
                      onClick={() => handlePick(l.code)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm
                                  ${active
                                    ? "bg-accent/10 text-accent"
                                    : "text-ink dark:text-slate-200 hover:bg-accent/5"}`}
                    >
                      <span className="text-base leading-none">{l.flag}</span>
                      <span className="flex-1 text-start font-medium">{l.nativeLabel}</span>
                      {active && <Check size={14} />}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // pill variant
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("language.selectLanguage")}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
                   bg-paper dark:bg-white/5 border border-sand dark:border-white/10
                   text-ink-muted dark:text-slate-300
                   hover:border-accent/50 hover:text-accent transition"
      >
        <Languages size={14} />
        <span>{current.code.toUpperCase()}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute inset-inline-end-0 mt-2 w-44 rounded-xl overflow-hidden z-50
                       bg-paper dark:bg-[#1c1a26]
                       border border-accent/20 dark:border-white/10
                       shadow-warm"
          >
            {languages.map((l) => {
              const active = l.code === lang;
              return (
                <li key={l.code}>
                  <button
                    type="button"
                    onClick={() => handlePick(l.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm
                                ${active
                                  ? "bg-accent/10 text-accent"
                                  : "text-ink dark:text-slate-200 hover:bg-accent/5"}`}
                  >
                    <span className="text-base leading-none">{l.flag}</span>
                    <span className="flex-1 text-start font-medium">{l.nativeLabel}</span>
                    {active && <Check size={14} />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
