"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Paperclip, X, FileText } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/useAuth";
import { useLanguage } from "@/lib/useLanguage";

// MessageInput
//  • Text + file attachment (Paperclip) — uploads through /api/upload (Cloudinary).
//  • Optimistic UI via the `sendMessage` prop; falls back to a direct addDoc.
//  • Attachments are always created as `pending` (Firestore rules enforce this).

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_FILE_MB = 25;

export default function MessageInput({ groupId, group, sendMessage }) {
  const { user, userData } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [content, setContent] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const isMuted =
    group?.isReadOnly && user?.uid !== group?.leaderId && userData?.role !== "admin";

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(t("chat.fileTooBig", { max: MAX_FILE_MB }));
      return;
    }
    setUploadError(null);
    setPendingFile({
      file,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    });
  };

  const clearPending = () => {
    setPendingFile(null);
    setUploadError(null);
  };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", `tawassol/groups/${groupId}`);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || t("chat.uploadFailed"));
    }
    return res.json();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && !pendingFile) return;
    if (isSending || isMuted) return;

    setIsSending(true);
    setUploadError(null);

    let fileUrl = null;
    let fileName = null;
    let fileType = null;
    let fileSize = null;

    try {
      if (pendingFile) {
        setIsUploading(true);
        const { url } = await uploadFile(pendingFile.file);
        setIsUploading(false);
        fileUrl = url;
        fileName = pendingFile.name;
        fileType = pendingFile.type;
        fileSize = pendingFile.size;
      }

      const snapshotContent = trimmed;
      setContent("");
      setPendingFile(null);

      if (typeof sendMessage === "function") {
        await sendMessage({
          content: snapshotContent,
          fileUrl,
          fileName,
          fileType,
          fileSize,
        });
      } else {
        const isAuthorized =
          user?.uid === group?.leaderId || userData?.role === "admin";
        const moderationStatus =
          fileUrl && !isAuthorized ? "pending" : "approved";
        await addDoc(collection(firestore, "messages"), {
          groupId,
          uid: user.uid,
          content: snapshotContent,
          senderName: userData?.fullName || t("chat.scholarFallback"),
          role: userData?.role || "student",
          fileUrl,
          fileName,
          fileType,
          fileSize,
          moderationStatus,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("[MessageInput] send failed:", error);
      setUploadError(error?.message || t("chat.uploadFailed"));
      setContent(trimmed);
    } finally {
      setIsUploading(false);
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
      {/* Pending file pill / error banner */}
      <AnimatePresence>
        {pendingFile && (
          <motion.div
            initial={{ opacity: 0, y: 6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 6, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl border"
            style={{
              background: "rgba(124, 131, 242, 0.08)",
              borderColor: "rgba(124, 131, 242, 0.35)",
            }}
          >
            <FileText size={14} style={{ color: "#7c83f2" }} />
            <div className="flex-1 min-w-0">
              <p
                className="text-[12px] font-serif italic truncate"
                style={{ color: "#7c83f2" }}
              >
                {pendingFile.name}
              </p>
              <p className="text-[9px] uppercase tracking-[0.15em] text-ink-faint">
                {(pendingFile.size / 1024).toFixed(1)} KB · {t("chat.fileForReview")}
              </p>
            </div>
            <button
              type="button"
              onClick={clearPending}
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
              aria-label={t("chat.removeFile")}
            >
              <X size={14} style={{ color: "#7c83f2" }} />
            </button>
          </motion.div>
        )}

        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] font-serif italic text-rose-500 px-3"
          >
            {uploadError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex items-center gap-3 relative">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handlePickFile}
          disabled={isMuted || isSending}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isMuted || isSending}
          title={t("chat.attachFile")}
          aria-label={t("chat.attachFile")}
          className="p-3 rounded-full border border-sand/30 dark:border-white/10 hover:border-accent/60 hover:bg-accent/5 transition disabled:opacity-50"
          style={{ color: "#7c83f2" }}
        >
          <Paperclip size={18} strokeWidth={2} />
        </button>

        <div className="flex-1 bg-paper dark:bg-white/5 border border-sand/20 dark:border-white/10 rounded-[1.5rem] px-4 py-1 flex items-center transition-all focus-within:border-accent">
          <textarea
            disabled={isMuted}
            value={isMuted ? t("chat.mutedPlaceholder") : content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder={
              pendingFile
                ? t("chat.inputFileCaptionPlaceholder")
                : t("chat.inputPlaceholder")
            }
            className="w-full bg-transparent border-none py-3 text-sm focus:ring-0 resize-none max-h-32 italic font-serif placeholder:italic placeholder:font-serif placeholder:text-ink-faint"
            rows={1}
          />
        </div>

        <button
          type="submit"
          disabled={isSending || isMuted || (!content.trim() && !pendingFile)}
          aria-label={t("common.send")}
          title={t("common.send")}
          className={`p-4 rounded-full transition-all ${
            isMuted
              ? "bg-sand text-ink-faint"
              : "bg-accent text-white shadow-lg shadow-accent/20 hover:bg-ink disabled:opacity-60"
          }`}
        >
          {isSending || isUploading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Send size={20} data-flip-rtl />
          )}
        </button>
      </div>
    </form>
  );
}
