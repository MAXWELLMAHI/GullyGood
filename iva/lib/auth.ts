import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
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

const DEMO_USERS: Record<AppRole, { user: User; profile: ProfileRow; ngoMembership: AuthContext["ngoMembership"] }> = {
  donor: {
    user: {
      id: "11111111-1111-1111-1111-111111111111",
      email: "donor@gullygood.app",
      app_metadata: {},
      user_metadata: { full_name: "Asha Mehta" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User,
    profile: {
      id: "11111111-1111-1111-1111-111111111111",
      role: "donor",
      full_name: "Asha Mehta",
      city: "Mumbai",
      pincode: "400016",
      phone: "+91 90000 11111",
      created_at: new Date().toISOString(),
    } as unknown as ProfileRow,
    ngoMembership: null,
  },
  ngo: {
    user: {
      id: "22222222-2222-2222-2222-222222222222",
      email: "ngo@gullygood.app",
      app_metadata: {},
      user_metadata: { full_name: "Rohan Patil" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User,
    profile: {
      id: "22222222-2222-2222-2222-222222222222",
      role: "ngo",
      full_name: "Rohan Patil",
      city: "Mumbai",
      pincode: "400050",
      phone: "+91 98765 43210",
      created_at: new Date().toISOString(),
    } as unknown as ProfileRow,
    ngoMembership: {
      user_id: "22222222-2222-2222-2222-222222222222",
      ngo_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      role: "lead",
      created_at: new Date().toISOString(),
      ngo: {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        name: "Sahaara Community Trust",
        address: "Hill Road Outreach Centre",
        city: "Mumbai",
        pincode: "400050",
        ngo_darpan_id: "MH/2026/0001111",
        registration_number: "MH-TRUST-48211",
        contact_phone: "+91 98765 43210",
        service_radius_km: 8,
        daily_pickup_capacity: 14,
        rating_average: 4.8,
        completion_rate: 0.94,
        verified_status: "verified",
        accepted_categories: ["Blankets", "Books", "Clothes"],
        latitude: 19.0548,
        longitude: 72.8265,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as NgoRow,
    } as unknown as (NgoStaffRow & { ngo: NgoRow | null }),
  },
  admin: {
    user: {
      id: "33333333-3333-3333-3333-333333333333",
      email: "admin@gullygood.app",
      app_metadata: {},
      user_metadata: { full_name: "GullyGood Ops" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User,
    profile: {
      id: "33333333-3333-3333-3333-333333333333",
      role: "admin",
      full_name: "GullyGood Ops",
      city: "Mumbai",
      pincode: "400001",
      phone: "+91 99999 00000",
      created_at: new Date().toISOString(),
    } as unknown as ProfileRow,
    ngoMembership: null,
  },
};

export function isDemoModeAllowed(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "false") {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
  }
  return true;
}

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = null;
  }

  // Check for demo role or mock email session (strictly guarded for production)
  const allowDemo = isDemoModeAllowed();
  const demoRoleCookie = allowDemo
    ? (cookieStore?.get("iva_demo_role")?.value as AppRole | undefined)
    : undefined;
  const mockEmail = allowDemo ? cookieStore?.get("mock_user_email")?.value : undefined;

  const demoRole: AppRole | null =
    allowDemo && demoRoleCookie && DEMO_USERS[demoRoleCookie]
      ? demoRoleCookie
      : allowDemo && (mockEmail === "admin@gullygood.app" || mockEmail === "admin@iva.app")
      ? "admin"
      : allowDemo && (mockEmail === "ngo@gullygood.app" || mockEmail === "ngo@iva.app")
      ? "ngo"
      : allowDemo && (mockEmail === "donor@gullygood.app" || mockEmail === "donor@iva.app")
      ? "donor"
      : null;

  if (demoRole && DEMO_USERS[demoRole]) {
    const demo = DEMO_USERS[demoRole];
    return {
      supabaseConfigured: true,
      previewMode: false,
      user: demo.user,
      profile: demo.profile,
      role: demoRole,
      ngoMembership: demo.ngoMembership,
    };
  }

  // Fast-path: If no Supabase auth token cookie exists, don't make a slow remote network call
  const hasAuthCookie = cookieStore
    ?.getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  if (!hasAuthCookie) {
    return {
      supabaseConfigured: isSupabaseConfigured(),
      previewMode: true,
      user: null,
      profile: null,
      role: null,
      ngoMembership: null,
    };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      supabaseConfigured: isSupabaseConfigured(),
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

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.rpc("sync_profile_from_auth_user", {
      target_user_id: user.id,
    });

    const { data: syncedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    profile = syncedProfile ?? null;
  }

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

  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = null;
  }

  const isDemoSession = Boolean(
    cookieStore?.get("iva_demo_role")?.value ||
      cookieStore?.get("mock_user_email")?.value,
  );

  // If in demo mode, auto-switch active role so the user is never trapped in donor dashboard
  if (isDemoSession) {
    const targetRole = normalizedRoles[0];
    if (auth.role !== targetRole) {
      try {
        cookieStore?.set("iva_demo_role", targetRole, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      } catch {
        // Next.js Server Components have a read-only cookies() store.
        // Role switching is persisted via middleware or Server Actions.
      }
      const demo = DEMO_USERS[targetRole];
      return {
        supabaseConfigured: true,
        previewMode: false,
        user: demo.user,
        profile: demo.profile,
        role: targetRole,
        ngoMembership: demo.ngoMembership,
      };
    }
    return auth;
  }

  if (!auth.supabaseConfigured && !auth.user) {
    return {
      ...auth,
      role: normalizedRoles[0],
    };
  }

  if (!auth.user || !auth.role) {
    redirect("/login");
  }

  if (!normalizedRoles.includes(auth.role)) {
    redirect(getDefaultRouteForRole(auth.role));
  }

  return auth;
}

