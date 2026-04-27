import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDefaultRouteForRole, type AppRole } from "@/lib/roles";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type NgoRow = Database["public"]["Tables"]["ngos"]["Row"];
type NgoStaffRow = Database["public"]["Tables"]["ngo_staff"]["Row"];

export type AuthContext = {
  supabaseConfigured: boolean;
  previewMode: boolean;
  user: User | null;
  profile: ProfileRow | null;
  role: AppRole | null;
  ngoMembership: (NgoStaffRow & { ngo: NgoRow | null }) | null;
};

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      supabaseConfigured: false,
      previewMode: true,
      user: null,
      profile: null,
      role: null,
      ngoMembership: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabaseConfigured: true,
      previewMode: false,
      user: null,
      profile: null,
      role: null,
      ngoMembership: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? null) as AppRole | null;

  let ngoMembership: AuthContext["ngoMembership"] = null;

  if (role === "ngo") {
    const { data } = await supabase
      .from("ngo_staff")
      .select("*, ngo:ngos(*)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    ngoMembership =
      (data as (NgoStaffRow & { ngo: NgoRow | null }) | null) ?? null;
  }

  return {
    supabaseConfigured: true,
    previewMode: false,
    user,
    profile: profile ?? null,
    role,
    ngoMembership,
  };
});

export async function requireRole(
  allowedRoles: AppRole | AppRole[],
): Promise<AuthContext> {
  const auth = await getAuthContext();
  const normalizedRoles = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  if (!auth.supabaseConfigured) {
    return {
      ...auth,
      role: normalizedRoles[0],
    };
  }

  if (!auth.user) {
    redirect("/login");
  }

  if (!auth.role) {
    redirect("/login");
  }

  if (!normalizedRoles.includes(auth.role)) {
    redirect(getDefaultRouteForRole(auth.role));
  }

  return auth;
}
