import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  neutral: "bg-[#F3F4F6] text-[#4B5563]",
  success: "bg-[#F1FCF5] text-[#17A34A] border border-[#22C55E]/20",
  accent: "bg-[#FFFBEB] text-[#8A6300] border border-[#FFC800]/30",
  warning: "bg-[#FEF2F2] text-[#FF4B4B] border border-[#FF4B4B]/20",
  sky: "bg-[#F0F9FF] text-[#0284C7] border border-[#1CB0F6]/25",
  purple: "bg-[#F5F3FF] text-[#7C6EF2] border border-[#7C6EF2]/25",
  ink: "bg-[#14251C] text-white",
} as const;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

