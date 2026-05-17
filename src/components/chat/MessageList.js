"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import MessageAttachment from "@/components/MessageAttachment";

// MessageList — live message feed
//  • Smart auto-scroll: sticks to bottom on new messages, doesn't interrupt scroll-up.
//  • Optimistic UI: optimistic messages render dimmed with a "sending" indicator.
//  • Bubble corners use logical Tailwind utilities (`rounded-ss/se/es/ee`) so the
//    tail flips automatically under RTL.

function formatTime(createdAt) {
  if (!createdAt) return "...";
  const date =
    createdAt instanceof Date
      ? createdAt
      : createdAt.seconds
      ? new Date(createdAt.seconds * 1000)
      : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "...";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function MessageList({
  messages = [],
  currentUser,
  groupLeaderId,
  onDeleteMessage,
}) {
  const scrollRef = useRef(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setStickToBottom(distance < 120);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, stickToBottom]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto hide-scrollbar space-y-6 pb-10 px-4"
    >
      {messages.length === 0 && (
        <p className="text-center text-ink-faint italic font-display py-12">
          No messages yet — be the first to speak.
        </p>
      )}
      <AnimatePresence initial={false}>
        {messages.map((m, idx) => {
          const isSystem = m.isSystem || m.role === "system";
          const isMe = !isSystem && m.uid === currentUser?.uid;
          const isLeader = m.uid === groupLeaderId;
          const isAdmin = m.role === "admin";
          const isOptimistic = !!m._optimistic;
          const isFailed = !!m._failed;
          const canDelete =
            !isOptimistic &&
            !isSystem &&
            (isMe ||
              currentUser?.uid === groupLeaderId ||
              currentUser?.role === "admin");

          // System message: centered accent pill
          if (isSystem) {
            return (
              <motion.div
                key={m.id || idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-center w-full"
              >
                <div className="px-4 py-1.5 bg-accent-soft border border-accent/20 rounded-full text-[10px] italic font-serif text-accent flex items-center gap-2">
                  <ShieldCheck size={11} />
                  <span className="tracking-wide">{m.content}</span>
                </div>
              </motion.div>
            );
          }

          // NOTE: `justify-end` and `items-end` are direction-aware in flex layouts.
          // Under RTL the visual end is the LEFT edge, so own messages naturally
          // sit on the left in Arabic and on the right in English/French.
          return (
            <motion.div
              key={m.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isOptimistic ? 0.7 : 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"} w-full group`}
            >
              <div
                className={`flex flex-col max-w-[85%] md:max-w-[70%] ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                {/* Sender name + badges + time */}
                {!m._grouped && (
                  <div className="flex items-center gap-2 mb-1.5 px-2">
                    <span className="text-[11px] italic font-serif text-ink dark:text-white/90 tracking-wide">
                      {m.senderName || "Scholar"}
                    </span>
                    {(isLeader || isAdmin) && (
                      <span className="flex items-center gap-0.5 text-[8px] font-black text-accent bg-accent/5 px-2 py-0.5 rounded-md border border-accent/15">
                        <ShieldCheck size={8} />
                        {isAdmin ? "ADMIN" : "OVERSEER"}
                      </span>
                    )}
                    <span className="text-[10px] italic font-serif text-ink-faint">
                      · {formatTime(m.createdAt)}
                    </span>
                  </div>
                )}

                <div className="relative flex items-center gap-2">
                  {canDelete && onDeleteMessage && (
                    <button
                      onClick={() => onDeleteMessage(m.id)}
                      aria-label="Delete message"
                      title="Delete message"
                      className={`p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full ${
                        isMe ? "order-first" : "order-last"
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <div
                    className={`px-5 py-3 rounded-[1.5rem] text-sm leading-relaxed transition-all
                      ${
                        isMe
                          ? "bg-accent text-white rounded-se-none"
                          : "bg-paper dark:bg-white/5 border border-sand/20 dark:border-white/10 rounded-ss-none text-ink dark:text-white"
                      }
                      ${isFailed ? "ring-2 ring-rose-400/60" : ""}
                    `}
                  >
                    {m.content}

                    {(m.fileUrl || m.imageUrl) && (
                      <div className="mt-3">
                        <MessageAttachment
                          imageUrl={m.imageUrl}
                          fileUrl={m.fileUrl}
                          fileName={m.fileName}
                          fileType={m.fileType}
                          fileSize={m.fileSize}
                          moderationStatus={m.moderationStatus ?? "approved"}
                        />
                      </div>
                    )}

                    {isOptimistic && !isFailed && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[9px] italic font-serif opacity-80">
                        <Loader2 size={10} className="animate-spin" />
                        sending…
                      </span>
                    )}
                    {isFailed && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[9px] italic font-serif text-rose-200">
                        <AlertCircle size={10} /> failed to send
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
