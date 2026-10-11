import { NextRequest } from "next/server";
import { realtimeDonations, type DonationClaimEvent } from "@/lib/realtime/events";

export const dynamic = "force-dynamic";

/**
 * GET /api/realtime/donations/events
 * Server-Sent Events (SSE) stream for real-time FCFS claim notifications
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected", timestamp: new Date().toISOString() })}\n\n`)
      );

      // Listener for donation events
      const unsubscribe = realtimeDonations.subscribe((event: DonationClaimEvent) => {
        try {
          const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.warn("Failed to push SSE event to client:", err);
        }
      });

      // Keepalive heartbeat ping every 25 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 25000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
