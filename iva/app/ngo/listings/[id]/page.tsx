import { completePickupAction, lockListingAction } from "@/app/actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FeedbackForm } from "@/components/donation/feedback-form";
import { StatusPill } from "@/components/donation/status-pill";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { formatCoordinates, formatDistance, formatPickupWindow } from "@/lib/geo";
import { getNgoListingDetail } from "@/lib/data";
import { requireRole } from "@/lib/auth";

type NgoListingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NgoListingDetailPage({
  params,
}: NgoListingDetailPageProps) {
  const { id } = await params;
  const auth = await requireRole("ngo");
  const listing = await getNgoListingDetail(id);

  return (
    <DashboardShell
      description="Review listing details, lock the donation, complete pickup, and leave donor feedback when the loop is done."
      eyebrow="NGO listing detail"
      previewMode={auth.previewMode}
      title={`${listing.category} donation`}
    >
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_380px]">
        <Card className="glass-panel p-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status={listing.status} />
            <span className="rounded-full bg-muted-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
              {listing.quality}
            </span>
            <span className="rounded-full bg-[#ffe4d1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-foreground">
              {formatDistance(listing.distanceKm ?? null)}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">
              {listing.quantity} {listing.category}
            </h2>
            <p className="text-sm leading-7 text-muted">
              {listing.description ?? "No additional description was provided."}
            </p>
          </div>

          <dl className="mt-6 grid gap-4 text-sm text-muted sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-foreground">Pickup window</dt>
              <dd>{formatPickupWindow(listing.pickupWindowStart, listing.pickupWindowEnd)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Address visibility</dt>
              <dd>
                {listing.addressVisible
                  ? [listing.addressLine, listing.locality, listing.city]
                      .filter(Boolean)
                      .join(", ")
                  : `${listing.locality}, ${listing.city} (full address unlocks after claim)`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Coordinates</dt>
              <dd>{formatCoordinates(listing.latitude, listing.longitude)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Claim state</dt>
              <dd className="capitalize">
                {(listing.claimState ?? "not claimed").replace("_", " ")}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="page-grid">
          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-foreground">Action panel</h3>
            <div className="mt-4 space-y-3">
              {listing.canLock ? (
                <form action={lockListingAction}>
                  <input name="listingId" type="hidden" value={listing.id} />
                  {auth.previewMode ? (
                    <button
                      className="w-full rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold text-muted"
                      disabled
                      type="button"
                    >
                      Connect Supabase to lock listing
                    </button>
                  ) : (
                    <SubmitButton
                      className="w-full"
                      idleLabel="Lock donation"
                      pendingLabel="Locking..."
                    />
                  )}
                </form>
              ) : null}

              {listing.canMarkPickedUp ? (
                <form action={completePickupAction}>
                  <input name="listingId" type="hidden" value={listing.id} />
                  {auth.previewMode ? (
                    <button
                      className="w-full rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold text-muted"
                      disabled
                      type="button"
                    >
                      Connect Supabase to complete pickup
                    </button>
                  ) : (
                    <SubmitButton
                      className="w-full"
                      idleLabel="Mark pickup completed"
                      pendingLabel="Updating..."
                    />
                  )}
                </form>
              ) : null}

              {!listing.canLock && !listing.canMarkPickedUp ? (
                <p className="text-sm leading-6 text-muted">
                  This listing is either completed or not available for further action.
                </p>
              ) : null}
            </div>
          </Card>

          {(listing.canLeaveFeedback || listing.status === "picked_up") && (
            <FeedbackForm
              claimId={listing.claimId}
              listingId={listing.id}
              previewMode={auth.previewMode}
              targetRole="donor"
            />
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
