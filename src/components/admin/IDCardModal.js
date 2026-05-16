"use client";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function IDCardModal({ url, onClose }) {
    if (!url) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden max-w-4xl w-full shadow-2xl border border-white/10"
            >
                <div className="absolute top-6 right-6 z-10 flex gap-2">
                    <button onClick={onClose} className="p-3 bg-black/50 text-white rounded-full hover:bg-black transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-2">
                    <img src={url} alt="Student ID" className="w-full h-auto max-h-[80vh] object-contain rounded-[2rem] shadow-inner bg-black/20" />
                </div>
                <div className="p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        Official Academic Identification Document
                    </p>
                </div>
            </motion.div>
        </div>
    );
}