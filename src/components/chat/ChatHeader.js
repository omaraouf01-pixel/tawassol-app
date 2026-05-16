"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Users, Settings } from "lucide-react";
import MemberListDrawer from "./MemberListDrawer";
import NotificationCenter from "@/components/NotificationCenter";
import { useLanguage } from "@/lib/useLanguage";

const ACADEMIC_PURPLE = "#7c83f2";

export default function ChatHeader({ group, isLeader, onOpenSettings }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [membersOpen, setMembersOpen] = useState(false);

  const memberCount = group?.members?.length ?? 0;
  const scholarLabel = memberCount === 1 ? t("roles.scholar") : t("roles.scholars");

  return (
    <div className="flex items-center justify-between w-full gap-3">
      {/* ── Branding & Navigation ────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => router.push("/hub")}
          className="p-2 -ms-1 rounded-xl text-ink-faint hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
          aria-label={t("nav.backToHub")}
        >
          <ChevronLeft size={20} data-flip-rtl />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-serif italic font-bold leading-tight truncate text-ink dark:text-white">
            {group?.name || t("common.untitled")}
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-faint mt-0.5 flex items-center gap-2">
            <span>
              {memberCount} {scholarLabel}
            </span>
            {isLeader && (
              <span
                className="px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest"
                style={{ background: `${ACADEMIC_PURPLE}1A`, color: ACADEMIC_PURPLE }}
              >
                {t("roles.overseer")}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Action Buttons ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <NotificationCenter />

        <button
          onClick={() => setMembersOpen(true)}
          className="p-2.5 rounded-xl transition-colors"
          style={{ color: ACADEMIC_PURPLE }}
          onMouseEnter={(e) => (e.currentTarget.style.background = `${ACADEMIC_PURPLE}14`)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label={t("chat.viewScholars")}
          title={t("chat.viewScholars")}
        >
          <Users size={18} />
        </button>

        {isLeader && onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl text-ink-faint hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label={t("chat.nodeSettings")}
            title={t("chat.nodeSettings")}
          >
            <Settings size={18} />
          </button>
        )}
      </div>

      <MemberListDrawer
        isOpen={membersOpen}
        onClose={() => setMembersOpen(false)}
        group={group}
      />
    </div>
  );
}
