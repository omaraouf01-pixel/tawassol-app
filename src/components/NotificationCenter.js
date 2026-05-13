"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Circle, Clock, ArrowRight, Sparkles } from "lucide-react";
import { firestore } from "@/lib/firebase";
import {
    collection, query, where, orderBy, onSnapshot,
    updateDoc, doc, limit
} from "firebase/firestore";

export default function NotificationCenter({ currentUser }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // حساب الإشعارات غير المقروءة بناءً على حقل read
    const unreadCount = notifications.filter(n => n.read === false).length;

    useEffect(() => {
        if (!currentUser?.uid) return;

        // الاستعلام المعتمد على الفهرس الموجود في صورتك
        const q = query(
            collection(firestore, "notifications"),
            where("userId", "==", currentUser.uid),
            orderBy("createdAt", "desc"),
            limit(15)
        );

        const unsub = onSnapshot(q, (snap) => {
            setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            console.error("Signal Sync Error:", error);
        });

        return unsub;
    }, [currentUser]);

    // دالة المعالجة عند الضغط على الإشعار
    const handleNotificationClick = async (n) => {
        // 1. تحديث حالة القراءة في Firestore
        if (n.read === false) {
            try {
                await updateDoc(doc(firestore, "notifications", n.id), { read: true });
            } catch (err) {
                console.error("Update Read Status Error:", err);
            }
        }

        // 2. إغلاق القائمة
        setIsOpen(false);

        // 3. التوجيه للرابط المرفق بالإشعار (link)
        if (n.link) {
            router.push(n.link);
        }
    };

    return (
        <div className="relative">
            {/* زر الجرس التفاعلي */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer group hover:border-brand-indigo/30"
            >
                <Bell size={20} className={unreadCount > 0 ? "text-brand-indigo animate-pulse" : ""} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-indigo text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-glow border-2 border-[#050505]">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* غطاء خلفي شفاف لإغلاق القائمة عند الضغط خارجها */}
                        <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-80 bg-[#0A0A0B] border border-white/10 rounded-[2rem] shadow-premium z-50 overflow-hidden text-left"
                        >
                            {/* ترويسة قائمة الإشعارات */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-2">
                                    <Sparkles size={12} className="text-brand-indigo" /> Academic Signals
                                </h3>
                                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                    {unreadCount} New
                                </span>
                            </div>

                            {/* قائمة الإشعارات المستلمة */}
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-16 text-center opacity-20 flex flex-col items-center gap-3">
                                        <BellOff size={24} />
                                        <p className="text-[9px] font-black uppercase tracking-widest">No signals detected.</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`p-5 border-b border-white/[0.02] flex gap-4 transition-all cursor-pointer hover:bg-white/[0.03] group relative ${n.read === false ? 'bg-brand-indigo/[0.04]' : 'opacity-60'}`}
                                        >
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {n.read === false && <Circle size={6} className="fill-brand-indigo text-brand-indigo animate-pulse" />}
                                                    <p className="text-[11px] font-bold text-white uppercase tracking-wider">{n.title}</p>
                                                </div>
                                                <p className="text-[12px] text-slate-400 font-serif italic leading-relaxed line-clamp-2">
                                                    {n.body}
                                                </p>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <Clock size={8} className="text-slate-700" />
                                                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter">
                                                        {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending...'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight size={14} className="text-brand-indigo" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-white/[0.01] text-center border-t border-white/5">
                                <button className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                                    Network History
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
} "use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Circle, Clock, ArrowRight, Sparkles } from "lucide-react";
import { firestore } from "@/lib/firebase";
import {
    collection, query, where, orderBy, onSnapshot,
    updateDoc, doc, limit
} from "firebase/firestore";

export default function NotificationCenter({ currentUser }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // حساب الإشعارات غير المقروءة بناءً على حقل read
    const unreadCount = notifications.filter(n => n.read === false).length;

    useEffect(() => {
        if (!currentUser?.uid) return;

        // الاستعلام المعتمد على الفهرس الموجود في صورتك
        const q = query(
            collection(firestore, "notifications"),
            where("userId", "==", currentUser.uid),
            orderBy("createdAt", "desc"),
            limit(15)
        );

        const unsub = onSnapshot(q, (snap) => {
            setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => {
            console.error("Signal Sync Error:", error);
        });

        return unsub;
    }, [currentUser]);

    // دالة المعالجة عند الضغط على الإشعار
    const handleNotificationClick = async (n) => {
        // 1. تحديث حالة القراءة في Firestore
        if (n.read === false) {
            try {
                await updateDoc(doc(firestore, "notifications", n.id), { read: true });
            } catch (err) {
                console.error("Update Read Status Error:", err);
            }
        }

        // 2. إغلاق القائمة
        setIsOpen(false);

        // 3. التوجيه للرابط المرفق بالإشعار (link)
        if (n.link) {
            router.push(n.link);
        }
    };

    return (
        <div className="relative">
            {/* زر الجرس التفاعلي */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer group hover:border-brand-indigo/30"
            >
                <Bell size={20} className={unreadCount > 0 ? "text-brand-indigo animate-pulse" : ""} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-indigo text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-glow border-2 border-[#050505]">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* غطاء خلفي شفاف لإغلاق القائمة عند الضغط خارجها */}
                        <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-80 bg-[#0A0A0B] border border-white/10 rounded-[2rem] shadow-premium z-50 overflow-hidden text-left"
                        >
                            {/* ترويسة قائمة الإشعارات */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-2">
                                    <Sparkles size={12} className="text-brand-indigo" /> Academic Signals
                                </h3>
                                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                    {unreadCount} New
                                </span>
                            </div>

                            {/* قائمة الإشعارات المستلمة */}
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-16 text-center opacity-20 flex flex-col items-center gap-3">
                                        <BellOff size={24} />
                                        <p className="text-[9px] font-black uppercase tracking-widest">No signals detected.</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`p-5 border-b border-white/[0.02] flex gap-4 transition-all cursor-pointer hover:bg-white/[0.03] group relative ${n.read === false ? 'bg-brand-indigo/[0.04]' : 'opacity-60'}`}
                                        >
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {n.read === false && <Circle size={6} className="fill-brand-indigo text-brand-indigo animate-pulse" />}
                                                    <p className="text-[11px] font-bold text-white uppercase tracking-wider">{n.title}</p>
                                                </div>
                                                <p className="text-[12px] text-slate-400 font-serif italic leading-relaxed line-clamp-2">
                                                    {n.body}
                                                </p>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <Clock size={8} className="text-slate-700" />
                                                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter">
                                                        {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending...'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight size={14} className="text-brand-indigo" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-white/[0.01] text-center border-t border-white/5">
                                <button className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                                    Network History
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}