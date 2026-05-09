"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowRight, FiZap, FiCheck,
} from "react-icons/fi";
import TsswalLogo from "@/components/TsswalLogo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white overflow-x-hidden font-sans antialiased selection:bg-indigo-500/40">
      {/* Ambient lighting */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-15%] left-[5%] w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[180px]" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] left-[30%] w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[160px]" />
      </div>

      {/* ═══════ HEADER ═══════ */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#121212]/70 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group">
            <TsswalLogo size={32} lockup glow className="hover:opacity-90 transition-opacity" />
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#start" className="hover:text-white transition-colors">Démarrer</a>
          </nav>

          {/* Outlined neon-glow button */}
          <Link
            href="/auth"
            className="relative group px-5 py-2 rounded-lg text-sm font-semibold text-indigo-300 transition-all"
          >
            <span className="absolute inset-0 rounded-lg border border-indigo-400/60 group-hover:border-indigo-400 transition-colors" />
            <span className="absolute inset-0 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_28px_rgba(99,102,241,0.7)] transition-shadow" />
            <span className="relative">S'inscrire</span>
          </Link>
        </div>
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
            {/* LEFT */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-slate-300 tracking-wide">
                  Plateforme EdTech · Université 2026
                </span>
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.05] mb-6">
                L'excellence académique<br />
                par la{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  collaboration numérique.
                </span>
              </h1>

              <p className="text-lg text-slate-400 max-w-xl mb-9 leading-relaxed">
                Rejoignez vos groupes d'étude, partagez vos ressources et
                communiquez en temps réel — au sein d'une plateforme conçue
                pour l'écosystème universitaire.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/auth"
                  className="relative group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-white bg-indigo-500 hover:bg-indigo-400 transition-colors"
                >
                  <span className="absolute -inset-1 rounded-xl bg-indigo-500 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    Commencer gratuitement
                    <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white border border-white/10 hover:bg-white/[0.04] transition-all"
                >
                  Explorer les fonctionnalités
                </a>
              </div>

              <div className="mt-9 flex items-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <FiCheck size={13} className="text-emerald-400" />
                  Inscription gratuite
                </div>
                <div className="flex items-center gap-1.5">
                  <FiCheck size={13} className="text-emerald-400" />
                  Validation universitaire
                </div>
                <div className="flex items-center gap-1.5">
                  <FiCheck size={13} className="text-emerald-400" />
                  Données sécurisées
                </div>
              </div>
            </motion.div>

            {/* RIGHT — Isometric illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="relative h-[520px] hidden lg:block"
            >
              <IsometricCampus />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES (Glassmorphism cards) ═══════ */}
      <section id="features" className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14 max-w-2xl">
            <span className="inline-block text-[11px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full mb-4 tracking-wide">
              FONCTIONNALITÉS
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Trois piliers pour une collaboration<br />
              <span className="text-indigo-400">sans friction</span>.
            </h2>
            <p className="text-slate-400">
              Pensé pour les étudiants. Optimisé pour les groupes. Supervisé par les enseignants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <GlassCard
              icon={GroupIcon}
              title="Groupes Dynamiques"
              desc="Créez des groupes par matière, projet ou objectif d'étude. Règles, questions de filtrage et capacité — tout est configurable."
            />
            <GlassCard
              icon={CloudIcon}
              title="Cloud Pédagogique"
              desc="Téléversez et téléchargez instantanément documents, résumés et exercices. Validation par le responsable du groupe."
            />
            <GlassCard
              icon={ChatIcon}
              title="Messagerie Live"
              desc="Chat sécurisé en temps réel entre étudiants de la même filière. Powered by Firestore real-time listeners."
            />
          </div>
        </div>
      </section>

      {/* ═══════ MATRICULE PREVIEW ═══════ */}
      <section id="start" className="relative py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          {/* Aura */}
          <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-500/15 blur-[140px] pointer-events-none" />
          <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-500/20 blur-[100px] pointer-events-none" />

          <span className="relative inline-block text-[11px] font-bold text-violet-300 bg-violet-500/10 border border-violet-500/30 px-3 py-1 rounded-full mb-5 tracking-wide">
            DÉMARRAGE EN 1 ÉTAPE
          </span>

          <h2 className="relative text-3xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">
            Entrez votre <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">Matricule</span><br />
            pour commencer.
          </h2>
          <p className="relative text-slate-400 mb-10 max-w-md mx-auto">
            Un seul identifiant. Un compte vérifié par l'administration. Et l'accès complet à votre campus numérique.
          </p>

          {/* Centered matricule input with violet aura */}
          <MatriculeInput />

          <p className="relative mt-7 text-xs text-slate-500">
            Pas de matricule&nbsp;? <Link href="/auth" className="text-indigo-300 hover:text-indigo-200 font-semibold">Créer un compte</Link>
          </p>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="relative border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TsswalLogo size={26} lockup />
            <span className="text-xs text-slate-500 ml-2">EdTech Collaborative Platform</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#start" className="hover:text-white transition-colors">Démarrer</a>
            <span>© 2026 TSSWAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════ ISOMETRIC CAMPUS ═══════════════════════ */
function IsometricCampus() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* radial halo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-80 h-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <svg viewBox="0 0 600 600" className="relative w-full h-full max-w-[560px]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Gradients */}
          <linearGradient id="topPlate" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="50%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
          <linearGradient id="rightPlate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>
          <linearGradient id="leftPlate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3730A3" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>
          <linearGradient id="cardA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="cardB" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="cardC" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="dataline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0" />
            <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="orbInner">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#4C1D95" />
          </radialGradient>
        </defs>

        {/* Floor grid (isometric) */}
        <g opacity="0.15" stroke="#6366F1" strokeWidth="1" fill="none">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <g key={`grid-${i}`}>
              <line x1={120 + i * 30} y1={420 - i * 17.3} x2={300 + i * 30} y2={510 - i * 17.3} />
              <line x1={300 - i * 30} y1={510 - i * 17.3} x2={480 - i * 30} y2={420 - i * 17.3} />
            </g>
          ))}
        </g>

        {/* === Central isometric platform (rhombus + sides) === */}
        {/* Right side */}
        <polygon points="480,360 480,400 300,490 300,450" fill="url(#rightPlate)" />
        {/* Left side */}
        <polygon points="120,360 120,400 300,490 300,450" fill="url(#leftPlate)" />
        {/* Top face (rhombus) */}
        <polygon
          points="300,270 480,360 300,450 120,360"
          fill="url(#topPlate)"
          stroke="#6366F1"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
        {/* Highlight pattern on top */}
        <polygon points="300,300 450,375 300,450 150,375" fill="none" stroke="#818CF8" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 4" />

        {/* === Central TSSWAL hub cube on platform === */}
        <g>
          {/* cube right */}
          <polygon points="300,270 360,300 360,360 300,330" fill="#4C1D95" />
          {/* cube left */}
          <polygon points="300,270 240,300 240,360 300,330" fill="#5B21B6" />
          {/* cube top */}
          <polygon
            points="300,210 360,240 300,270 240,240"
            fill="url(#cardA)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />
          {/* T letter on top */}
          <text x="300" y="252" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily="Inter, sans-serif">T</text>

          {/* cube glow */}
          <ellipse cx="300" cy="380" rx="80" ry="14" fill="#6366F1" opacity="0.3" filter="blur(8px)" />
        </g>

        {/* === Floating isometric cards (book / chat / group) === */}
        {/* Book card — top-left */}
        <g>
          <polygon points="115,165 175,135 175,195 115,225" fill="url(#cardA)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <polygon points="175,135 195,145 195,205 175,195" fill="#312E81" />
          <polygon points="115,165 135,175 195,145 175,135" fill="#3730A3" opacity="0.7" />
          {/* Lines (book pages) */}
          <line x1="130" y1="180" x2="160" y2="165" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
          <line x1="130" y1="190" x2="155" y2="177" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />
          <line x1="130" y1="200" x2="160" y2="185" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -8; 0 0" dur="4s" repeatCount="indefinite" />
        </g>

        {/* Chat card — top-right */}
        <g>
          <polygon points="425,135 485,165 485,225 425,195" fill="url(#cardB)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <polygon points="365,165 425,135 485,165 425,195" fill="#831843" opacity="0.4" />
          <polygon points="365,165 425,195 425,255 365,225" fill="#86198F" opacity="0.6" />
          {/* Chat dots */}
          <circle cx="445" cy="173" r="3" fill="white" opacity="0.95" />
          <circle cx="455" cy="178" r="3" fill="white" opacity="0.85" />
          <circle cx="465" cy="183" r="3" fill="white" opacity="0.75" />
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 8; 0 0" dur="4.5s" repeatCount="indefinite" />
        </g>

        {/* Group card — bottom-right */}
        <g>
          <polygon points="445,335 505,365 505,425 445,395" fill="url(#cardC)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <polygon points="385,365 445,335 505,365 445,395" fill="#075985" opacity="0.4" />
          <polygon points="385,365 445,395 445,455 385,425" fill="#0E7490" opacity="0.6" />
          {/* user dots */}
          <circle cx="465" cy="365" r="4" fill="white" opacity="0.9" />
          <circle cx="475" cy="370" r="4" fill="white" opacity="0.7" />
          <circle cx="465" cy="380" r="4" fill="white" opacity="0.85" />
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -6; 0 0" dur="3.8s" repeatCount="indefinite" />
        </g>

        {/* === Floating student orbs === */}
        <FloatingOrb cx={90} cy={310} delay="0s" letter="A" />
        <FloatingOrb cx={510} cy={290} delay="1s" letter="S" />
        <FloatingOrb cx={170} cy={490} delay="2s" letter="M" />
        <FloatingOrb cx={420} cy={500} delay="0.5s" letter="L" />

        {/* === Data flow lines (curved) === */}
        <path d="M 90 310 Q 200 260 300 270" fill="none" stroke="url(#dataline)" strokeWidth="1.5">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M 510 290 Q 410 260 360 280" fill="none" stroke="url(#dataline)" strokeWidth="1.5">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3.4s" begin="0.4s" repeatCount="indefinite" />
        </path>
        <path d="M 170 490 Q 240 470 290 450" fill="none" stroke="url(#dataline)" strokeWidth="1.5">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3.2s" begin="0.8s" repeatCount="indefinite" />
        </path>
        <path d="M 420 500 Q 360 470 320 450" fill="none" stroke="url(#dataline)" strokeWidth="1.5">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3.6s" begin="1.2s" repeatCount="indefinite" />
        </path>

        {/* Card-to-hub connections */}
        <path d="M 175 165 Q 230 200 290 230" fill="none" stroke="#A78BFA" strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />
        <path d="M 425 165 Q 380 200 320 230" fill="none" stroke="#A78BFA" strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />
        <path d="M 445 365 Q 380 340 330 320" fill="none" stroke="#A78BFA" strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />

        {/* Animated traveling particles */}
        <circle r="3" fill="#C4B5FD">
          <animateMotion dur="3.5s" repeatCount="indefinite" path="M 90 310 Q 200 260 300 270" />
          <animate attributeName="opacity" values="0;1;0" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#F0ABFC">
          <animateMotion dur="3.8s" begin="0.5s" repeatCount="indefinite" path="M 510 290 Q 410 260 360 280" />
          <animate attributeName="opacity" values="0;1;0" dur="3.8s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#7DD3FC">
          <animateMotion dur="3.2s" begin="1s" repeatCount="indefinite" path="M 170 490 Q 240 470 290 450" />
          <animate attributeName="opacity" values="0;1;0" dur="3.2s" begin="1s" repeatCount="indefinite" />
        </circle>

        {/* Tiny ambient sparkles */}
        <circle cx="60" cy="180" r="2" fill="#A78BFA">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="540" cy="200" r="2" fill="#F472B6">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="540" cy="450" r="2" fill="#22D3EE">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="3s" begin="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="460" r="2" fill="#A78BFA">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.8s" begin="0.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function FloatingOrb({ cx, cy, letter, delay }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="22" fill="url(#orbInner)" opacity="0.4">
        <animate attributeName="r" values="22;28;22" dur="3s" begin={delay} repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r="18" fill="url(#orbInner)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="800" fontFamily="Inter, sans-serif">{letter}</text>
    </g>
  );
}

/* ═══════════════════════ GLASS CARD ═══════════════════════ */
function GlassCard({ icon: Icon, title, desc }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-7 hover:border-indigo-400/40 transition-all overflow-hidden"
    >
      {/* Inner glow on hover */}
      <div aria-hidden className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/0 group-hover:bg-indigo-500/20 rounded-full blur-3xl transition-colors duration-500" />

      <div className="relative">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/40 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
          <Icon size={26} />
        </div>
        <h3 className="text-lg font-black tracking-tight mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>

        {/* bottom accent line */}
        <div aria-hidden className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-indigo-400 to-violet-400 group-hover:w-full transition-all duration-700" style={{ bottom: "-28px" }} />
      </div>
    </motion.div>
  );
}

/* Custom 2D-flat icons */
function GroupIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" fill="rgba(255,255,255,0.3)" />
      <circle cx="17" cy="9" r="2.5" fill="rgba(255,255,255,0.3)" />
      <path d="M3 19c0-2.5 2-5 6-5s6 2.5 6 5" />
      <path d="M14 17c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5" />
    </svg>
  );
}
function CloudIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 18a4 4 0 0 0 0-8 6 6 0 0 0-11.5 2A3.5 3.5 0 0 0 6 19h11" fill="rgba(255,255,255,0.2)" />
      <path d="M12 14v4" />
      <path d="M9.5 16l2.5 2 2.5-2" />
    </svg>
  );
}
function ChatIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v11H8l-4 4V5z" fill="rgba(255,255,255,0.25)" />
      <circle cx="9" cy="11" r="0.7" fill="white" />
      <circle cx="12" cy="11" r="0.7" fill="white" />
      <circle cx="15" cy="11" r="0.7" fill="white" />
    </svg>
  );
}

/* ═══════════════════════ MATRICULE INPUT ═══════════════════════ */
function MatriculeInput() {
  return (
    <div className="relative max-w-lg mx-auto">
      {/* multi-layer aura */}
      <div aria-hidden className="absolute -inset-12 bg-gradient-to-r from-indigo-500/30 via-violet-500/40 to-fuchsia-500/30 rounded-full blur-3xl opacity-70" />
      <div aria-hidden className="absolute -inset-4 bg-violet-500/30 rounded-full blur-2xl" />

      <form
        onSubmit={(e) => { e.preventDefault(); window.location.href = "/auth"; }}
        className="relative flex items-center gap-2 p-2 rounded-2xl bg-white/[0.04] border border-violet-400/30 backdrop-blur-2xl shadow-[0_0_60px_rgba(139,92,246,0.4)]"
      >
        <div className="pl-4 pr-2 flex items-center gap-2 text-violet-300">
          <FiZap size={16} />
        </div>
        <input
          type="text"
          placeholder="Ex. 2024-CS-001"
          className="flex-1 bg-transparent outline-none text-white text-base font-medium placeholder:text-slate-500 py-3"
        />
        <button
          type="submit"
          className="relative group px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold transition-colors flex items-center gap-2"
        >
          <span className="absolute inset-0 rounded-xl bg-indigo-500 blur-md opacity-50 group-hover:opacity-90 transition-opacity" />
          <span className="relative flex items-center gap-1.5">
            Continuer
            <FiArrowRight size={14} />
          </span>
        </button>
      </form>
    </div>
  );
}
