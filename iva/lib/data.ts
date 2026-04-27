import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mockAdminDashboard, mockDonorDashboard, mockListingDetails, mockNgoDashboard } from "@/lib/mock-data";
import type { Database } from "@/types/database";
import type {
  AdminDashboardData,
  DonorDashboardData,
  ListingDetail,
  ListingSummary,
  NgoDashboardData,
} from "@/lib/view-models";

type ListingRow = Database["public"]["Tables"]["donation_listings"]["Row"];
type DonationImageRow = Database["public"]["Tables"]["donation_images"]["Row"];
type FeedbackRow = Database["public"]["Tables"]["feedback"]["Row"];

async function getSignedImageUrl(storagePath: string | null | undefined) {
  if (!storagePath) {
    return null;
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.storage
    .from("donation-images")
    .createSignedUrl(storagePath, 60 * 60);

  return data?.signedUrl ?? null;
}

function fallbackListingDetail(listingId: string) {
  return (
    mockListingDetails[listingId] ??
    ({
      ...mockListingDetails["mock-blankets"],
      id: listingId,
    } satisfies ListingDetail)
  );
}

function mapListing(
  listing: ListingRow,
  imageUrl: string | null,
  options?: {
    addressVisible?: boolean;
    distanceKm?: number | null;
    claimId?: string | null;
    claimState?: ListingSummary["claimState"];
    ngoName?: string | null;
  },
): ListingSummary {
  return {
    id: listing.id,
    category: listing.category,
    quantity: listing.quantity,
    quality: listing.quality,
    description: listing.description,
    status: listing.status,
    locality: listing.locality,
    city: listing.city,
    pincode: listing.pincode,
    addressLine: options?.addressVisible ? listing.address_line1 : null,
    landmark: options?.addressVisible ? listing.landmark : null,
    addressVisible: options?.addressVisible ?? false,
    pickupWindowStart: listing.pickup_window_start,
    pickupWindowEnd: listing.pickup_window_end,
    imageUrl,
    distanceKm: options?.distanceKm,
    claimId: options?.claimId ?? null,
    claimState: options?.claimState ?? null,
    ngoName: options?.ngoName ?? null,
  };
}

export async function getDonorDashboardData(
  donorId: string | null | undefined,
): Promise<DonorDashboardData> {
  const supabase = await createServerSupabaseClient();

  if (!supabase || !donorId) {
    return mockDonorDashboard;
  }

  const { data } = await supabase
    .from("donation_listings")
    .select("*, donation_images(*), claims(*, ngo:ngos(name))")
    .eq("donor_id", donorId)
    .order("created_at", { ascending: false });

  const rows =
    (data as unknown as
      | Array<
          ListingRow & {
            donation_images?: DonationImageRow[];
            claims?: Array<
              Database["public"]["Tables"]["claims"]["Row"] & {
                ngo?: { name: string | null } | null;
              }
            >;
          }
        >
      | null) ?? [];

  const listings = await Promise.all(
    rows.map(async (listing) => {
      const image = listing.donation_images?.[0];
      const claim = listing.claims?.[0];

      return mapListing(
        listing,
        await getSignedImageUrl(image?.storage_path),
        {
          addressVisible: true,
          claimId: claim?.id ?? null,
          claimState: claim?.state ?? null,
          ngoName: claim?.ngo?.name ?? null,
        },
      );
    }),
  );

  const liveCount = listings.filter((listing) => listing.status === "live").length;
  const lockedCount = listings.filter(
    (listing) => listing.status === "locked",
  ).length;
  const completedCount = listings.filter(
    (listing) => listing.status === "picked_up",
  ).length;

  return {
    stats: [
      {
        label: "Live donations",
        value: String(liveCount),
        hint: "Visible to verified NGOs nearby",
      },
      {
        label: "Locked today",
        value: String(lockedCount),
        hint: "Claimed and awaiting pickup completion",
      },
      {
        label: "Completed loop",
        value: String(completedCount),
        hint: "Ready for follow-up feedback",
      },
    ],
    listings,
  };
}

export async function getNgoDashboardData(
  ngoId: string | null | undefined,
): Promise<NgoDashboardData> {
  const supabase = await createServerSupabaseClient();

  if (!supabase || !ngoId) {
    return mockNgoDashboard;
  }

  const { data: nearbyData } = await supabase.rpc("nearby_live_listings");
  const nearbyRows =
    (nearbyData as Database["public"]["Functions"]["nearby_live_listings"]["Returns"]) ??
    [];

  const nearbyListings: ListingSummary[] = nearbyRows.map((listing) => ({
    id: listing.id,
    category: listing.category,
    quantity: listing.quantity,
    quality: listing.quality,
    description: listing.description,
    status: listing.status,
    locality: listing.locality,
    city: listing.city,
    pincode: listing.pincode,
    addressLine: null,
    landmark: null,
    addressVisible: false,
    pickupWindowStart: listing.pickup_window_start,
    pickupWindowEnd: listing.pickup_window_end,
    imageUrl: null,
    distanceKm: listing.distance_km,
    claimId: null,
    claimState: null,
    ngoName: null,
  }));

  const { data: claimsData } = await supabase
    .from("claims")
    .select("*, listing:donation_listings(*)")
    .eq("ngo_id", ngoId)
    .order("locked_at", { ascending: false })
    .limit(6);

  const activeClaims = await Promise.all(
    ((claimsData as unknown as
      | Array<
          Database["public"]["Tables"]["claims"]["Row"] & {
            listing?: ListingRow | null;
          }
        >
      | null) ?? [])
      .filter((claim) => claim.listing)
      .map(async (claim) =>
        mapListing(claim.listing as ListingRow, null, {
          addressVisible: true,
          claimId: claim.id,
          claimState: claim.state,
        }),
      ),
  );

  return {
    stats: [
      {
        label: "Nearby live listings",
        value: String(nearbyListings.length),
        hint: "Matched by radius, category, and availability",
      },
      {
        label: "Active locks",
        value: String(activeClaims.filter((claim) => claim.claimState === "locked").length),
        hint: "Needs pickup completion",
      },
      {
        label: "Completed pickups",
        value: String(
          activeClaims.filter((claim) => claim.claimState === "completed").length,
        ),
        hint: "Ready for donor feedback",
      },
    ],
    nearbyListings,
    activeClaims,
  };
}

export async function getDonorListingDetail(
  listingId: string,
  donorId: string | null | undefined,
): Promise<ListingDetail> {
  const supabase = await createServerSupabaseClient();

  if (!supabase || !donorId) {
    return fallbackListingDetail(listingId);
  }

  const { data: listingData } = await supabase
    .from("donation_listings")
    .select("*, donation_images(*), claims(*, ngo:ngos(name))")
    .eq("id", listingId)
    .eq("donor_id", donorId)
    .maybeSingle();

  if (!listingData) {
    return fallbackListingDetail(listingId);
  }

  const listing = listingData as unknown as ListingRow & {
    donation_images?: DonationImageRow[];
    claims?: Array<
      Database["public"]["Tables"]["claims"]["Row"] & {
        ngo?: { name: string | null } | null;
      }
    >;
  };

  const { data: feedbackRows } = await supabase
    .from("feedback")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  const claim = listing.claims?.[0];
  const imageUrl = await getSignedImageUrl(listing.donation_images?.[0]?.storage_path);

  return {
    ...mapListing(listing, imageUrl, {
      addressVisible: true,
      claimId: claim?.id ?? null,
      claimState: claim?.state ?? null,
      ngoName: claim?.ngo?.name ?? null,
    }),
    latitude: listing.latitude,
    longitude: listing.longitude,
    feedback:
      ((feedbackRows as FeedbackRow[] | null) ?? []).map((entry) => ({
        id: entry.id,
        authorLabel: entry.target_role === "ngo" ? "Donor feedback" : "NGO feedback",
        rating: entry.rating,
        comments: entry.comments,
        createdAt: entry.created_at,
        targetRole: entry.target_role,
      })) ?? [],
    canLock: false,
    canMarkPickedUp: false,
    canLeaveFeedback: listing.status === "picked_up",
    targetFeedbackRole: "ngo",
  };
}

export async function getNgoListingDetail(
  listingId: string,
): Promise<ListingDetail> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return fallbackListingDetail(listingId);
  }

  const { data: listingData } = await supabase.rpc(
    "listing_detail_for_current_user",
    {
      listing_uuid: listingId,
    },
  );

  const row = listingData?.[0];

  if (!row) {
    return fallbackListingDetail(listingId);
  }

  const { data: feedbackRows } = await supabase
    .from("feedback")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  return {
    id: row.id,
    category: row.category,
    quantity: row.quantity,
    quality: row.quality,
    description: row.description,
    status: row.status,
    locality: row.locality,
    city: row.city,
    pincode: row.pincode,
    addressLine: row.exact_address,
    landmark: row.landmark,
    addressVisible: row.address_visible,
    pickupWindowStart: row.pickup_window_start,
    pickupWindowEnd: row.pickup_window_end,
    imageUrl: null,
    distanceKm: row.distance_km,
    claimId: row.current_claim_id,
    claimState: row.current_claim_state,
    ngoName: row.current_ngo_name,
    latitude: row.latitude,
    longitude: row.longitude,
    feedback: ((feedbackRows as FeedbackRow[] | null) ?? []).map((entry) => ({
      id: entry.id,
      authorLabel: entry.target_role === "donor" ? "NGO feedback" : "Donor feedback",
      rating: entry.rating,
      comments: entry.comments,
      createdAt: entry.created_at,
      targetRole: entry.target_role,
    })),
    canLock: row.status === "live",
    canMarkPickedUp: row.current_claim_state === "locked",
    canLeaveFeedback: row.status === "picked_up",
    targetFeedbackRole: "donor",
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return mockAdminDashboard;
  }

  const [profilesRes, ngosRes, listingsRes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("ngos").select("*").order("created_at", { ascending: false }),
    supabase
      .from("donation_listings")
      .select("*, claims(*, ngo:ngos(name))")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const profiles = profilesRes.data ?? [];
  const ngos = ngosRes.data ?? [];
  const listings =
    (listingsRes.data as unknown as
      | Array<
          ListingRow & {
            claims?: Array<
              Database["public"]["Tables"]["claims"]["Row"] & {
                ngo?: { name: string | null } | null;
              }
            >;
          }
        >
      | null) ?? [];

  return {
    stats: [
      {
        label: "Registered users",
        value: String(profiles.length),
        hint: "Profiles synced from Supabase Auth",
      },
      {
        label: "Verified NGOs",
        value: String(ngos.filter((ngo) => ngo.verified_status === "verified").length),
        hint: "Manual onboarding completed",
      },
      {
        label: "Open listings",
        value: String(
          listings.filter((listing) =>
            ["live", "locked"].includes(listing.status),
          ).length,
        ),
        hint: "Needs active monitoring",
      },
    ],
    ngos: ngos.map((ngo) => ({
      id: ngo.id,
      name: ngo.name,
      address: ngo.address,
      city: ngo.city,
      pincode: ngo.pincode,
      ngoDarpanId: ngo.ngo_darpan_id,
      registrationNumber: ngo.registration_number,
      contactPhone: ngo.contact_phone,
      serviceRadiusKm: ngo.service_radius_km,
      verifiedStatus: ngo.verified_status,
    })),
    users: profiles.map((profile) => ({
      id: profile.id,
      fullName: profile.full_name,
      role: profile.role,
      city: profile.city,
      pincode: profile.pincode,
    })),
    listings: listings.map((listing) =>
      mapListing(listing, null, {
        addressVisible: true,
        claimId: listing.claims?.[0]?.id ?? null,
        claimState: listing.claims?.[0]?.state ?? null,
        ngoName: listing.claims?.[0]?.ngo?.name ?? null,
      }),
    ),
  };
}
