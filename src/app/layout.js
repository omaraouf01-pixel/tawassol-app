import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";

/**
 * TWASSEL — THE ACADEMIC SANCTUARY
 * -------------------------------------------
 * Root Layout Configuration (v4.0 - Performance & Editorial UI)
 * * Modifications & Optimizations:
 * 1. Fonts: Migrated to next/font/google for zero-layout-shift and local hosting.
 * 2. Styling: Removed inline styles in favor of Tailwind utility classes.
 * 3. Human Touch: Added CSS variables for Playfair Display to enable editorial typography.
 */

// 1. Optimize Inter (For technical UI, data, and fast readability)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // Ensures text remains visible during webfont load
});

// 2. Optimize Playfair Display (For editorial headers and human touch)
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: 'swap',
  style: ['normal', 'italic'], // Vital for the editorial aesthetic
});

export const metadata = {
  title: "Twassel — The Academic Sanctuary",
  description: "A premium collaborative ecosystem for scholars to synchronize knowledge and grow together.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      dir="ltr"
      // Inject font variables into the root HTML
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen flex flex-col relative bg-background text-foreground font-sans antialiased selection:bg-brand-indigo/30 selection:text-white"
      >
        {/* HUMAN TOUCH: Subtle Ambient Glow & Texture Layer 
          This layer is completely un-interactive (pointer-events-none) 
          and uses CSS optimizations to prevent layout recalculations.
        */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-noise">
          {/* Asymmetric glows for an organic, non-robotic feel */}
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-indigo/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-brand-fuchsia/5 rounded-full blur-[120px]" />
        </div>

        {/* CORE ARCHITECTURE: 
          All pages and components (Hub, Auth, Explore) are injected here. 
          The logic remains 100% untouched.
        */}
        <main className="relative z-10 flex-1 flex flex-col">
          {children}
        </main>

      </body>
    </html>
  );
}