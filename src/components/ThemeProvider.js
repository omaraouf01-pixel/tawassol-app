"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Wraps next-themes. Manual toggle only (no system detection).
 * - storageKey: where the user choice is saved in localStorage
 * - defaultTheme: light unless the user has previously chosen dark
 */
export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="twassel-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
