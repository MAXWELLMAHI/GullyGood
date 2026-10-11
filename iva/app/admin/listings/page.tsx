import Link from "next/link";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/donation/status-pill";
import { getAdminDashboardData } from "@/lib/data";
import { requireRole } from "@/lib/auth";

export default async function AdminListingsPage() {
  const auth = await requireRole("admin");
  const data = await getAdminDashboardData();

  return (
    <DashboardShell
      actions={
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold text-[#14251C] shadow-xs transition hover:bg-[#F1FCF5]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Operations</span>
        </Link>
      }
      description="View the complete marketplace listings and registered donor & NGO user accounts."
      eyebrow="Marketplace Inventory"
      previewMode={auth.previewMode}
      title="All Listings & Platform Accounts"
    >
      <div className="space-y-8">
        {/* Listings Table */}
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">Live & Historical Listings</h2>
          <Card className="overflow-hidden p-0 border border-[#E5E7EB]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#E5E7EB] bg-[#FCFCFA] text-[#6B7280]">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Listing</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Pickup window</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Location</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {data.listings.map((listing) => (
                    <tr key={listing.id} className="bg-white hover:bg-[#FCFCFA] transition-colors">
                      <td className="px-5 py-4 align-top">
                        <Link href={`/donor/listings/${listing.id}`} className="font-bold text-[#14251C] hover:text-[#17A34A] hover:underline">
                          {listing.category}
                        </Link>
                        <p className="text-xs text-[#6B7280]">
                          {listing.quantity} items · {listing.quality}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-xs text-[#6B7280]">
                        {new Date(listing.pickupWindowStart).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-5 py-4 align-top text-xs text-[#6B7280]">
                        {[listing.addressLine, listing.locality, listing.city]
                          .filter(Boolean)
                          .join(", ")}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <StatusPill status={listing.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">Registered User Accounts</h2>
          <Card className="overflow-hidden p-0 border border-[#E5E7EB]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#E5E7EB] bg-[#FCFCFA] text-[#6B7280]">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">User</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">City</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Pincode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {data.users.map((user) => (
                    <tr key={user.id} className="bg-white hover:bg-[#FCFCFA] transition-colors">
                      <td className="px-5 py-4 align-top font-bold text-[#14251C]">
                        {user.fullName ?? "Unnamed user"}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className="rounded-full bg-[#F1FCF5] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#17A34A]">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top text-xs text-[#6B7280]">{user.city ?? "Mumbai"}</td>
                      <td className="px-5 py-4 align-top text-xs text-[#6B7280]">
                        {user.pincode ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

