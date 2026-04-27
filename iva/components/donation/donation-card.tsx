import Image from "next/image";
import Link from "next/link";
import { formatDistance, formatPickupWindow, maskAddress } from "@/lib/geo";
import type { ListingSummary } from "@/lib/view-models";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/donation/status-pill";

type DonationCardProps = {
  listing: ListingSummary;
  href: string;
  ctaLabel?: string;
  showDistance?: boolean;
};

export function DonationCard({
  listing,
  href,
  ctaLabel = "View details",
  showDistance = false,
}: DonationCardProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="flex min-h-44 items-end bg-[linear-gradient(145deg,_rgba(31,91,61,0.9),_rgba(234,140,67,0.88))] p-5 text-brand-foreground">
          {listing.imageUrl ? (
            <div className="relative h-full min-h-36 w-full overflow-hidden rounded-2xl">
              <Image
                alt={`${listing.category} donation`}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 180px"
                src={listing.imageUrl}
                unoptimized
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                {listing.category}
              </p>
              <p className="max-w-[10rem] text-xl font-semibold leading-tight">
                {listing.quantity} units ready for pickup
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={listing.status} />
            <Badge variant="neutral">{listing.quality}</Badge>
            {showDistance ? (
              <Badge variant="accent">
                {formatDistance(listing.distanceKm ?? null)}
              </Badge>
            ) : null}
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {listing.category}
            </h2>
            <p className="text-sm leading-7 text-muted">
              {listing.description ?? "Ready to support a nearby family or community program."}
            </p>
          </div>

          <dl className="grid gap-3 text-sm text-muted sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-foreground">Pickup window</dt>
              <dd>{formatPickupWindow(listing.pickupWindowStart, listing.pickupWindowEnd)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Location</dt>
              <dd>
                {listing.addressVisible
                  ? [listing.addressLine, listing.locality, listing.city]
                      .filter(Boolean)
                      .join(", ")
                  : maskAddress(listing.locality, listing.city)}
              </dd>
            </div>
            {listing.ngoName ? (
              <div>
                <dt className="font-semibold text-foreground">Claimed by</dt>
                <dd>{listing.ngoName}</dd>
              </div>
            ) : null}
            {listing.claimState ? (
              <div>
                <dt className="font-semibold text-foreground">Claim state</dt>
                <dd className="capitalize">{listing.claimState.replace("_", " ")}</dd>
              </div>
            ) : null}
          </dl>

          <Link
            className="inline-flex rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-[#184934]"
            href={href}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </Card>
  );
}
