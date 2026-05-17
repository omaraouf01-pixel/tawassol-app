"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Users, Settings, Trash2, Loader2 } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { COL } from "@/lib/collectionNames";
import MemberListDrawer from "./MemberListDrawer";
import NotificationCenter from "@/components/NotificationCenter";

const ACADEMIC_PURPLE = "#7c83f2";

export default function ChatHeader({ group, isLeader, isAdmin, onOpenSettings }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cameFromAdmin = searchParams?.get("from") === "admin";
  const backHref = cameFromAdmin ? "/admin" : "/hub";

  const [membersOpen, setMembersOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteGroup = async () => {
    if (!group?.id || deleting) return;
    if (!confirm(`Delete the node "${group.name || "Untitled"}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(firestore, COL.GROUPS, group.id));
      router.push(backHref);
    } catch (err) {
      console.error("[ChatHeader] Delete group failed:", err);
      alert("Could not delete node.");
      setDeleting(false);
    }
  };

  const memberCount = group?.members?.length ?? 0;
  const scholarLabel = memberCount === 1 ? "Scholar" : "Scholars";

  return (
    <div className="flex items-center justify-between w-full gap-3">
      {/* ── Branding & Navigation ────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => router.push(backHref)}
          className="p-2 -ms-1 rounded-xl text-ink-faint hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
          aria-label={cameFromAdmin ? "Back to Admin" : "Back to Hub"}
        >
          <ChevronLeft size={20} data-flip-rtl />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-serif italic font-bold leading-tight truncate text-ink dark:text-white">
            {group?.name || "Untitled Node"}
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
                Overseer
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
          aria-label="View Scholars"
          title="View Scholars"
        >
          <Users size={18} />
        </button>

        {isLeader && onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl text-ink-faint hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Node Settings"
            title="Node Settings"
          >
            <Settings size={18} />
          </button>
        )}

        {isAdmin && (
          <button
            onClick={handleDeleteGroup}
            disabled={deleting}
            className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete Node"
            title="Delete Node"
          >
            {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          </button>
        )}
      </div>

      <MemberListDrawer
        isOpen={membersOpen}
        onClose={() => setMembersOpen(false)}
        group={group}
        isLeader={isLeader}
        isAdmin={isAdmin}
      />
    </div>
  );
}
