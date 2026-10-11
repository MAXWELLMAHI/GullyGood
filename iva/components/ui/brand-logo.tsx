import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "full" | "icon";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = "full",
  size = "md",
  className,
  priority = false,
}: BrandLogoProps) {
  if (variant === "icon") {
    const iconSizes = {
      xs: "h-6 w-6",
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
      xl: "h-16 w-16",
    };

    return (
      <div className={cn("relative inline-flex shrink-0 items-center justify-center", iconSizes[size], className)}>
        <Image
          src="/gullygood-icon.png"
          alt="GullyGood icon"
          width={64}
          height={64}
          priority={priority}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  const heights = {
    xs: "h-6",
    sm: "h-7",
    md: "h-9",
    lg: "h-11",
    xl: "h-14",
  };

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Image
        src="/gullygood-logo.png"
        alt="GullyGood"
        width={220}
        height={38}
        priority={priority}
        className={cn("w-auto object-contain transition-transform duration-200", heights[size])}
      />
    </div>
  );
}
