"use client";
import { Eye, Check, X, UserCheck } from "lucide-react";

export default function AdminPendingTable({ users, onApprove, onReject, onViewID, processingId }) {
    if (users.length === 0) {
        return (
            <div className="py-20 text-center bg-white dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                <UserCheck className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={48} />
                <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">All clear! No pending requests.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-50 dark:border-slate-800">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Information</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Matricule</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Verification & Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.uid} className="border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#7c83f2]/10 flex items-center justify-center font-bold text-[#7c83f2]">
                                        {u.fullName[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{u.fullName}</p>
                                        <p className="text-xs text-slate-400">{u.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-6 font-mono text-xs font-bold text-[#7c83f2]">{u.matricule}</td>
                            <td className="px-8 py-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => onViewID(u.studentCardUrl)} className="p-2.5 text-slate-400 hover:text-[#7c83f2] transition-colors">
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        disabled={processingId === u.uid}
                                        onClick={() => onApprove(u.uid)}
                                        className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        disabled={processingId === u.uid}
                                        onClick={() => onReject(u.uid)}
                                        className="p-2.5 bg-rose-500/10 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30"
                                    >
                                        <X size={18} />
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