import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  HeartHandshake,
  MapPin,
  Package,
  Plus,
  Radar,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/roles";
import { DonationCard } from "@/components/donation/donation-card";
import { mockDonorDashboard } from "@/lib/mock-data";

const categories = [
  { name: "Clothes", emoji: "👕", bg: "bg-[#22C55E]", chip: "bg-[#F1FCF5] text-[#17A34A]" },
  { name: "Books", emoji: "📚", bg: "bg-[#1CB0F6]", chip: "bg-[#F0F9FF] text-[#0284C7]" },
  { name: "Blankets", emoji: "🛏️", bg: "bg-[#FFC800]", chip: "bg-[#FFFBEB] text-[#8A6300]" },
  { name: "Meals", emoji: "🍲", bg: "bg-[#FF6B6B]", chip: "bg-[#FFF1F2] text-[#E11D48]" },
  { name: "Toys", emoji: "🧸", bg: "bg-[#7C6EF2]", chip: "bg-[#F5F3FF] text-[#7C6EF2]" },
  { name: "More", emoji: "📦", bg: "bg-[#06B6D4]", chip: "bg-[#ECFEFF] text-[#0E7490]" },
];

export default async function Home() {
  const auth = await getAuthContext();
  const userName = auth.user ? (auth.profile?.full_name?.split(" ")[0] ?? "Aisha") : "Aisha";
  const primaryHref =
    auth.user && auth.role ? getDefaultRouteForRole(auth.role) : "/login";

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 pb-12">
      {/* 1. Hero Block: Ink moment per Spec §4 redlines 1 & 2 */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#14251C] via-[#162D22] to-[#1C3327] p-6 text-white shadow-[0_20px_48px_-12px_rgba(20,37,28,0.4)] sm:p-9">
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#22C55E]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#FFC800]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                Good evening
              </span>
              <span className="inline-block rounded-full bg-[#22C55E]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#22C55E]">
                Mumbai
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {userName} 👋
            </h1>
            <p className="max-w-md text-sm font-medium leading-relaxed text-white/80">
              Someone nearby could use what you don&apos;t. Give essentials in ~90 seconds with zero coordination drag.
            </p>
          </div>

          {/* Floating Stat Badges (Spec §4 Redline 2) */}
          <div className="flex flex-col gap-3 shrink-0 sm:flex-row md:flex-col">
            {/* Impact Points Card */}
            <div className="floatcard flex items-center justify-between gap-4 rounded-2xl bg-white p-3.5 shadow-lg">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Impact
                </span>
                <p className="font-display text-xl font-bold text-[#8A6300]">
                  210 pts
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFFBEB] text-xl">
                ⭐
              </span>
            </div>

            {/* Live Status Pill */}
            <div className="floatcard flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-md">
              <span className="dot-live" />
              <span className="text-xs font-bold text-[#14251C]">
                All clear · no pending action
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Big Give CTA Button (Spec §4 Redline 3) */}
      <Link
        href="/donor/donate"
        className="group flex items-center justify-between rounded-[24px] bg-[#22C55E] p-5 sm:p-6 text-white shadow-[0_12px_32px_rgba(34,197,94,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#17A34A] hover:shadow-[0_16px_40px_rgba(34,197,94,0.42)] active:scale-[0.98]"
      >
        <div className="space-y-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/90">
            TAKES ~90 SEC
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Give something today
          </h2>
          <p className="text-xs font-medium text-white/85 sm:text-sm">
            Clothes, books, blankets, meals or toys for verified NGOs nearby.
          </p>
        </div>

        {/* 48px circle arrow tap target */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#17A34A] shadow-md transition-transform duration-200 group-hover:scale-110 group-active:scale-90">
          <ArrowRight className="h-6 w-6 stroke-[3]" />
        </div>
      </Link>

      {/* 3. Category Shortcuts Grid (Spec §4 Redline 4) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display text-base font-bold text-[#14251C]">
            Quick Categories
          </h3>
          <span className="text-xs font-bold text-[#6B7280]">
            Tap to start
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/donor/donate?category=${encodeURIComponent(cat.name === "More" ? "Clothes" : cat.name)}`}
              className="group flex flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white p-3.5 text-center shadow-xs transition-all duration-150 hover:-translate-y-1 hover:border-[#22C55E] hover:shadow-md active:scale-95"
            >
              <span className="text-3xl transition-transform duration-200 group-hover:scale-115">
                {cat.emoji}
              </span>
              <span className="mt-2 font-display text-xs font-bold text-[#14251C] truncate w-full">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Gamified Streak Flame & Neighborhood Impact (Spec §4 Redlines 7 & 8) */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Streak Flame Card (Clean surface per 'Ink once per screen max' token rule) */}
        <div className="flex flex-col justify-between rounded-[26px] border border-[#E5E7EB] bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FFFBEB] text-3xl shadow-xs animate-streak-flame">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8A6300]">
                  Active streak
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#14251C]">
                5-week streak
              </h3>
              <p className="text-xs text-[#6B7280]">
                You&apos;ve given something 5 weeks running
              </p>
            </div>
          </div>

          {/* 5-Week Diamond Tracker per Reference 1 */}
          <div className="mt-5 grid grid-cols-5 gap-1.5 border-t border-[#E5E7EB] pt-4 text-center">
            {["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5"].map((wk, idx) => (
              <div
                key={wk}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 transition ${
                  idx === 4 ? "bg-[#FFFBEB] ring-1 ring-[#FFC800]" : "bg-[#FCFCFA] border border-[#E5E7EB]/70"
                }`}
              >
                <span className="text-base">{idx === 4 ? "⭐" : "💎"}</span>
                <span className="font-display text-[11px] font-bold text-[#8A6300]">
                  {wk}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Neighborhood Aggregate Impact (Aggregate Only) */}
        <div className="flex flex-col justify-between rounded-[26px] border border-[#E5E7EB] bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Community Shared Effort
              </span>
              <span className="text-[11px] font-bold text-[#17A34A]">
                Mumbai
              </span>
            </div>
            <h3 className="font-display text-lg font-bold text-[#14251C]">
              Your neighbourhood this week
            </h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB]/80 bg-[#FCFCFA] px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1FCF5] text-base">
                  🧥
                </span>
                <span className="text-xs font-bold text-[#14251C]">
                  Clothes given
                </span>
              </div>
              <span className="font-display text-xs font-bold text-[#17A34A]">
                18 items
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB]/80 bg-[#FCFCFA] px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0F9FF] text-base">
                  📚
                </span>
                <span className="text-xs font-bold text-[#14251C]">
                  Books given
                </span>
              </div>
              <span className="font-display text-xs font-bold text-[#0284C7]">
                42 items
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB]/80 bg-[#FCFCFA] px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF1F2] text-base">
                  🍚
                </span>
                <span className="text-xs font-bold text-[#14251C]">
                  Meals shared
                </span>
              </div>
              <span className="font-display text-xs font-bold text-[#E11D48]">
                65 items
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Active Loop / Feed */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display text-lg font-bold text-[#14251C]">
            Recent Neighborhood Loop
          </h3>
          <Link
            href="/donor/dashboard"
            className="text-xs font-bold text-[#17A34A] hover:underline"
          >
            View Dashboard →
          </Link>
        </div>

        <div className="grid gap-3">
          {mockDonorDashboard.listings.map((listing) => (
            <DonationCard
              key={listing.id}
              href={`/donor/listings/${listing.id}`}
              listing={listing}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

