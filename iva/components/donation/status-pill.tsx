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

export function StatusPill({ status }: StatusPillProps) {
  return (
    <Badge variant={variantByStatus[status]}>
      {status.replace("_", " ")}
    </Badge>
  );
}
