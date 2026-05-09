"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiClock, FiMail, FiLogOut, FiUsers } from "react-icons/fi";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { api } from "@/lib/apiClient";

/* ════════════════════════════════════════════════════════════════════
   PENDING PAGE — Polling MongoDB toutes les 10s (zéro Firestore)
   Vérifie si le statut utilisateur passe à "active"
══════════════════════════════════════════════════════════════════════ */

export default function PendingPage() {
  const router = useRouter();

  useEffect(() => {
    let pollId = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const checkStatus = async () => {
        try {
          const profile = await api("/api/user/profile");
          if (profile?.status === "active") {
            router.push(profile.onboarded ? "/hub" : "/onboarding");
          }
        } catch {}
      };

      checkStatus();
      pollId = setInterval(checkStatus, 10_000);
    });

    return () => {
      unsubAuth();
      if (pollId) clearInterval(pollId);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex items-center justify-center p-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-violet-600/25 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md w-full"
      >
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/40 ring-1 ring-white/20">
            <FiUsers size={17} className="text-white" />
          </div>
          <span className="text-lg font-black tracking-tight">eTwassel</span>
        </div>

        <div className="rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md p-10 shadow-2xl shadow-black/40 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl shadow-2xl shadow-amber-500/40 ring-1 ring-white/20 flex items-center justify-center">
              <FiClock size={32} className="text-white" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-amber-400/40"
              animate={{ scale: [1, 1.2, 1.2], opacity: [0.7, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          <h1 className="text-2xl font-black mb-2 tracking-tight">
            Compte en cours de vérification
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Votre inscription est complète. Un administrateur examinera votre carte d&apos;étudiant
            et activera votre compte sous peu. Cela prend généralement moins de 24 heures.
          </p>

          <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 flex items-start gap-3 mb-7 text-left">
            <FiMail size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200 leading-relaxed">
              Vous serez automatiquement redirigé une fois votre compte approuvé.
              Vous pouvez quitter cette page et y revenir plus tard.
            </p>
          </div>

          <button
            onClick={() => { signOut(auth); router.push("/auth"); }}
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-rose-400 transition-colors font-semibold"
          >
            <FiLogOut size={13} />
            Se déconnecter
          </button>
        </div>
      </motion.div>
    </div>
  );
}
