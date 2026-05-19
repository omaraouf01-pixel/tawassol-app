"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, X, Loader2, CheckCircle } from "lucide-react";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/lib/i18n";

/**
 * ReportModal — modal for reporting a message, post, or group.
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   -- For messages --
 *   groupId: string
 *   messageId: string
 *   -- For posts --
 *   postId: string
 *   -- For groups --
 *   reportGroupId: string   (use this to report the group itself)
 */
export default function ReportModal({ isOpen, onClose, groupId, messageId, postId, reportGroupId }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const REASONS = [
    { value: "inappropriate", label: t("report.reason_inappropriate") },
    { value: "spam",          label: t("report.reason_spam") },
    { value: "harassment",    label: t("report.reason_harassment") },
    { value: "misinformation",label: t("report.reason_misinformation") },
    { value: "other",         label: t("report.reason_other") },
  ];

  const isPost        = !!postId;
  const isGroupReport = !!reportGroupId;
  const title = isPost ? t("report.title_post")
              : isGroupReport ? t("report.title_group")
              : t("report.title_message");

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      let endpoint;
      if (isPost)        endpoint = `/api/posts/${postId}/report`;
      else if (isGroupReport) endpoint = `/api/groups/${reportGroupId}/report`;
      else               endpoint = `/api/groups/${groupId}/messages/${messageId}/report`;
      await api(endpoint, { method: "POST", body: { reason } });
      setDone(true);
    } catch (e) {
      setError(e?.message || t("report.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setDone(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-paper dark:bg-[#0F0F0F] border border-sand dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-sand dark:border-white/5">
              <div className="flex items-center gap-2">
                <Flag size={16} className="text-rose-500" />
                <h3 className="text-sm font-bold text-ink dark:text-white">{title}</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition text-ink-faint"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              {done ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle size={32} className="text-emerald-500" />
                  <p className="text-sm font-serif italic text-ink dark:text-white/80">
                    {t("report.success")}
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-6 py-2 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-ink transition"
                  >
                    {t("report.ok")}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[12px] text-ink-faint font-serif italic mb-4">
                    {t("report.reason_prompt")}
                  </p>
                  <div className="space-y-2">
                    {REASONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setReason(r.value)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-serif italic transition-all ${
                          reason === r.value
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-sand dark:border-white/10 text-ink dark:text-white/80 hover:border-accent/40"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {error && (
                    <p className="mt-3 text-[11px] text-rose-500 font-serif italic">{error}</p>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-2.5 rounded-xl border border-sand dark:border-white/10 text-xs font-black uppercase tracking-widest text-ink-faint hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!reason || submitting}
                      className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-600 disabled:opacity-40 transition flex items-center justify-center gap-2"
                    >
                      {submitting && <Loader2 size={13} className="animate-spin" />}
                      {t("report.submit")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
