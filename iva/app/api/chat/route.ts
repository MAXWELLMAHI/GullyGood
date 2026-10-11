import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { mockListingDetails } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ChatEntry } from "@/lib/view-models";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  // 1. Try Supabase
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase && !listingId.startsWith("mock-")) {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        return NextResponse.json({ messages: data });
      }
    }
  } catch {
    // Fall through to mock store
  }

  // 2. Mock store fallback
  const mockDetail = mockListingDetails[listingId];
  return NextResponse.json({
    messages: mockDetail?.chatMessages ?? [],
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listingId, message, sharedPhone, senderRole, senderName } = body;

    if (!listingId || !message?.trim()) {
      return NextResponse.json(
        { error: "listingId and message are required" },
        { status: 400 },
      );
    }

    const auth = await getAuthContext();
    const role = senderRole || auth.role || "donor";
    const name =
      senderName ||
      auth.profile?.full_name ||
      (role === "donor" ? "Donor" : "NGO Coordinator");

    const newEntry: ChatEntry = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderRole: role,
      senderName: name,
      message: message.trim(),
      sharedPhone: sharedPhone || null,
      createdAt: new Date().toISOString(),
    };

    // 1. If real Supabase and not a mock listing, attempt insert
    let savedToSupabase = false;
    if (!listingId.startsWith("mock-")) {
      try {
        const supabase = await createServerSupabaseClient();
        if (supabase && auth.user) {
          const { error } = await supabase.rpc("send_chat_message", {
            listing_uuid: listingId,
            message_body: message.trim(),
            share_phone: Boolean(sharedPhone),
          });

          if (!error) {
            savedToSupabase = true;
          }
        }
      } catch {
        savedToSupabase = false;
      }
    }

    // 2. Always ensure local mock store is updated for instant demo responsiveness
    if (!savedToSupabase || listingId.startsWith("mock-")) {
      if (!mockListingDetails[listingId]) {
        mockListingDetails[listingId] = {
          id: listingId,
          category: "Essentials",
          quantity: 1,
          quality: "good",
          description: null,
          status: "locked",
          locality: "Mumbai",
          city: "Mumbai",
          pincode: "400001",
          addressLine: null,
          landmark: null,
          addressVisible: true,
          pickupWindowStart: new Date().toISOString(),
          pickupWindowEnd: new Date(Date.now() + 3600000).toISOString(),
          imageUrl: null,
          distanceKm: 1.5,
          matchScore: 90,
          ngoRatingAverage: 4.8,
          ngoCompletionRate: 0.95,
          claimId: "claim-temp",
          claimState: "locked",
          ngoName: "Verified NGO Partner",
          latitude: 19.076,
          longitude: 72.8777,
          feedback: [],
          chatEnabled: true,
          chatParticipantName: role === "donor" ? "Verified NGO Partner" : "Donor",
          chatParticipantPhone: "+91 98765 43210",
          chatMessages: [],
          canLock: false,
          canMarkPickedUp: true,
          canLeaveFeedback: false,
          targetFeedbackRole: "donor",
        };
      }

      mockListingDetails[listingId].chatMessages.push(newEntry);
    }

    return NextResponse.json({
      success: true,
      message: newEntry,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to process message";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
