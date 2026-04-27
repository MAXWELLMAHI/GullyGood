import { redirect } from "next/navigation";
import { AuthForm } from "@/components/layout/auth-form";
import { Card } from "@/components/ui/card";
import { getAuthContext } from "@/lib/auth";
import { demoCredentials } from "@/lib/mock-data";
import { getDefaultRouteForRole } from "@/lib/roles";

export default async function LoginPage() {
  const auth = await getAuthContext();

  if (auth.user && auth.role) {
    redirect(getDefaultRouteForRole(auth.role));
  }

  return (
    <div className="page-grid">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4 rounded-[32px] border border-border/70 bg-[linear-gradient(150deg,_rgba(31,91,61,0.98),_rgba(234,140,67,0.9))] p-8 text-brand-foreground shadow-[0_24px_70px_rgba(20,59,42,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            IVA access
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Sign in to launch the first working donation loop.
          </h1>
          <p className="max-w-xl text-base leading-8 text-white/82">
            Donors, verified NGOs, and admins all share the same secure backend, but each role sees only the workflows and data it needs.
          </p>
        </div>

        <Card className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-foreground">Seeded demo accounts</h2>
          <div className="mt-4 space-y-3">
            {demoCredentials.map((credential) => (
              <div
                key={credential.role}
                className="rounded-2xl border border-border/70 bg-white/80 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {credential.role}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {credential.email}
                </p>
                <p className="text-sm text-muted">{credential.password}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <AuthForm previewMode={!auth.supabaseConfigured} />
    </div>
  );
}
