import { redirect } from "next/navigation";
import { Sparkles, KeyRound, ShieldCheck, HeartHandshake } from "lucide-react";
import { AuthForm } from "@/components/layout/auth-form";
import { Card } from "@/components/ui/card";
import { getAuthContext, isDemoModeAllowed } from "@/lib/auth";
import { demoCredentials } from "@/lib/mock-data";
import { getDefaultRouteForRole } from "@/lib/roles";

export default async function LoginPage() {
  const auth = await getAuthContext();

  if (auth.user && auth.role) {
    redirect(getDefaultRouteForRole(auth.role));
  }

  const showDemo = isDemoModeAllowed();

  return (
    <div className="space-y-8 pb-8">
      <section className={showDemo ? "grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_400px]" : "grid gap-6"}>
        {/* Ink Hero Banner */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#14251C] via-[#162D22] to-[#1C3A2D] p-8 text-white shadow-[0_24px_60px_-12px_rgba(20,37,28,0.35)] sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#22C55E]/15 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#22C55E] backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5" />
              GullyGood Access
            </span>

            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Sign in to launch your donation loop.
            </h1>

            <p className="max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
              Donors, verified NGOs, and admins share the same streamlined backend, designed to move Mumbai essentials in under 90 seconds.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-white/70">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#22C55E]" /> Verified NGOs
              </span>
              <span className="flex items-center gap-1.5">
                <HeartHandshake className="h-4 w-4 text-[#22C55E]" /> 100% Free & Hyperlocal
              </span>
            </div>
          </div>
        </div>

        {/* Demo Credentials Quick Guide - Hidden in Production unless demo enabled */}
        {showDemo ? (
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#FFC800]" />
              <h2 className="font-display text-lg font-bold text-[#14251C]">Seeded demo accounts</h2>
            </div>
            <p className="mt-1 text-xs text-[#6B7280]">
              Use these test credentials or create your own instant account below.
            </p>

            <div className="mt-4 space-y-2.5">
              {demoCredentials.map((credential) => (
                <div
                  key={credential.role}
                  className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-[#FCFCFA] p-3 text-xs"
                >
                  <div>
                    <span className="rounded-full bg-[#F1FCF5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#17A34A]">
                      {credential.role}
                    </span>
                    <p className="mt-1 font-semibold text-[#14251C]">
                      {credential.email}
                    </p>
                  </div>
                  <code className="rounded-lg bg-white px-2 py-1 font-mono text-[11px] text-[#6B7280] border border-[#E5E7EB]">
                    {credential.password}
                  </code>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </section>

      <AuthForm previewMode={!auth.supabaseConfigured} showDemoPresets={showDemo} />
    </div>
  );
}

