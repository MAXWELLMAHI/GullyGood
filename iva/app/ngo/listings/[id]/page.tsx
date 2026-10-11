import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Lock, MapPin, CheckCircle2 } from "lucide-react";
import { completePickupAction, lockListingAction } from "@/app/actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FeedbackForm } from "@/components/donation/feedback-form";
import { StatusPill } from "@/components/donation/status-pill";
import { StatusTrack } from "@/components/donation/status-track";
import { ListingChatPanel } from "@/components/chat/listing-chat-panel";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { formatCoordinates, formatDistance, formatPickupWindow } from "@/lib/geo";
import { getNgoListingDetail } from "@/lib/data";
import { requireRole } from "@/lib/auth";

type NgoListingDetailPageProps = {
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

export default async function NgoListingDetailPage({
  params,
}: NgoListingDetailPageProps) {
  const { id } = await params;
  const auth = await requireRole("ngo");
  const listing = await getNgoListingDetail(id);

  const catStyle = categoryStyles[listing.category] || {
    bg: "bg-[#22C55E]",
    text: "text-[#22C55E]",
    emoji: "📦",
  };

  return (
    <DashboardShell
      actions={
        <Link
          href="/ngo/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold text-[#14251C] shadow-xs transition hover:bg-[#F1FCF5]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to NGO Radar</span>
        </Link>
      }
      description="Review listing details, lock the donation for pickup, coordinate with donor via live chat, and complete pickup."
      eyebrow="NGO Listing Detail"
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
                {listing.distanceKm != null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] px-3 py-1 text-xs font-bold text-[#8A6300]">
                    <MapPin className="h-3.5 w-3.5 text-[#FFC800]" />
                    {formatDistance(listing.distanceKm)}
                  </span>
                )}
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
                  {listing.quantity} {listing.category}
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-[#6B7280]">
                {listing.description ?? "No additional description was provided by the donor."}
              </p>
            </div>

            <dl className="grid gap-4 border-t border-[#E5E7EB] pt-5 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Pickup window</dt>
                <dd className="font-semibold text-[#14251C] flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#1CB0F6] shrink-0" />
                  {formatPickupWindow(listing.pickupWindowStart, listing.pickupWindowEnd)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Address visibility</dt>
                <dd className="font-semibold text-[#14251C] flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#22C55E] shrink-0" />
                  {listing.addressVisible
                    ? [listing.addressLine, listing.locality, listing.city].filter(Boolean).join(", ")
                    : `${listing.locality}, ${listing.city} (exact address unlocks after lock)`}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Coordinates</dt>
                <dd className="font-medium text-[#4B5563] font-mono text-xs">
                  {formatCoordinates(listing.latitude, listing.longitude)}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Claim state</dt>
                <dd className="font-bold text-[#14251C] capitalize">
                  {(listing.claimState ?? "not claimed").replace("_", " ")}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Right Column: Actions & Chat Panel */}
          <div className="space-y-6">
            {/* Action Trigger Card */}
            <Card className="p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-[#14251C]">
                NGO Pickup Actions
              </h3>

              {listing.canLock ? (
                <form action={lockListingAction} className="space-y-3">
                  <input name="listingId" type="hidden" value={listing.id} />
                  <p className="text-xs text-[#6B7280]">
                    Locking this listing unlocks the donor&apos;s exact address and opens a private coordination chat.
                  </p>
                  {auth.previewMode ? (
                    <SubmitButton
                      className="w-full font-display"
                      idleLabel="Lock donation (Demo)"
                      pendingLabel="Locking..."
                    />
                  ) : (
                    <SubmitButton
                      className="w-full font-display"
                      idleLabel="Lock this donation 🔒"
                      pendingLabel="Locking..."
                    />
                  )}
                </form>
              ) : null}

              {listing.canMarkPickedUp ? (
                <form action={completePickupAction} className="space-y-3">
                  <input name="listingId" type="hidden" value={listing.id} />
                  <p className="text-xs text-[#6B7280]">
                    Once your volunteer receives the items from the donor, confirm completion below.
                  </p>
                  {auth.previewMode ? (
                    <SubmitButton
                      className="w-full font-display"
                      idleLabel="Mark pickup completed (Demo)"
                      pendingLabel="Updating..."
                    />
                  ) : (
                    <SubmitButton
                      className="w-full font-display"
                      idleLabel="Mark pickup completed ✅"
                      pendingLabel="Updating..."
                    />
                  )}
                </form>
              ) : null}

              {!listing.canLock && !listing.canMarkPickedUp ? (
                <div className="flex items-center gap-2 rounded-2xl bg-[#F1FCF5] p-3 text-xs font-bold text-[#17A34A]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>This listing is completed! Thank you for moving essentials.</span>
                </div>
              ) : null}
            </Card>

            {/* Realtime Chat */}
            <ListingChatPanel
              canShareOwnPhone={true}
              chatEnabled={listing.chatEnabled}
              currentUserRole="ngo"
              initialMessages={listing.chatMessages}
              listingId={listing.id}
              participantName={listing.chatParticipantName}
              participantPhone={listing.chatParticipantPhone}
              previewMode={auth.previewMode}
              shareableOwnPhone={auth.ngoMembership?.ngo?.contact_phone ?? null}
            />

            {/* Feedback Form for completed pickups */}
            {(listing.canLeaveFeedback || listing.status === "picked_up") && (
              <FeedbackForm
                claimId={listing.claimId}
                listingId={listing.id}
                previewMode={auth.previewMode}
                targetRole="donor"
              />
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

