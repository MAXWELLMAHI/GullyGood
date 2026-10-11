import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DonationCard } from "@/components/donation/donation-card";
import { NgoLiveActivity } from "@/components/ngo/ngo-live-activity";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getNgoDashboardData } from "@/lib/data";

export default async function NgoDashboardPage() {
  const auth = await requireRole("ngo");
  const data = await getNgoDashboardData(auth.ngoMembership?.ngo_id);

  return (
    <DashboardShell
      description="See nearby live listings in Mumbai, lock one donation at a time, and move pickups through completion."
      eyebrow="NGO Workspace"
      previewMode={auth.previewMode}
      title="Prioritize the closest, most pickup-ready donations."
    >
      <div className="space-y-8">
        {/* Live Radar Beacon Component */}
        <NgoLiveActivity
          previewMode={auth.previewMode}
          initialListingIds={data.nearbyListings.map((l) => l.id)}
        />

        {/* Stat Cards */}
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

        {/* Nearby Live Listings */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-[#14251C]">Nearby live listings</h2>
            <p className="text-sm text-[#6B7280]">
              Exact donor addresses stay protected until your NGO locks a listing.
            </p>
          </div>
          <div className="grid gap-4">
            {data.nearbyListings.length > 0 ? (
              data.nearbyListings.map((listing) => (
                <DonationCard
                  key={listing.id}
                  ctaLabel="Review and lock"
                  href={`/ngo/listings/${listing.id}`}
                  listing={listing}
                  showDistance
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6B7280]">
                No new listings in your radius right now. The live radar above will ping as soon as a donor posts!
              </div>
            )}
          </div>
        </section>

        {/* Active Claims */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-[#14251C]">Active claims in progress</h2>
            <p className="text-sm text-[#6B7280]">
              Coordinate with donors, dispatch volunteers, and mark pickups completed.
            </p>
          </div>
          <div className="grid gap-4">
            {data.activeClaims.map((listing) => (
              <DonationCard
                key={listing.id}
                ctaLabel="Open claim & chat"
                href={`/ngo/listings/${listing.id}`}
                listing={listing}
              />
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

