import type { DonationStatus } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";

type StatusPillProps = {
  status: DonationStatus;
};

const variantByStatus: Record<
  DonationStatus,
  "neutral" | "success" | "accent" | "warning"
> = {
  submitted: "neutral",
  live: "success",
  locked: "accent",
  picked_up: "success",
  cancelled: "warning",
  expired: "warning",
};

const labelByStatus: Record<DonationStatus, string> = {
  submitted: "Submitted",
  live: "Matching NGOs",
  locked: "Locked · Claimed",
  picked_up: "Picked Up",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <Badge variant={variantByStatus[status]}>
      {status === "live" && <span className="dot-live mr-1" />}
      {status === "locked" && <span className="inline-block h-2 w-2 rounded-full bg-[#FFC800] mr-1" />}
      {status === "picked_up" && <span className="inline-block h-2 w-2 rounded-full bg-[#22C55E] mr-1" />}
      {labelByStatus[status] || status.replace("_", " ")}
    </Badge>
  );
}

