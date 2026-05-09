"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  FiHome, FiCompass, FiUser, FiShield,
  FiLogOut, FiPlus,
} from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import TsswalLogo from "@/components/TsswalLogo";
import NotificationsBell from "@/components/NotificationsBell";

const NAV = [
  { label: "Hub", icon: FiHome, href: "/hub" },
  { label: "Explore", icon: FiCompass, href: "/explore" },
  { label: "Profile", icon: FiUser, href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData } = useAuth();

  const name = userData?.name || user?.email?.split("@")[0] || "Étudiant";
  const initial = name[0]?.toUpperCase() || "S";
  const role = userData?.role === "admin" ? "Admin" : "Étudiant";

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth");
  };

  return (
    <aside className="w-60 h-screen bg-slate-950 border-r border-white/10 fixed left-0 top-0 flex flex-col p-4 z-20 backdrop-blur-xl">
      {/* Decorative blob */}
      <div aria-hidden className="absolute top-0 left-0 w-60 h-60 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Logo + bell */}
      <div className="flex items-center justify-between px-2 py-2 mb-6">
        <Link href="/hub" className="flex group">
          <TsswalLogo size={28} lockup glow className="group-hover:scale-[1.02] transition-transform" />
        </Link>
        <NotificationsBell />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/hub" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
                active
                  ? "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-violet-500/30 ring-1 ring-white/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
        {userData?.role === "admin" && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              pathname === "/admin"
                ? "bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white shadow-lg shadow-fuchsia-500/30 ring-1 ring-white/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <FiShield size={17} />
            Admin
          </Link>
        )}
      </nav>

      {/* Bottom */}
      <div className="space-y-2 mt-4">
        <Link
          href="/groups/create"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm font-bold hover:bg-white/10 hover:border-violet-400/30 transition-all"
        >
          <FiPlus size={15} />
          Nouveau groupe
        </Link>
        <div className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/10 rounded-xl backdrop-blur-sm">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-lg shadow-violet-500/40 ring-1 ring-white/20">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{name}</p>
            <p className="text-xs text-slate-500">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-sm font-semibold"
        >
          <FiLogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
