import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  const response = NextResponse.next({
    request,
  });

  if (!env) {
    return {
      response,
      user: null,
      supabaseConfigured: false,
    };
  }

  // Fast-path 1: Demo sessions require zero remote auth calls (instant 0ms)
  const isDemo = Boolean(
    request.cookies.get("iva_demo_role")?.value ||
      request.cookies.get("mock_user_email")?.value,
  );
  if (isDemo) {
    const pathname = request.nextUrl.pathname;
    let targetRole: string | null = null;
    if (pathname.startsWith("/donor")) targetRole = "donor";
    else if (pathname.startsWith("/ngo")) targetRole = "ngo";
    else if (pathname.startsWith("/admin")) targetRole = "admin";

    if (targetRole && request.cookies.get("iva_demo_role")?.value !== targetRole) {
      response.cookies.set("iva_demo_role", targetRole, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return {
      response,
      user: null,
      supabaseConfigured: true,
    };
  }

  // Fast-path 2: If there are no Supabase auth token cookies in the request,
  // do NOT make a blocking 2-second remote call to Supabase across the internet!
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  if (!hasAuthCookie) {
    return {
      response,
      user: null,
      supabaseConfigured: true,
    };
  }

  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Only refresh when auth cookies actually exist in the request
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      response,
      user,
      supabaseConfigured: true,
    };
  } catch {
    return {
      response,
      user: null,
      supabaseConfigured: true,
    };
  }
}

