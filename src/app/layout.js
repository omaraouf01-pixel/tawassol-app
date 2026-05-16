import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/useAuth";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

export const metadata = {
  title: "Twassel — A cozy place for scholars",
  description: "A warm, collaborative space for students to share knowledge and grow together.",
};

// Inline script — runs before React hydrates, so the first paint already has
// the correct `dir` and `lang` on <html>. This avoids an RTL flash for Arabic
// users on cold loads.
const langBootstrap = `
(function(){try{
  var k='twassel-language';
  var supported=['en','ar','fr'];
  var stored=localStorage.getItem(k);
  var nav=(navigator.language||'').slice(0,2).toLowerCase();
  var lang=supported.indexOf(stored)>-1?stored:(supported.indexOf(nav)>-1?nav:'en');
  var dir=lang==='ar'?'rtl':'ltr';
  var h=document.documentElement;
  h.setAttribute('lang',lang);
  h.setAttribute('dir',dir);
  h.dataset.lang=lang;
}catch(e){}})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: langBootstrap }} />
      </head>
      <body className="min-h-screen flex flex-col bg-cream text-ink">
        <ThemeProvider>
          <I18nProvider>
            {/* تغليف التطبيق بـ AuthProvider يضمن بقاء الجلسة نشطة أثناء التنقل */}
            <AuthProvider>
              <main className="relative z-10 flex-1 flex flex-col">
                {children}
              </main>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}