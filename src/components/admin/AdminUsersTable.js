"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Eye, EyeOff, ShieldAlert, UserCheck, Trash2,
    UserPlus, X, Loader2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { api } from "@/lib/apiClient";
import UserBadge from "@/components/UserBadge";

export default function AdminUsersTable({ users, onViewID, onViewProfile }) {
    const [deletingId, setDeletingId] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [sortDir, setSortDir] = useState(null); // null | "desc" | "asc"

    const handleDelete = async (u) => {
        if (!u?.uid || deletingId) return;
        if (!window.confirm(`Delete "${u.fullName}"?\nThis will remove them from Firebase Auth and Firestore. This cannot be undone.`)) return;
        setDeletingId(u.uid);
        try {
            await api(`/api/admin/users/${u.uid}`, { method: "DELETE" });
        } catch (err) {
            alert(err.data?.error || err.message || "Failed to delete user.");
        } finally {
            setDeletingId(null);
        }
    };

    const toggleSort = () => {
        setSortDir((d) => d === "desc" ? "asc" : "desc");
    };

    const sorted = sortDir
        ? [...users].sort((a, b) => {
            const pa = a.points ?? 0;
            const pb = b.points ?? 0;
            return sortDir === "desc" ? pb - pa : pa - pb;
        })
        : users;

    const SortIcon = sortDir === "desc" ? ArrowDown : sortDir === "asc" ? ArrowUp : ArrowUpDown;

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                >
                    <UserPlus size={14} /> Add Scholar
                </button>
            </div>

            {users.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <UserCheck className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={48} />
                    <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">No active scholars yet.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 dark:border-slate-800">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Scholar</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Matricule & Major</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <button
                                        onClick={toggleSort}
                                        className="inline-flex items-center gap-1.5 hover:text-accent transition-colors"
                                    >
                                        Points <SortIcon size={12} />
                                    </button>
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((u) => (
                                <tr key={u.uid} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 overflow-hidden shrink-0">
                                                {u.avatarUrl
                                                    ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                    : (u.fullName?.[0]?.toUpperCase() || "?")}
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => onViewProfile?.(u)}
                                                    className="font-bold text-slate-800 dark:text-slate-100 hover:text-accent dark:hover:text-accent transition-colors text-left"
                                                >
                                                    {u.fullName}
                                                </button>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{u.matricule}</p>
                                        <p className="text-[10px] text-[#7c83f2] font-bold uppercase tracking-widest">{u.major || "N/A"}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-sm font-bold text-ink dark:text-white">
                                                {u.points ?? 0}
                                            </span>
                                            <UserBadge rank={u.rank} size="sm" />
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            Verified
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onViewID(u.studentCardUrl)}
                                                className="p-2.5 text-slate-400 hover:text-[#7c83f2] transition-colors"
                                                title="View ID"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                className="p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all"
                                                title="Suspend User"
                                            >
                                                <ShieldAlert size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u)}
                                                disabled={deletingId === u.uid}
                                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                title="Delete User"
                                            >
                                                {deletingId === u.uid
                                                    ? <Loader2 size={18} className="animate-spin" />
                                                    : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {showAddModal && (
                    <AddUserModal onClose={() => setShowAddModal(false)} />
                )}
            </AnimatePresence>
        </>
    );
}

function AddUserModal({ onClose }) {
    const [form, setForm] = useState({
        fullName: "", matricule: "", email: "", password: "", role: "student",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.fullName || !form.matricule || !form.email || !form.password) {
            setError("All fields are required.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api("/api/admin/users", {
                method: "POST",
                body: {
                    name: form.fullName,
                    matricule: form.matricule,
                    email: form.email,
                    password: form.password,
                    role: form.role,
                },
            });
            onClose();
        } catch (err) {
            setError(err.data?.error || err.message || "Failed to create user.");
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { name: "fullName", label: "Full Name", type: "text", placeholder: "e.g. Amira Benali" },
        { name: "matricule", label: "Matricule", type: "text", placeholder: "e.g. 202312345" },
        { name: "email", label: "Email Address", type: "email", placeholder: "e.g. amira@university.dz" },
    ];

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="fixed inset-0 z-[210] flex items-center justify-center p-6 pointer-events-none"
            >
                <div className="pointer-events-auto bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-sand dark:border-white/10 shadow-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-sand dark:border-white/5 bg-cream/40 dark:bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                                <UserPlus size={18} />
                            </div>
                            <div>
                                <h3 className="font-display italic font-bold text-ink dark:text-white">Add Scholar</h3>
                                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-ink-faint mt-1">
                                    Create account directly — bypasses ID verification
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-ink-faint hover:text-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {fields.map((f) => (
                            <div key={f.name}>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-ink-faint mb-1.5">
                                    {f.label}
                                </label>
                                <input
                                    type={f.type}
                                    name={f.name}
                                    value={form[f.name]}
                                    onChange={handleChange}
                                    placeholder={f.placeholder}
                                    autoComplete="off"
                                    className="w-full bg-cream dark:bg-white/5 border border-sand dark:border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 text-ink dark:text-white placeholder:text-ink-faint/40 transition-all"
                                />
                            </div>
                        ))}

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-ink-faint mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Min 6 characters"
                                    autoComplete="new-password"
                                    className="w-full bg-cream dark:bg-white/5 border border-sand dark:border-white/10 rounded-2xl px-4 py-3 pr-11 text-sm outline-none focus:ring-2 ring-accent/20 text-ink dark:text-white placeholder:text-ink-faint/40 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-3 flex items-center text-ink-faint hover:text-ink dark:hover:text-white transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-ink-faint mb-1.5">Role</label>
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="w-full bg-cream dark:bg-white/5 border border-sand dark:border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 text-ink dark:text-white transition-all"
                            >
                                <option value="student">Student</option>
                                <option value="leader">Leader</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl">
                                <AlertCircle size={14} className="text-rose-500 shrink-0" />
                                <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 border border-sand dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-ink-faint hover:text-ink dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading
                                    ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
                                    : <><UserPlus size={14} /> Create Scholar</>}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </>
    );
}
