import Link from "next/link";
import { ArrowRight, Clock, Flame, HeartHandshake, MapPin, Plus, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DonationCard } from "@/components/donation/donation-card";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getDonorDashboardData } from "@/lib/data";

const categories = [
  { name: "Clothes", emoji: "👕", bg: "bg-[#22C55E]", chip: "bg-[#F1FCF5] text-[#17A34A]" },
  { name: "Books", emoji: "📚", bg: "bg-[#1CB0F6]", chip: "bg-[#F0F9FF] text-[#0284C7]" },
  { name: "Blankets", emoji: "🛏️", bg: "bg-[#FFC800]", chip: "bg-[#FFFBEB] text-[#8A6300]" },
  { name: "Packed Meals", emoji: "🍲", bg: "bg-[#FF6B6B]", chip: "bg-[#FFF1F2] text-[#E11D48]" },
  { name: "Toys", emoji: "🧸", bg: "bg-[#7C6EF2]", chip: "bg-[#F5F3FF] text-[#7C6EF2]" },
  { name: "Utensils", emoji: "🥣", bg: "bg-[#06B6D4]", chip: "bg-[#ECFEFF] text-[#0E7490]" },
];

export default async function DonorDashboardPage() {
  const auth = await requireRole("donor");
  const data = await getDonorDashboardData(auth.user?.id);
  const userName = auth.user?.user_metadata?.full_name || "Aisha";

  return (
    <div className="flex flex-col gap-8 pb-6">
      {/* 1. Donor Ink Hero Header per Spec §4 */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#14251C] via-[#162D22] to-[#1C3A2D] p-6 text-white shadow-[0_24px_60px_-12px_rgba(20,37,28,0.35)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#22C55E]/15 blur-3xl" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_320px] lg:items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#22C55E] backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                Donor Hub
              </span>
              <span className="text-xs font-medium text-white/70">
                Level 6 · Eco Champion
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Good evening
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {userName} 👋
              </h1>
              <p className="text-sm text-white/80">
                Track your active listings and see your neighborhood donation impact in real time.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/donor/donate"
                className="inline-flex items-center gap-2 rounded-full bg-[#22C55E] px-5 py-3 font-display text-sm font-bold text-white shadow-[0_10px_24px_rgba(34,197,94,0.4)] transition-all hover:scale-105 hover:bg-[#17A34A] active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Give something</span>
              </Link>
            </div>
          </div>

          {/* Right Floating Stat Cards (Spec §4 redline 1 & 2) */}
          <div className="flex flex-col gap-3">
            <div className="floatcard flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFFBEB] text-xl">
                  🔥
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                    Impact Points
                  </p>
                  <p className="font-display text-lg font-bold text-[#14251C]">
                    210 pts
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#FFC800] px-2.5 py-0.5 font-display text-xs font-extrabold text-[#14251C]">
                +30 this wk
              </span>
            </div>

            <div className="floatcard flex items-center gap-2.5">
              <span className="dot-live" />
              <p className="text-xs font-semibold text-[#14251C]">
                All clear · no pending pickups requiring action
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Big Give Banner & Category Shortcuts (Spec §4 redlines 3 & 4) */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Link
          href="/donor/donate"
          className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-[#22C55E] p-6 text-white shadow-[0_16px_40px_rgba(34,197,94,0.28)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(34,197,94,0.38)] active:scale-[0.99] sm:p-7"
        >
          <div className="space-y-1.5">
            <span className="inline-block rounded-full bg-black/15 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-white">
              TAKES ~90 SEC
            </span>
            <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
              Give something today
            </h2>
            <p className="text-xs font-medium text-white/90">
              Someone nearby in Mumbai could use what you don&apos;t.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">
              Create new donation
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#17A34A] shadow-md transition-transform duration-200 group-hover:scale-110 group-active:scale-90">
              <ArrowRight className="h-5 w-5 stroke-[2.5]" />
            </div>
          </div>
        </Link>

        {/* Categories Shortcuts */}
        <div className="flex flex-col justify-between rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#14251C]">
              Category shortcuts
            </h3>
            <span className="text-xs font-semibold text-[#6B7280]">
              Skip to step 2
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/donor/donate?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-[#FCFCFA] p-2.5 text-center transition-all duration-150 hover:-translate-y-0.5 hover:border-[#22C55E] hover:bg-white hover:shadow-sm active:scale-95"
              >
                <span className="text-xl transition-transform duration-200 group-hover:scale-115">
                  {cat.emoji}
                </span>
                <span className="mt-1 font-display text-[11px] font-bold text-[#14251C] truncate w-full">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Streak Flame & Community Aggregate Impact */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Streak Flame Card (Clean surface per 'Ink once per screen max' token rule) */}
        <div className="flex flex-col justify-between rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFFBEB] text-2xl shadow-xs animate-streak-flame">
              🔥
            </div>
            <div className="space-y-1">
              <span className="inline-block rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8A6300]">
                Active streak
              </span>
              <h3 className="font-display text-xl font-bold text-[#14251C]">
                5-week streak
              </h3>
              <p className="text-xs text-[#6B7280]">
                You&apos;ve given something 5 weeks running!
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-5 gap-2 border-t border-[#E5E7EB] pt-4 text-center">
            {["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5"].map((wk, idx) => (
              <div
                key={wk}
                className={`flex flex-col items-center gap-1 rounded-2xl p-2 transition ${
                  idx === 4 ? "bg-[#FFFBEB] ring-1 ring-[#FFC800]" : "bg-[#FCFCFA] border border-[#E5E7EB]/70"
                }`}
              >
                <span className="text-sm">{idx === 4 ? "⭐" : "💎"}</span>
                <span className="font-display text-xs font-bold text-[#8A6300]">
                  {wk}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Neighborhood Weekly Stats */}
        <div className="flex flex-col justify-between rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1FCF5] px-2.5 py-0.5 text-xs font-bold text-[#17A34A] uppercase tracking-wider">
                <HeartHandshake className="h-3.5 w-3.5" />
                Community Impact
              </span>
              <span className="text-xs font-semibold text-[#6B7280]">
                Mumbai aggregate
              </span>
            </div>
            <h3 className="mt-1.5 font-display text-lg font-bold text-[#14251C]">
              Your neighbourhood this week
            </h3>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-[#FCFCFA] p-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-base">👕</span>
                <span className="font-display text-xs font-bold text-[#14251C]">Clothes given</span>
              </div>
              <span className="font-display text-xs font-bold text-[#17A34A]">18 items</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-[#FCFCFA] p-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📚</span>
                <span className="font-display text-xs font-bold text-[#14251C]">Books given</span>
              </div>
              <span className="font-display text-xs font-bold text-[#0284C7]">42 items</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-[#FCFCFA] p-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🍲</span>
                <span className="font-display text-xs font-bold text-[#14251C]">Meals shared</span>
              </div>
              <span className="font-display text-xs font-bold text-[#E11D48]">65 meals</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Stat Numbers Row */}
      <section className="grid gap-4 md:grid-cols-3">
        {data.stats.map((stat) => (
          <div key={stat.label} className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">{stat.label}</p>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight text-[#14251C]">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">{stat.hint}</p>
          </div>
        ))}
      </section>

      {/* 5. Active & Past Listings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#14251C]">
              Your donation activity
            </h2>
            <p className="text-sm text-[#6B7280]">
              Track pickups, coordination chats, and completed deliveries.
            </p>
          </div>
          <Link
            href="/donor/donate"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#17A34A]"
          >
            <Plus className="h-4 w-4" />
            <span>New item</span>
          </Link>
        </div>

        <div className="grid gap-4">
          {data.listings.map((listing) => (
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

