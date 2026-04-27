import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FeedbackForm } from "@/components/donation/feedback-form";
import { StatusPill } from "@/components/donation/status-pill";
import { Card } from "@/components/ui/card";
import { formatCoordinates, formatPickupWindow } from "@/lib/geo";
import { getDonorListingDetail } from "@/lib/data";
import { requireRole } from "@/lib/auth";

type DonorListingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DonorListingDetailPage({
  params,
}: DonorListingDetailPageProps) {
  const { id } = await params;
  const auth = await requireRole("donor");
  const listing = await getDonorListingDetail(id, auth.user?.id);

  return (
    <DashboardShell
      description="Review claim progress, exact pickup details, and donor-side feedback after the loop is complete."
      eyebrow="Donation detail"
      previewMode={auth.previewMode}
      title={`${listing.category} listing`}
    >
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_380px]">
        <Card className="glass-panel p-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={listing.status} />
            <span className="rounded-full bg-muted-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
              {listing.quality}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">
              {listing.quantity} {listing.category}
            </h2>
            <p className="text-sm leading-7 text-muted">
              {listing.description ?? "No additional notes were added to this listing."}
            </p>
          </div>

          <dl className="mt-6 grid gap-4 text-sm text-muted sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-foreground">Exact pickup address</dt>
              <dd>{[listing.addressLine, listing.locality, listing.city].filter(Boolean).join(", ")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Pickup window</dt>
              <dd>{formatPickupWindow(listing.pickupWindowStart, listing.pickupWindowEnd)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Coordinates</dt>
              <dd>{formatCoordinates(listing.latitude, listing.longitude)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Claimed by</dt>
              <dd>{listing.ngoName ?? "Not locked yet"}</dd>
            </div>
          </dl>
        </Card>

        <div className="page-grid">
          {listing.canLeaveFeedback || listing.status === "picked_up" ? (
            <FeedbackForm
              claimId={listing.claimId}
              listingId={listing.id}
              previewMode={auth.previewMode}
              targetRole="ngo"
            />
          ) : null}

          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-foreground">Feedback timeline</h3>
            <div className="mt-4 space-y-4">
              {listing.feedback.length > 0 ? (
                listing.feedback.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-border/70 bg-white/80 p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {entry.authorLabel} · {entry.rating}/5
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {entry.comments ?? "No extra comments left."}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted">
                  Feedback appears here after pickup completion.
                </p>
              )}
            </div>
          </Card>
        </div>
      </section>
    </DashboardShell>
  );
}
