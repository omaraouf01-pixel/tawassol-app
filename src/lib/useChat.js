"use client";

// ════════════════════════════════════════════════════════════════
// TAWASSOL — Real-time Chat Engine (useChat)
// ────────────────────────────────────────────────────────────────
// محرك المزامنة اللحظية الموحّد لشات العقدة الأكاديمية:
//  • مستمع رسائل (onSnapshot) مرتّب زمنياً تصاعدياً + تجميع.
//  • Optimistic UI لإرسال الرسائل قبل تأكيد السيرفر.
//  • مستمعات إدارية للمشرف فقط: طلبات الانضمام + الملفات المعلّقة.
//  • تنظيف كامل لكل القنوات عند مغادرة الشات (cleanup).
// ════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore as db } from "./firebase";
import { COL } from "./collectionNames";

const GROUPING_WINDOW_MS = 5 * 60 * 1000;

function toDate(ts) {
  if (!ts) return new Date();
  if (typeof ts?.toDate === "function") return ts.toDate();
  if (ts?.seconds) return new Date(ts.seconds * 1000);
  return ts instanceof Date ? ts : new Date(ts);
}

function applyGrouping(list) {
  return list.map((m, i) => {
    const prev = list[i - 1];
    const sameUser = prev && prev.uid === m.uid;
    const recent = prev && m.createdAt - prev.createdAt < GROUPING_WINDOW_MS;
    return { ...m, _grouped: !!(sameUser && recent) };
  });
}

export function useChat({ groupId, user, userData, group } = {}) {
  const isLeader = !!(group?.leaderId && user?.uid && group.leaderId === user.uid);
  const isAdmin = userData?.role === "admin";
  const canOverseer = isLeader || isAdmin;

  const [serverMessages, setServerMessages] = useState([]);
  const [optimistic, setOptimistic] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // مفاتيح الرسائل المرسلة مؤقتاً — للمطابقة عند وصول النسخة الحقيقية
  const sentKeys = useRef(new Map()); // key -> tempId

  // ── 1) مستمع الرسائل ───────────────────────────────────────
  // 🛡️ حارس: ننتظر اكتمال الـ Auth قبل ربط أي listener.
  useEffect(() => {
    if (!groupId || !user?.uid) {
      setServerMessages([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, COL.MESSAGES),
      where("groupId", "==", groupId),
      orderBy("createdAt", "asc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const raw = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: toDate(data.createdAt),
          };
        });

        // إزالة أي optimistic تأكّد وصوله من السيرفر (مطابقة uid + content)
        setOptimistic((prev) =>
          prev.filter((o) => {
            const matched = raw.some(
              (r) =>
                r.uid === o.uid &&
                (r.content || "") === (o.content || "") &&
                (r.fileUrl || null) === (o.fileUrl || null),
            );
            if (matched) sentKeys.current.delete(o.id);
            return !matched;
          }),
        );

        setServerMessages(raw);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("[useChat] messages listener failed:", err);
        setError(err?.message || "messages-failed");
        setLoading(false);
      },
    );

    return () => unsub();
  }, [groupId, user?.uid]);

  // ── 2) مستمع طلبات الانضمام (للمشرف فقط) ──────────────────
  useEffect(() => {
    if (!groupId || !canOverseer) {
      setJoinRequests([]);
      return;
    }
    const q = query(
      collection(db, COL.JOIN_REQUESTS),
      where("groupId", "==", groupId),
      where("status", "==", "pending"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setJoinRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("[useChat] join-requests listener failed:", err),
    );
    return () => unsub();
  }, [groupId, canOverseer]);

  // ── 3) مستمع الملفات المعلّقة (للمشرف فقط) ────────────────
  useEffect(() => {
    if (!groupId || !canOverseer) {
      setPendingFiles([]);
      return;
    }
    const q = query(
      collection(db, COL.MESSAGES),
      where("groupId", "==", groupId),
      where("moderationStatus", "==", "pending"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const files = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => m.fileUrl);
        setPendingFiles(files);
      },
      (err) => console.error("[useChat] pending-files listener failed:", err),
    );
    return () => unsub();
  }, [groupId, canOverseer]);

  // ── 4) إرسال رسالة (Optimistic UI) ─────────────────────────
  const sendMessage = useCallback(
    async ({
      content = "",
      fileUrl = null,
      fileName = null,
      fileType = null,
      fileSize = null,
    } = {}) => {
      const trimmed = (content || "").trim();
      if (!trimmed && !fileUrl) return;
      if (!user?.uid || !groupId) return;

      const isAuthorized = isLeader || isAdmin;
      const moderationStatus = fileUrl && !isAuthorized ? "pending" : "approved";

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const localMsg = {
        id: tempId,
        _optimistic: true,
        uid: user.uid,
        groupId,
        content: trimmed,
        senderName: userData?.fullName || "Scholar",
        role: userData?.role || "student",
        fileUrl,
        fileName,
        fileType,
        fileSize,
        moderationStatus,
        createdAt: new Date(),
      };

      sentKeys.current.set(tempId, true);
      setOptimistic((prev) => [...prev, localMsg]);

      try {
        await addDoc(collection(db, COL.MESSAGES), {
          groupId,
          uid: user.uid,
          content: trimmed,
          senderName: userData?.fullName || "Scholar",
          role: userData?.role || "student",
          fileUrl,
          fileName,
          fileType,
          fileSize,
          moderationStatus,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("[useChat] send failed:", err);
        setOptimistic((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, _failed: true } : m)),
        );
        throw err;
      }
    },
    [groupId, user?.uid, userData?.fullName, userData?.role, isLeader, isAdmin],
  );

  // ── 5) دمج رسائل السيرفر مع المؤقتة + تجميع + فلترة ذكية ──
  //   • في العقدة "المحمية": لا تظهر الملفات المعلّقة للأعضاء العاديين.
  //   • المشرف/الأدمن يرى كل شيء (مع شارة Pending Review).
  //   • صاحب الرسالة يرى ملفه دائماً (تجربة Optimistic).
  const isProtected = group?.accessType === "protected";
  const messages = useMemo(() => {
    const merged = [...serverMessages, ...optimistic].sort(
      (a, b) => a.createdAt - b.createdAt,
    );

    const filtered = merged.filter((m) => {
      if (!m.fileUrl) return true;                           // النصوص دائماً
      if (m.moderationStatus === "approved") return true;    // الملفات المعتمدة
      if (canOverseer) return true;                          // المشرف يرى المعلّق
      if (m.uid === user?.uid) return true;                  // صاحب الملف نفسه
      return !isProtected;                                   // العقدة المفتوحة تظهر المعلّق
    });

    return applyGrouping(filtered);
  }, [serverMessages, optimistic, canOverseer, isProtected, user?.uid]);

  return {
    // رسائل
    messages,
    loading,
    error,
    sendMessage,

    // لوحة الإشراف
    joinRequests,
    pendingFiles,
    pendingCount: joinRequests.length + pendingFiles.length,
    canOverseer,
  };
}

export default useChat;
