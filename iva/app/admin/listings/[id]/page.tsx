import Link from "next/link";
import { ArrowLeft, House, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/donation/status-pill";
import { StatusTrack } from "@/components/donation/status-track";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatPickupWindow } from "@/lib/geo";
import type { Database } from "@/types/database";
import type { DonationStatus } from "@/lib/roles";
import { mockListingDetails } from "@/lib/mock-data";

type ListingRow = Database["public"]["Tables"]["donation_listings"]["Row"];

type AdminListingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminListingDetailPage({
  params,
}: AdminListingDetailPageProps) {
  const { id } = await params;
  const auth = await requireRole("admin");
  const supabase = await createServerSupabaseClient();

  type AdminListing = {
    id: string;
    category: string;
    quantity: number;
    quality: string;
    description: string | null;
    status: DonationStatus;
    address_line1: string;
    landmark: string | null;
    locality: string;
    city: string;
    pincode: string;
    pickup_window_start: string;
    pickup_window_end: string;
    claimNgoName: string | null;
    claimState: string | null;
  };

  let listing: AdminListing | null = null;

  if (id.startsWith("mock-") || mockListingDetails[id]) {
    const mock = mockListingDetails[id] ?? mockListingDetails["mock-blankets"];
    listing = {
      id: mock.id,
      category: mock.category,
      quantity: mock.quantity,
      quality: mock.quality,
      description: mock.description,
      status: mock.status,
      address_line1: mock.addressLine ?? "123 Example Street",
      landmark: mock.landmark,
      locality: mock.locality,
      city: mock.city,
      pincode: mock.pincode,
      pickup_window_start: mock.pickupWindowStart,
      pickup_window_end: mock.pickupWindowEnd,
      claimNgoName: mock.ngoName ?? null,
      claimState: mock.claimState ?? null,
    };
  } else if (supabase) {
    try {
      const { data } = await supabase
        .from("donation_listings")
        .select("*, claims(id, state, ngo:ngos(name))")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = (data as unknown) as ListingRow & { claims?: any[] };
        const claim = row.claims?.[0] ?? null;
        listing = {
          id: row.id,
          category: row.category,
          quantity: row.quantity,
          quality: row.quality,
          description: row.description,
          status: row.status as DonationStatus,
          address_line1: row.address_line1,
          landmark: row.landmark,
          locality: row.locality,
          city: row.city,
          pincode: row.pincode,
          pickup_window_start: row.pickup_window_start,
          pickup_window_end: row.pickup_window_end,
          claimNgoName: (claim?.ngo as { name?: string } | null)?.name ?? null,
          claimState: claim?.state ?? null,
        };
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback / preview state
  if (!listing) {
    listing = {
      id,
      category: "Sample Category",
      quantity: 10,
      quality: "good",
      description: "Admin view preview — connect Supabase to see live listing data.",
      status: "live",
      address_line1: "123 Example Street",
      landmark: "Near City Square",
      locality: "Bandra",
      city: "Mumbai",
      pincode: "400050",
      pickup_window_start: new Date().toISOString(),
      pickup_window_end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      claimNgoName: null,
      claimState: null,
    };
  }

  return (
    <DashboardShell
      actions={
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white/90 px-5 py-3 text-sm font-semibold text-foreground shadow-[0_12px_30px_rgba(31,47,70,0.06)] transition hover:-translate-y-0.5 hover:border-brand/30"
          href="/admin/listings"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>
      }
      description="Full listing details for admin review. Address and claim state are always visible to admins."
      eyebrow="Admin · Listing detail"
      previewMode={auth.previewMode}
      title={`${listing.category} listing`}
    >
      <Card className="glass-panel p-6">
        <StatusTrack status={listing.status} />

        <div className="mt-4 flex flex-wrap items-center gap-3">
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
            {listing.description ?? "No additional description provided."}
          </p>
        </div>

        <dl className="mt-6 grid gap-4 text-sm text-muted sm:grid-cols-2">
          <div className="joy-surface rounded-[24px] border border-border/70 p-4">
            <dt className="flex items-center gap-2 font-semibold text-foreground">
              <House className="h-4 w-4 text-brand" />
              Full pickup address
            </dt>
            <dd className="mt-2">
              {[
                listing.address_line1,
                listing.landmark,
                listing.locality,
                listing.city,
                listing.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </dd>
          </div>

          <div className="joy-surface rounded-[24px] border border-border/70 p-4">
            <dt className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-support" />
              Pickup window
            </dt>
            <dd className="mt-2">
              {formatPickupWindow(listing.pickup_window_start, listing.pickup_window_end)}
            </dd>
          </div>

          <div className="joy-surface rounded-[24px] border border-border/70 p-4">
            <dt className="font-semibold text-foreground">Claim state</dt>
            <dd className="mt-2 capitalize">
              {(listing.claimState ?? "not claimed").replace(/_/g, " ")}
            </dd>
          </div>

          {listing.claimNgoName ? (
            <div className="joy-surface rounded-[24px] border border-border/70 p-4">
              <dt className="font-semibold text-foreground">Claimed by NGO</dt>
              <dd className="mt-2">{listing.claimNgoName}</dd>
            </div>
          ) : (
            <div className="joy-surface rounded-[24px] border border-border/70 p-4">
              <dt className="font-semibold text-foreground">Listing ID</dt>
              <dd className="mt-2 font-mono text-xs text-muted">{listing.id}</dd>
            </div>
          )}
        </dl>
      </Card>
    </DashboardShell>
  );
}
