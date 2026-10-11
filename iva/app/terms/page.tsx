import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service — GullyGood",
  description: "Terms and conditions governing the use of GullyGood for donors and NGOs in Mumbai, India.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-16 pt-4">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14251C] shadow-2xs hover:border-[#22C55E]/50 hover:bg-[#F1FCF5]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
      </div>

      <header className="space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFBEB] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#8A6300]">
          Platform Agreement & Code of Conduct
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#14251C] sm:text-4xl">
          Terms of Service
        </h1>
        <p className="text-sm text-[#6B7280]">
          Last updated: October 2026 • Governing all users and participating NGOs across Mumbai, Maharashtra.
        </p>
      </header>

      {/* Critical Platform Disclaimer */}
      <Card className="border-[#FFC800]/40 bg-[#FFFBEB]/60 p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-[#8A6300]">
          <AlertCircle className="h-5 w-5" />
          <h2 className="font-display text-base font-bold">Coordination Facilitator Notice</h2>
        </div>
        <p className="text-xs leading-relaxed text-[#14251C]">
          GullyGood is a purely digital, non-monetary coordination intermediary connecting generous citizens with independently operated, verified charities. GullyGood does not take physical custody of donated items, does not employ NGO delivery drivers, and is not a party to disputes regarding item condition or pickup timing.
        </p>
      </Card>

      <section className="space-y-6 text-sm leading-relaxed text-[#374151]">
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">1. Eligibility & User Accounts</h2>
          <p>
            You must be at least 18 years of age and a resident of India to create a donor or NGO account. You agree to provide true, accurate, and current information regarding your location and item descriptions.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">2. Permitted & Prohibited Donation Items</h2>
          <p>To uphold dignity and safety for recipients, all donations must adhere to these standards:</p>
          
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="rounded-2xl border border-[#22C55E]/30 bg-[#F1FCF5]/60 p-4 space-y-2">
              <p className="font-bold text-xs uppercase tracking-wider text-[#17A34A] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Permitted Items
              </p>
              <ul className="text-xs space-y-1.5 text-[#14251C]">
                <li>• Clean, wearable clothing without severe tears</li>
                <li>• Clean blankets, bedsheets, and warm winterwear</li>
                <li>• Educational, fiction, and children&apos;s books</li>
                <li>• Intact toys and games with all essential parts</li>
                <li>• Non-perishable packaged groceries within expiry</li>
                <li>• Freshly cooked meals prepared in hygienic conditions</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#EF4444]/30 bg-[#FEF2F2]/60 p-4 space-y-2">
              <p className="font-bold text-xs uppercase tracking-wider text-[#DC2626] flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Strictly Prohibited
              </p>
              <ul className="text-xs space-y-1.5 text-[#14251C]">
                <li>• Expired medicines or prescription drugs</li>
                <li>• Torn, stained, or unhygienic undergarments</li>
                <li>• Broken electronics with exposed wires or lithium fire hazards</li>
                <li>• Spoiled, stale, or moldy food</li>
                <li>• Sharp weapons, flammable chemicals, or explosives</li>
                <li>• Any item prohibited by Indian state or national law</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">3. NGO Partner Obligations</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#4B5563]">
            <li>NGOs must be legitimately registered under Indian law (Society, Trust, or Section 8 Company) and hold a valid NGO Darpan ID where applicable.</li>
            <li>Claimed items must be collected within the designated pickup window agreed upon with the donor.</li>
            <li>Donated goods must be distributed free of charge to underprivileged individuals or emergency relief recipients. <strong>Commercial resale is strictly prohibited</strong> and grounds for immediate legal deregistration.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">4. Non-Monetary Disclaimer & 80G Receipts</h2>
          <p>
            GullyGood does not process payments or accept monetary donations through this platform. Any tax exemption certificates (such as Form 10BE / 80G receipts) must be directly issued and verified between the participating NGO and donor in accordance with the Income Tax Act, 1961.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by Indian law, GullyGood and its operators shall not be liable for any direct, indirect, incidental, or consequential damages arising out of:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-[#4B5563]">
            <li>Unforeseen delays or cancellations in item pickup by an NGO.</li>
            <li>Disagreements regarding item quality or suitability upon handover.</li>
            <li>Acts or omissions of third-party volunteers, drivers, or donors during in-person interactions.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">6. Governing Law & Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Mumbai, Maharashtra</strong>.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">7. Contact Us</h2>
          <p className="text-xs">
            For operational inquiries or questions regarding these terms, write to: <a href="mailto:support@gullygood.app" className="text-[#22C55E] font-medium underline">support@gullygood.app</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
