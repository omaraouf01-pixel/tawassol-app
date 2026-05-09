"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiUser, FiHash, FiMail, FiUsers, FiMessageSquare,
  FiEdit2, FiX, FiCheck, FiCamera, FiCompass, FiAlertCircle,
} from "react-icons/fi";
import Sidebar from "@/components/Sidebar";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "@/lib/apiClient";
import { useMyGroups } from "@/lib/useMyGroups";

/* ════════════════════════════════════════════════════════════════════
   PROFILE PAGE — Firestore + real-time groups (useMyGroups)
   ───────────────────────────────────────────────────────────────────
   • Profil utilisateur : GET /api/user/profile
   • Mes groupes        : useMyGroups() → onSnapshot real-time
                          (filtre members array-contains uid + status active)
   • Index Firestore    : déjà déclaré dans firestore.indexes.json
                          (members CONTAINS + status ASC + updatedAt DESC)
══════════════════════════════════════════════════════════════════════ */

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const fileInputRef = useRef(null);

  // ── Real-time : groupes dont je suis membre ──
  //    Le hook gère lui-même l'authentification + le filtrage par UID.
  const { groups: myGroups, loading: groupsLoading, error: groupsError } = useMyGroups();

  // ── Auth + profil ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setCurrentUser(u);
      try {
        const profile = await api("/api/user/profile");
        setUserData(profile);
        setEditName(profile?.fullName || "");
      } catch (e) {
        console.error("[profile]", e);
      }
    });
    return unsub;
  }, []);

  // ── Sauvegarder le profil ──
  const saveProfile = async () => {
    if (!editName.trim() || !currentUser) return;
    setSaving(true);
    try {
      const updates = { fullName: editName.trim() };
      if (editAvatar) {
        const fd = new FormData();
        fd.append("file", editAvatar);
        fd.append("folder", "tawassol/avatars");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          updates.avatarUrl = data.url || data.secure_url;
        }
      }
      await api("/api/user/profile", { method: "PATCH", body: updates });
      setUserData({ ...userData, ...updates });
      setEditing(false);
      setEditAvatar(null);
      setToast("Profil mis à jour");
      setTimeout(() => setToast(""), 3000);
    } catch (e) {
      alert(e.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const name = userData?.fullName || currentUser?.email?.split("@")[0] || "Étudiant";
  const initial = name[0]?.toUpperCase() || "S";
  const status = userData?.status || "active";
  const avatarUrl = userData?.avatarUrl;

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[5%] right-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px]" />
      </div>

      <Sidebar />
      <main className="ml-60 flex-1 p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black tracking-tight">Mon Profil</h2>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-sm font-bold transition-colors">
              <FiEdit2 size={13} /> Modifier
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white/[0.04] rounded-3xl border border-white/10 backdrop-blur-md p-6 mb-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-5">
            <div className="relative">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={name} className="w-16 h-16 rounded-2xl object-cover ring-1 ring-white/20 shadow-xl shadow-violet-500/40" />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-violet-500/40 ring-1 ring-white/20">
                  {initial}
                </div>
              )}
              {editing && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => setEditAvatar(e.target.files?.[0] || null)} />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center ring-2 ring-slate-950 transition-colors">
                    <FiCamera size={12} />
                  </button>
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-lg font-black outline-none focus:border-indigo-400/50" />
              ) : (
                <h3 className="text-xl font-black text-white">{name}</h3>
              )}
              <p className="text-sm text-slate-400 capitalize">{userData?.role === "admin" ? "Administrateur" : "Étudiant"}</p>
              {editAvatar && <p className="text-xs text-emerald-400 mt-1">📎 {editAvatar.name}</p>}
            </div>
            {editing ? (
              <div className="flex gap-1">
                <button onClick={saveProfile} disabled={saving}
                  className="p-2 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors disabled:opacity-50">
                  <FiCheck size={15} />
                </button>
                <button onClick={() => { setEditing(false); setEditAvatar(null); setEditName(userData?.fullName || ""); }}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                  <FiX size={15} />
                </button>
              </div>
            ) : (
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                status === "active"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/30"
                  : status === "pending"
                  ? "bg-amber-500/10 text-amber-300 border-amber-400/30"
                  : "bg-rose-500/10 text-rose-300 border-rose-400/30"
              }`}>
                {status === "active" ? "Actif" : status === "pending" ? "En attente" : "Refusé"}
              </span>
            )}
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
            <InfoCard icon={FiHash} label="Matricule" value={userData?.matricule || "—"} gradient="from-blue-500 to-cyan-500" />
            <InfoCard icon={FiMail} label="Email" value={userData?.email || currentUser?.email || "—"} gradient="from-violet-500 to-fuchsia-500" />
            <InfoCard
              icon={FiUsers}
              label="Groupes"
              value={groupsLoading ? "…" : String(myGroups.length)}
              gradient="from-emerald-500 to-teal-500"
            />
          </div>
        </div>

        {/* Student ID Card */}
        {userData?.studentCardUrl && (
          <div className="bg-white/[0.04] rounded-3xl border border-white/10 backdrop-blur-md p-6 mb-6">
            <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
              <FiUser size={15} className="text-violet-400" /> Carte d&apos;étudiant
            </h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={userData.studentCardUrl} alt="Carte" className="rounded-2xl w-full max-w-xs object-cover border border-white/10" />
          </div>
        )}

        {/* ═══════ MY GROUPS — real-time via useMyGroups ═══════ */}
        <div className="bg-white/[0.04] rounded-3xl border border-white/10 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FiUsers size={15} className="text-violet-400" /> Mes groupes d&apos;étude
              {!groupsLoading && myGroups.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-black">
                  {myGroups.length}
                </span>
              )}
            </h3>
            {/* Indicator real-time */}
            {!groupsLoading && !groupsError && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative rounded-full w-1.5 h-1.5 bg-emerald-400" />
                </span>
                Live
              </span>
            )}
          </div>

          {/* Loading skeletons */}
          {groupsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-2xl border border-white/10 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-white/10 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="h-3 w-32 bg-white/10 rounded" />
                    <div className="h-2 w-20 bg-white/5 rounded" />
                  </div>
                  <div className="w-7 h-7 bg-white/5 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!groupsLoading && groupsError && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-400/30">
              <FiAlertCircle size={16} className="text-rose-300 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <p className="font-bold mb-0.5">Impossible de charger les groupes</p>
                <p className="opacity-80">{groupsError}</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!groupsLoading && !groupsError && myGroups.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
                <FiUsers size={22} className="text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Vous n&apos;avez encore rejoint aucun groupe</p>
              <p className="text-xs mt-1">Rejoignez un groupe pour collaborer avec d&apos;autres étudiants.</p>
              <button
                onClick={() => router.push("/explore")}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/30 rounded-xl text-xs font-bold text-violet-200 hover:text-white transition-all"
              >
                <FiCompass size={12} /> Explorer les groupes
              </button>
            </div>
          )}

          {/* Groups list */}
          {!groupsLoading && !groupsError && myGroups.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => router.push(`/hub/chat/${group.id}`)}
                  className="text-left flex items-center gap-3 p-3 bg-white/[0.04] rounded-2xl border border-white/10 hover:bg-white/[0.07] hover:border-violet-400/30 transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-violet-500/30 ring-1 ring-white/20">
                    {group.name?.[0]?.toUpperCase() || "G"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors">
                      {group.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {group.subject || "—"} · {group.memberCount || 0} membres
                    </p>
                  </div>
                  <div className="p-2 text-violet-400 group-hover:bg-violet-500/10 rounded-xl transition-all shrink-0">
                    <FiMessageSquare size={14} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-bold shadow-2xl shadow-emerald-500/40 z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg ring-1 ring-white/20`}>
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{label}</p>
        <p className="font-bold text-white text-sm truncate">{value}</p>
      </div>
    </div>
  );
}
