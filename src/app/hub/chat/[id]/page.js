"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, ChevronLeft } from "lucide-react";
import { firestore as db } from "@/lib/firebase"; // محرك العميل (firestore.js صار server-only)
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { COL } from "@/lib/collectionNames";
import { useAuth } from "@/lib/useAuth";
import { useChat } from "@/lib/useChat";

import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import ActiveNodesSidebar from "@/components/chat/ActiveNodesSidebar";
import ResourcesSidebar from "@/components/chat/ResourcesSidebar";
import OverseerPanel from "@/components/chat/OverseerPanel";

export default function GroupChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cameFromAdmin = searchParams?.get("from") === "admin";
  const backHref = cameFromAdmin ? "/admin" : "/hub";
  const { user, userData, loading: authLoading } = useAuth();

  const [group, setGroup] = useState(null);
  const { messages, sendMessage } = useChat({ groupId: id, user, userData, group });
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // جلب بيانات المجموعة والمجموعات المشترك بها
  useEffect(() => {
    if (!id || authLoading || !userData || !user?.uid) return;

    const groupRef = doc(db, COL.GROUPS, id);
    const unsubGroup = onSnapshot(
      groupRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          console.warn("[Chat] Node not found:", id);
          setError("not-found");
          setLoading(false);
          return;
        }

        const data = { id: docSnap.id, ...docSnap.data() };
        const isMember = Array.isArray(data.members) && data.members.includes(user.uid);
        const isAdmin = userData.role === "admin";
        const isLeader = data.leaderId === user.uid;

        if (!isMember && !isAdmin && !isLeader) {
          console.warn("[Chat] Access denied — diagnostic:", {
            uid: user.uid,
            leaderId: data.leaderId,
            members: data.members,
            role: userData.role,
            accessType: data.accessType,
          });
          setError("forbidden");
          setLoading(false);
          return;
        }

        setGroup(data);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("[Chat] Firestore error:", err);
        setError(err.code === "permission-denied" ? "forbidden" : "fetch-failed");
        setLoading(false);
      }
    );

    const q = query(collection(db, COL.GROUPS), where("members", "array-contains", user.uid));
    const unsubMyGroups = onSnapshot(
      q,
      (snap) => setMyGroups(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("[Chat] myGroups listener:", err)
    );

    return () => { unsubGroup(); unsubMyGroups(); };
  }, [id, user?.uid, userData?.uid, userData?.role, authLoading]);

  if (authLoading || loading) return (
    <div className="h-screen flex items-center justify-center bg-cream dark:bg-black transition-colors">
      <Loader2 className="animate-spin text-accent" size={40} />
    </div>
  );

  if (error) {
    const title = error === "not-found" ? "Item not found."
                : error === "forbidden" ? "You do not have permission for this action."
                : "Network error. Check your connection.";
    const desc = title;
    return (
      <div className="h-screen flex items-center justify-center bg-cream dark:bg-black px-6">
        <div className="max-w-md text-center space-y-5">
          <div className="w-16 h-16 mx-auto bg-accent-soft border border-accent/20 rounded-2xl flex items-center justify-center text-accent">
            <ChevronLeft size={28} data-flip-rtl />
          </div>
          <h2 className="text-2xl font-display italic font-bold text-ink">{title}</h2>
          <p className="text-sm text-ink-faint font-serif italic leading-relaxed">{desc}</p>
          <button
            onClick={() => router.push(backHref)}
            className="px-6 py-3 bg-accent text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-ink transition-all"
          >
            {cameFromAdmin ? "Back to Admin" : "Back to Hub"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-cream dark:bg-black overflow-hidden transition-all duration-500">

      {/* ─── الشريط الجانبي המوحد (280px الثابت مع إطار نحيف) ─── */}
      <aside className="hidden lg:flex flex-col w-[280px] h-full bg-paper dark:bg-[#0A0A0A] border-e border-sand dark:border-white/5 transition-all">
        {/* قسم المجموعات */}
        <div className="flex-[1.3] overflow-hidden flex flex-col">
          <ActiveNodesSidebar nodes={myGroups} activeId={id} currentUser={user} />
        </div>

        {/* قسم الملفات */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ResourcesSidebar messages={messages || []} />
        </div>
      </aside>

      {/* ─── منطقة الدردشة الرئيسية ─── */}
      <main className="flex-1 flex flex-col relative bg-white/40 dark:bg-black/20 backdrop-blur-sm">
        <header
          className="sticky top-0 z-20 backdrop-blur-xl px-6 py-4 flex items-center justify-between gap-3 border-b bg-[#F8F8F5]/85 dark:bg-slate-900/80"
          style={{ borderBottomColor: "rgba(124, 131, 242, 0.10)" }}
        >
          <div className="flex-1 min-w-0">
            <ChatHeader
              group={group}
              isLeader={userData?.uid === group?.leaderId}
              isAdmin={userData?.role === "admin"}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <OverseerPanel
              groupId={id}
              group={group}
              isLeader={userData?.uid === group?.leaderId}
            />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto hide-scrollbar p-6 lg:p-10">
          <MessageList messages={messages || []} currentUser={user} groupLeaderId={group?.leaderId} />
        </section>

        <footer className="p-4 lg:p-8 bg-paper/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-sand/10 dark:border-white/5">
          <MessageInput groupId={id} group={group} sendMessage={sendMessage} />
        </footer>
      </main>

      <style jsx global>{` .hide-scrollbar::-webkit-scrollbar { display: none; } `}</style>
    </div>
  );
}