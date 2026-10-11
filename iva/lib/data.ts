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
type ChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];

async function getSignedImageUrl(storagePath: string | null | undefined) {
  if (!storagePath || storagePath.startsWith("mock") || storagePath.startsWith("http")) {
    return storagePath ?? null;
  }

  try {
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return null;
    }

    const { data } = await supabase.storage
      .from("donation-images")
      .createSignedUrl(storagePath, 60 * 60);

    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
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
    matchScore?: number | null;
    ngoRatingAverage?: number | null;
    ngoCompletionRate?: number | null;
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
    matchScore: options?.matchScore,
    ngoRatingAverage: options?.ngoRatingAverage,
    ngoCompletionRate: options?.ngoCompletionRate,
    claimId: options?.claimId ?? null,
    claimState: options?.claimState ?? null,
    ngoName: options?.ngoName ?? null,
  };
}

function mapChatMessages(
  messages: ChatMessageRow[] | null | undefined,
  options: {
    donorName: string;
    ngoName: string;
  },
) {
  return (messages ?? []).map((message) => ({
    id: message.id,
    senderRole: message.sender_role as "donor" | "ngo",
    senderName:
      message.sender_role === "donor" ? options.donorName : options.ngoName,
    message: message.message,
    sharedPhone: message.shared_phone,
    createdAt: message.created_at,
  }));
}

export async function getDonorDashboardData(
  donorId: string | null | undefined,
): Promise<DonorDashboardData> {
  // Fast-path: Demo donor and preview sessions render in 0ms without remote network calls
  if (!donorId || donorId.startsWith("11111111")) {
    return mockDonorDashboard;
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return mockDonorDashboard;
  }

  try {
    const { data } = await supabase
      .from("donation_listings")
      .select("*, donation_images(*), claims(*, ngo:ngos(name, rating_average, completion_rate))")
      .eq("donor_id", donorId)
      .order("created_at", { ascending: false });

    const rows =
      (data as unknown as
        | Array<
            ListingRow & {
              donation_images?: DonationImageRow[];
              claims?: Array<
                Database["public"]["Tables"]["claims"]["Row"] & {
                  ngo?: {
                    name: string | null;
                    rating_average?: number | null;
                    completion_rate?: number | null;
                  } | null;
                }
              >;
            }
          >
        | null) ?? [];

    if (rows.length === 0) {
      return mockDonorDashboard;
    }

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
            ngoRatingAverage: claim?.ngo?.rating_average ?? null,
            ngoCompletionRate: claim?.ngo?.completion_rate ?? null,
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
  } catch {
    return mockDonorDashboard;
  }
}

export async function getNgoDashboardData(
  ngoId: string | null | undefined,
): Promise<NgoDashboardData> {
  // Fast-path: Demo NGO renders in 0ms without remote network calls
  if (!ngoId || ngoId.startsWith("aaaaaaaa") || ngoId.startsWith("22222222")) {
    return mockNgoDashboard;
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return mockNgoDashboard;
  }

  try {
    const { data: nearbyData } = await supabase.rpc("nearby_live_listings");
    const nearbyRows =
      (nearbyData as Database["public"]["Functions"]["nearby_live_listings"]["Returns"]) ??
      [];

    if (nearbyRows.length === 0) {
      return mockNgoDashboard;
    }

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
      matchScore: listing.match_score,
      ngoRatingAverage: listing.ngo_rating_average,
      ngoCompletionRate: listing.ngo_completion_rate,
      claimId: null,
      claimState: null,
      ngoName: null,
    }));

    const { data: activeClaimData } = await supabase
      .from("claims")
      .select("*, donation_listing:donation_listings(*, donation_images(*))")
      .eq("ngo_id", ngoId)
      .in("state", ["locked", "completed"])
      .order("created_at", { ascending: false });

    const activeClaimRows =
      (activeClaimData as unknown as
        | Array<
            Database["public"]["Tables"]["claims"]["Row"] & {
              donation_listing:
                | (ListingRow & { donation_images?: DonationImageRow[] })
                | null;
            }
          >
        | null) ?? [];

    const activeClaims: ListingSummary[] = await Promise.all(
      activeClaimRows
        .filter((claim) => Boolean(claim.donation_listing))
        .map(async (claim) => {
          const listing = claim.donation_listing as ListingRow & {
            donation_images?: DonationImageRow[];
          };
          const image = listing.donation_images?.[0];

          return mapListing(
            listing,
            await getSignedImageUrl(image?.storage_path),
            {
              addressVisible: true,
              claimId: claim.id,
              claimState: claim.state,
              ngoRatingAverage: null,
              ngoCompletionRate: null,
              ngoName: null,
            },
          );
        }),
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
  } catch {
    return mockNgoDashboard;
  }
}

export async function getDonorListingDetail(
  listingId: string,
  donorId: string | null | undefined,
): Promise<ListingDetail> {
  // Fast-path: Instant 0ms return for mock listings or demo donor
  if (
    listingId.startsWith("mock-") ||
    !donorId ||
    donorId.startsWith("11111111") ||
    mockListingDetails[listingId]
  ) {
    return fallbackListingDetail(listingId);
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase || !donorId) {
    return fallbackListingDetail(listingId);
  }

  try {
    const { data: listingData } = await supabase
      .from("donation_listings")
      .select("*, donation_images(*), claims(*, ngo:ngos(name, rating_average, completion_rate, contact_phone))")
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
          ngo?: {
            name: string | null;
            rating_average?: number | null;
            completion_rate?: number | null;
            contact_phone?: string | null;
          } | null;
        }
      >;
    };

    const { data: feedbackRows } = await supabase
      .from("feedback")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    const { data: chatRows } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: true });

    const claim = listing.claims?.[0];
    const imageUrl = await getSignedImageUrl(listing.donation_images?.[0]?.storage_path);
    const chatEnabled =
      claim?.state === "locked" || claim?.state === "completed";
    const ngoName = claim?.ngo?.name ?? "Verified NGO";

    return {
      ...mapListing(listing, imageUrl, {
        addressVisible: true,
        claimId: claim?.id ?? null,
        claimState: claim?.state ?? null,
        ngoRatingAverage: claim?.ngo?.rating_average ?? null,
        ngoCompletionRate: claim?.ngo?.completion_rate ?? null,
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
      chatEnabled,
      chatParticipantName: chatEnabled ? ngoName : null,
      chatParticipantPhone: chatEnabled ? (claim?.ngo?.contact_phone ?? null) : null,
      chatMessages: mapChatMessages(chatRows as ChatMessageRow[] | null, {
        donorName: "You",
        ngoName,
      }),
      canLock: false,
      canMarkPickedUp: false,
      canLeaveFeedback: listing.status === "picked_up",
      targetFeedbackRole: "ngo",
    };
  } catch {
    return fallbackListingDetail(listingId);
  }
}

export async function getNgoListingDetail(
  listingId: string,
): Promise<ListingDetail> {
  // Fast-path: Instant 0ms return for mock listings
  if (listingId.startsWith("mock-") || mockListingDetails[listingId]) {
    return fallbackListingDetail(listingId);
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return fallbackListingDetail(listingId);
  }

  try {
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

    const { data: chatRows } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: true });

    const chatEnabled =
      row.current_claim_state === "locked" || row.current_claim_state === "completed";
    const donorName = row.donor_full_name ?? "Donor";
    const ngoName = row.current_ngo_name ?? "Your NGO";

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
      matchScore: row.match_score,
      ngoRatingAverage: row.ngo_rating_average,
      ngoCompletionRate: row.ngo_completion_rate,
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
      chatEnabled,
      chatParticipantName: chatEnabled ? donorName : null,
      chatParticipantPhone: chatEnabled ? row.donor_phone : null,
      chatMessages: mapChatMessages(chatRows as ChatMessageRow[] | null, {
        donorName,
        ngoName,
      }),
      canLock: row.status === "live",
      canMarkPickedUp: row.current_claim_state === "locked",
      canLeaveFeedback: row.status === "picked_up",
      targetFeedbackRole: "donor",
    };
  } catch {
    return fallbackListingDetail(listingId);
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return mockAdminDashboard;
  }

  try {
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

    if (profiles.length === 0 && ngos.length === 0 && listings.length === 0) {
      return mockAdminDashboard;
    }

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
        acceptedCategories: ngo.accepted_categories,
        dailyPickupCapacity: ngo.daily_pickup_capacity,
        ratingAverage: ngo.rating_average,
        completionRate: ngo.completion_rate,
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
  } catch {
    return mockAdminDashboard;
  }
}

