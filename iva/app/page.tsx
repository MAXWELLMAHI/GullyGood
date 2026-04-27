import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/roles";
import { Card } from "@/components/ui/card";

const steps = [
  "Donor uploads item details, image, pickup window, and location.",
  "Nearby verified NGOs see live listings inside their service radius.",
  "An NGO locks one listing, revealing the exact donor address only after claim.",
  "Pickup completes, status updates, and both sides leave feedback.",
];

const modules = [
  {
    title: "Donor app",
    text: "Register, donate in under a minute, and track each listing from submission to pickup.",
  },
  {
    title: "NGO dashboard",
    text: "Prioritize nearby donations by radius, category, and time window without exposing donor addresses too early.",
  },
  {
    title: "Admin controls",
    text: "Manually onboard NGOs, verify compliance details, and monitor users, claims, and complaints.",
  },
];

export default async function Home() {
  const auth = await getAuthContext();
  const primaryHref =
    auth.user && auth.role ? getDefaultRouteForRole(auth.role) : "/login";

  return (
    <div className="page-grid">
      <section className="grid gap-6 rounded-[36px] border border-border/70 bg-[linear-gradient(135deg,_rgba(255,250,244,0.95),_rgba(246,232,214,0.88))] p-6 shadow-[0_24px_70px_rgba(20,59,42,0.1)] sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
              Phase 1 MVP
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              IVA helps Mumbai donors move essentials to verified NGOs without the usual coordination drag.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
              App Router on the front end, Supabase for auth and data, PostGIS-ready matching underneath, and a mobile-first flow designed around one clean loop: upload, match, lock, pick up, review.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition hover:bg-[#184934]"
            >
              {auth.user ? "Open dashboard" : "Start with login"}
            </Link>
            <Link
              href="/donor/donate"
              className="rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-brand/40 hover:bg-white"
            >
              Preview donor flow
            </Link>
          </div>
        </div>

        <Card className="glass-panel flex flex-col justify-between p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Donation loop
            </p>
            <div className="mt-5 space-y-5">
              {steps.map((step, index) => (
                <div key={step} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-7 text-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.title} className="p-6">
            <h2 className="text-xl font-semibold text-foreground">{module.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{module.text}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
