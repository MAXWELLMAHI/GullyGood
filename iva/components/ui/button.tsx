import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-brand text-brand-foreground shadow-[0_16px_40px_rgba(20,59,42,0.12)] hover:-translate-y-0.5 hover:bg-[#184934]",
  secondary:
    "bg-accent text-accent-foreground shadow-[0_16px_40px_rgba(234,140,67,0.18)] hover:-translate-y-0.5 hover:bg-[#dd7e36]",
  outline:
    "border border-border bg-card/70 text-foreground hover:border-brand/40 hover:bg-muted-surface/60",
  ghost: "bg-transparent text-foreground hover:bg-muted-surface/70",
} as const;

const sizes = {
  sm: "h-10 rounded-full px-4 text-sm",
  md: "h-11 rounded-full px-5 text-sm font-medium",
  lg: "h-12 rounded-full px-6 text-base font-semibold",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
