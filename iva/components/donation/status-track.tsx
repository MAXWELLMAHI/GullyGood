import { CheckCircle2, LocateFixed, Lock, PackageCheck } from "lucide-react";
import type { DonationStatus } from "@/lib/roles";
import { cn } from "@/lib/utils";

type StatusTrackProps = {
  status: DonationStatus;
};

const steps = [
  { key: "submitted", label: "Submitted", icon: CheckCircle2, color: "#22C55E" },
  { key: "live", label: "Matching NGOs", icon: LocateFixed, color: "#1CB0F6" },
  { key: "locked", label: "Locked", icon: Lock, color: "#FFC800" },
  { key: "picked_up", label: "Completed", icon: PackageCheck, color: "#22C55E" },
] as const;

const statusOrder: Record<DonationStatus, number> = {
  submitted: 0,
  live: 1,
  locked: 2,
  picked_up: 3,
  cancelled: 1,
  expired: 1,
};

export function StatusTrack({ status }: StatusTrackProps) {
  const activeStepIndex = statusOrder[status];

  return (
    <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isComplete = index <= activeStepIndex;
          const isCurrent = index === activeStepIndex;

          return (
            <div key={step.key} className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={cn(
                  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200",
                  isComplete
                    ? "border-[#22C55E]/30 bg-[#F1FCF5] text-[#17A34A] shadow-[0_6px_16px_rgba(34,197,94,0.18)]"
                    : "border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF]",
                  isCurrent ? "scale-105 ring-4 ring-[#22C55E]/20 font-bold" : "",
                )}
              >
                <Icon className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    isComplete ? "text-[#14251C]" : "text-[#9CA3AF]",
                  )}
                >
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 ? (
                <div
                  className={cn(
                    "hidden h-1.5 flex-1 rounded-full md:block transition-all",
                    index < activeStepIndex
                      ? "bg-[#22C55E]"
                      : "bg-[#E5E7EB]",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {(status === "cancelled" || status === "expired") ? (
        <p className="mt-3 text-xs font-semibold text-[#FF4B4B]">
          This loop paused before pickup completion, so the live timeline stopped early.
        </p>
      ) : null}
    </div>
  );
}

