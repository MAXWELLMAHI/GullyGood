import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111111] shadow-xs outline-none transition focus:border-[#22C55E] focus:ring-4 focus:ring-[#22C55E]/20",
        className,
      )}
      {...props}
    />
  );
}

