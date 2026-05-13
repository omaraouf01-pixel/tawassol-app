import { useState, useEffect } from "react";
import { firestore as db } from "./firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export function useJoinRequests(groupId, isLeader) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // 1. حماية: إذا لم يكن هناك معرف مجموعة أو لم يكن المستخدم قائداً، لا تفعل شيئاً
    if (!groupId || !isLeader) {
      setRequests([]);
      return;
    }

    // 2. بناء الاستعلام من Firestore مباشرة
    const q = query(
      collection(db, "join-requests"),
      where("groupId", "==", groupId),
      where("status", "==", "pending")
    );

    // 3. الاستماع اللحظي (Real-time)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
    }, (error) => {
      console.error("❌ خطأ Firestore:", error);
    });

    return () => unsubscribe();
  }, [groupId, isLeader]);

  return { requests, pendingCount: requests.length };
}