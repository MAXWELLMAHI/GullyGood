import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-[#22C55E] text-white shadow-[0_10px_24px_rgba(34,197,94,0.32)] hover:bg-[#17A34A] hover:shadow-[0_12px_28px_rgba(34,197,94,0.4)]",
  secondary:
    "bg-[#FFC800] text-[#14251C] shadow-[0_10px_24px_rgba(255,200,0,0.25)] hover:bg-[#E6B400]",
  dark:
    "bg-[#14251C] text-white shadow-[0_10px_24px_rgba(20,37,28,0.25)] hover:bg-[#1B3226]",
  outline:
    "border-2 border-[#E5E7EB] bg-white text-[#14251C] hover:border-[#22C55E] hover:bg-[#F1FCF5]",
  ghost:
    "bg-transparent text-[#14251C] hover:bg-[#F3F4F6]",
} as const;

const sizes = {
  sm: "h-9 rounded-full px-4 text-xs font-semibold",
  md: "h-11 rounded-full px-5 text-sm font-semibold",
  lg: "h-13 rounded-full px-7 text-base font-bold",
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
        "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#22C55E]/30 disabled:pointer-events-none disabled:opacity-50 cursor-pointer font-sans",
        variants[variant],
        sizes[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}

