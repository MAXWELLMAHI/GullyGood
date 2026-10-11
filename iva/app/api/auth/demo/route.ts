import { NextResponse, type NextRequest } from "next/server";
import { getDefaultRouteForRole, type AppRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
  const roleParam = request.nextUrl.searchParams.get("role") || "donor";
  const role: AppRole =
    roleParam === "admin" ? "admin" : roleParam === "ngo" ? "ngo" : "donor";

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "192.168.0.109:3001";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const path = getDefaultRouteForRole(role);
  const targetUrl = `${proto}://${host}${path}`;

  const response = NextResponse.redirect(targetUrl);

  response.cookies.set("iva_demo_role", role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  return response;
}

export async function POST(request: NextRequest) {
  return GET(request);
}
