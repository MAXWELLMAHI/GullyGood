import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

type DashboardShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  previewMode?: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({
  eyebrow,
  title,
  description,
  previewMode = false,
  actions,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#E5E7EB] pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F1FCF5] px-3 py-0.5 text-xs font-bold text-[#17A34A] uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            {eyebrow}
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#14251C] sm:text-3xl">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-[#6B7280]">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div> : null}
      </section>

      {previewMode ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[#FFC800]/40 bg-[#FFFBEB] p-4 text-xs font-semibold text-[#8A6300]">
          <span className="text-base">💡</span>
          <p>
            You are exploring GullyGood in demo mode with realistic Mumbai matching data. Connect Supabase to switch to persistent production database storage.
          </p>
        </div>
      ) : null}

      {children}
    </div>
  );
}

