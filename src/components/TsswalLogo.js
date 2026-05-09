"use client";

/**
 * TSSWAL Logo — T & S forming a collaboration star.
 *
 * Variants:
 *   <TsswalLogo />               → default 36px square mark
 *   <TsswalLogo size={48} />     → custom size
 *   <TsswalLogo glow />          → with indigo halo behind
 *   <TsswalLogo lockup />        → mark + "TSSWAL" wordmark side by side
 *   <TsswalLogo lockup glow />   → both
 *
 * Color tokens (strict design system) :
 *   - Indigo 500  #6366F1   (primary accent)
 *   - Violet 500  #8B5CF6   (gradient stop)
 *   - Fuchsia 500 #D946EF   (highlight only)
 *   - Deep Navy   #0F172A   (background)
 */
export default function TsswalLogo({
  size = 36,
  glow = false,
  lockup = false,
  className = "",
}) {
  const mark = (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      {glow && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-indigo-500 blur-lg opacity-50"
        />
      )}
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className="relative"
        aria-label="TSSWAL"
      >
        <defs>
          <linearGradient id="tsswalBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="tsswalLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {/* Rounded rhombus frame (collaboration star body) */}
        <path
          d="M32 4 L60 32 L32 60 L4 32 Z"
          fill="url(#tsswalBody)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />

        {/* Inner glow accent */}
        <path
          d="M32 12 L52 32 L32 52 L12 32 Z"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.8"
        />

        {/* T (top stroke + vertical) */}
        <path
          d="M22 22 H42 M32 22 V42"
          stroke="url(#tsswalLight)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* S curve interlocking (stylized) */}
        <path
          d="M27 30
             C 27 27 32 27 32 30
             C 32 33 37 33 37 36
             C 37 39 32 39 32 36"
          stroke="url(#tsswalLight)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />

        {/* 4 collaboration nodes (corners) */}
        <circle cx="32" cy="6"  r="2" fill="#A5B4FC" />
        <circle cx="58" cy="32" r="2" fill="#C4B5FD" />
        <circle cx="32" cy="58" r="2" fill="#F0ABFC" />
        <circle cx="6"  cy="32" r="2" fill="#A5B4FC" />
      </svg>
    </div>
  );

  if (!lockup) return <span className={className}>{mark}</span>;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark}
      <span
        className="font-black tracking-tight bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent"
        style={{ fontSize: Math.max(14, size * 0.45) }}
      >
        TSSWAL
      </span>
    </span>
  );
}
