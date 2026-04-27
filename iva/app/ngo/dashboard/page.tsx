import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DonationCard } from "@/components/donation/donation-card";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getNgoDashboardData } from "@/lib/data";

export default async function NgoDashboardPage() {
  const auth = await requireRole("ngo");
  const data = await getNgoDashboardData(auth.ngoMembership?.ngo_id);

  return (
    <DashboardShell
      description="See nearby live listings, lock one donation at a time, and move pickups through completion."
      eyebrow="NGO dashboard"
      previewMode={auth.previewMode}
      title="Prioritize the closest, most pickup-ready donations."
    >
      <section className="grid gap-4 md:grid-cols-3">
        {data.stats.map((stat) => (
          <Card key={stat.label} className="glass-panel p-6">
            <p className="text-sm font-medium text-muted">{stat.label}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">{stat.hint}</p>
          </Card>
        ))}
      </section>

      <section className="page-grid">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Nearby live listings</h2>
          <p className="text-sm leading-6 text-muted">
            Exact donor addresses stay hidden until your NGO locks a listing.
          </p>
        </div>
        {data.nearbyListings.map((listing) => (
          <DonationCard
            key={listing.id}
            ctaLabel="Review and lock"
            href={`/ngo/listings/${listing.id}`}
            listing={listing}
            showDistance
          />
        ))}
      </section>

      <section className="page-grid">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Active claims</h2>
          <p className="text-sm leading-6 text-muted">
            Use this section to complete pickups and gather donor feedback.
          </p>
        </div>
        {data.activeClaims.map((listing) => (
          <DonationCard
            key={listing.id}
            ctaLabel="Open claim"
            href={`/ngo/listings/${listing.id}`}
            listing={listing}
          />
        ))}
      </section>
    </DashboardShell>
  );
}
