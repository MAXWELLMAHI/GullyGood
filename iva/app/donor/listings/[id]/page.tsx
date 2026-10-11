import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FeedbackForm } from "@/components/donation/feedback-form";
import { StatusPill } from "@/components/donation/status-pill";
import { StatusTrack } from "@/components/donation/status-track";
import { ListingChatPanel } from "@/components/chat/listing-chat-panel";
import { Card } from "@/components/ui/card";
import { formatCoordinates, formatPickupWindow } from "@/lib/geo";
import { getDonorListingDetail } from "@/lib/data";
import { requireRole } from "@/lib/auth";

type DonorListingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const categoryStyles: Record<string, { bg: string; text: string; emoji: string }> = {
  Clothes: { bg: "bg-[#22C55E]", text: "text-[#22C55E]", emoji: "👕" },
  Books: { bg: "bg-[#1CB0F6]", text: "text-[#1CB0F6]", emoji: "📚" },
  Blankets: { bg: "bg-[#FFC800]", text: "text-[#8A6300]", emoji: "🛏️" },
  "Packed Meals": { bg: "bg-[#FF6B6B]", text: "text-[#FF6B6B]", emoji: "🍲" },
  Toys: { bg: "bg-[#7C6EF2]", text: "text-[#7C6EF2]", emoji: "🧸" },
  Utensils: { bg: "bg-[#06B6D4]", text: "text-[#06B6D4]", emoji: "🥣" },
};

export default async function DonorListingDetailPage({
  params,
}: DonorListingDetailPageProps) {
  const { id } = await params;
  const auth = await requireRole("donor");
  const listing = await getDonorListingDetail(id, auth.user?.id);

  const catStyle = categoryStyles[listing.category] || {
    bg: "bg-[#22C55E]",
    text: "text-[#22C55E]",
    emoji: "📦",
  };

  return (
    <DashboardShell
      actions={
        <Link
          href="/donor/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold text-[#14251C] shadow-xs transition hover:bg-[#F1FCF5]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to dashboard</span>
        </Link>
      }
      description="Review claim progress, exact pickup coordinates, and realtime coordination chat with the matched NGO."
      eyebrow="Donation Details"
      previewMode={auth.previewMode}
      title={`${listing.quantity} ${listing.category}`}
    >
      <div className="space-y-6">
        {/* Status Lifecycle Track */}
        <StatusTrack status={listing.status} />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_400px]">
          {/* Main Info Card */}
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={listing.status} />
                <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                  {listing.quality}
                </span>
              </div>
              <span className="font-display text-sm font-bold text-[#14251C]">
                ID: {listing.id}
              </span>
            </div>

            {/* Product Image if available */}
            {listing.imageUrl ? (
              <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-[#E5E7EB]">
                <Image
                  alt={listing.category}
                  className="object-cover"
                  fill
                  src={listing.imageUrl}
                  unoptimized
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{catStyle.emoji}</span>
                <h2 className="font-display text-2xl font-bold text-[#14251C]">
                  {listing.quantity} {listing.category} ready
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-[#6B7280]">
                {listing.description ?? "No additional condition notes were added to this listing."}
              </p>
            </div>

            <dl className="grid gap-4 border-t border-[#E5E7EB] pt-5 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Exact pickup address</dt>
                <dd className="font-semibold text-[#14251C] flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#22C55E] shrink-0" />
                  {[listing.addressLine, listing.locality, listing.city].filter(Boolean).join(", ")}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Pickup window</dt>
                <dd className="font-semibold text-[#14251C] flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#1CB0F6] shrink-0" />
                  {formatPickupWindow(listing.pickupWindowStart, listing.pickupWindowEnd)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Coordinates</dt>
                <dd className="font-medium text-[#4B5563] font-mono text-xs">
                  {formatCoordinates(listing.latitude, listing.longitude)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Matched NGO</dt>
                <dd className="font-bold text-[#14251C]">
                  {listing.ngoName ? (
                    <span className="text-[#17A34A]">{listing.ngoName}</span>
                  ) : (
                    <span className="text-[#9CA3AF]">Matching nearby NGOs...</span>
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Right Column: Realtime Chat Panel & Feedback */}
          <div className="space-y-6">
            <ListingChatPanel
              canShareOwnPhone={true}
              chatEnabled={listing.chatEnabled}
              currentUserRole="donor"
              initialMessages={listing.chatMessages}
              listingId={listing.id}
              participantName={listing.chatParticipantName}
              participantPhone={listing.chatParticipantPhone}
              previewMode={auth.previewMode}
              shareableOwnPhone={auth.user?.phone ?? null}
            />

            {listing.canLeaveFeedback || listing.status === "picked_up" ? (
              <FeedbackForm
                claimId={listing.claimId}
                listingId={listing.id}
                previewMode={auth.previewMode}
                targetRole="ngo"
              />
            ) : null}

            {/* Feedback Timeline */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-[#14251C]">
                Feedback history
              </h3>
              <div className="mt-4 space-y-3">
                {listing.feedback.length > 0 ? (
                  listing.feedback.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFA] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-display text-sm font-bold text-[#14251C]">
                          {entry.authorLabel}
                        </p>
                        <span className="rounded-full bg-[#FFFBEB] px-2 py-0.5 text-xs font-bold text-[#8A6300]">
                          {"⭐".repeat(entry.rating)} ({entry.rating}/5)
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
                        {entry.comments ?? "No additional notes left."}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#9CA3AF]">
                    Feedback appears here once the pickup loop is completed.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

