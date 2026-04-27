import Link from "next/link";
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
            className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition hover:bg-[#184934]"
          >
            Manage NGOs
          </Link>
          <Link
            href="/admin/listings"
            className="rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand/40 hover:bg-white"
          >
            View listings
          </Link>
        </>
      }
      description="Monitor onboarding, user growth, and donation flow health from a single admin workspace."
      eyebrow="Admin dashboard"
      previewMode={auth.previewMode}
      title="Keep trust, operations, and compliance moving together."
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
          <h2 className="text-2xl font-semibold text-foreground">Recent listings</h2>
          <p className="text-sm leading-6 text-muted">
            Admins can review claims, user activity, and complaint-prone donations here.
          </p>
        </div>
        {data.listings.slice(0, 3).map((listing) => (
          <DonationCard
            key={listing.id}
            ctaLabel="Inspect listing"
            href="/admin/listings"
            listing={listing}
          />
        ))}
      </section>
    </DashboardShell>
  );
}
