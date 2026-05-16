"use client";
import { Eye, ShieldAlert, UserCheck } from "lucide-react";

export default function AdminUsersTable({ users, onViewID }) {
    if (users.length === 0) {
        return (
            <div className="py-20 text-center bg-white dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <UserCheck className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={48} />
                <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">No active scholars yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-50 dark:border-slate-800">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Scholar Details</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Matricule & Major</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.uid} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : u.fullName[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{u.fullName}</p>
                                        <p className="text-xs text-slate-400">{u.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <p className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{u.matricule}</p>
                                <p className="text-[10px] text-[#7c83f2] font-bold uppercase tracking-widest">{u.major || "N/A"}</p>
                            </td>
                            <td className="px-8 py-5">
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    Verified
                                </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => onViewID(u.studentCardUrl)} className="p-2.5 text-slate-400 hover:text-[#7c83f2] transition-colors" title="View ID">
                                        <Eye size={18} />
                                    </button>
                                    <button className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Suspend User">
                                        <ShieldAlert size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}