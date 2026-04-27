import { updateNgoStatusAction } from "@/app/actions";
import { AddNgoForm } from "@/components/admin/add-ngo-form";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/data";

export default async function AdminNgosPage() {
  const auth = await requireRole("admin");
  const data = await getAdminDashboardData();

  return (
    <DashboardShell
      description="Create NGO records manually, verify documents, and update service radius before they join the live matching pool."
      eyebrow="NGO management"
      previewMode={auth.previewMode}
      title="Review every organization before it reaches donor supply."
    >
      <AddNgoForm previewMode={auth.previewMode} />

      <Card className="glass-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border/70 bg-white/70 text-muted">
              <tr>
                <th className="px-5 py-4 font-medium">NGO</th>
                <th className="px-5 py-4 font-medium">Docs</th>
                <th className="px-5 py-4 font-medium">Coverage</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.ngos.map((ngo) => (
                <tr key={ngo.id} className="border-b border-border/60 bg-card/70">
                  <td className="px-5 py-4 align-top">
                    <p className="font-semibold text-foreground">{ngo.name}</p>
                    <p className="mt-1 text-muted">
                      {[ngo.address, ngo.city, ngo.pincode].filter(Boolean).join(", ")}
                    </p>
                  </td>
                  <td className="px-5 py-4 align-top text-muted">
                    <p>Darpan: {ngo.ngoDarpanId ?? "Pending"}</p>
                    <p>Registration: {ngo.registrationNumber ?? "Pending"}</p>
                  </td>
                  <td className="px-5 py-4 align-top text-muted">
                    {ngo.serviceRadiusKm} km
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className="rounded-full bg-muted-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                      {ngo.verifiedStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <form action={updateNgoStatusAction} className="flex gap-2">
                      <input name="ngoId" type="hidden" value={ngo.id} />
                      <input name="verifiedStatus" type="hidden" value="verified" />
                      <button
                        className="rounded-full bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-foreground transition hover:bg-[#184934]"
                        disabled={auth.previewMode || ngo.verifiedStatus === "verified"}
                        type="submit"
                      >
                        Verify
                      </button>
                    </form>
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
