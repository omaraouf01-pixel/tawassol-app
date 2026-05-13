"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Send, Sparkles, PenTool, Users, Compass,
  Paperclip, FileText, X, Loader2,
  Heart, MessageCircle, MoreHorizontal
} from "lucide-react";

// ─── الاستيرادات الأساسية ───
import { auth, firestore } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, where
} from "firebase/firestore";
import { COL } from "@/lib/collections";
import { useFileUpload } from "@/lib/useFileUpload";

// ─── المكونات الخارجية ───
import Sidebar from "@/components/Sidebar";
import TsswalLogo from "@/components/TsswalLogo";
import ActiveNodesSidebar from "@/components/chat/ActiveNodesSidebar";

/**
 * مكون فرعي لعرض الردود الأكاديمية (التعليقات)
 */
function PostComments({ postId }) {
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    const q = query(collection(firestore, COL.POSTS, postId, "replies"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [postId]);

  return (
    <div className="mt-6 space-y-4 px-4 border-l border-white/5 ml-4 text-left">
      {replies.map((reply) => (
        <div key={reply.id} className="animate-in fade-in slide-in-from-left-2 duration-500">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black text-brand-indigo uppercase tracking-widest">
              {reply.authorName}
            </span>
          </div>
          <p className="text-[12px] text-slate-400 font-serif italic leading-relaxed">{reply.text}</p>
        </div>
      ))}
    </div>
  );
}

export default function HubPage() {
  const router = useRouter();
  const { upload, uploading } = useFileUpload();

  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [userNodes, setUserNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState(true);

  // حالات النشر (Composer)
  const [postText, setPostText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // حالات التعليق
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");

  const fileInputRef = useRef(null);

  // 1. التحقق من الهوية (Identity Sync)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userSnap = await getDoc(doc(firestore, COL.USERS, u.uid));
        if (userSnap.exists() && userSnap.data().status === "active") {
          setCurrentUser({ id: u.uid, uid: u.uid, ...userSnap.data() });
          setLoading(false);
        } else {
          router.push("/pending");
        }
      } else {
        router.push("/auth");
      }
    });
    return unsub;
  }, [router]);

  // 2. مزامنة البث العام (Broadcast Stream)
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(firestore, COL.POSTS), orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubPosts();
  }, [currentUser]);

  // 3. مزامنة العقد النشطة (Active Nodes Sync)
  useEffect(() => {
    const currentId = currentUser?.uid || currentUser?.id;
    if (!currentId) return;

    const q = query(
      collection(firestore, COL.GROUPS),
      where("members", "array-contains", currentId) // ✅ التصحيح هنا
    );

    const unsubNodes = onSnapshot(q,
      (snap) => {
        setUserNodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingNodes(false);
      },
      (error) => {
        console.error("Nodes Sync Error:", error);
        setLoadingNodes(false);
      }
    );

    return () => unsubNodes();
  }, [currentUser]);

  // 4. منطق الإعجاب
  const handleLike = async (postId, likesArray) => {
    const postRef = doc(firestore, COL.POSTS, postId);
    const isLiked = likesArray?.includes(currentUser.id);
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id)
    });
  };

  // 5. إرسال رد أكاديمي
  const handleSendComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      await addDoc(collection(firestore, COL.POSTS, postId, "replies"), {
        uid: currentUser.id,
        authorName: currentUser.fullName,
        text: commentText,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(firestore, COL.POSTS, postId), { repliesCount: increment(1) });
      setCommentText("");
    } catch (e) { console.error(e); }
  };

  // 6. بث منشور جديد
  const handleBroadcast = async () => {
    if ((!postText.trim() && !attachedFile) || isBroadcasting) return;
    setIsBroadcasting(true);
    try {
      let fileData = null;
      if (attachedFile) {
        const uploadResult = await upload(attachedFile, "tawassol/posts");
        fileData = { url: uploadResult.url, name: attachedFile.name, type: attachedFile.type };
      }
      await addDoc(collection(firestore, COL.POSTS), {
        uid: currentUser.id,
        authorName: currentUser.fullName,
        authorPic: currentUser.profilePicUrl || currentUser.avatarUrl || "",
        major: currentUser.major || currentUser.department || "",
        text: postText,
        file: fileData,
        likes: [],
        repliesCount: 0,
        createdAt: serverTimestamp(),
      });
      setPostText("");
      setAttachedFile(null);
    } catch (e) { console.error(e); } finally { setIsBroadcasting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <TsswalLogo size={40} className="animate-pulse" />
    </div>
  );

  return (
    <div dir="ltr" className="min-h-screen bg-[#050505] text-[#F9FAFB] font-sans selection:bg-brand-indigo/30 relative flex overflow-hidden">

      <Sidebar currentUser={currentUser} />

      <main className="flex-1 lg:ml-[280px] px-6 py-10 lg:px-16 flex flex-col xl:flex-row justify-between relative z-10 overflow-y-auto custom-scrollbar h-screen text-left">

        <div className="flex-1 max-w-[680px] pb-32">
          <header className="mb-10">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-[38px] xl:text-[48px] font-serif font-black italic tracking-tighter leading-none text-white">The Hub.</h1>
              <div className="flex items-center gap-3 mt-3">
                <div className="h-[1px] w-6 bg-brand-indigo/40" />
                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.4em]">Central Node: {currentUser?.university}</p>
              </div>
            </motion.div>
          </header>

          {/* Composer Section */}
          <section className="bg-[#0A0A0B] border border-white/5 rounded-[2rem] p-6 mb-12 focus-within:border-white/10 transition-all shadow-premium">
            <div className="flex gap-5">
              <div className="w-10 h-10 shrink-0 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center italic text-xs">
                {currentUser?.profilePicUrl ? (
                  <img src={currentUser.profilePicUrl} className="w-full h-full object-cover" />
                ) : currentUser?.fullName?.[0]}
              </div>
              <div className="flex-1 flex flex-col text-left">
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="What's on your academic mind?"
                  className="w-full bg-transparent border-none outline-none text-[16px] font-serif italic text-slate-200 placeholder:text-slate-900 resize-none min-h-[60px]"
                />
                <AnimatePresence>
                  {attachedFile && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mt-4 p-2 bg-white/5 border border-white/5 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-brand-indigo" />
                        <span className="text-[9px] font-bold text-slate-500 truncate max-w-[180px]">{attachedFile.name}</span>
                      </div>
                      <button onClick={() => setAttachedFile(null)} className="text-slate-600 hover:text-white bg-transparent border-none cursor-pointer"><X size={12} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <div className="flex gap-1">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setAttachedFile(e.target.files[0])} />
                    <button onClick={() => fileInputRef.current.click()} className="p-2.5 text-slate-600 hover:text-brand-indigo rounded-lg transition-all bg-transparent border-none cursor-pointer"><Paperclip size={16} /></button>
                  </div>
                  <button onClick={handleBroadcast} disabled={isBroadcasting || uploading} className="bg-white text-black px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-glow hover:bg-brand-indigo hover:text-white transition-all border-none cursor-pointer disabled:opacity-20">
                    {isBroadcasting || uploading ? <Loader2 size={12} className="animate-spin" /> : "Broadcast"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Broadcast List */}
          <section className="space-y-6">
            <AnimatePresence mode="popLayout">
              {posts.map((post) => {
                const isLiked = post.likes?.includes(currentUser?.id);
                return (
                  <motion.article key={post.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0A0A0B] border border-white/5 rounded-[2rem] p-8 hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center text-xs italic">{post.authorPic ? <img src={post.authorPic} className="w-full h-full object-cover" /> : post.authorName?.[0]}</div>
                        <div>
                          <p className="font-bold text-[12px] text-white leading-none">{post.authorName}</p>
                          <p className="text-[7px] text-slate-600 font-bold uppercase tracking-widest mt-1">{post.major}</p>
                        </div>
                      </div>
                      <MoreHorizontal size={16} className="text-slate-800" />
                    </div>
                    <p className="text-md font-serif italic text-slate-300 whitespace-pre-wrap mb-6 text-left">{post.text}</p>
                    {post.file && (
                      <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center gap-4 mb-6">
                        <FileText className="text-brand-indigo" size={20} />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[9px] font-black text-white uppercase truncate">{post.file.name}</p>
                          <a href={post.file.url} target="_blank" className="text-[7px] text-brand-indigo font-bold uppercase no-underline hover:underline">Download Resource</a>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-6 mt-4 pt-6 border-t border-white/5">
                      <button onClick={() => handleLike(post.id, post.likes)} className={`flex items-center gap-2 text-[9px] font-black uppercase bg-transparent border-none cursor-pointer ${isLiked ? 'text-rose-500' : 'text-slate-700 hover:text-rose-500'}`}>
                        <Heart size={14} fill={isLiked ? "currentColor" : "none"} /> {post.likes?.length || 0}
                      </button>
                      <button onClick={() => setActiveCommentId(activeCommentId === post.id ? null : post.id)} className="flex items-center gap-2 text-[9px] font-black text-slate-700 hover:text-brand-indigo bg-transparent border-none cursor-pointer uppercase tracking-widest">
                        <MessageCircle size={14} /> {post.repliesCount || 0} Replies
                      </button>
                    </div>
                    <AnimatePresence>
                      {activeCommentId === post.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <PostComments postId={post.id} />
                          <div className="mt-6 flex gap-2 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                            <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)} placeholder="Reply to node..." className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-[11px] text-white italic font-serif" />
                            <button onClick={() => handleSendComment(post.id)} className="w-8 h-8 bg-brand-indigo text-white rounded-lg flex items-center justify-center border-none cursor-pointer"><Send size={12} /></button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="hidden xl:flex flex-col w-[320px] sticky top-10 h-fit ml-auto">
          <ActiveNodesSidebar
            nodes={userNodes}
            currentUser={currentUser}
            loading={loadingNodes}
          />
        </aside>

      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.02); border-radius: 10px; }
      `}} />
    </div>
  );
}