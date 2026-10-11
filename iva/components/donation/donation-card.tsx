import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Sparkles } from "lucide-react";
import { formatDistance, formatPickupWindow, maskAddress } from "@/lib/geo";
import type { ListingSummary } from "@/lib/view-models";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/donation/status-pill";
import { cn } from "@/lib/utils";

type DonationCardProps = {
  listing: ListingSummary;
  href: string;
  ctaLabel?: string;
  ctaClassName?: string;
  showDistance?: boolean;
};

// Fixed Category Colors across entire app per Spec §4 Redline 5
const categoryStyles: Record<string, { bg: string; text: string; chip: string; emoji: string }> = {
  Clothes: { bg: "bg-[#22C55E]", text: "text-[#22C55E]", chip: "bg-[#F1FCF5] text-[#17A34A]", emoji: "👕" },
  Books: { bg: "bg-[#1CB0F6]", text: "text-[#1CB0F6]", chip: "bg-[#F0F9FF] text-[#0284C7]", emoji: "📚" },
  Blankets: { bg: "bg-[#FFC800]", text: "text-[#8A6300]", chip: "bg-[#FFFBEB] text-[#8A6300]", emoji: "🛏️" },
  "Packed Meals": { bg: "bg-[#FF6B6B]", text: "text-[#FF6B6B]", chip: "bg-[#FFF1F2] text-[#E11D48]", emoji: "🍲" },
  Toys: { bg: "bg-[#7C6EF2]", text: "text-[#7C6EF2]", chip: "bg-[#F5F3FF] text-[#7C6EF2]", emoji: "🧸" },
  Utensils: { bg: "bg-[#06B6D4]", text: "text-[#06B6D4]", chip: "bg-[#ECFEFF] text-[#0E7490]", emoji: "🥣" },
};

export function DonationCard({
  listing,
  href,
  ctaLabel = "View details",
  ctaClassName,
  showDistance = false,
}: DonationCardProps) {
  const catStyle = categoryStyles[listing.category] || {
    bg: "bg-[#22C55E]",
    text: "text-[#22C55E]",
    chip: "bg-[#F1FCF5] text-[#17A34A]",
    emoji: "📦",
  };

  return (
    <Card className="group overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_-6px_rgba(20,37,28,0.1)]">
      <div className="grid gap-0 md:grid-cols-[200px_minmax(0,1fr)]">
        {/* Left Visual Column */}
        <div className="relative flex min-h-48 items-end overflow-hidden p-5 text-white">
          {listing.imageUrl ? (
            <>
              <Image
                alt={`${listing.category} donation`}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                fill
                sizes="(max-width: 768px) 100vw, 200px"
                src={listing.imageUrl}
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-extrabold text-[#14251C] shadow-sm">
                  <span>{catStyle.emoji}</span>
                  {listing.category}
                </span>
                <p className="font-display text-lg font-bold text-white leading-tight">
                  {listing.quantity} {listing.quantity === 1 ? "unit" : "units"}
                </p>
              </div>
            </>
          ) : (
            <div className={`relative z-10 flex h-full w-full flex-col justify-between rounded-2xl ${catStyle.bg} p-4 text-white`}>
              <span className="text-3xl">{catStyle.emoji}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {listing.category}
                </p>
                <p className="font-display text-xl font-bold leading-tight">
                  {listing.quantity} units ready
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Info Column */}
        <div className="flex flex-col justify-between p-5 sm:p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={listing.status} />
              <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                {listing.quality}
              </span>
              {showDistance && listing.distanceKm != null ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] px-3 py-1 text-xs font-bold text-[#8A6300]">
                  <MapPin className="h-3.5 w-3.5 text-[#FFC800]" />
                  {formatDistance(listing.distanceKm)}
                </span>
              ) : null}
            </div>

            <h3 className="font-display text-xl font-bold text-[#14251C] group-hover:text-[#17A34A] transition-colors">
              {listing.quantity} {listing.category} in {listing.locality || listing.city}
            </h3>

            <p className="text-sm leading-relaxed text-[#6B7280] line-clamp-2">
              {listing.description ?? "Ready to support a nearby family or community program in Mumbai."}
            </p>
          </div>

          <div className="grid gap-2 border-t border-[#E5E7EB]/80 pt-4 text-xs font-medium text-[#6B7280] sm:grid-cols-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#9CA3AF] shrink-0" />
              <span>{formatPickupWindow(listing.pickupWindowStart, listing.pickupWindowEnd)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#9CA3AF] shrink-0" />
              <span className="truncate">
                {listing.addressVisible
                  ? [listing.addressLine, listing.locality, listing.city].filter(Boolean).join(", ")
                  : maskAddress(listing.locality, listing.city)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {listing.ngoName ? (
              <p className="text-xs font-semibold text-[#14251C]">
                NGO: <span className="text-[#17A34A]">{listing.ngoName}</span>
              </p>
            ) : <span />}

            <Link
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#16A34A]/25 transition-all duration-200 hover:bg-[#15803D] hover:scale-105 hover:shadow-lg active:scale-95",
                ctaClassName,
              )}
              href={href}
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

