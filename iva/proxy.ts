import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 proxy (equivalent to middleware.ts in earlier versions).
 *
 * Two responsibilities:
 * 1. Calls updateSession() on every request so @supabase/ssr can refresh
 *    auth tokens before they expire (prevents silent logouts).
 * 2. Redirects unauthenticated users away from protected routes to /login.
 */

const protectedPrefixes = ["/donor", "/ngo", "/admin"];

export async function proxy(request: NextRequest) {
  const isDemo = Boolean(
    request.cookies.get("iva_demo_role")?.value ||
      request.cookies.get("mock_user_email")?.value,
  );

  if (isDemo) {
    return NextResponse.next({ request });
  }

  const { response, user, supabaseConfigured } = await updateSession(request);
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (!supabaseConfigured || !isProtectedRoute || user) {
    return response;
  }

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost:3001";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const loginUrl = new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, `${proto}://${host}`);

  const redirectResponse = NextResponse.redirect(loginUrl);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static assets so auth overhead is minimal.
     * Excluded: _next/static, _next/image, favicon.ico, api/health,
     *           and all font/image file extensions.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)",
  ],
};
