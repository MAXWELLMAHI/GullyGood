import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, ShieldCheck } from "lucide-react";
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
      actions={
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-bold text-[#14251C] shadow-xs transition hover:bg-[#F1FCF5]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Operations</span>
        </Link>
      }
      description="Create NGO records manually, verify Darpan registration documents, and approve coverage radius for live matching."
      eyebrow="NGO Management"
      previewMode={auth.previewMode}
      title="Verified NGO Directory & Compliance"
    >
      <div className="space-y-8">
        <AddNgoForm previewMode={auth.previewMode} />

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">Registered NGO Partners</h2>
          <Card className="overflow-hidden p-0 border border-[#E5E7EB]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#E5E7EB] bg-[#FCFCFA] text-[#6B7280]">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">NGO Organization</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Compliance Docs</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Service Radius</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {data.ngos.map((ngo) => (
                    <tr key={ngo.id} className="bg-white hover:bg-[#FCFCFA] transition-colors">
                      <td className="px-5 py-4 align-top">
                        <p className="font-bold text-[#14251C]">{ngo.name}</p>
                        <p className="mt-1 text-xs text-[#6B7280]">
                          {[ngo.address, ngo.city, ngo.pincode].filter(Boolean).join(", ")}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-xs text-[#6B7280]">
                        <p><strong>Darpan:</strong> {ngo.ngoDarpanId ?? "Pending"}</p>
                        <p><strong>Reg:</strong> {ngo.registrationNumber ?? "Pending"}</p>
                      </td>
                      <td className="px-5 py-4 align-top text-xs font-bold text-[#14251C]">
                        {ngo.serviceRadiusKm} km radius
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          ngo.verifiedStatus === "verified"
                            ? "bg-[#F1FCF5] text-[#17A34A] border border-[#22C55E]/30"
                            : "bg-[#FFFBEB] text-[#8A6300] border border-[#FFC800]/30"
                        }`}>
                          {ngo.verifiedStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <form action={updateNgoStatusAction} className="flex gap-2">
                          <input name="ngoId" type="hidden" value={ngo.id} />
                          <input name="verifiedStatus" type="hidden" value="verified" />
                          <button
                            className="rounded-full bg-[#22C55E] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#17A34A] disabled:opacity-50 disabled:pointer-events-none"
                            disabled={auth.previewMode || ngo.verifiedStatus === "verified"}
                            type="submit"
                          >
                            {ngo.verifiedStatus === "verified" ? "Verified ✓" : "Approve"}
                          </button>
                        </form>
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

