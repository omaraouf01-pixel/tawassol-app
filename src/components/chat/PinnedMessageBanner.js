"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, X } from "lucide-react";

/**
 * PinnedMessageBanner
 * Displays a thin sticky banner below the ChatHeader when a message is pinned.
 * Clicking the banner scrolls to the original message.
 * Leaders/admins can unpin via the X button.
 */
export default function PinnedMessageBanner({ pinnedMessage, onScrollTo, onUnpin, canUnpin }) {
  return (
    <AnimatePresence>
      {pinnedMessage && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div
            className="w-full flex items-center gap-3 px-5 py-2 cursor-pointer transition-colors"
            style={{ background: "rgba(124, 131, 242, 0.07)", borderBottom: "1px solid rgba(124, 131, 242, 0.15)" }}
            onClick={onScrollTo}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onScrollTo?.()}
          >
            <Pin size={13} style={{ color: "#7c83f2", flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] block mb-0.5" style={{ color: "#7c83f2" }}>
                Pinned · {pinnedMessage.senderName}
              </span>
              <p className="text-[12px] font-serif italic text-ink dark:text-white/80 truncate">
                {pinnedMessage.content || "(attachment)"}
              </p>
            </div>
            {canUnpin && (
              <button
                onClick={(e) => { e.stopPropagation(); onUnpin(); }}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
                aria-label="Unpin message"
                title="Unpin message"
                style={{ color: "#7c83f2" }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
