import { createServerSupabaseClient } from "@/lib/supabase/server";
import { realtimeDonations } from "@/lib/realtime/events";
import { mockListingDetails } from "@/lib/mock-data";

export type ClaimRequestParams = {
  donationId: string;
  ngoId: string;
  userId?: string;
  timeoutMinutes?: number;
  idempotencyKey?: string;
};

export type ClaimResponseResult = {
  success: boolean;
  statusCode: number;
  message: string;
  idempotent?: boolean;
  data?: {
    claimId: string;
    donationId: string;
    ngoId: string;
    status: "CLAIMED" | "AVAILABLE" | "COMPLETED";
    claimedAt: string;
    expiresAt?: string;
    donation?: Record<string, unknown>;
  };
};

// In-memory atomic store for demo / local / fallback mode
type InMemoryClaim = {
  claimId: string;
  donationId: string;
  ngoId: string;
  userId: string;
  claimedAt: string;
  expiresAt: string;
  idempotencyKey?: string;
};

const inMemoryClaims = new Map<string, InMemoryClaim>();
// Concurrency mutex lock per donationId for Node.js process safety
const donationMutexes = new Map<string, Promise<void>>();

async function acquireMutex(key: string): Promise<() => void> {
  while (donationMutexes.has(key)) {
    await donationMutexes.get(key);
  }
  let resolveMutex: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    resolveMutex = resolve;
  });
  donationMutexes.set(key, promise);
  return () => {
    donationMutexes.delete(key);
    resolveMutex();
  };
}

export class ClaimService {
  /**
   * Atomic First-Come, First-Served (FCFS) Claim Mechanism
   * Guarantees zero race conditions via database-level pessimistic row locking (or atomic Node mutex).
   */
  public static async claimDonation(params: ClaimRequestParams): Promise<ClaimResponseResult> {
    const {
      donationId,
      ngoId,
      userId = "system-user",
      timeoutMinutes = 15,
      idempotencyKey,
    } = params;

    if (!donationId || !ngoId) {
      return {
        success: false,
        statusCode: 400,
        message: "Missing required parameters: donationId and ngoId are required.",
      };
    }

    const releaseMutex = await acquireMutex(donationId);

    try {
      const supabase = await createServerSupabaseClient();

      // --- 1. Production Mode: PostgreSQL / Supabase with RPC / Row-Level Lock ---
      if (supabase && !donationId.startsWith("mock-")) {
        const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)(
          "claim_donation_fcfs",
          {
            p_listing_id: donationId,
            p_ngo_id: ngoId,
            p_user_id: userId,
            p_timeout_minutes: timeoutMinutes,
            p_idempotency_key: idempotencyKey ?? null,
          }
        );

        if (rpcError) {
          console.error("claim_donation_fcfs RPC error:", rpcError);
          // If RPC is missing or fails, we fall through or return 500
          return {
            success: false,
            statusCode: 500,
            message: `Database error during claim: ${rpcError.message}`,
          };
        }

        const res = rpcResult as any;

        if (!res.success) {
          if (res.code === "CONFLICT") {
            return {
              success: false,
              statusCode: 409,
              message: "This donation has already been claimed by another NGO.",
            };
          }
          if (res.code === "NOT_FOUND") {
            return {
              success: false,
              statusCode: 404,
              message: "Donation listing not found.",
            };
          }
          return {
            success: false,
            statusCode: 400,
            message: res.message || "Failed to claim donation.",
          };
        }

        // Broadcast real-time event to all connected NGOs
        realtimeDonations.broadcast({
          type: "DONATION_CLAIMED",
          donationId,
          ngoId,
          claimedAt: res.claimed_at,
          expiresAt: res.expires_at,
        });

        return {
          success: true,
          statusCode: 200,
          idempotent: res.idempotent ?? false,
          message: res.message || "Donation claim successfully locked.",
          data: {
            claimId: res.claim_id,
            donationId,
            ngoId,
            status: "CLAIMED",
            claimedAt: res.claimed_at,
            expiresAt: res.expires_at,
            donation: res.donation,
          },
        };
      }

      // --- 2. Fallback / Mock In-Memory Concurrency Safe Mode ---
      const now = new Date();
      const existingClaim = inMemoryClaims.get(donationId);

      // Check if current claim has expired (TTL Grace Period Fallback)
      if (existingClaim && new Date(existingClaim.expiresAt) <= now) {
        inMemoryClaims.delete(donationId);
        if (mockListingDetails[donationId]) {
          mockListingDetails[donationId].status = "live";
          mockListingDetails[donationId].canLock = true;
          mockListingDetails[donationId].canMarkPickedUp = false;
          mockListingDetails[donationId].claimState = null;
        }
        realtimeDonations.broadcast({
          type: "DONATION_AVAILABLE",
          donationId,
        });
      }

      const activeClaim = inMemoryClaims.get(donationId);

      // Idempotency: Same NGO re-requesting their own active claim
      if (activeClaim && (activeClaim.ngoId === ngoId || (idempotencyKey && activeClaim.idempotencyKey === idempotencyKey))) {
        return {
          success: true,
          statusCode: 200,
          idempotent: true,
          message: "Donation already claimed by your organization.",
          data: {
            claimId: activeClaim.claimId,
            donationId,
            ngoId,
            status: "CLAIMED",
            claimedAt: activeClaim.claimedAt,
            expiresAt: activeClaim.expiresAt,
            donation: mockListingDetails[donationId] as any,
          },
        };
      }

      // Race condition check: Claimed by another NGO
      if (activeClaim && activeClaim.ngoId !== ngoId) {
        return {
          success: false,
          statusCode: 409,
          message: "This donation has already been claimed by another NGO.",
        };
      }

      // Check listing availability in mock store
      const mockListing = mockListingDetails[donationId];
      if (mockListing && mockListing.status !== "live") {
        return {
          success: false,
          statusCode: 409,
          message: "This donation has already been claimed by another NGO.",
        };
      }

      // Lock successfully acquired
      const claimId = `claim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const expiresAt = new Date(now.getTime() + timeoutMinutes * 60 * 1000).toISOString();
      const claimedAt = now.toISOString();

      const newClaim: InMemoryClaim = {
        claimId,
        donationId,
        ngoId,
        userId,
        claimedAt,
        expiresAt,
        idempotencyKey,
      };

      inMemoryClaims.set(donationId, newClaim);

      if (mockListing) {
        mockListing.status = "locked";
        mockListing.canLock = false;
        mockListing.canMarkPickedUp = true;
        mockListing.claimState = "locked";
        mockListing.claimId = claimId;
        mockListing.ngoName = "Claiming NGO Partner";
      }

      // Broadcast real-time event to all connected clients
      realtimeDonations.broadcast({
        type: "DONATION_CLAIMED",
        donationId,
        ngoId,
        claimedAt,
        expiresAt,
      });

      return {
        success: true,
        statusCode: 200,
        idempotent: false,
        message: "Donation claim successfully confirmed.",
        data: {
          claimId,
          donationId,
          ngoId,
          status: "CLAIMED",
          claimedAt,
          expiresAt,
          donation: mockListing as any,
        },
      };
    } finally {
      releaseMutex();
    }
  }

  /**
   * Sweeps claims that have exceeded their TTL grace period
   * Resets donation listing back to 'live' and broadcasts DONATION_AVAILABLE
   */
  public static async expireTimedOutClaims(): Promise<{ releasedCount: number; releasedIds: string[] }> {
    const now = new Date();
    const releasedIds: string[] = [];

    // 1. Supabase Sweep
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data } = await (supabase.rpc as any)("sweep_expired_claims");
        if (data && data.released_count > 0) {
          return { releasedCount: data.released_count, releasedIds: [] };
        }
      }
    } catch (err) {
      console.warn("Supabase sweep error:", err);
    }

    // 2. In-memory Sweep
    for (const [donationId, claim] of inMemoryClaims.entries()) {
      if (new Date(claim.expiresAt) <= now) {
        inMemoryClaims.delete(donationId);
        if (mockListingDetails[donationId]) {
          mockListingDetails[donationId].status = "live";
          mockListingDetails[donationId].canLock = true;
          mockListingDetails[donationId].canMarkPickedUp = false;
          mockListingDetails[donationId].claimState = null;
        }

        realtimeDonations.broadcast({
          type: "DONATION_AVAILABLE",
          donationId,
        });

        releasedIds.push(donationId);
      }
    }

    return { releasedCount: releasedIds.length, releasedIds };
  }

  /**
   * Query claim status for a donation
   */
  public static getClaim(donationId: string): InMemoryClaim | undefined {
    return inMemoryClaims.get(donationId);
  }
}
