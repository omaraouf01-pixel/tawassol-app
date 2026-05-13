"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUpRight,
    Sparkles,
    Command,
    MoveRight,
    Heart,
    Users,
    Globe,
    Feather
} from 'lucide-react';

/* ─────────────────────────────────────────
   GOOGLE FONTS INJECTION (Lora + Plus Jakarta Sans)
───────────────────────────────────────── */
const FontLoader = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --cream:       #FAF8F4;
      --cream-dark:  #F2EFE9;
      --sand:        #E8E3DA;
      --sand-deep:   #D4CEC3;
      --ink:         #1C1917;
      --ink-muted:   #44403C;
      --ink-faint:   #78716C;
      --indigo:      #4F46E5;
      --indigo-soft: #EEF2FF;
      --indigo-mid:  #818CF8;
      --rose:        #F43F5E;
      --amber:       #F59E0B;
    }

    body { background: var(--cream); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--ink); }

    .font-display { font-family: 'Lora', Georgia, serif; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--cream-dark); }
    ::-webkit-scrollbar-thumb { background: var(--sand-deep); border-radius: 99px; }

    /* Grain overlay */
    .grain::after {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    }

    /* Nav pill */
    .nav-pill {
      background: white;
      border: 1.5px solid var(--sand);
      border-radius: 999px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }

    /* Cards */
    .card-warm {
      background: white;
      border: 1.5px solid var(--sand);
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.04);
      transition: all 0.35s ease;
    }
    .card-warm:hover {
      box-shadow: 0 8px 40px rgba(0,0,0,0.08);
      transform: translateY(-3px);
    }

    .card-featured {
      background: linear-gradient(145deg, #fdfbf7 0%, #f5f2ed 100%);
      border: 1.5px solid var(--sand);
      border-radius: 24px;
      box-shadow: 0 8px 48px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8);
    }

    /* Pill badge */
    .badge-indigo {
      background: var(--indigo-soft);
      color: var(--indigo);
      border: 1px solid rgba(79,70,229,0.12);
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    /* Buttons */
    .btn-primary {
      background: var(--ink);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 14px 28px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      transition: all 0.25s ease;
      box-shadow: 0 4px 16px rgba(28,25,23,0.2);
    }
    .btn-primary:hover { background: var(--indigo); transform: translateY(-1px); box-shadow: 0 6px 24px rgba(79,70,229,0.3); }
    .btn-primary:active { transform: scale(0.98); }

    .btn-secondary {
      background: white;
      color: var(--ink);
      border: 1.5px solid var(--sand);
      border-radius: 12px;
      padding: 13px 24px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.25s ease;
    }
    .btn-secondary:hover { border-color: var(--indigo); color: var(--indigo); }

    .btn-icon {
      background: var(--ink);
      color: white;
      border: none;
      border-radius: 50%;
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: all 0.25s ease;
      flex-shrink: 0;
    }
    .btn-icon:hover { background: var(--indigo); transform: scale(1.08); }

    /* Avatar stack */
    .avatar-ring {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 2px solid var(--cream);
      background: var(--sand);
      display: flex; align-items: center; justify-content: center;
      color: var(--ink-faint);
    }

    /* Divider ornament */
    .divider-line {
      height: 1.5px;
      background: linear-gradient(90deg, transparent, var(--sand), transparent);
    }

    /* Sketch underline */
    .sketch-underline { position: relative; display: inline-block; }
    .sketch-underline svg { position: absolute; bottom: -6px; left: 0; }

    /* Stat item */
    .stat-pill {
      background: white;
      border: 1.5px solid var(--sand);
      border-radius: 14px;
      padding: 14px 20px;
      display: flex; flex-direction: column; gap: 3px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }

    /* Pulse dot */
    .pulse-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #22C55E;
      animation: pulse-green 2s infinite;
    }
    @keyframes pulse-green {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }

    /* Footer */
    .footer-warm {
      background: var(--cream-dark);
      border-top: 1.5px solid var(--sand);
    }
  `}</style>
);

/* ─────────────────────────────────────────
   LOGO
───────────────────────────────────────── */
const TwasselLogo = ({ size = 24, color = "#1C1917" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <path d="M20 35 H80" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <path d="M50 35 V85" stroke={color} strokeWidth="7" strokeLinecap="round" />
        <circle cx="50" cy="35" r="7" fill="#4F46E5" />
    </svg>
);

/* ─────────────────────────────────────────
   SKETCH UNDERLINE
───────────────────────────────────────── */
const SketchLine = ({ width = 180 }) => (
    <svg width={width} height="10" viewBox={`0 0 ${width} 12`} fill="none" className="sketch-underline" style={{ position: 'absolute', bottom: -6, left: 0 }}>
        <motion.path
            d={`M4 8 C${width * 0.3} 3 ${width * 0.7} 3 ${width - 4} 8`}
            stroke="#4F46E5"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.35"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, delay: 0.8, ease: "easeInOut" }}
        />
    </svg>
);

/* ─────────────────────────────────────────
   MINI FEATURE CARD
───────────────────────────────────────── */
function MiniCard({ icon: Icon, title, desc, accentColor = "#4F46E5", delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
            className="card-warm"
            style={{ padding: '24px' }}
        >
            <div style={{
                width: 44, height: 44,
                borderRadius: 12,
                background: `${accentColor}12`,
                border: `1.5px solid ${accentColor}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: accentColor,
                marginBottom: 16,
            }}>
                <Icon size={20} />
            </div>
            <h4 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 5 }}>{title}</h4>
            <p style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 500, lineHeight: 1.5 }}>{desc}</p>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function App() {
    const [mounted, setMounted] = useState(false);
    const [navScrolled, setNavScrolled] = useState(false);

    useEffect(() => {
        setMounted(true);
        const onScroll = () => setNavScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    if (!mounted) return null;

    return (
        <>
            <FontLoader />
            <div className="grain" style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>

                {/* ─── NAVBAR ─── */}
                <header style={{
                    position: 'sticky', top: 0, zIndex: 100,
                    padding: '0 32px',
                    height: 68,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    maxWidth: 1280,
                    margin: '0 auto',
                    width: '100%',
                    transition: 'all 0.3s ease',
                }}>
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        onClick={() => window.location.href = '/'}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    >
                        <div style={{
                            padding: 8,
                            background: 'white',
                            border: '1.5px solid var(--sand)',
                            borderRadius: 12,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <TwasselLogo size={20} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <span className="font-display" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Twassel</span>
                            <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>The Sanctuary</span>
                        </div>
                    </motion.div>

                    {/* Nav links */}
                    <nav className="nav-pill" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px' }}>
                        {['Philosophy', 'Ecosystem', 'Vision'].map((item) => (
                            <a key={item} href="#" style={{
                                padding: '8px 16px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'var(--ink-faint)',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                letterSpacing: '0.01em',
                            }}
                                onMouseEnter={e => { e.target.style.background = 'var(--indigo-soft)'; e.target.style.color = 'var(--indigo)'; }}
                                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--ink-faint)'; }}
                            >{item}</a>
                        ))}
                    </nav>

                    {/* CTA */}
                    <motion.button
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        onClick={() => window.location.href = '/auth'}
                        className="btn-primary"
                        style={{ borderRadius: 12, fontSize: 13 }}
                    >
                        Enter Portal
                        <ArrowUpRight size={15} />
                    </motion.button>
                </header>

                {/* Top divider */}
                <div className="divider-line" style={{ maxWidth: 1280, margin: '0 auto', width: 'calc(100% - 64px)' }} />

                {/* ─── HERO ─── */}
                <main style={{
                    flex: 1,
                    maxWidth: 1280,
                    margin: '0 auto',
                    width: '100%',
                    padding: '64px 32px 80px',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 60,
                    alignItems: 'center',
                }}>

                    {/* LEFT: Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', gap: 32 }}
                    >
                        {/* Badge */}
                        <div>
                            <span className="badge-indigo">
                                <Sparkles size={11} />
                                Synchronize Intelligence
                            </span>
                        </div>

                        {/* Headline */}
                        <div style={{ position: 'relative' }}>
                            <h1 className="font-display" style={{
                                fontSize: 'clamp(40px, 5.5vw, 76px)',
                                fontWeight: 700,
                                lineHeight: 1.1,
                                letterSpacing: '-0.03em',
                                color: 'var(--ink)',
                            }}>
                                A refined{' '}
                                <span className="sketch-underline" style={{ position: 'relative', display: 'inline-block' }}>
                                    sanctuary
                                    <SketchLine width={200} />
                                </span>
                                <br />
                                to Share{' '}
                                <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>&amp;</span>
                                {' '}Evolve.
                            </h1>
                        </div>

                        {/* Subtext */}
                        <p style={{
                            fontSize: 17,
                            color: 'var(--ink-muted)',
                            lineHeight: 1.75,
                            maxWidth: 480,
                            fontWeight: 400,
                        }}>
                            Designed for{' '}
                            <span className="font-display" style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--ink)' }}>ambitious scholars</span>.
                            A thoughtful ecosystem to synthesize knowledge and grow together under{' '}
                            <span style={{ color: 'var(--indigo)', fontWeight: 600, borderBottom: '1.5px solid #c7d2fe' }}>Twassel</span>.
                        </p>

                        {/* CTAs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <button
                                onClick={() => window.location.href = '/auth'}
                                className="btn-primary"
                                style={{ padding: '15px 32px', fontSize: 14, borderRadius: 14 }}
                            >
                                Begin Onboarding
                                <MoveRight size={18} />
                            </button>
                            <button
                                onClick={() => window.location.href = '/explore'}
                                className="btn-secondary"
                                style={{ padding: '14px 24px', fontSize: 14, borderRadius: 14 }}
                            >
                                Explore
                                <ArrowUpRight size={15} />
                            </button>
                        </div>

                        {/* Social proof */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            paddingTop: 8,
                            borderTop: '1.5px solid var(--sand)',
                        }}>
                            <div style={{ display: 'flex' }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="avatar-ring" style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i }}>
                                        <Users size={14} color="var(--ink-faint)" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>2,800+ scholars joined</p>
                                <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-faint)', marginTop: 2 }}>Active community — growing daily</p>
                            </div>
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="pulse-dot" />
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#22C55E' }}>Live</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT: Cards */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

                        {/* Two mini cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <MiniCard
                                icon={Globe}
                                title="Global Nodes"
                                desc="Interconnected clusters of knowledge across universities."
                                accentColor="#4F46E5"
                                delay={0.1}
                            />
                            <MiniCard
                                icon={Feather}
                                title="Organic Flow"
                                desc="Natural, human-first interactions without friction."
                                accentColor="#EC4899"
                                delay={0.2}
                            />
                        </div>

                        {/* Featured card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="card-featured"
                            style={{ padding: '32px' }}
                        >
                            {/* Top row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                                <div style={{
                                    width: 52, height: 52,
                                    background: 'white',
                                    border: '1.5px solid var(--sand)',
                                    borderRadius: 14,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--indigo)',
                                    boxShadow: '0 2px 12px rgba(79,70,229,0.1)',
                                }}>
                                    <Command size={24} />
                                </div>
                                <span style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: 'var(--ink-faint)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    background: 'white',
                                    border: '1px solid var(--sand)',
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                }}>v3.2</span>
                            </div>

                            {/* Body */}
                            <h3 className="font-display" style={{
                                fontSize: 26,
                                fontWeight: 700,
                                color: 'var(--ink)',
                                lineHeight: 1.25,
                                marginBottom: 10,
                                letterSpacing: '-0.02em',
                            }}>
                                Built for{' '}
                                <span style={{ color: 'var(--indigo)', fontStyle: 'italic' }}>focused</span>{' '}
                                synthesis.
                            </h3>
                            <p style={{ fontSize: 13, color: 'var(--ink-faint)', lineHeight: 1.65, maxWidth: 300, fontWeight: 400 }}>
                                Engage in a collective node built for deep academic focus and meaningful connection.
                            </p>

                            {/* Footer row */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginTop: 28,
                                paddingTop: 20,
                                borderTop: '1.5px solid var(--sand)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="pulse-dot" />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)' }}>Network Synchronized</span>
                                </div>
                                <button
                                    onClick={() => window.location.href = '/explore'}
                                    className="btn-icon"
                                    style={{ width: 40, height: 40 }}
                                >
                                    <ArrowUpRight size={18} />
                                </button>
                            </div>
                        </motion.div>

                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            {[
                                { label: 'Universities', value: '14+' },
                                { label: 'Resources', value: '9.2K' },
                                { label: 'Uptime', value: '99.9%' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + i * 0.08 }}
                                    className="stat-pill"
                                >
                                    <span className="font-display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{stat.value}</span>
                                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* ─── FOOTER ─── */}
                <footer className="footer-warm" style={{ padding: '24px 32px' }}>
                    <div style={{
                        maxWidth: 1280, margin: '0 auto',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flexWrap: 'wrap', gap: 12,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <TwasselLogo size={18} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.02em' }}>Twassel &copy; 2026</span>
                            <span style={{ width: 1, height: 14, background: 'var(--sand)' }} />
                            <span className="font-display" style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--ink-faint)' }}>Synthesize Intelligence.</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-faint)' }}>
                            <span style={{ fontSize: 11, fontWeight: 500 }}>Made with</span>
                            <Heart size={12} fill="var(--rose)" color="var(--rose)" />
                            <span style={{ fontSize: 11, fontWeight: 500 }}>for scholars</span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}