import { NextRequest, NextResponse } from "next/server";
import { ClaimService } from "@/lib/services/claim-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/donations/claims/expire
 * GET /api/donations/claims/expire (for cron jobs)
 * Sweeps all claims that exceeded their TTL grace period without pickup confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const result = await ClaimService.expireTimedOutClaims();
    return NextResponse.json({
      success: true,
      message: `Successfully swept expired claims. Released ${result.releasedCount} donations back to AVAILABLE.`,
      releasedCount: result.releasedCount,
      releasedIds: result.releasedIds,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error sweeping expired claims:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sweep expired claims.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
