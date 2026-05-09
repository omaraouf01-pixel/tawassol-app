"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSend, FiArrowLeft, FiUsers, FiX, FiMessageSquare,
  FiFileText, FiDownload, FiPaperclip, FiSettings,
  FiCheck, FiClock, FiUserX, FiUserPlus, FiSearch,
  FiSmile, FiInfo, FiCamera, FiFile,
} from "react-icons/fi";
import dynamic from "next/dynamic";
import TsswalLogo from "@/components/TsswalLogo";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "@/lib/apiClient";
import { useMessages } from "@/lib/useMessages";
import { notify } from "@/lib/notify";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

/* ════════════════════════════════════════════════════════════════════
   CHAT PAGE — Architecture REAL-TIME (Firestore onSnapshot)
   ───────────────────────────────────────────────────────────────────
   • Messages : useMessages(groupId) → onSnapshot listener
   • Envoi    : POST /api/groups/[id]/messages
   • Upload   : POST /api/upload (Cloudinary) → secure_url
   • Group    : REST sur Firestore via API routes
══════════════════════════════════════════════════════════════════════ */

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();

  // ─── Auth + profile ───
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);

  // ─── Real-time messages (replaces polling) ───
  const { messages, loading: messagesLoading } = useMessages(id);

  // ─── Group data ───
  const [roomData, setRoomData] = useState(null);
  const [resources, setResources] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);

  // ─── UX ───
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const messagesEndRef = useRef(null);
  const resourceInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ─── 1. Auth + profile ────────────────────────────────────────────
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/auth"); return; }
      setCurrentUser(u);
      try {
        const profile = await api("/api/user/profile");
        setUserData(profile);
      } catch (e) {
        console.error("[profile]", e);
      }
    });
  }, [router]);

  // ─── 2. REST loaders ─────────────────────────────────────────────
  const loadGroup = async () => {
    try {
      const data = await api(`/api/groups/${id}`);
      setRoomData(data);
    } catch (e) {
      if (e.message?.includes("Forbidden")) setAccessDenied(true);
    }
  };

  const loadResources = async () => {
    try {
      const { resources } = await api(`/api/groups/${id}/resources`);
      setResources(resources || []);
    } catch {}
  };

  const loadJoinRequests = async () => {
    if (!roomData || roomData.leaderId !== currentUser?.uid) return;
    try {
      const { requests } = await api(`/api/groups/${id}/join-requests`);
      setJoinRequests(requests || []);
    } catch {}
  };

  // ─── 3. Initial load ─────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !id) return;
    loadGroup();
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser]);

  useEffect(() => {
    loadJoinRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData, currentUser]);

  // ─── 4. Auto-scroll on new messages ──────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── 5. Membership check ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !roomData) return;
    const isMember = (roomData.members || []).includes(currentUser.uid);
    const isAdmin = userData?.role === "admin";
    setAccessDenied(!isMember && !isAdmin);
  }, [currentUser, roomData, userData]);

  const isLeader = roomData?.leaderId === currentUser?.uid;
  const members = roomData?.membersList || [];
  const pendingResources = resources.filter((r) => r.status === "pending");

  const visibleMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) => m.text?.toLowerCase().includes(q) || m.userName?.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const groupedMessages = useMemo(() => {
    return visibleMessages.map((m, i) => {
      const prev = visibleMessages[i - 1];
      const sameAuthor = prev && prev.uid === m.uid;
      const closeInTime =
        prev && m.createdAt && prev.createdAt &&
        Math.abs(new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 60000;
      return { ...m, _grouped: sameAuthor && closeInTime };
    });
  }, [visibleMessages]);

  /* ═════════ ACTIONS ═════════ */

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentUser || sending) return;
    const text = message.trim();
    setMessage("");
    setSending(true);
    try {
      await api(`/api/groups/${id}/messages`, {
        method: "POST",
        body: {
          text,
          replyTo: replyTo
            ? {
                id: replyTo.id,
                text: replyTo.text?.slice(0, 100) ||
                      (replyTo.imageUrl ? "📷 Image" :
                       replyTo.fileUrl ? `📎 ${replyTo.fileName || "Fichier"}` : ""),
                userName: replyTo.userName,
              }
            : null,
        },
      });
      // Le listener onSnapshot ajoutera le message automatiquement
      setReplyTo(null);
    } catch (err) {
      console.error("[send]", err);
    } finally {
      setSending(false);
    }
  };

  // Image inline (rendue dans la bulle)
  const handleImageSend = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setSendingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", `tawassol/groups/${id}/images`);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const imageUrl = data.url || data.secure_url; // tolère les 2 formats
      await api(`/api/groups/${id}/messages`, {
        method: "POST",
        body: { text: "", imageUrl },
      });
    } catch (err) {
      console.error("[image send]", err);
    } finally {
      setSendingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // Fichier générique (PDF, doc, etc.) joint à un message
  const handleFileSend = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setSendingFile(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", `tawassol/groups/${id}/files`);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const fileUrl = data.url || data.secure_url;

      // Si c'est une image → on l'envoie comme imageUrl (rendu inline)
      const isImage = file.type.startsWith("image/");
      const payload = isImage
        ? { text: "", imageUrl: fileUrl }
        : {
            text: "",
            fileUrl,
            fileName: file.name,
            fileType: file.type,
          };
      await api(`/api/groups/${id}/messages`, {
        method: "POST",
        body: payload,
      });
    } catch (err) {
      console.error("[file send]", err);
    } finally {
      setSendingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Resource (sidebar — séparé des messages)
  const handleResourceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploadingResource(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", `tawassol/groups/${id}/resources`);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const data = await uploadRes.json();
      const url = data.url || data.secure_url;
      await api(`/api/groups/${id}/resources`, {
        method: "POST",
        body: { name: file.name, url },
      });
      await loadResources();
    } catch (err) {
      console.error("[resource upload]", err);
    } finally {
      setUploadingResource(false);
      if (resourceInputRef.current) resourceInputRef.current.value = "";
    }
  };

  const kickMember = async (uid) => {
    if (!confirm("Retirer ce membre du groupe ?")) return;
    try {
      await api(`/api/groups/${id}/members/${uid}`, { method: "DELETE" });
      await loadGroup();
    } catch (e) { alert(e.message); }
  };

  const approveResource = async (resId) => {
    await api(`/api/groups/${id}/resources/${resId}`, { method: "PATCH" });
    await loadResources();
  };
  const rejectResource = async (resId) => {
    await api(`/api/groups/${id}/resources/${resId}`, { method: "DELETE" });
    await loadResources();
  };

  const approveJoin = async (req) => {
    try {
      await api(`/api/groups/${id}/join-requests/${req.id}`, {
        method: "PATCH",
        body: { action: "approve" },
      });
      await Promise.all([loadGroup(), loadJoinRequests()]);
      await notify({
        userId: req.userId,
        title: "Demande acceptée ✅",
        body: `Bienvenue dans ${roomData?.name || "le groupe"} !`,
        link: `/hub/chat/${id}`,
      });
    } catch (e) { alert(e.message); }
  };
  const rejectJoin = async (req) => {
    try {
      await api(`/api/groups/${id}/join-requests/${req.id}`, {
        method: "PATCH",
        body: { action: "reject" },
      });
      await loadJoinRequests();
      await notify({
        userId: req.userId,
        title: "Demande refusée",
        body: `Votre demande pour ${roomData?.name || "le groupe"} a été refusée.`,
      });
    } catch (e) { alert(e.message); }
  };

  /* ═════════ RENDER ═════════ */

  if (accessDenied) {
    return (
      <div className="flex h-screen bg-[#0F172A] text-white items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center">
            <FiUserX size={28} className="text-rose-400" />
          </div>
          <h1 className="text-xl font-black">Accès refusé</h1>
          <p className="text-sm text-slate-400 max-w-xs">Vous n'êtes pas membre de ce groupe. Demandez à rejoindre depuis la page Explore.</p>
          <button onClick={() => router.push("/explore")}
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-sm font-bold transition-colors">
            Explorer les groupes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0F172A] text-white overflow-hidden relative">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px]" />
      </div>

      {/* ═══════ LEFT SIDEBAR — Resources ═══════ */}
      <aside className="w-72 bg-[#0F172A]/80 backdrop-blur-xl border-r border-white/10 hidden lg:flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <button
            onClick={() => router.push("/explore")}
            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
            aria-label="Retour"
          >
            <FiArrowLeft size={16} />
          </button>
          <TsswalLogo size={28} />
          <h2 className="font-bold text-sm text-white">Ressources</h2>
          {isLeader && pendingResources.length > 0 && (
            <span className="ml-auto bg-violet-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/50 animate-pulse">
              {pendingResources.length}
            </span>
          )}
        </div>

        {isLeader && pendingResources.length > 0 && (
          <div className="p-3 border-b border-white/10 space-y-2">
            <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
              <FiClock size={10} /> En attente
            </p>
            {pendingResources.map((file) => (
              <div key={file.id} className="p-3 bg-violet-500/10 rounded-2xl border border-violet-400/30">
                <div className="flex items-center gap-2 mb-1">
                  <FiFileText className="text-violet-300 shrink-0" size={12} />
                  <span className="text-[10px] font-bold text-white truncate">{file.name}</span>
                </div>
                <p className="text-[9px] text-slate-400 mb-2">par {file.uploader}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => approveResource(file.id)}
                    className="flex-1 py-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-lg text-[9px] font-black uppercase hover:opacity-90 ring-1 ring-white/20">
                    <FiCheck className="inline" /> OK
                  </button>
                  <button onClick={() => rejectResource(file.id)}
                    className="flex-1 py-1 bg-white/5 text-rose-300 border border-rose-400/30 rounded-lg text-[9px] font-black uppercase hover:bg-rose-500/10">
                    <FiX className="inline" /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {resources.filter((r) => r.status === "approved").length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              <FiFileText size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">Aucun document</p>
            </div>
          ) : (
            resources.filter((r) => r.status === "approved").map((file) => (
              <a key={file.id} href={file.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-indigo-400/30 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 ring-1 ring-white/20">
                  <FiFileText size={14} className="text-white" />
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-[11px] font-bold text-white truncate">{file.name}</p>
                  <p className="text-[9px] text-slate-500">par {file.uploader}</p>
                </div>
                <FiDownload className="text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" size={13} />
              </a>
            ))
          )}
        </div>

        <div className="p-3 border-t border-white/10">
          <input ref={resourceInputRef} type="file" className="hidden" onChange={handleResourceUpload} />
          <button onClick={() => resourceInputRef.current?.click()} disabled={uploadingResource}
            className="relative group w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            <span aria-hidden className="absolute -inset-1 bg-indigo-500 blur-md opacity-50 group-hover:opacity-90 transition-opacity rounded-xl" />
            <span className="relative flex items-center gap-2">
              <FiPaperclip size={13} /> {uploadingResource ? "Téléversement…" : "Téléverser"}
            </span>
          </button>
        </div>
      </aside>

      {/* ═══════ MAIN CHAT ═══════ */}
      <main className="flex-1 flex flex-col bg-[#0F172A]/40 backdrop-blur-sm min-w-0">
        <header className="border-b border-white/10 px-5 py-3 flex flex-col gap-3 bg-[#0F172A]/70 backdrop-blur-xl shrink-0">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-slate-400" onClick={() => router.push("/explore")}>
                <FiArrowLeft size={16} />
              </button>
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-indigo-500 blur-md opacity-40" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center ring-1 ring-white/20">
                  <FiUsers size={18} className="text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="font-black text-sm text-white truncate">{roomData?.name || "Groupe d'étude"}</h1>
                <p className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 text-emerald-400">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative rounded-full w-1.5 h-1.5 bg-emerald-400" />
                  </span>
                  {roomData?.memberCount || 0} membres · Live
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isLeader && joinRequests.length > 0 && (
                <button onClick={() => setShowRequests(true)}
                  className="relative p-2.5 text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-xl transition-all"
                  title="Demandes d'adhésion">
                  <FiUserPlus size={17} />
                  <span className="absolute top-0.5 right-0.5 bg-violet-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/50">
                    {joinRequests.length}
                  </span>
                </button>
              )}
              <button onClick={() => setShowMembers(true)}
                className="p-2.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-all" title="Membres">
                <FiUsers size={17} />
              </button>
              {isLeader && (
                <button onClick={() => setShowSettings(true)}
                  className="p-2.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-all" title="Paramètres">
                  <FiSettings size={17} />
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <FiSearch size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans la conversation…"
              className="w-full pl-10 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/10 transition-all" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <FiX size={13} />
              </button>
            )}
          </div>
        </header>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {messagesLoading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          )}
          {!messagesLoading && groupedMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
              <FiMessageSquare size={40} />
              <p className="text-sm font-semibold">
                {searchQuery ? "Aucun message ne correspond" : "Soyez le premier à envoyer un message"}
              </p>
            </div>
          )}
          {groupedMessages.map((msg) => {
            const isMe = msg.uid === currentUser?.uid;
            const time = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${msg._grouped ? "mt-0.5" : "mt-3"}`}>
                {!isMe && !msg._grouped && (
                  <div className="flex items-center gap-2 mb-1 ml-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-black ring-1 ring-white/20">
                      {msg.userName?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{msg.userName}</span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`group relative max-w-[75%] md:max-w-md px-4 py-2.5 text-[13.5px] font-medium leading-relaxed ${
                    isMe
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-tr-md shadow-lg shadow-indigo-500/30 ring-1 ring-white/15"
                      : "bg-white/[0.06] text-slate-100 rounded-2xl rounded-tl-md border border-white/10 backdrop-blur-sm"
                  }`}
                >
                  {msg.replyTo && (
                    <div className={`mb-2 pl-2 border-l-2 ${isMe ? "border-white/40" : "border-indigo-400/60"} text-[11px] opacity-80`}>
                      <p className="font-bold">{msg.replyTo.userName}</p>
                      <p className="truncate">{msg.replyTo.text}</p>
                    </div>
                  )}

                  {/* Image inline */}
                  {msg.imageUrl && (
                    <a href={msg.imageUrl} target="_blank" rel="noreferrer" className="block mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.imageUrl} alt="" className="rounded-xl max-w-full max-h-64 object-cover" loading="lazy" />
                    </a>
                  )}

                  {/* File attachment (PDF, doc, etc.) */}
                  {msg.fileUrl && (
                    <FileAttachment
                      url={msg.fileUrl}
                      name={msg.fileName}
                      type={msg.fileType}
                      isMe={isMe}
                    />
                  )}

                  {/* Text */}
                  {msg.text && (
                    <p className="whitespace-pre-wrap break-words">
                      {searchQuery ? <Highlight text={msg.text} q={searchQuery} /> : msg.text}
                    </p>
                  )}

                  <button onClick={() => setReplyTo(msg)}
                    className={`absolute ${isMe ? "-left-8" : "-right-8"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all`}
                    title="Répondre">
                    <FiMessageSquare size={11} />
                  </button>
                </motion.div>
                {time && !msg._grouped && (
                  <span className="text-[9px] text-slate-600 mt-1 mx-2 font-semibold tabular-nums">{time}</span>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="p-4 bg-[#0F172A]/70 border-t border-white/10 backdrop-blur-xl shrink-0">
          {replyTo && (
            <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border-l-2 border-indigo-400 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-indigo-300 uppercase">Répondre à {replyTo.userName}</p>
                <p className="text-xs text-slate-300 truncate">
                  {replyTo.text ||
                    (replyTo.imageUrl ? "📷 Image" :
                     replyTo.fileUrl ? `📎 ${replyTo.fileName || "Fichier"}` : "")}
                </p>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 text-slate-400 hover:text-white">
                <FiX size={14} />
              </button>
            </div>
          )}

          {/* Hidden inputs */}
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSend} />
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSend} />

          <form onSubmit={handleSend} className="flex items-end gap-2 max-w-3xl mx-auto">
            {/* 📎 Joindre fichier (PDF, doc, image, etc.) */}
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sendingFile}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-indigo-300 hover:border-indigo-400/30 transition-all shrink-0 disabled:opacity-50"
              title="Joindre un fichier" aria-label="Joindre un fichier">
              {sendingFile ? (
                <div className="w-[17px] h-[17px] border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
              ) : (
                <FiPaperclip size={17} />
              )}
            </button>

            {/* 📷 Image rapide */}
            <button type="button" onClick={() => imageInputRef.current?.click()} disabled={sendingImage}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-violet-300 hover:border-violet-400/30 transition-all shrink-0 disabled:opacity-50"
              title="Envoyer une image" aria-label="Envoyer une image">
              {sendingImage ? (
                <div className="w-[17px] h-[17px] border-2 border-violet-400/40 border-t-violet-400 rounded-full animate-spin" />
              ) : (
                <FiCamera size={17} />
              )}
            </button>

            <div className="flex-1 relative">
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrivez votre message…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-white placeholder:text-slate-500" />
              <button type="button" onClick={() => setShowEmoji(!showEmoji)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-300 transition-colors" aria-label="Emoji">
                <FiSmile size={15} />
              </button>
              {showEmoji && (
                <div className="absolute bottom-14 right-0 z-50">
                  <EmojiPicker theme="dark"
                    onEmojiClick={(e) => { setMessage((p) => p + e.emoji); setShowEmoji(false); }}
                    width={320} height={400} />
                </div>
              )}
            </div>

            <button type="submit" disabled={!message.trim() || sending}
              className="relative group p-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              aria-label="Envoyer">
              <span aria-hidden className="absolute -inset-0.5 bg-indigo-500 blur-md opacity-50 group-hover:opacity-90 transition-opacity rounded-xl" />
              <span className="relative">
                {sending ? (
                  <div className="w-[17px] h-[17px] border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiSend size={17} />
                )}
              </span>
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-slate-600">
            <FiInfo className="inline mr-1" size={10} />
            Conversation en temps réel · Firestore
          </p>
        </div>
      </main>

      {/* MEMBERS */}
      <AnimatePresence>
        {showMembers && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md p-4">
            <motion.div initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
              className="bg-[#0F172A] border border-white/10 w-72 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-5 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-sm text-white uppercase tracking-wide">Membres ({members.length})</h3>
                <button onClick={() => setShowMembers(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white">
                  <FiX size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {members.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">Aucune donnée</p>
                ) : (
                  members.map((m, i) => (
                    <div key={m.uid || i} className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-2xl border border-white/10">
                      <div className="relative">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/20">
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0F172A]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{m.name}</p>
                        <p className={`text-[9px] font-black uppercase tracking-wide ${m.role === "Leader" ? "text-amber-400" : "text-slate-500"}`}>
                          {m.role || "Membre"}
                        </p>
                      </div>
                      {isLeader && m.uid !== currentUser?.uid && (
                        <button onClick={() => kickMember(m.uid)} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                          <FiUserX size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JOIN REQUESTS */}
      <AnimatePresence>
        {showRequests && (
          <ModalOverlay onClose={() => setShowRequests(false)}>
            <ModalHeader icon={FiUserPlus} title={`Demandes (${joinRequests.length})`} onClose={() => setShowRequests(false)} />
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
              {joinRequests.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Aucune demande</p>
              ) : (
                joinRequests.map((req) => (
                  <div key={req.id} className="bg-white/[0.04] rounded-2xl border border-white/10 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm ring-1 ring-white/20">
                        {req.userName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{req.userName}</p>
                        <p className="text-xs text-slate-500">Matricule : {req.matricule}</p>
                      </div>
                    </div>
                    {req.answers?.length > 0 && (
                      <div className="bg-[#0F172A]/50 rounded-xl p-3 border border-white/10 mb-3 space-y-2">
                        {req.answers.map((a, i) => (
                          <div key={i}>
                            <p className="text-[10px] font-black text-slate-500 uppercase">Réponse {i + 1}</p>
                            <p className="text-xs text-slate-200">{a}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => approveJoin(req)} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30">
                        <FiCheck size={12} /> Accepter
                      </button>
                      <button onClick={() => rejectJoin(req)} className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/30">
                        <FiX size={12} /> Refuser
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* SETTINGS */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal roomData={roomData} groupId={id}
            onClose={() => setShowSettings(false)} onSaved={() => loadGroup()} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────── helpers ───────────── */

function FileAttachment({ url, name, type, isMe }) {
  const ext = (name?.split(".").pop() || "").toLowerCase();
  const label = name || "Fichier";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={name || true}
      className={`flex items-center gap-3 mb-2 px-3 py-2.5 rounded-xl border transition-colors group/file ${
        isMe
          ? "bg-white/15 border-white/20 hover:bg-white/20"
          : "bg-white/[0.04] border-white/10 hover:border-indigo-400/40"
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ${
        isMe ? "bg-white/15 ring-white/20" : "bg-indigo-500/15 ring-indigo-500/20"
      }`}>
        {ext === "pdf" || ext === "doc" || ext === "docx" || ext === "txt"
          ? <FiFileText size={16} className={isMe ? "text-white" : "text-indigo-300"} />
          : <FiFile size={16} className={isMe ? "text-white" : "text-indigo-300"} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-bold truncate ${isMe ? "text-white" : "text-white"}`}>{label}</p>
        <p className={`text-[10px] uppercase tracking-wider ${isMe ? "text-white/70" : "text-slate-500"}`}>
          {ext || type || "Fichier"}
        </p>
      </div>
      <FiDownload size={13} className={`shrink-0 ${isMe ? "text-white/80" : "text-slate-500 group-hover/file:text-indigo-300"} transition-colors`} />
    </a>
  );
}

function Highlight({ text, q }) {
  if (!q || !text) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="bg-indigo-400/30 text-white rounded px-0.5">{p}</mark>
      : <span key={i}>{p}</span>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0F172A] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        {children}
      </motion.div>
    </div>
  );
}

function ModalHeader({ icon: Icon, title, onClose }) {
  return (
    <div className="p-5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex justify-between items-center">
      <h2 className="font-bold text-sm flex items-center gap-2"><Icon size={15} /> {title}</h2>
      <button onClick={onClose}><FiX size={17} /></button>
    </div>
  );
}

function SettingsModal({ roomData, groupId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: roomData?.name || "",
    subject: roomData?.subject || "",
    description: roomData?.description || "",
    rules: roomData?.rules || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/groups/${groupId}`, { method: "PATCH", body: form });
      onSaved?.();
      onClose();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const deleteGroup = async () => {
    if (!confirm("Supprimer ce groupe définitivement ?")) return;
    try {
      await api(`/api/groups/${groupId}`, { method: "DELETE" });
      onClose();
      window.location.href = "/explore";
    } catch (err) { alert(err.message); }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader icon={FiSettings} title="Paramètres" onClose={onClose} />
      <form className="p-6 space-y-4" onSubmit={save}>
        {[
          { label: "Nom du groupe", key: "name", type: "input" },
          { label: "Matière", key: "subject", type: "input" },
          { label: "Description", key: "description", type: "textarea" },
          { label: "Règles", key: "rules", type: "textarea" },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
            {type === "input" ? (
              <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-white" />
            ) : (
              <textarea value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 h-24 resize-none transition-all text-white" />
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving}
            className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold uppercase transition-colors active:scale-95 disabled:opacity-50 ring-1 ring-white/20">
            {saving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
          <button type="button" onClick={deleteGroup}
            className="px-4 py-3 bg-rose-500/10 text-rose-400 border border-rose-400/30 rounded-xl text-xs font-bold uppercase hover:bg-rose-500/20 transition-all">
            Supprimer
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
