import type { ReactNode } from "react";
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
    <div className="page-grid">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            {eyebrow}
          </p>
          <div className="space-y-2">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
              {description}
            </p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </section>

      {previewMode ? (
        <Card className="glass-panel border-brand/20 bg-[rgba(255,250,244,0.92)]">
          <p className="text-sm leading-7 text-foreground">
            Supabase isn&apos;t connected yet, so these pages are rendering with
            realistic sample data. Add your environment variables to switch the
            UI to live auth, database, and storage-backed flows.
          </p>
        </Card>
      ) : null}

      {children}
    </div>
  );
}
