export const APP_ROLES = ["donor", "ngo", "admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const DONATION_STATUSES = [
  "submitted",
  "live",
  "locked",
  "picked_up",
  "cancelled",
  "expired",
] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const CLAIM_STATUSES = [
  "locked",
  "completed",
  "cancelled",
  "timed_out",
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const NGO_VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "suspended",
] as const;
export type NgoVerificationStatus =
  (typeof NGO_VERIFICATION_STATUSES)[number];

export const ITEM_QUALITIES = ["new", "excellent", "good", "fair"] as const;
export type ItemQuality = (typeof ITEM_QUALITIES)[number];

export const roleLabels: Record<AppRole, string> = {
  donor: "Donor",
  ngo: "NGO",
  admin: "Admin",
};

export function isAppRole(value: string | null | undefined): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function getDefaultRouteForRole(role: AppRole) {
  switch (role) {
    case "donor":
      return "/donor/dashboard";
    case "ngo":
      return "/ngo/dashboard";
    case "admin":
      return "/admin/dashboard";
  }
}
