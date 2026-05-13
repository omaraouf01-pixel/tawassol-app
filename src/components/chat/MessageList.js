"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, FileText, ImageIcon, Reply,
  ShieldAlert, Clock
} from "lucide-react";

export default function MessageList({ messages, currentUser, onReaction, setReplyTo }) {
  const scrollRef = useRef(null);

  // التمرير التلقائي لأسفل عند وصول رسائل جديدة
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // --- دالة التحميل المضمونة عبر الوكيل (Fix 401 Error) ---
  const handleDownload = (fileUrl, fileName) => {
    if (!fileUrl) return;

    // توجيه الطلب إلى الـ API الداخلي الخاص بنا لتخطي حماية Cloudinary
    const proxyUrl = `/api/download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName || 'resource')}`;

    const link = document.createElement('a');
    link.href = proxyUrl;
    // السيرفر سيرسل ترويسة attachment لإجبار التحميل
    link.setAttribute('download', fileName || 'resource');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 custom-scrollbar bg-[#050505]"
    >
      <AnimatePresence initial={false}>
        {messages.map((m, idx) => {
          const isMe = m.uid === currentUser?.uid;
          const isPending = m.moderationStatus === "pending";

          return (
            <motion.div
              key={m.id || idx}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"} w-full group`}
            >
              {/* Sender Name */}
              {!isMe && (
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2 ml-4">
                  {m.authorName} • Scholar
                </span>
              )}

              <div className={`flex items-end gap-3 max-w-[85%] sm:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0 mb-1 shadow-sm">
                  <span className="text-[10px] font-serif italic font-black text-slate-500 uppercase">
                    {m.authorName?.[0] || "S"}
                  </span>
                </div>

                {/* Message Content */}
                <div className="flex flex-col gap-2">
                  <div className={`relative p-4 rounded-2xl border transition-all ${isMe
                      ? "bg-white text-black border-white shadow-glow"
                      : "bg-[#0A0A0B] text-slate-200 border-white/5"
                    } ${isPending ? "opacity-50 border-amber-500/30" : ""}`}>

                    {/* Reply Preview */}
                    {m.replyTo && (
                      <div className={`mb-3 p-3 rounded-xl text-[10px] border-l-2 ${isMe ? "bg-black/5 border-black/20 text-black/60" : "bg-white/5 border-brand-indigo/40 text-slate-400"
                        }`}>
                        <p className="font-black uppercase tracking-widest opacity-80 mb-1">{m.replyTo.userName}</p>
                        <p className="italic truncate line-clamp-1">{m.replyTo.text}</p>
                      </div>
                    )}

                    {/* Text Message */}
                    {m.text && <p className="text-[13px] leading-relaxed font-medium selection:bg-brand-indigo/30">{m.text}</p>}

                    {/* File / Image Attachment */}
                    {m.file && (
                      <div className={`mt-3 overflow-hidden rounded-xl border ${isMe ? "border-black/10 bg-black/5" : "border-white/5 bg-white/[0.02]"}`}>
                        {m.file.type?.startsWith("image/") ? (
                          <img
                            src={m.file.url}
                            alt="Node Asset"
                            className="w-full max-h-64 object-cover hover:scale-[1.02] transition-transform cursor-pointer"
                            onClick={() => window.open(m.file.url, '_blank')}
                          />
                        ) : (
                          <div className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-brand-indigo/10 rounded-xl text-brand-indigo shadow-glow">
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-[11px] font-bold truncate">{m.file.name}</p>
                              <p className="text-[8px] opacity-50 uppercase tracking-tighter mt-1 font-black">Academic Resource</p>
                            </div>
                          </div>
                        )}

                        {/* الزر المحدث للتحميل الآمن */}
                        <button
                          onClick={() => handleDownload(m.file.url, m.file.name)}
                          className={`w-full py-3 text-[9px] font-black uppercase tracking-[0.2em] border-t transition-all cursor-pointer flex items-center justify-center gap-2 ${isMe
                              ? "border-black/5 hover:bg-black/10 text-black"
                              : "border-white/5 hover:bg-white/10 text-brand-indigo"
                            }`}
                        >
                          <Download size={12} /> Sync Asset
                        </button>
                      </div>
                    )}

                    {/* Moderation Status Icon */}
                    {isPending && (
                      <div className="absolute -top-3 -right-3 bg-[#050505] border border-amber-500/40 text-amber-500 p-1.5 rounded-full shadow-glow">
                        <ShieldAlert size={14} className="animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  <div className={`flex items-center gap-3 px-2 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={8} />
                      {m.createdAt?.toDate ? new Date(m.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Syncing...'}
                    </span>
                    <button
                      onClick={() => setReplyTo(m)}
                      className="p-1 text-slate-700 hover:text-brand-indigo transition-colors cursor-pointer border-none bg-transparent"
                      title="Reply to protocol"
                    >
                      <Reply size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.03); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.2); }
      `}} />
    </div>
  );
}