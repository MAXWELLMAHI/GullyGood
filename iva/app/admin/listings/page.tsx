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
      description="View the latest donation activity, claim assignments, and the user base behind the marketplace."
      eyebrow="Listings and users"
      previewMode={auth.previewMode}
      title="Inspect supply, claims, and account coverage."
    >
      <Card className="glass-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border/70 bg-white/70 text-muted">
              <tr>
                <th className="px-5 py-4 font-medium">Listing</th>
                <th className="px-5 py-4 font-medium">Pickup window</th>
                <th className="px-5 py-4 font-medium">Location</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.listings.map((listing) => (
                <tr key={listing.id} className="border-b border-border/60 bg-card/70">
                  <td className="px-5 py-4 align-top">
                    <p className="font-semibold text-foreground">{listing.category}</p>
                    <p className="mt-1 text-muted">
                      {listing.quantity} items · {listing.quality}
                    </p>
                  </td>
                  <td className="px-5 py-4 align-top text-muted">
                    {new Date(listing.pickupWindowStart).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 align-top text-muted">
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

      <Card className="glass-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border/70 bg-white/70 text-muted">
              <tr>
                <th className="px-5 py-4 font-medium">User</th>
                <th className="px-5 py-4 font-medium">Role</th>
                <th className="px-5 py-4 font-medium">City</th>
                <th className="px-5 py-4 font-medium">Pincode</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id} className="border-b border-border/60 bg-card/70">
                  <td className="px-5 py-4 align-top font-semibold text-foreground">
                    {user.fullName ?? "Unnamed user"}
                  </td>
                  <td className="px-5 py-4 align-top capitalize text-muted">
                    {user.role}
                  </td>
                  <td className="px-5 py-4 align-top text-muted">{user.city ?? "—"}</td>
                  <td className="px-5 py-4 align-top text-muted">
                    {user.pincode ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardShell>
  );
}
