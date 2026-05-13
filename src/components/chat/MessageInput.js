"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip, Camera, Send, Smile, X, CornerUpLeft,
  Image as ImageIcon, FileText, UploadCloud, Loader2
} from "lucide-react";

// ─── Helpers ───
function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(name) {
  const ext = name?.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return <ImageIcon size={18} className="text-emerald-400" />;
  return <FileText size={18} className="text-brand-indigo" />;
}

const SimpleEmojiPicker = ({ onSelect }) => {
  const emojis = ["📖", "🎓", "💡", "🧪", "🧠", "🧬", "💻", "🖋️", "🔍", "🌍", "✅", "🔥"];
  return (
    <div className="p-3 grid grid-cols-4 gap-2 bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-premium">
      {emojis.map(e => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          className="text-xl hover:bg-white/5 p-2 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
        >
          {e}
        </button>
      ))}
    </div>
  );
};

export default function MessageInput({
  onSend,
  upload,
  uploading,
  groupId,
  replyTo,
  setReplyTo
}) {
  const [message, setMessage] = useState("");
  const [sendingText, setSendingText] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  // Staged File States
  const [stagedFile, setStagedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const isUploading = uploading || sendingText;

  // ─── Actions ───
  const cancelStaged = () => {
    setStagedFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File magnitude too large (Limit: 10MB)");
      e.target.value = "";
      return;
    }

    setStagedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // تأكيد رفع الملف المجهز (Staged File)
  const confirmUpload = async () => {
    if (!stagedFile) return;

    try {
      // 1. رفع الملف عبر دالة upload الممررة من page.js
      const res = await upload(stagedFile, `chats/${groupId}`);

      // 2. إرسال الرسالة مع رابط الملف
      await onSend(message.trim(), { url: res.url, name: stagedFile.name, type: stagedFile.type });

      setMessage("");
      if (setReplyTo) setReplyTo(null);
      cancelStaged();
    } catch (err) {
      console.error("Synchronization failed: ", err);
    }
  };

  // إرسال نص عادي بدون ملف
  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || isUploading || stagedFile) return;

    setSendingText(true);
    try {
      await onSend(message.trim(), null);
      setMessage("");
      if (setReplyTo) setReplyTo(null);
      setShowEmoji(false);
    } catch (err) {
      console.error("Transmission failed: ", err);
    } finally {
      setSendingText(false);
    }
  };

  return (
    <footer className="relative px-6 lg:px-10 pb-8 pt-2">

      {/* ─── Floating Upload Overlay ─── */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-6 lg:inset-x-10 inset-y-0 bottom-8 bg-black/60 z-30 flex items-center justify-center gap-4 rounded-[2.5rem] border border-white/5 shadow-premium"
          >
            <Loader2 size={24} className="text-brand-indigo animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
              Synchronizing Identity...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={imageInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

      <div className="max-w-[1000px] mx-auto space-y-4">

        {/* ─── Staged Asset Preview ─── */}
        <AnimatePresence>
          {stagedFile && !isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="bg-[#0A0A0B] border border-white/10 p-4 rounded-[2rem] shadow-premium flex items-center gap-5 group"
            >
              <div className="relative overflow-hidden w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                {imagePreview ? (
                  <img src={imagePreview} alt="Stage Preview" className="w-full h-full object-cover" />
                ) : (
                  getFileIcon(stagedFile.name)
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-bold text-white truncate">{stagedFile.name}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{formatSize(stagedFile.size)} • Academic Asset</p>
              </div>
              <div className="flex items-center gap-3 pr-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={cancelStaged} className="p-3 bg-white/5 text-slate-500 hover:text-rose-500 rounded-xl transition-all border-none cursor-pointer">
                  <X size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={confirmUpload}
                  className="px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-glow border-none cursor-pointer"
                >
                  <UploadCloud size={14} /> Synchronize
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Reply Identity Strip ─── */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-brand-indigo/10 border border-brand-indigo/20 p-4 rounded-[1.5rem] flex items-center gap-4 shadow-sm text-left mb-2">
                <CornerUpLeft size={16} className="text-brand-indigo" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-brand-indigo uppercase tracking-[0.2em]">Referencing Scholar: {replyTo.authorName}</p>
                  <p className="text-[12px] text-slate-300 italic truncate mt-0.5">"{replyTo.text || "Linked Frequency"}"</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-2 text-slate-600 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Main Editorial Input Bar ─── */}
        <div className="relative group/bar">
          <div className="absolute inset-0 bg-brand-indigo/5 blur-3xl opacity-0 group-focus-within/bar:opacity-100 transition-opacity duration-1000 rounded-full" />

          <form
            onSubmit={handleSend}
            className="relative bg-black/60 backdrop-blur-2xl border border-white/5 p-3 pl-5 rounded-[2.5rem] flex items-center gap-2 shadow-premium group-focus-within/bar:border-white/10 transition-all duration-500"
          >
            {/* Attachment Actions */}
            <div className="flex items-center gap-1">
              <motion.button
                type="button" whileHover={{ y: -2 }} onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-500 hover:text-brand-indigo hover:bg-brand-indigo/5 rounded-full transition-all border-none cursor-pointer"
              >
                <Paperclip size={18} strokeWidth={2} />
              </motion.button>
              <motion.button
                type="button" whileHover={{ y: -2 }} onClick={() => imageInputRef.current?.click()}
                className="p-3 text-slate-500 hover:text-brand-indigo hover:bg-brand-indigo/5 rounded-full transition-all border-none cursor-pointer hidden sm:flex"
              >
                <Camera size={18} strokeWidth={2} />
              </motion.button>
            </div>

            <div className="h-6 w-px bg-white/5 mx-1" />

            {/* Core Text Input */}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Articulate your scholarly pursuit..."
              className="flex-1 bg-transparent border-none outline-none py-3 text-[15px] font-medium text-white placeholder:text-slate-700 selection:bg-brand-indigo/30"
            />

            {/* Emoji & Send */}
            <div className="flex items-center gap-2 pr-1 relative">
              <motion.button
                type="button" whileTap={{ scale: 0.9 }} onClick={() => setShowEmoji(!showEmoji)}
                className={`p-3 rounded-full transition-all border-none cursor-pointer ${showEmoji ? 'bg-brand-indigo/10 text-brand-indigo' : 'text-slate-500 hover:text-white'}`}
              >
                <Smile size={18} strokeWidth={2} />
              </motion.button>

              <motion.button
                type="submit"
                disabled={(!message.trim() && !stagedFile) || isUploading}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-none cursor-pointer shadow-glow ${(!message.trim() && !stagedFile) || isUploading ? 'bg-white/5 text-slate-700' : 'bg-white text-black hover:bg-brand-indigo hover:text-white'}`}
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} strokeWidth={2.5} />}
              </motion.button>

              {/* Simple Inline Emoji Picker */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-16 right-0 z-50 min-w-[200px]"
                  >
                    <SimpleEmojiPicker onSelect={(emoji) => {
                      setMessage(prev => prev + emoji);
                      setShowEmoji(false);
                    }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>
    </footer>
  );
}