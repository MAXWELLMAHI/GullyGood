"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  idleLabel: string;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "dark" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function SubmitButton({
  idleLabel,
  pendingLabel = "Working...",
  className,
  disabled = false,
  variant = "primary",
  size = "md",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={className}
      disabled={disabled || pending}
      size={size}
      type="submit"
      variant={variant}
    >
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

