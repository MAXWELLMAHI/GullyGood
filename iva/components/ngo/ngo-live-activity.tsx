"use client";

import Link from "next/link";
import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";
import { ArrowRight, BellRing, MapPinned, Radar, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { formatDistance, formatPickupWindow } from "@/lib/geo";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type NgoLiveActivityProps = {
  previewMode: boolean;
  initialListingIds: string[];
};

type NearbyListingRow =
  Database["public"]["Functions"]["nearby_live_listings"]["Returns"][number];

type LiveAlert = {
  id: string;
  category: string;
  locality: string;
  city: string;
  distanceKm: number | null;
  matchScore: number | null;
  pickupWindowStart: string;
  pickupWindowEnd: string;
};

const LIVE_POLL_MS = 10000;

function mapAlert(row: NearbyListingRow): LiveAlert {
  return {
    id: row.id,
    category: row.category,
    locality: row.locality,
    city: row.city,
    distanceKm: row.distance_km,
    matchScore: row.match_score,
    pickupWindowStart: row.pickup_window_start,
    pickupWindowEnd: row.pickup_window_end,
  };
}

export function NgoLiveActivity({
  previewMode,
  initialListingIds,
}: NgoLiveActivityProps) {
  const router = useRouter();
  const knownIdsRef = useRef(new Set(initialListingIds));
  const pollingRef = useRef(false);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [lastSignal, setLastSignal] = useState<string>("Scanning Mumbai radius for live donor uploads.");

  useEffect(() => {
    initialListingIds.forEach((id) => knownIdsRef.current.add(id));
  }, [initialListingIds]);

  const refreshNearbyListings = useEffectEvent(async () => {
    if (previewMode || pollingRef.current) {
      return;
    }

    const client = getSupabaseBrowserClient();

    if (!client) {
      return;
    }

    pollingRef.current = true;

    try {
      const { data, error } = await client.rpc("nearby_live_listings");

      if (error || !data) {
        if (error) {
          setLastSignal("Live radar is connecting to Supabase.");
        }
        return;
      }

      const newRows = data.filter((row) => !knownIdsRef.current.has(row.id));

      if (newRows.length === 0) {
        return;
      }

      newRows.forEach((row) => knownIdsRef.current.add(row.id));
      setLastSignal(`Fresh alert: ${newRows[0]?.category ?? "New listing"} just uploaded nearby!`);
      setAlerts((current) => {
        const next = [...newRows.map(mapAlert), ...current];
        const deduped = next.filter(
          (alert, index, all) =>
            all.findIndex((candidate) => candidate.id === alert.id) === index,
        );

        return deduped.slice(0, 3);
      });

      startTransition(() => {
        router.refresh();
      });
    } finally {
      pollingRef.current = false;
    }
  });

  useEffect(() => {
    if (previewMode) {
      return;
    }

    void refreshNearbyListings();

    const intervalId = window.setInterval(() => {
      void refreshNearbyListings();
    }, LIVE_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [previewMode]);

  useEffect(() => {
    if (!alerts.length) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAlerts((current) => current.slice(0, -1));
    }, 8500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [alerts]);

  return (
    <>
      <div className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-gradient-to-br from-[#14251C] to-[#1C3A2D] p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#22C55E] text-[#14251C] shadow-[0_8px_20px_rgba(34,197,94,0.35)]">
              <Radar className="h-6 w-6 stroke-[2.4]" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#22C55E]" />
              </span>
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-[#22C55E]">
                <Sparkles className="h-3 w-3" />
                Active Radius Matching
              </span>
              <h2 className="font-display text-xl font-bold text-white">
                Live Mumbai Pickup Radar
              </h2>
              <p className="text-xs text-white/80">
                {previewMode
                  ? "Live radar active in demo mode. Polling for nearest donor posts."
                  : lastSignal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/12 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-xs">
              {previewMode ? "Radar online (Demo)" : "Auto-scan 10s"}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Live Alert Toasts */}
      <div className="pointer-events-none fixed bottom-20 right-5 z-50 flex w-[min(92vw,25rem)] flex-col gap-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="pointer-events-auto overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-[0_20px_50px_rgba(20,37,28,0.2)] animate-hero-entrance"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1FCF5] text-[#17A34A] text-xl">
                  🔔
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#17A34A]">
                    New donation nearby
                  </span>
                  <h3 className="font-display text-base font-bold text-[#14251C]">
                    {alert.category} in {alert.locality}
                  </h3>
                </div>
              </div>
              <button
                className="rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-bold text-[#6B7280] hover:text-[#111111]"
                onClick={() =>
                  setAlerts((current) =>
                    current.filter((candidate) => candidate.id !== alert.id),
                  )
                }
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-[#6B7280]">
              <span>📍 {alert.locality}, {alert.city}</span>
              <span className="font-bold text-[#17A34A]">
                {formatDistance(alert.distanceKm)}
              </span>
            </div>

            <Link
              className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#22C55E] py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#17A34A]"
              href={`/ngo/listings/${alert.id}`}
            >
              <span>Inspect and lock</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}

