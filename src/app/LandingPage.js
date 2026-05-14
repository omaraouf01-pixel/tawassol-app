"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowRight, Users, MessageSquare, BookOpen,
    Sparkles, ShieldCheck, GraduationCap
} from "lucide-react";
import TsswalLogo from "@/components/TsswalLogo";

/* ─── Animated underline decoration (same as Auth) ─── */
const WaveLine = () => (
    <svg width="120" height="12" viewBox="0 0 160 12" fill="none" className="mt-1">
        <motion.path
            d="M2 9 C30 2, 60 10, 90 4 C120 -2, 140 8, 158 5"
            stroke="#6366f1" strokeWidth="3" strokeLinecap="round" fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        />
    </svg>
);

export default function LandingPage() {
    const router = useRouter();

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .land-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8faff 0%, #eef2ff 50%, #fdf4ff 100%);
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
        }

        .land-logo-name {
          font-family: 'Lora', serif;
          font-weight: 600;
          font-style: italic;
          font-size: 18px;
          color: #1e1b4b;
          letter-spacing: 0.04em;
        }
        .land-logo-sub {
          font-size: 10px;
          font-weight: 700;
          color: #6366f1;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .land-pill-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 100px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .land-pill-btn:hover {
          background: #f0f4ff;
          color: #4f46e5;
          border-color: #c7d2fe;
        }

        .land-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          border-radius: 14px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(79,70,229,0.30);
        }
        .land-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(79,70,229,0.38);
        }
        .land-cta-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 16px 24px;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: color 0.2s;
        }
        .land-cta-ghost:hover { color: #4f46e5; }

        .left-headline {
          font-family: 'Lora', serif;
          font-size: clamp(42px, 5.2vw, 76px);
          font-weight: 600;
          color: #1e1b4b;
          line-height: 1.08;
          letter-spacing: -0.02em;
        }
        .left-headline em {
          font-style: italic;
          color: #6366f1;
        }
        .left-desc {
          font-size: 15px;
          color: #64748b;
          line-height: 1.75;
          max-width: 460px;
          margin-top: 28px;
        }

        .trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 100px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #16a34a;
          margin-top: 28px;
        }
        .trust-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 700;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        /* ── Showcase card on the right ── */
        .show-card {
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 4px 6px -1px rgba(99,102,241,0.04),
                      0 30px 60px -12px rgba(99,102,241,0.18),
                      0 0 0 1px rgba(99,102,241,0.06);
          padding: 32px;
          width: 100%;
          max-width: 460px;
          position: relative;
        }
        .show-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 18px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 20px;
        }
        .show-card-title {
          font-family: 'Lora', serif;
          font-size: 18px;
          font-weight: 600;
          color: #1e1b4b;
        }
        .show-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6366f1;
          background: #eef2ff;
          padding: 4px 10px;
          border-radius: 100px;
        }

        .feature-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px;
          border-radius: 14px;
          transition: background 0.2s;
        }
        .feature-row:hover { background: #fafbff; }
        .feature-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #eef2ff, #f5f3ff);
          border: 1px solid #e0e7ff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4f46e5;
          flex-shrink: 0;
        }
        .feature-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e1b4b;
          margin-bottom: 3px;
        }
        .feature-desc {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.55;
        }

        .mini-stat {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 22px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }
        .mini-stat-num {
          font-family: 'Lora', serif;
          font-size: 24px;
          font-weight: 700;
          color: #4f46e5;
        }
        .mini-stat-label {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 2px;
        }
        .mini-stat-divider {
          width: 1px;
          height: 36px;
          background: #f1f5f9;
        }

        /* ── Floating decorative dots ── */
        .float-dot {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, #818cf8, #c084fc);
          opacity: 0.15;
          filter: blur(40px);
          pointer-events: none;
        }

        @media (max-width: 1024px) {
          .land-right { display: none; }
          .land-main { justify-content: center; }
        }
      `}</style>

            <div className="land-root" dir="ltr">

                {/* decorative blobs */}
                <div className="float-dot" style={{ width: 300, height: 300, top: -80, right: -60 }} />
                <div className="float-dot" style={{ width: 240, height: 240, bottom: -60, left: -40, background: 'linear-gradient(135deg, #c084fc, #f0abfc)' }} />

                {/* ─── Header ─── */}
                <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1360, width: '100%', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => router.push('/')}>
                        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TsswalLogo size={18} style={{ color: 'white' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1.5px solid #e2e8f0', paddingLeft: 14 }}>
                            <span className="land-logo-name">Twassel</span>
                            <span className="land-logo-sub">Academic Network</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={() => router.push('/auth')}
                            className="land-pill-btn"
                        >
                            Sign in
                        </button>
                        <button
                            onClick={() => router.push('/auth?mode=register')}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none', borderRadius: 100, padding: '9px 18px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: '0 4px 14px rgba(79,70,229,0.25)' }}
                        >
                            Get started <ArrowRight size={13} />
                        </button>
                    </div>
                </header>

                {/* ─── Main ─── */}
                <main
                    className="land-main"
                    style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1360, width: '100%', margin: '0 auto', padding: '40px 40px 80px', gap: 60, position: 'relative', zIndex: 5 }}
                >

                    {/* Left: Brand copy */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{ flex: 1, paddingRight: 20 }}
                    >
                        <p className="eyebrow">
                            <Sparkles size={12} /> Oran University Network
                        </p>

                        <h1 className="left-headline">
                            A place to<br />
                            learn, share,<br />
                            and <em>grow together.</em>
                        </h1>

                        <WaveLine />

                        <p className="left-desc">
                            Twassel brings students and academics together in focused groups —
                            where real conversations happen, knowledge actually sticks,
                            and your university network becomes your strongest asset.
                        </p>

                        <div className="trust-badge">
                            <span className="trust-dot" />
                            Trusted by Oran University students
                        </div>

                        {/* CTAs */}
                        <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button
                                onClick={() => router.push('/auth?mode=register')}
                                className="land-cta"
                            >
                                Join the community <ArrowRight size={16} />
                            </button>
                            <button
                                onClick={() => router.push('/auth')}
                                className="land-cta-ghost"
                            >
                                I already have an account
                            </button>
                        </div>

                        {/* Numbered list */}
                        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                { icon: "01", text: "Access shared academic resources" },
                                { icon: "02", text: "Connect with fellow students" },
                                { icon: "03", text: "Manage your university profile" },
                            ].map(item => (
                                <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <span style={{ width: 32, height: 32, borderRadius: 8, background: '#f0f4ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#4f46e5', flexShrink: 0 }}>
                                        {item.icon}
                                    </span>
                                    <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                                        {item.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Showcase card */}
                    <motion.div
                        className="land-right"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        style={{ flexShrink: 0, width: '100%', maxWidth: 460 }}
                    >
                        <div className="show-card">

                            <div className="show-card-header">
                                <div>
                                    <h3 className="show-card-title">What you'll get</h3>
                                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Everything in one academic hub</p>
                                </div>
                                <span className="show-tag">Free</span>
                            </div>

                            {/* Features */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {[
                                    { icon: <Users size={18} />, title: "Study Groups", desc: "Join or create focused groups around any subject." },
                                    { icon: <MessageSquare size={18} />, title: "Real-time Chat", desc: "Discuss, ask, and share notes in real time with peers." },
                                    { icon: <BookOpen size={18} />, title: "Shared Resources", desc: "Upload and find files, links and materials in one place." },
                                ].map((f, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                                        className="feature-row"
                                    >
                                        <div className="feature-icon-box">{f.icon}</div>
                                        <div>
                                            <div className="feature-title">{f.title}</div>
                                            <div className="feature-desc">{f.desc}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Mini stats */}
                            <div className="mini-stat">
                                <div>
                                    <div className="mini-stat-num">500+</div>
                                    <div className="mini-stat-label">Students</div>
                                </div>
                                <div className="mini-stat-divider" />
                                <div>
                                    <div className="mini-stat-num">40+</div>
                                    <div className="mini-stat-label">Groups</div>
                                </div>
                                <div className="mini-stat-divider" />
                                <div>
                                    <div className="mini-stat-num">24/7</div>
                                    <div className="mini-stat-label">Active</div>
                                </div>
                            </div>
                        </div>

                        {/* Footer note under card */}
                        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16, lineHeight: 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <ShieldCheck size={12} /> Secure university-only access
                        </p>
                    </motion.div>

                </main>
            </div>
        </>
    );
}
