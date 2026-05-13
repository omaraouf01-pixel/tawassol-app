"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

// ─── المكونات (Components) ───
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import ModerationPanel from "@/components/chat/ModerationPanel";
import ResourcesSidebar from "@/components/chat/ResourcesSidebar";
import GroupSettings from "@/components/chat/GroupSettings";
import GroupMembers from "@/components/chat/GroupMembers";

// ─── دوال قاعدة البيانات ───
import { auth, firestore } from "@/lib/firebase";
import {
  doc, getDoc, collection, query, orderBy, where,
  onSnapshot, addDoc, serverTimestamp, updateDoc,
  arrayUnion, arrayRemove
} from "firebase/firestore";
import { COL } from "@/lib/collections";
import { useFileUpload } from "@/lib/useFileUpload";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { upload, uploading } = useFileUpload();

  // ─── حالات البيانات ───
  const [groupId, setGroupId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // ─── حالات التحكم بالواجهات الجانبية ───
  const [showModeration, setShowModeration] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  // 1. استخراج الـ ID بأمان
  useEffect(() => {
    const id = params?.id || params?.groupId;
    if (id) setGroupId(id);
    else {
      const segments = window.location.pathname.split('/');
      const fallback = segments[segments.length - 1];
      if (fallback && !fallback.startsWith('[')) setGroupId(fallback);
    }
  }, [params]);

  // 2. جلب هوية المستخدم وبيانات العقدة مع فحص الصلاحيات
  useEffect(() => {
    if (!groupId || !COL?.USERS) return;

    const unsubAuth = auth.onAuthStateChanged(async (u) => {
      if (u) {
        try {
          const userSnap = await getDoc(doc(firestore, COL.USERS, u.uid));
          const userData = userSnap.exists() ? userSnap.data() : null;
          setCurrentUser(userData);

          const gSnap = await getDoc(doc(firestore, COL.GROUPS, groupId));
          if (gSnap.exists()) {
            const groupData = gSnap.data();
            const isAdmin = userData?.role === 'admin';
            const isMember = groupData.members?.includes(u.uid);

            // السماح بالدخول إذا كان عضواً أو أدمناً
            if (isMember || isAdmin) {
              setGroup({ id: gSnap.id, ...groupData });
            } else {
              // إذا لم يكن أدمناً ولا عضواً، يتم توجيهه للخارج
              router.push("/hub");
            }
          } else {
            router.push("/hub"); // المجموعة غير موجودة
          }
        } catch (e) {
          console.error("Access Error:", e);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/auth");
      }
    });
    return () => unsubAuth();
  }, [groupId, router]);

  // 3. مزامنة الرسائل لحظياً
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(firestore, COL.GROUPS, groupId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => setAllMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [groupId]);

  // 4. مزامنة طلبات الانضمام (للقائد والأدمن)
  useEffect(() => {
    const isAdmin = currentUser?.role === 'admin';
    const isLeader = currentUser?.uid === group?.leaderId;

    if (!groupId || (!isLeader && !isAdmin)) return;

    const q = query(collection(firestore, COL.JOIN_REQUESTS), where("groupId", "==", groupId), where("status", "==", "pending"));
    return onSnapshot(q, (snap) => setJoinRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [groupId, currentUser, group]);

  // ─── منطق الصلاحيات والفلترة ───
  const isLeader = currentUser?.uid === group?.leaderId;
  const isAdmin = currentUser?.role === 'admin';
  const hasControlPower = isLeader || isAdmin; // القائد والأدمن يملكون حق التحكم

  const approvedMessages = allMessages.filter(m =>
    m.moderationStatus !== "pending" || m.uid === currentUser?.uid || hasControlPower
  );

  const pendingCount = joinRequests.length + allMessages.filter(m => m.moderationStatus === "pending").length;

  // ─── العمليات (Actions) ───
  const handleReaction = async (msgId, emoji) => {
    const msgRef = doc(firestore, COL.GROUPS, groupId, "messages", msgId);
    const msg = allMessages.find(m => m.id === msgId);
    const hasReacted = msg?.reactions?.[emoji]?.includes(auth.currentUser.uid);

    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: hasReacted ? arrayRemove(auth.currentUser.uid) : arrayUnion(auth.currentUser.uid)
    });
  };

  const handleSend = async (text, file = null) => {
    // الملفات تُعتمد فوراً إذا أرسلها القائد أو الأدمن
    const moderationStatus = file ? (hasControlPower ? "approved" : "pending") : "approved";

    await addDoc(collection(firestore, COL.GROUPS, groupId, "messages"), {
      uid: auth.currentUser.uid,
      authorName: currentUser?.fullName || "Scholar",
      text: text || "",
      file,
      replyTo: replyTo ? {
        id: replyTo.id,
        text: replyTo.text,
        userName: replyTo.authorName || replyTo.userName
      } : null,
      reactions: {},
      moderationStatus,
      createdAt: serverTimestamp()
    });

    setReplyTo(null);
    if (moderationStatus === "pending") showToast("Asset sent to Overseer for verification.");
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <Loader2 size={40} className="text-brand-indigo animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-700">Connecting to Node</p>
    </div>
  );

  return (
    <div dir="ltr" className="min-h-screen bg-[#050505] text-[#F9FAFB] flex flex-col font-sans relative overflow-hidden">

      {/* ─── نظام التنبيهات (Toast) ─── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ opacity: 0 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-brand-indigo text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-glow flex items-center gap-2">
            <ShieldCheck size={14} /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── الشريط العلوي (Global Back + Header) ─── */}
      <div className="sticky top-0 z-30 flex items-center bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={() => router.push('/hub')} className="ml-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border-none cursor-pointer shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <ChatHeader
            roomData={group}
            isLeader={hasControlPower} // الأدمن يرى خيارات التحكم أيضاً
            pendingCount={pendingCount}
            onOpenModeration={() => setShowModeration(true)}
            onOpenSettings={() => setShowSettings(true)}
            onToggleResources={() => setShowResources(!showResources)}
            onOpenMembers={() => setShowMembersPanel(true)}
          />
        </div>
      </div>

      {/* ─── مساحة العمل الرئيسية (Sidebar + Chat) ─── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* شريط الملفات الأيسر */}
        <ResourcesSidebar
          isOpen={showResources}
          onClose={() => setShowResources(false)}
          messages={allMessages}
        />

        {/* منطقة الدردشة (الوسط) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
          <MessageList
            messages={approvedMessages}
            currentUser={currentUser}
            onReaction={handleReaction}
            isUploading={uploading}
            setReplyTo={setReplyTo}
          />

          <MessageInput
            onSend={handleSend}
            upload={upload}
            uploading={uploading}
            groupId={groupId}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
          />
        </div>
      </div>

      {/* ─── لوحات التحكم المتداخلة ─── */}

      {/* 1. لوحة الموافقات (للقائد والأدمن) */}
      {hasControlPower && (
        <ModerationPanel
          showModeration={showModeration}
          setShowModeration={setShowModeration}
          pendingMessages={allMessages.filter(m => m.moderationStatus === "pending")}
          joinRequests={joinRequests}
          id={groupId}
          setToast={showToast}
        />
      )}

      {/* 2. لوحة إعدادات المجموعة (للقائد والأدمن) */}
      {hasControlPower && (
        <GroupSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          groupData={group}
          setToast={showToast}
        />
      )}

      {/* 3. قائمة الأعضاء (للجميع) */}
      <GroupMembers
        isOpen={showMembersPanel}
        onClose={() => setShowMembersPanel(false)}
        group={group}
        isLeader={hasControlPower}
        setToast={showToast}
      />

    </div>
  );
}