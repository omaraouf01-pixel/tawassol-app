/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Latin scripts (en/fr) — Inter handles French diacritics cleanly.
        // For Arabic we cascade to Tajawal / IBM Plex Sans Arabic so the
        // browser picks the Arabic-shaping font when rendering ar glyphs.
        sans: [
          "Inter",
          "Tajawal",
          "IBM Plex Sans Arabic",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        serif: ["Playfair Display", "Georgia", "serif"],
        display: ["Lora", "Georgia", "serif"],
        arabic: ["Tajawal", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
      },

      colors: {
        // Cozy palette — driven by CSS variables so dark mode swaps cleanly
        cream:   "rgb(var(--c-cream) / <alpha-value>)",
        paper:   "rgb(var(--c-paper) / <alpha-value>)",
        sand:    "rgb(var(--c-sand) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          muted:   "rgb(var(--c-ink-muted) / <alpha-value>)",
          faint:   "rgb(var(--c-ink-faint) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--c-accent) / <alpha-value>)",
          soft:    "rgb(var(--c-accent-soft) / <alpha-value>)",
        },

        // Legacy aliases kept so existing pages keep working until migrated
        background: "rgb(var(--c-cream) / <alpha-value>)",
        foreground: "rgb(var(--c-ink) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--c-paper) / <alpha-value>)",
          hover:   "rgb(var(--c-sand) / <alpha-value>)",
          accent:  "rgb(var(--c-sand) / 0.4)",
        },
        brand: {
          indigo:  "#6366F1",
          fuchsia: "#D946EF",
          muted:   "rgba(99, 102, 241, 0.1)",
        },
      },

      boxShadow: {
        soft:    "0 4px 24px -8px rgb(var(--c-shadow) / 0.18)",
        warm:    "0 8px 40px -12px rgb(var(--c-shadow) / 0.22)",
        glow:    "0 0 24px rgba(99, 102, 241, 0.18)",
        premium: "0 20px 50px rgba(0, 0, 0, 0.6)",
        glass:   "0 8px 32px 0 rgba(0, 0, 0, 0.8)",
      },

      animation: {
        "float-slow": "float 8s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer:      "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%":      { transform: "translateY(-15px) rotate(0.5deg)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },

      borderWidth: { thin: "0.5px" },
      backdropBlur: { xs: "2px", premium: "20px" },
    },
  },
  plugins: [],
};
