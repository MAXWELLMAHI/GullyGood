import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CreateDonationForm } from "@/components/donation/create-donation-form";
import { requireRole } from "@/lib/auth";

export default async function DonorDonatePage() {
  const auth = await requireRole("donor");

  return (
    <DashboardShell
      description="Create a listing with enough detail for NGOs to match quickly without exposing your exact address too early."
      eyebrow="New donation"
      previewMode={auth.previewMode}
      title="Add a donation in one clean pass."
    >
      <CreateDonationForm previewMode={auth.previewMode} />
    </DashboardShell>
  );
}
