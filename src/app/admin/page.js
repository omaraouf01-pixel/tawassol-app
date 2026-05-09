"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers, FiCheck, FiX, FiTrash2, FiShield,
  FiBookOpen, FiAlertTriangle, FiEye, FiUser,
  FiPlus, FiEdit2, FiUserCheck, FiAlertCircle,
  FiArrowLeft, FiTrendingUp, FiActivity, FiSearch,
  FiZoomIn, FiDownload, FiFileText, FiClock,
} from "react-icons/fi";
import TsswalLogo from "@/components/TsswalLogo";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { api } from "@/lib/apiClient";

/* ═══════════════════════════════════════════════════════════════════
   TSSWAL ADMIN DASHBOARD — Chef-d'œuvre
   • Dark mode #121212 + Glassmorphism + Isometric stat cards
   • Inter font, Indigo 500 accents, 7-day activity chart
   • Image viewer modal pour Student ID
═══════════════════════════════════════════════════════════════════ */

const TABS = [
  { key: "overview",  label: "Vue d'ensemble", icon: FiTrendingUp },
  { key: "pending",   label: "En attente",     icon: FiAlertTriangle },
  { key: "students",  label: "Étudiants",      icon: FiUsers },
  { key: "groups",    label: "Groupes",        icon: FiBookOpen },
];

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [allUsers, setAllUsers] = useState([]);
  const [previewCard, setPreviewCard] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const PAGE_SIZE = 20;

  // ─── Dérivés ───
  const pendingUsers = useMemo(
    () => allUsers.filter((u) => u.status === "pending"),
    [allUsers]
  );

  // ─── Fetch users from MongoDB (with light polling) ───
  const fetchUsers = async () => {
    try {
      const data = await api("/api/admin/users");
      setAllUsers(data.users || []);
    } catch (e) {
      console.error("[ADMIN FETCH ERROR]", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { if (u) fetchUsers(); });
    return unsub;
  }, []);

  // Polling toutes les 15s pour rafraîchir la liste (remplace onSnapshot)
  useEffect(() => {
    const id = setInterval(fetchUsers, 15000);
    return () => clearInterval(id);
  }, []);

  const showError = (msg) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(""), 4000); };

  // ─── API actions (toutes via MongoDB) ──────────────────────────────
  const approveUser = async (uid) => {
    try { await api(`/api/admin/users/${uid}/approve`, { method: "POST" }); fetchUsers(); }
    catch (e) { showError(e.message); }
  };
  const rejectUser = async (uid) => {
    try { await api(`/api/admin/users/${uid}/reject`, { method: "POST" }); fetchUsers(); }
    catch (e) { showError(e.message); }
  };
  const deleteUser = async (uid) => {
    if (!confirm("Supprimer définitivement ce compte ?")) return;
    try { await api(`/api/admin/users/${uid}`, { method: "DELETE" }); fetchUsers(); }
    catch (e) { showError(e.message); }
  };
  const updateUser = async (uid, updates) => {
    await api(`/api/admin/users/${uid}`, { method: "PATCH", body: updates });
    fetchUsers();
  };
  const toggleRole = async (u) => {
    const newRole = u.role === "admin" ? "student" : "admin";
    if (!confirm(`Changer le rôle de ${u.name} en ${newRole} ?`)) return;
    try { await api(`/api/admin/users/${u.uid}`, { method: "PATCH", body: { role: newRole } }); fetchUsers(); }
    catch (e) { showError(e.message); }
  };

  // ─── Stats data (MongoDB) ─────────────────────────────────────────
  const totalStudents = allUsers.filter((u) => u.role !== "admin").length;
  const activeStudents = allUsers.filter((u) => u.status === "active" && u.role !== "admin").length;
  const totalAdmins = allUsers.filter((u) => u.role === "admin").length;
  const onboardedCount = allUsers.filter((u) => u.onboarded).length;

  // ─── Activité 7 jours (depuis createdAt — ISO string MongoDB) ─────
  const activityData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
    return days.map((dayStart) => {
      const dayEnd = dayStart + 86_400_000;
      const count = allUsers.filter((u) => {
        if (!u.createdAt) return false;
        const t = new Date(u.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      return {
        day: ["L","M","M","J","V","S","D"][new Date(dayStart).getDay() === 0 ? 6 : new Date(dayStart).getDay() - 1],
        count,
      };
    });
  }, [allUsers]);

  const filteredStudentsAll = allUsers.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.matricule?.toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filteredStudentsAll.length / PAGE_SIZE));
  const filteredStudents = filteredStudentsAll.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="min-h-screen bg-[#121212] text-white relative overflow-x-hidden font-sans antialiased">
      {/* Ambient blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* ═══════ HEADER ═══════ */}
      <header className="bg-[#121212]/80 backdrop-blur-2xl border-b border-white/[0.06] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center gap-4">
          <TsswalLogo size={30} lockup glow />
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-sm">
            <FiShield size={14} className="text-indigo-400" />
            <span className="font-bold text-white">Admin Dashboard</span>
          </div>
          <button
            onClick={() => router.push("/hub")}
            className="ml-auto text-sm text-slate-400 hover:text-white font-semibold transition-colors flex items-center gap-1.5"
          >
            <FiArrowLeft size={13} /> Retour au Hub
          </button>
        </div>
      </header>

      {/* Toast errors */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl shadow-rose-500/50 z-50 flex items-center gap-2 ring-1 ring-white/20"
          >
            <FiAlertCircle size={15} /> {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-8 py-8 relative z-10">
        {/* ═══════ TABS NAV ═══════ */}
        <div className="flex items-center gap-1 mb-7 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl w-fit">
          {TABS.map((t) => {
            const active = tab === t.key;
            const badge = t.key === "pending" ? pendingUsers.length : 0;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  active ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="admin-tab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40 ring-1 ring-white/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <t.icon size={14} />
                  {t.label}
                  {badge > 0 && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-violet-500 text-white"}`}>
                      {badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* ═══════ OVERVIEW ═══════ */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Hero greeting */}
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Tableau de bord</p>
                <h1 className="text-3xl font-black tracking-tight">Vue d'ensemble de la plateforme</h1>
                <p className="text-sm text-slate-400 mt-1">Surveillez l'activité, validez les inscriptions et gérez les groupes.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative rounded-full w-2 h-2 bg-emerald-400" />
                </span>
                <span className="text-xs font-bold text-slate-200">Système opérationnel</span>
              </div>
            </div>

            {/* Isometric stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <IsoStatCard
                label="Étudiants totaux"
                value={totalStudents}
                hint={`${activeStudents} actifs`}
                gradient="from-indigo-500 to-blue-500"
                icon={FiUsers}
              />
              <IsoStatCard
                label="En attente"
                value={pendingUsers.length}
                hint="à valider"
                gradient="from-amber-500 to-orange-500"
                icon={FiAlertTriangle}
              />
              <IsoStatCard
                label="Onboardés"
                value={onboardedCount}
                hint="profils complets"
                gradient="from-violet-500 to-fuchsia-500"
                icon={FiUserCheck}
              />
              <IsoStatCard
                label="Administrateurs"
                value={totalAdmins}
                hint="comptes admin"
                gradient="from-cyan-500 to-indigo-500"
                icon={FiShield}
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <ActivityChart data={activityData} />
              <PendingPanel pending={pendingUsers} onApprove={approveUser} onReject={rejectUser} onView={(u) => u.idCardUrl && setPreviewCard(u)} />
            </div>

            {/* Section groupes — placeholder en attente migration MongoDB */}
            <GroupsMigrationNotice />
          </div>
        )}

        {/* ═══════ PENDING ═══════ */}
        {tab === "pending" && (
          <div className="space-y-3">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
              <div>
                <h1 className="text-2xl font-black tracking-tight">Comptes en attente</h1>
                <p className="text-sm text-slate-400">Validez ou refusez les nouvelles inscriptions.</p>
              </div>
            </div>

            {pendingUsers.length === 0 ? (
              <EmptyState icon={FiCheck} text="Aucun compte en attente" sub="Tous les étudiants sont validés." />
            ) : (
              pendingUsers.map((u) => (
                <PendingRow
                  key={u.uid}
                  u={u}
                  onView={() => u.idCardUrl && setPreviewCard(u)}
                  onApprove={() => approveUser(u.uid)}
                  onReject={() => rejectUser(u.uid)}
                />
              ))
            )}
          </div>
        )}

        {/* ═══════ STUDENTS ═══════ */}
        {tab === "students" && (
          <div className="space-y-4">
            <div className="flex items-end justify-between flex-wrap gap-3 mb-2">
              <div>
                <h1 className="text-2xl font-black tracking-tight">Tous les étudiants</h1>
                <p className="text-sm text-slate-400">Gérez les comptes, modifiez les rôles et supprimez si nécessaire.</p>
              </div>
              <button
                onClick={() => setShowAddStudent(true)}
                className="relative group flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold transition-colors"
              >
                <span aria-hidden className="absolute -inset-1 bg-indigo-500 blur-xl opacity-50 group-hover:opacity-90 transition-opacity rounded-xl" />
                <span className="relative flex items-center gap-2">
                  <FiPlus size={14} /> Ajouter un étudiant
                </span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <FiSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email ou matricule…"
                className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 backdrop-blur-xl transition-all"
              />
            </div>

            {/* Table */}
            <div className="bg-white/[0.04] rounded-2xl border border-white/[0.08] backdrop-blur-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] border-b border-white/[0.06]">
                  <tr>
                    {["Nom", "Matricule", "Email", "Rôle", "Statut", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-bold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-[10px] font-black ring-1 ring-white/15">
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.matricule}</td>
                      <td className="px-4 py-3 text-slate-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge tone={u.role === "admin" ? "violet" : "indigo"}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.status === "active" ? "emerald" : u.status === "pending" ? "amber" : "rose"}>{u.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <IconButton title="Modifier" onClick={() => setEditingUser(u)} icon={FiEdit2} hover="indigo" />
                          <IconButton title="Changer rôle" onClick={() => toggleRole(u)} icon={FiUserCheck} hover="violet" />
                          <IconButton title="Supprimer" onClick={() => deleteUser(u.uid)} icon={FiTrash2} hover="rose" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                <p className="text-xs text-slate-500">
                  {filteredStudentsAll.length} étudiants · Page {page} / {totalPages}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold disabled:opacity-40 transition-colors">
                    ← Précédent
                  </button>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold disabled:opacity-40 transition-colors">
                    Suivant →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ GROUPS — placeholder en attente migration ═══════ */}
        {tab === "groups" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight">Groupes d'étude</h1>
              <p className="text-sm text-slate-400">Module en cours de migration vers MongoDB.</p>
            </div>
            <GroupsMigrationNotice />
          </div>
        )}
      </main>

      {/* ═══════ MODALS ═══════ */}
      <AnimatePresence>
        {previewCard && (
          <CardViewerModal user={previewCard} onClose={() => setPreviewCard(null)}
            onApprove={() => { approveUser(previewCard.uid); setPreviewCard(null); }}
            onReject={() => { rejectUser(previewCard.uid); setPreviewCard(null); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingUser && (
          <EditStudentModal user={editingUser} onClose={() => setEditingUser(null)}
            onSave={async (updates) => { await updateUser(editingUser.uid, updates); setEditingUser(null); }}
            onError={showError} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddStudent && (
          <AddStudentModal
            onClose={() => setShowAddStudent(false)}
            onSuccess={() => { setShowAddStudent(false); fetchUsers(); }}
            onError={showError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════ ISOMETRIC STAT CARD ═══════════════════════ */
function IsoStatCard({ label, value, hint, gradient, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl overflow-hidden group hover:border-indigo-400/30 transition-all"
    >
      <div aria-hidden className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${gradient} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity`} />

      <div className="relative p-5">
        {/* Isometric mini-cube */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 56 56" className="w-full h-full">
              <defs>
                <linearGradient id={`top-${label}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              {/* iso cube faces */}
              <polygon points="28,4 52,18 28,32 4,18" fill={`url(#top-${label})`} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
              <polygon points="28,32 52,18 52,42 28,56" fill="#1E1B4B" />
              <polygon points="28,32 4,18 4,42 28,56" fill="#312E81" />
            </svg>
            <Icon size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-black tracking-tighter bg-gradient-to-br from-white to-slate-300 bg-clip-text text-transparent">
            {value}
          </p>
          {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ ACTIVITY CHART ═══════════════════════ */
function ActivityChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="lg:col-span-2 bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Activité 7 jours</p>
          <h3 className="text-lg font-black text-white">Inscriptions récentes</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <FiActivity size={12} className="text-indigo-400" />
          temps réel
        </div>
      </div>

      {/* SVG bars */}
      <div className="flex items-end gap-3 h-40 px-2">
        {data.map((d, i) => {
          const h = (d.count / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end relative">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(h, 4)}%` }}
                  transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
                  className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-violet-400 ring-1 ring-white/10 relative group"
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-white bg-[#121212] border border-white/10 rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {d.count}
                  </span>
                </motion.div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">{d.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════ PENDING PANEL (Overview side card) ═══════════════════════ */
function PendingPanel({ pending, onApprove, onReject, onView }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">À valider</p>
          <h3 className="text-base font-black text-white">{pending.length} comptes</h3>
        </div>
        <FiAlertTriangle size={15} className="text-amber-400" />
      </div>
      {pending.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">Tout est en ordre 🎉</p>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {pending.slice(0, 5).map((u) => (
            <div key={u.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/20">
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{u.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{u.matricule}</p>
              </div>
              <button onClick={() => onView(u)} className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-md transition-all">
                <FiZoomIn size={11} />
              </button>
              <button onClick={() => onApprove(u.id)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-all">
                <FiCheck size={11} />
              </button>
              <button onClick={() => onReject(u.id)} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-md transition-all">
                <FiX size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ MIGRATION NOTICE (Groups en attente) ═══════════════════════ */
function GroupsMigrationNotice() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden">
      <div aria-hidden className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="relative flex items-start gap-4">
        <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30 ring-1 ring-white/20 shrink-0">
          <FiClock size={18} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest mb-1">Migration en cours</p>
          <h3 className="text-base font-black text-white mb-1.5">Module Groupes — bientôt sur MongoDB</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            La gestion des groupes et des demandes d'adhésion est en cours de migration vers
            la nouvelle architecture MongoDB. Cette section sera réactivée dès la migration
            du chat temps réel terminée.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ PENDING ROW (full tab) ═══════════════════════ */
function PendingRow({ u, onView, onApprove, onReject }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.04] rounded-2xl border border-white/[0.08] backdrop-blur-xl p-4 flex items-center gap-4 hover:border-indigo-400/30 transition-all"
    >
      <div className="relative">
        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold ring-1 ring-white/20">
          {u.name?.[0]?.toUpperCase()}
        </div>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-[#121212] flex items-center justify-center">
          <FiAlertTriangle size={7} className="text-[#121212]" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-white">{u.name}</p>
        <p className="text-xs text-slate-400">{u.email} · <span className="font-mono">{u.matricule}</span></p>
      </div>
      {u.idCardUrl && (
        <button onClick={onView} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-300 hover:text-white border border-indigo-400/30 hover:bg-indigo-500/10 rounded-xl transition-all">
          <FiEye size={13} /> Voir carte
        </button>
      )}
      <button onClick={onApprove} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all">
        <FiCheck size={13} /> Approuver
      </button>
      <button onClick={onReject} className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all">
        <FiX size={13} /> Refuser
      </button>
    </motion.div>
  );
}

/* ═══════════════════════ CARD VIEWER MODAL (Glassmorphism) ═══════════════════════ */
function CardViewerModal({ user, onClose, onApprove, onReject }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white/[0.05] border border-indigo-400/30 backdrop-blur-2xl rounded-3xl p-6 max-w-2xl w-full shadow-2xl shadow-indigo-500/20 overflow-hidden"
      >
        <div aria-hidden className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl" />
        <div aria-hidden className="absolute -bottom-20 -left-20 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold ring-1 ring-white/20">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-black text-base text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email} · <span className="font-mono">{user.matricule}</span></p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white">
              <FiX size={17} />
            </button>
          </div>

          {/* Image with glassmorphism frame */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/30 mb-5">
            <img src={user.idCardUrl} alt="Carte d'étudiant" className="w-full max-h-[60vh] object-contain" />
            <a
              href={user.idCardUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md text-white rounded-xl border border-white/10 hover:bg-black/70 transition-all"
              title="Ouvrir l'original"
            >
              <FiDownload size={14} />
            </a>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onApprove}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              <FiCheck size={15} /> Approuver le compte
            </button>
            <button
              onClick={onReject}
              className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2"
            >
              <FiX size={15} /> Refuser
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════ EDIT / ADD STUDENT MODALS ═══════════════════════ */
function EditStudentModal({ user, onClose, onSave, onError }) {
  const [form, setForm] = useState({
    name: user.name || "", matricule: user.matricule || "",
    email: user.email || "", role: user.role || "student",
    status: user.status || "active",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    catch (err) { onError?.(err.message); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell onClose={onClose} icon={FiEdit2} title="Modifier l'étudiant">
      <form onSubmit={submit} className="space-y-4">
        <DarkInput label="Nom complet" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <DarkInput label="Matricule" value={form.matricule} onChange={(v) => setForm({ ...form, matricule: v })} />
        <DarkInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <DarkSelect label="Rôle" value={form.role} onChange={(v) => setForm({ ...form, role: v })}
          options={[{ value: "student", label: "Étudiant" }, { value: "admin", label: "Administrateur" }]} />
        <DarkSelect label="Statut" value={form.status} onChange={(v) => setForm({ ...form, status: v })}
          options={[{ value: "active", label: "Actif" }, { value: "pending", label: "En attente" }, { value: "rejected", label: "Refusé" }]} />
        <SubmitBtn loading={saving}>Sauvegarder</SubmitBtn>
      </form>
    </ModalShell>
  );
}

function AddStudentModal({ onClose, onSuccess, onError }) {
  const [form, setForm] = useState({ name: "", matricule: "", email: "", password: "", role: "student" });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/users", { method: "POST", body: form });
      onSuccess?.();
    }
    catch (err) { onError(err.message); }
    setSaving(false);
  };

  return (
    <ModalShell onClose={onClose} icon={FiPlus} title="Ajouter un étudiant">
      <form onSubmit={submit} className="space-y-4">
        <DarkInput label="Nom complet" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <DarkInput label="Matricule" value={form.matricule} onChange={(v) => setForm({ ...form, matricule: v })} required />
        <DarkInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <DarkInput label="Mot de passe" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
        <DarkSelect label="Rôle" value={form.role} onChange={(v) => setForm({ ...form, role: v })}
          options={[{ value: "student", label: "Étudiant" }, { value: "admin", label: "Administrateur" }]} />
        <SubmitBtn loading={saving}>Créer le compte</SubmitBtn>
        <p className="text-[10px] text-slate-500 text-center">Le compte sera activé immédiatement.</p>
      </form>
    </ModalShell>
  );
}

/* ═══════════════════════ Shared atoms ═══════════════════════ */
function ModalShell({ icon: Icon, title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121212]/90 border border-indigo-400/20 backdrop-blur-2xl w-full max-w-md rounded-3xl shadow-2xl shadow-indigo-500/20 overflow-hidden"
      >
        <div className="p-5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex justify-between items-center">
          <h2 className="font-bold text-sm flex items-center gap-2"><Icon size={15} /> {title}</h2>
          <button onClick={onClose}><FiX size={17} /></button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}

function DarkInput({ label, value, onChange, type = "text", required }) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
        {label} {required && <span className="text-violet-400">*</span>}
      </label>
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-white" />
    </div>
  );
}
function DarkSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400/50 transition-all text-white">
        {options.map((o) => <option key={o.value} value={o.value} className="bg-[#121212]">{o.label}</option>)}
      </select>
    </div>
  );
}
function SubmitBtn({ loading, children }) {
  return (
    <button type="submit" disabled={loading}
      className="relative group w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold uppercase transition-colors active:scale-95 disabled:opacity-50">
      <span aria-hidden className="absolute -inset-1 bg-indigo-500 blur-xl opacity-50 group-hover:opacity-90 transition-opacity rounded-xl" />
      <span className="relative">{loading ? "Patientez…" : children}</span>
    </button>
  );
}
function Badge({ tone = "indigo", children }) {
  const tones = {
    indigo:  "bg-indigo-500/10 text-indigo-300 border-indigo-400/30",
    violet:  "bg-violet-500/10 text-violet-300 border-violet-400/30",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30",
    amber:   "bg-amber-500/10 text-amber-300 border-amber-400/30",
    rose:    "bg-rose-500/10 text-rose-300 border-rose-400/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tones[tone]}`}>{children}</span>
  );
}
function IconButton({ icon: Icon, onClick, hover = "indigo", title }) {
  const tones = {
    indigo: "hover:text-indigo-400 hover:bg-indigo-500/10",
    violet: "hover:text-violet-400 hover:bg-violet-500/10",
    rose:   "hover:text-rose-400 hover:bg-rose-500/10",
  };
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 text-slate-500 rounded-lg transition-all ${tones[hover]}`}>
      <Icon size={13} />
    </button>
  );
}
function EmptyState({ icon: Icon, text, sub }) {
  return (
    <div className="text-center py-16 bg-white/[0.04] rounded-3xl border border-white/[0.08] backdrop-blur-xl">
      <div className="w-14 h-14 mx-auto mb-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
        <Icon size={22} className="text-emerald-400" />
      </div>
      <p className="font-bold text-white">{text}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
