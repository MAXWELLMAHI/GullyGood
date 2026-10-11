import Link from "next/link";
import { Flame, Sparkles, HeartHandshake, Shield, User } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { getAuthContext } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/roles";
import { BrandLogo } from "@/components/ui/brand-logo";

export async function SiteHeader() {
  const auth = await getAuthContext();
  const dashboardHref = auth.role ? getDefaultRouteForRole(auth.role) : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB]/80 bg-[#FCFCFA]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5 transition-transform">
            <BrandLogo size="md" priority />
            <span className="hidden rounded-full bg-[#F1FCF5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#17A34A] sm:inline-block">
              Mumbai
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white p-1 text-sm font-semibold text-[#6B7280] md:flex">
          <Link
            href="/donor/dashboard"
            className="rounded-full px-4 py-1.5 transition hover:bg-[#F1FCF5] hover:text-[#14251C]"
          >
            Donor
          </Link>
          <Link
            href="/ngo/dashboard"
            className="rounded-full px-4 py-1.5 transition hover:bg-[#F1FCF5] hover:text-[#14251C]"
          >
            NGO Radar
          </Link>
          <Link
            href="/admin/dashboard"
            className="rounded-full px-4 py-1.5 transition hover:bg-[#F1FCF5] hover:text-[#14251C]"
          >
            Admin
          </Link>
        </nav>

        {/* Right Actions & Gamification Status */}
        <div className="flex items-center gap-2.5">
          {/* Gamification Streak & Points Pill */}
          <Link
            href="/donor/dashboard"
            className="hidden items-center gap-2 rounded-full border border-[#FFC800]/40 bg-[#FFFBEB] px-3 py-1.5 text-xs font-bold text-[#8A6300] transition hover:scale-105 sm:flex"
            title="5-week donation streak!"
          >
            <Flame className="h-4 w-4 fill-[#FFC800] text-[#FFC800]" />
            <span>5-wk streak</span>
            <span className="rounded-full bg-[#FFC800] px-1.5 py-0.2 text-[10px] font-extrabold text-[#14251C]">
              210 pts
            </span>
          </Link>

          {auth.previewMode ? (
            <span className="hidden rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#6B7280] md:inline-flex">
              Demo mode
            </span>
          ) : null}

          {auth.user ? (
            <div className="flex items-center gap-2">
              <Link
                href={dashboardHref}
                className="hidden rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#14251C] shadow-sm transition hover:border-[#22C55E]/50 hover:bg-[#F1FCF5] sm:inline-flex"
              >
                Dashboard
              </Link>
              <form action={signOutAction}>
                <button
                  className="rounded-full bg-[#14251C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1B3226]"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(34,197,94,0.3)] transition hover:bg-[#17A34A] hover:shadow-[0_10px_22px_rgba(34,197,94,0.4)]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

