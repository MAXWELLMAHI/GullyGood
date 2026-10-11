import { NextRequest, NextResponse } from "next/server";
import { ClaimService } from "@/lib/services/claim-service";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * POST /api/donations/:id/claim
 * Atomic First-Come, First-Served (FCFS) Claim Endpoint
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: routeDonationId } = await params;
    let body: Record<string, any> = {};

    try {
      body = await request.json();
    } catch {
      // Body may be empty if passing params via query or headers
      body = {};
    }

    const donationId = routeDonationId || body.donationId || request.nextUrl.searchParams.get("donationId");
    const ngoId = body.ngoId || request.nextUrl.searchParams.get("ngoId");
    const userId = body.userId || request.headers.get("x-user-id") || undefined;
    const timeoutMinutes = body.timeoutMinutes ? parseInt(body.timeoutMinutes, 10) : undefined;
    const idempotencyKey =
      request.headers.get("x-idempotency-key") ||
      request.headers.get("idempotency-key") ||
      body.idempotencyKey ||
      undefined;

    if (!donationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing parameter: donationId is required.",
        },
        { status: 400 }
      );
    }

    if (!ngoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing parameter: ngoId is required to claim this donation.",
        },
        { status: 400 }
      );
    }

    // Call atomic claim service
    const result = await ClaimService.claimDonation({
      donationId,
      ngoId,
      userId,
      timeoutMinutes,
      idempotencyKey,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          code: result.statusCode === 409 ? "CLAIM_CONFLICT" : "CLAIM_FAILED",
        },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        idempotent: result.idempotent ?? false,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Unhandled error in POST /api/donations/:id/claim:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error occurred while processing claim.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
