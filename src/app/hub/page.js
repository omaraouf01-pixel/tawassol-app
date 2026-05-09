"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSend, FiHeart, FiMessageCircle, FiBell,
  FiTrendingUp, FiBookOpen, FiRefreshCw,
  FiCompass, FiUsers, FiArrowRight,
} from "react-icons/fi";
import Sidebar from "@/components/Sidebar";
import DiscoveryGrid from "@/components/DiscoveryGrid";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "@/lib/apiClient";
import { useAllGroups } from "@/lib/useAllGroups";

/* ════════════════════════════════════════════════════════════════════
   HUB PAGE — Polling MongoDB toutes les 5s (zéro Firestore)
══════════════════════════════════════════════════════════════════════ */

const POLL_MS = 5000;

const TAGS = ["General", "Question", "Reminder", "Tip", "Milestone"];
const TAG_STYLE = {
  General: "bg-white/5 text-slate-300 border-white/10",
  Question: "bg-amber-500/10 text-amber-300 border-amber-400/30",
  Reminder: "bg-rose-500/10 text-rose-300 border-rose-400/30",
  Tip: "bg-blue-500/10 text-blue-300 border-blue-400/30",
  Milestone: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30",
};

export default function HubPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [selectedTag, setSelectedTag] = useState("General");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Discovery: fetch all groups for the discovery grid
  const { groups: allGroups, currentUid, isEmpty } = useAllGroups();

  // ── Auth ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setCurrentUser(u);
      try {
        const data = await api("/api/user/profile");
        setUserData(data);
      } catch { }
    });
    return unsub;
  }, []);

  // ── GET public : tous les posts (polling 5s) ──
  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts?limit=50");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      console.error("[hub] fetch posts", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const id = setInterval(fetchPosts, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // ── POST : créer un post (auth requis) ──
  const submitPost = async () => {
    if (!postText.trim() || !currentUser || posting) return;
    const text = postText.trim();
    setPostText("");
    setPosting(true);
    try {
      const newPost = await api("/api/posts", {
        method: "POST",
        body: { text, tag: selectedTag },
      });
      setPosts((prev) => [newPost, ...prev]);
      setSelectedTag("General");
    } catch (e) {
      console.error("[hub] submit", e);
    } finally {
      setPosting(false);
    }
  };

  // ── POST : toggle like (auth requis) ──
  const toggleLike = async (post) => {
    if (!currentUser) return;
    const liked = post.likes?.includes(currentUser.uid);
    // Optimistic
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likes: liked ? p.likes.filter((u) => u !== currentUser.uid) : [...(p.likes || []), currentUser.uid] }
          : p
      )
    );
    try {
      await api(`/api/posts/${post.id}/like`, { method: "POST" });
    } catch { }
  };

  const displayName = userData?.fullName || currentUser?.email?.split("@")[0] || "Vous";

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[5%] right-[-10%] w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px]" />
      </div>

      <Sidebar />

      <main className="ml-60 flex-1 p-8 flex gap-7 justify-center">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Hub Étudiant</h2>
              <p className="text-sm text-slate-400 mt-0.5">Partagez questions, astuces et étapes franchies</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 px-3 py-2 rounded-xl backdrop-blur-sm">
              <FiRefreshCw size={12} className="text-emerald-400" />
              Auto-refresh 5s
            </div>
          </div>

          {/* Composer */}
          <div className="bg-white/[0.04] rounded-3xl border border-white/10 backdrop-blur-md p-5 mb-6">
            <div className="flex gap-3 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-violet-500/40 ring-1 ring-white/20">
                {displayName[0]?.toUpperCase()}
              </div>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Partagez une question, une ressource ou une mise à jour..."
                rows={2}
                className="flex-1 resize-none bg-transparent outline-none text-sm text-white placeholder:text-slate-500 pt-1.5 leading-relaxed"
              />
            </div>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${selectedTag === tag
                      ? TAG_STYLE[tag] + " ring-2 ring-offset-2 ring-offset-slate-950 ring-violet-500/50"
                      : "bg-white/5 text-slate-500 border-white/10 hover:border-white/20"
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex justify-end border-t border-white/10 pt-3">
              <button
                onClick={submitPost}
                disabled={!postText.trim() || posting}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-violet-500/40 ring-1 ring-white/20 hover:from-blue-400 hover:to-violet-500 transition-all active:scale-95 disabled:opacity-40"
              >
                Publier <FiSend size={13} />
              </button>
            </div>
          </div>

          {/* Posts list */}
          <div className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}
            <AnimatePresence>
              {posts.map((post, i) => {
                const liked = post.likes?.includes(currentUser?.uid);
                const time = post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                  : null;
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i < 5 ? i * 0.05 : 0 }}
                    className="bg-white/[0.04] rounded-3xl border border-white/10 backdrop-blur-md p-5 hover:bg-white/[0.06] hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-lg shadow-violet-500/30 ring-1 ring-white/20">
                          {post.authorName?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{post.authorName}</p>
                          <p className="text-xs text-slate-500">{time || "À l'instant"}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${TAG_STYLE[post.tag] || TAG_STYLE.General}`}>
                        {post.tag}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed mb-4">{post.text}</p>
                    <div className="flex items-center gap-4 border-t border-white/10 pt-3">
                      <button
                        onClick={() => toggleLike(post)}
                        className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-rose-400" : "text-slate-500 hover:text-rose-400"}`}
                      >
                        <FiHeart size={15} className={liked ? "fill-rose-400" : ""} />
                        {post.likes?.length || 0}
                      </button>
                      <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-400 transition-colors">
                        <FiMessageCircle size={15} />
                        Répondre
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {!loading && posts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md p-10 text-center overflow-hidden"
              >
                {/* Ambient glow */}
                <div aria-hidden className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="relative mx-auto mb-5 w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center"
                >
                  <FiCompass size={36} className="text-indigo-400" />
                  {/* Pulse ring */}
                  <span className="absolute inset-0 rounded-2xl border border-indigo-400/30 animate-ping opacity-20" />
                </motion.div>

                {/* Text */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  <h3 className="text-lg font-black text-white mb-2">Your feed is currently quiet.</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto mb-6">
                    Join a study circle or explore the platform to start seeing updates here.
                  </p>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                >
                  <button
                    onClick={() => router.push("/explore")}
                    className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-[32px] bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold hover:from-indigo-400 hover:to-violet-500 active:scale-[0.97] transition-all shadow-lg shadow-indigo-500/30 ring-1 ring-white/20"
                  >
                    <span aria-hidden className="absolute -inset-1 bg-indigo-500 blur-xl opacity-30 group-hover:opacity-50 transition-opacity rounded-full" />
                    <span className="relative flex items-center gap-2">
                      Explore Circles
                      <FiArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-80 flex-shrink-0 hidden xl:block">
          <div className="sticky top-8 space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-white/10 backdrop-blur-md p-5 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/30 rounded-full blur-3xl" />
              <div className="relative">
                <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center mb-3 ring-1 ring-white/20">
                  <FiBookOpen size={17} className="text-white" />
                </div>
                <h3 className="font-bold text-sm mb-1 text-white">Créer un groupe d&apos;étude</h3>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">Rassemblez vos camarades et collaborez en temps réel.</p>
                <a href="/groups/create" className="block text-center bg-white text-slate-900 font-bold text-xs py-2.5 rounded-xl hover:bg-blue-50 transition-all">
                  Créer un groupe →
                </a>
              </div>
            </div>
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md p-5">
              <div className="flex items-center gap-2 mb-3">
                <FiTrendingUp size={14} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Tags populaires</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {["#Algorithmes", "#Examen", "#Python", "#DataScience", "#Astuces"].map((tag) => (
                  <span key={tag} className="text-[11px] font-semibold bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full hover:bg-violet-500/20 hover:border-violet-400/40 hover:text-violet-200 cursor-pointer transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Active Circles */}
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md p-5">
              <div className="flex items-center gap-2 mb-3">
                <FiUsers size={14} className="text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Active Circles</h3>
              </div>
              {allGroups.filter((g) => g.members?.includes(currentUid)).length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="py-3"
                >
                  <p className="text-xs italic text-slate-400 mb-2">No active circles yet.</p>
                  <button
                    onClick={() => router.push("/explore")}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-2 transition-colors"
                  >
                    + Find a group to join
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {allGroups
                    .filter((g) => g.members?.includes(currentUid))
                    .slice(0, 5)
                    .map((g, i) => (
                      <motion.button
                        key={g.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => router.push(`/hub/chat/${g.id}`)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-colors text-left group"
                      >
                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black ring-1 ring-white/20 shrink-0">
                          {g.name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{g.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{g.subject}</p>
                        </div>
                        <FiArrowRight size={10} className="text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                      </motion.button>
                    ))}
                </div>
              )}
            </div>

            {/* Discovery Grid */}
            <DiscoveryGrid
              groups={allGroups}
              currentUid={currentUid}
              maxCards={4}
              compact
              isEmpty={isEmpty}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
