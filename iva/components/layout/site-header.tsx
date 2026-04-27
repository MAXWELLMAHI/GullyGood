import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { getAuthContext } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/roles";

export async function SiteHeader() {
  const auth = await getAuthContext();
  const dashboardHref = auth.role ? getDefaultRouteForRole(auth.role) : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-[rgba(248,242,233,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-brand-foreground shadow-[0_12px_30px_rgba(20,59,42,0.2)]">
              IVA
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted">
                Mumbai-first
              </p>
              <p className="text-base font-semibold text-foreground">
                Hyperlocal donation loop
              </p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-5 text-sm font-medium text-muted md:flex">
          <Link href="/donor/dashboard" className="transition hover:text-foreground">
            Donor
          </Link>
          <Link href="/ngo/dashboard" className="transition hover:text-foreground">
            NGO
          </Link>
          <Link href="/admin/dashboard" className="transition hover:text-foreground">
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {auth.previewMode ? (
            <span className="rounded-full bg-muted-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
              UI preview mode
            </span>
          ) : null}

          {auth.user ? (
            <>
              <Link
                href={dashboardHref}
                className="hidden rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:border-brand/40 hover:bg-white sm:inline-flex"
              >
                Dashboard
              </Link>
              <form action={signOutAction}>
                <button
                  className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-[#184934]"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-[#184934]"
            >
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
