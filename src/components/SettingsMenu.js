"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Settings,
  Moon,
  Sun,
  Shield,
  Lock,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

import { SecurityModal, PrivacyModal } from "@/components/SettingsModals";
import { useTranslation } from "@/lib/i18n";

/**
 * SettingsMenu — compact trigger + upward popover.
 *
 * Layout:
 *   • Trigger is sized to sit alongside the NotificationCenter bell in the
 *     Sidebar footer (w-10 h-10 rounded-full).
 *   • The popover anchors to the trigger and opens UPWARD (bottom-full),
 *     so it never overlaps chat/page content below it.
 *   • A fixed, blurred backdrop (z-40) sits above the sidebar (z-40) and page
 *     but below the popover itself (z-50). Clicking it closes the menu.
 *   • All directional offsets use `inset-inline-*` so RTL/LTR are handled by
 *     the cascade — no manual flipping needed.
 */
export default function SettingsMenu({ currentUser }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(null);
  const [flash, setFlash] = useState(null);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [coords, setCoords] = useState(null);

  const triggerRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // Compute fixed-position coordinates for the popover, anchored to the trigger.
  // Opens UPWARD; aligns to the trigger's inline-start in both LTR and RTL by
  // measuring against the viewport edge for the active writing direction.
  useLayoutEffect(() => {
    if (!open) return;

    const POPOVER_WIDTH = 288; // w-72
    const GAP = 12;            // mb-3 equivalent
    const VIEWPORT_MARGIN = 8;

    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const isRtl =
        (typeof document !== "undefined" &&
          document.documentElement.getAttribute("dir") === "rtl") ||
        getComputedStyle(el).direction === "rtl";

      const vw = window.innerWidth;
      const bottom = window.innerHeight - rect.top + GAP;

      let left;
      if (isRtl) {
        // Align popover's right edge to trigger's right edge.
        left = rect.right - POPOVER_WIDTH;
      } else {
        // Align popover's left edge to trigger's left edge.
        left = rect.left;
      }
      // Clamp to viewport.
      left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(left, vw - POPOVER_WIDTH - VIEWPORT_MARGIN)
      );

      setCoords({ left, bottom, width: POPOVER_WIDTH });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  // Auto-dismiss inline flash
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 3200);
    return () => clearTimeout(id);
  }, [flash]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isDark = mounted && theme === "dark";
  const close = () => setOpen(false);

  const handleToggleNight = () => setTheme(isDark ? "light" : "dark");

  const handleSecurity = () => {
    close();
    setSecurityOpen(true);
  };

  const handlePrivacy = () => {
    close();
    setPrivacyOpen(true);
  };

  const handleLogout = async () => {
    if (busy) return;
    setBusy("logout");
    try {
      await signOut(auth);
      router.replace("/auth");
    } catch (err) {
      console.error("[LOGOUT]", err);
      setFlash({ tone: "error", text: t("settings.logout_error") });
      setBusy(null);
    }
  };

  return (
    <>
      {/* ── Trigger (mirrors the NotificationCenter bell) ─────────────── */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Account Options"
          aria-expanded={open}
          aria-haspopup="menu"
          className={`relative w-10 h-10 inline-flex items-center justify-center rounded-full
                      text-ink-muted dark:text-slate-300
                      hover:bg-accent/10 hover:text-accent transition-colors
                      ${open ? "bg-accent/10 text-accent" : ""}`}
        >
          <Settings size={18} strokeWidth={1.8} />
        </button>

        {/* ── Backdrop + Popover (rendered via Portal to escape sidebar overflow) */}
        {mounted && createPortal(
          <AnimatePresence>
            {open && coords && (
              <>
                {/* Blurred backdrop — above sidebar (z-40), below popover (z-50) */}
                <motion.button
                  type="button"
                  aria-label="Close settings"
                  onClick={close}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="fixed inset-0 z-[60] cursor-default bg-ink/20 dark:bg-black/40
                             backdrop-blur-[3px]"
                />

                {/* Popover — opens UPWARD from the trigger, fixed-positioned */}
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ type: "spring", damping: 26, stiffness: 280 }}
                  style={{
                    position: "fixed",
                    left: coords.left,
                    bottom: coords.bottom,
                    width: coords.width,
                  }}
                  className="z-[61]
                             rounded-2xl overflow-hidden
                             bg-paper dark:bg-[#1c1a26]
                             border border-accent/20 dark:border-white/10
                             shadow-2xl shadow-black/10"
                >
                {/* Header */}
                <div className="px-4 py-3 border-b border-sand dark:border-white/5
                                bg-cream/60 dark:bg-white/[0.02]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
                    {t("settings.title")}
                  </p>
                  {currentUser?.fullName && (
                    <p className="mt-1 text-xs text-ink-muted dark:text-slate-400 truncate font-serif italic">
                      {currentUser.fullName}
                    </p>
                  )}
                </div>

                {/* Action list */}
                <ul className="py-1.5 text-sm">
                  <MenuItem
                    icon={isDark ? Sun : Moon}
                    label={isDark ? t("settings.daylight") : t("settings.night_mode")}
                    hint={isDark ? t("settings.daylight") : t("settings.night_hint")}
                    onClick={handleToggleNight}
                  />

                  <MenuItem
                    icon={Shield}
                    label={t("settings.security")}
                    hint={t("settings.security_hint")}
                    onClick={handleSecurity}
                  />

                  <MenuItem
                    icon={Lock}
                    label={t("settings.privacy")}
                    hint={t("settings.privacy_hint")}
                    onClick={handlePrivacy}
                  />
                </ul>

                {/* Inline flash */}
                <AnimatePresence>
                  {flash && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mx-3 mb-2 flex items-start gap-2 rounded-xl px-3 py-2 text-xs
                                  ${flash.tone === "ok"
                                    ? "bg-accent/10 text-accent border border-accent/20"
                                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}
                    >
                      {flash.tone === "ok"
                        ? <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                        : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
                      <span className="font-serif italic leading-snug">{flash.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Logout */}
                <div className="border-t border-sand dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={busy === "logout"}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium
                               text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10
                               transition-colors disabled:opacity-60"
                  >
                    {busy === "logout"
                      ? <Loader2 size={15} className="animate-spin" />
                      : <LogOut size={15} data-flip-rtl />}
                    <span>{t("settings.logout")}</span>
                  </button>
                </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      <SecurityModal
        open={securityOpen}
        onClose={() => setSecurityOpen(false)}
        currentUser={currentUser}
      />
      <PrivacyModal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
}

function MenuItem({ icon: Icon, label, hint, onClick, loading }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full flex items-center gap-3 px-4 py-2.5
                   text-ink dark:text-slate-200
                   hover:bg-accent/10 hover:text-accent
                   transition-colors duration-200 disabled:opacity-60"
      >
        <span className="w-7 h-7 inline-flex items-center justify-center rounded-lg
                         bg-accent/10 text-accent flex-shrink-0">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
        </span>
        <span className="flex-1 text-start">
          <span className="block font-medium">{label}</span>
          {hint && (
            <span className="block text-[10px] font-serif italic text-ink-faint mt-0.5">
              {hint}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
