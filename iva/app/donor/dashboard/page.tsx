import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DonationCard } from "@/components/donation/donation-card";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getDonorDashboardData } from "@/lib/data";

export default async function DonorDashboardPage() {
  const auth = await requireRole("donor");
  const data = await getDonorDashboardData(auth.user?.id);

  return (
    <DashboardShell
      actions={
        <Link
          href="/donor/donate"
          className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition hover:bg-[#184934]"
        >
          Create donation
        </Link>
      }
      description="Track your submitted, live, locked, and completed donations in one place."
      eyebrow="Donor dashboard"
      previewMode={auth.previewMode}
      title="Keep essentials moving toward the right NGO."
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
        {data.listings.map((listing) => (
          <DonationCard
            key={listing.id}
            href={`/donor/listings/${listing.id}`}
            listing={listing}
          />
        ))}
      </section>
    </DashboardShell>
  );
}
