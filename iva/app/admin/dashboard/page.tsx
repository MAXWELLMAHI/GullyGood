import Link from "next/link";
import { Building2, Layers, ShieldCheck, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DonationCard } from "@/components/donation/donation-card";
import { Card } from "@/components/ui/card";
import { getAdminDashboardData } from "@/lib/data";
import { requireRole } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const auth = await requireRole("admin");
  const data = await getAdminDashboardData();

  return (
    <DashboardShell
      actions={
        <>
          <Link
            href="/admin/ngos"
            className="rounded-full bg-[#22C55E] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#17A34A]"
          >
            Manage NGOs
          </Link>
          <Link
            href="/admin/listings"
            className="rounded-full border border-[#E5E7EB] bg-white px-5 py-2.5 text-xs font-bold text-[#14251C] shadow-xs transition hover:bg-[#F1FCF5]"
          >
            All listings
          </Link>
        </>
      }
      description="Monitor NGO verifications, platform supply health, and donation lifecycle trust from a centralized control room."
      eyebrow="Admin Operations"
      previewMode={auth.previewMode}
      title="Platform Operations & Compliance"
    >
      <div className="space-y-8">
        {/* Stat Numbers */}
        <section className="grid gap-4 md:grid-cols-3">
          {data.stats.map((stat, idx) => (
            <div key={stat.label} className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">{stat.label}</p>
                <span className="text-lg">
                  {idx === 0 ? "👥" : idx === 1 ? "🏢" : "📦"}
                </span>
              </div>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-[#14251C]">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">{stat.hint}</p>
            </div>
          ))}
        </section>

        {/* Recent Listings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold text-[#14251C]">Recent marketplace activity</h2>
              <p className="text-sm text-[#6B7280]">
                Monitor live locks, active pickups, and verified handoffs.
              </p>
            </div>
            <Link
              href="/admin/listings"
              className="text-xs font-bold text-[#17A34A] hover:underline"
            >
              View all listings →
            </Link>
          </div>

          <div className="grid gap-4">
            {data.listings.slice(0, 3).map((listing) => (
              <DonationCard
                key={listing.id}
                ctaLabel="Inspect listing"
                href={`/donor/listings/${listing.id}`}
                listing={listing}
              />
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

