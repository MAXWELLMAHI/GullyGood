import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-2xl border border-border bg-white/90 px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-[var(--ring)]",
        className,
        props.value ? "text-foreground" : "text-muted",
      )}
      {...props}
    />
  );
}
