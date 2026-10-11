"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Home, Plus, Radar, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  role?: string | null;
  hasUser: boolean;
};

export function MobileNav({ role, hasUser }: MobileNavProps) {
  const pathname = usePathname();

  const isHome = pathname === "/" || pathname === "/donor/dashboard";
  const isDonate = pathname.startsWith("/donor/donate");
  const isNgo = pathname.startsWith("/ngo");
  const isAdmin = pathname.startsWith("/admin");
  const isAuth = pathname.startsWith("/login");

  if (isDonate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-[min(94vw,420px)] lg:hidden">
      <nav className="flex items-center justify-between rounded-full border border-white/60 bg-white/92 px-3 py-2 shadow-[0_16px_40px_rgba(20,37,28,0.16)] backdrop-blur-xl">
        {/* Home */}
        <Link
          href={role === "ngo" ? "/ngo/dashboard" : role === "admin" ? "/admin/dashboard" : "/"}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 transition-all",
            isHome && !isDonate && !isNgo && !isAdmin
              ? "bg-[#14251C] text-[#22C55E]"
              : "text-[#6B7280] hover:text-[#111111]",
          )}
          aria-label="Home"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>

        {/* Impact / Streak */}
        <Link
          href="/donor/dashboard"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 transition-all",
            pathname === "/donor/dashboard"
              ? "bg-[#FFFBEB] text-[#8A6300]"
              : "text-[#6B7280] hover:text-[#111111]",
          )}
          aria-label="Impact and Streak"
        >
          <Flame className="h-5 w-5 fill-[#FFC800] text-[#FFC800]" />
          <span className="text-[10px] font-bold">Streak</span>
        </Link>

        {/* Big Give Button (Floating Center Action) */}
        <Link
          href="/donor/donate"
          className="relative -top-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#22C55E] text-white shadow-[0_10px_24px_rgba(34,197,94,0.42)] transition-transform hover:scale-105 active:scale-95"
          aria-label="Give something"
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </Link>

        {/* NGO Live Radar */}
        <Link
          href="/ngo/dashboard"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 transition-all",
            isNgo ? "bg-[#14251C] text-[#22C55E]" : "text-[#6B7280] hover:text-[#111111]",
          )}
          aria-label="NGO Radar"
        >
          <Radar className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Radar</span>
        </Link>

        {/* Profile / Admin / Login */}
        <Link
          href={hasUser ? (role === "admin" ? "/admin/dashboard" : "/donor/dashboard") : "/login"}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 transition-all",
            isAdmin || isAuth
              ? "bg-[#14251C] text-[#22C55E]"
              : "text-[#6B7280] hover:text-[#111111]",
          )}
          aria-label="Account"
        >
          {role === "admin" ? (
            <ShieldCheck className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5" />
          )}
          <span className="text-[10px] font-semibold">
            {hasUser ? (role === "admin" ? "Admin" : "Profile") : "Login"}
          </span>
        </Link>
      </nav>
    </div>
  );
}
