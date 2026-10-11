import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDefaultRouteForRole, isAppRole } from "@/lib/roles";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const selectedRole = requestUrl.searchParams.get("role");
  let nextPath = requestUrl.searchParams.get("next") ?? "/";

  if (!nextPath.startsWith("/")) {
    nextPath = "/";
  }

  const fallbackRedirect = new URL("/login", requestUrl.origin);
  const supabase = await createServerSupabaseClient();

  if (!supabase || !code) {
    return NextResponse.redirect(fallbackRedirect);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(fallbackRedirect);
  }

  const user = data.user ?? data.session?.user;

  if (!user) {
    return NextResponse.redirect(fallbackRedirect);
  }

  await supabase.rpc("sync_profile_from_auth_user", {
    target_user_id: user.id,
  });

  if (selectedRole === "donor" || selectedRole === "ngo") {
    await supabase
      .from("profiles")
      .update({
        role: selectedRole,
      })
      .eq("id", user.id);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const resolvedRole = isAppRole(profile?.role)
    ? profile.role
    : selectedRole === "ngo"
      ? "ngo"
      : "donor";
  const redirectPath =
    nextPath !== "/" ? nextPath : getDefaultRouteForRole(resolvedRole);

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
