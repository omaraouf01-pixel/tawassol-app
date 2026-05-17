import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/useAuth";

export const metadata = {
  title: "Twassel - A cozy place for scholars",
  description: "A warm, collaborative space for students to share knowledge and grow together.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-cream text-ink">
        <ThemeProvider>
          <AuthProvider>
            <main className="relative z-10 flex-1 flex flex-col">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
