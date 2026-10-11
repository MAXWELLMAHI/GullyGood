import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy — GullyGood",
  description: "Privacy policy and data protection commitments for GullyGood donors and partner NGOs in India.",
};

export default function PrivacyPage() {
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
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F1FCF5] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#17A34A]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Digital Personal Data Protection (DPDP) Aligned
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#14251C] sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#6B7280]">
          Last updated: October 2026 • Applicable to all GullyGood users across Mumbai, Maharashtra, India.
        </p>
      </header>

      {/* Core Privacy Promise Banner */}
      <Card className="border-[#22C55E]/30 bg-[#F1FCF5]/50 p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-[#17A34A]">
          <Lock className="h-5 w-5" />
          <h2 className="font-display text-base font-bold">Our Core Privacy Commitment to Donors</h2>
        </div>
        <p className="text-xs leading-relaxed text-[#14251C]">
          Your complete street/flat address and phone number are <strong>never public</strong>. Nearby NGOs only see your broad locality (e.g., &ldquo;Bandra West&rdquo; or &ldquo;Andheri East&rdquo;) and general distance. Your exact pickup address is only revealed to a verified NGO <em>after</em> they officially commit to and lock your donation listing.
        </p>
      </Card>

      <section className="space-y-6 text-sm leading-relaxed text-[#374151]">
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">1. Introduction</h2>
          <p>
            GullyGood (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates a hyperlocal essentials coordination platform facilitating donations of physical goods (such as clothes, books, blankets, toys, and prepared meals) between citizens and verified Non-Governmental Organizations (NGOs) in Mumbai, India.
          </p>
          <p>
            We are committed to protecting the privacy and personal data of our donors and NGO partners in accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the Information Technology Act, 2000.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">2. Information We Collect</h2>
          <p>We only collect information strictly necessary to coordinate hyperlocal item pickups:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#4B5563]">
            <li><strong>Account Data:</strong> Name, email address, password hash, and user role (donor or NGO representative).</li>
            <li><strong>Listing & Location Data:</strong> Item descriptions, categories, item photos, pickup time windows, locality name, and GPS coordinates for radius matching.</li>
            <li><strong>Pickup Address:</strong> Complete street address, building/flat number, landmark, and pincode (strictly protected under our two-tier visibility model).</li>
            <li><strong>NGO Verification Data:</strong> NGO Darpan ID, Trust/Society registration numbers, operational addresses, and contact phone numbers.</li>
            <li><strong>Direct Chat Logs:</strong> Ephemeral coordination messages exchanged between the donor and claiming NGO during an active claim.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#4B5563]">
            <li>To compute proximity scores and match nearby NGOs within a viable transit radius.</li>
            <li>To facilitate logistics coordination between the donor and the claiming NGO.</li>
            <li>To verify the authenticity of participating charities and prevent fraudulent collection.</li>
            <li>To compute impact statistics (e.g. items saved from landfills, families supported).</li>
            <li>We <strong>do not sell</strong>, rent, or commercialize user personal data or contact details to third-party advertisers.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">4. Two-Tier Address Protection & Security</h2>
          <p>
            We enforce strict database-level Row Level Security (RLS) rules:
          </p>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 space-y-2">
            <div className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
              <span><strong>Pre-Claim State:</strong> Any registered NGO can only query items within their radius and view the general locality. Address line 1, exact coordinates, and phone numbers are redacted.</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
              <span><strong>Post-Claim State:</strong> Once a verified NGO locks the listing with their staff identity, the address is unlocked exclusively for that NGO&apos;s active session.</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">5. Data Retention & Deletion</h2>
          <p>
            You may request deletion of your account and associated listing history at any time by contacting our support team. Uploaded listing images and chat messages are archived or purged once pickups are successfully completed.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#14251C]">6. Grievance Redressal</h2>
          <p>
            In accordance with Indian legal requirements, please direct any data inquiries, concerns, or grievances to:
          </p>
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFA] p-4 text-xs space-y-1">
            <p className="font-bold text-[#14251C]">Grievance Officer: Legal & Trust Team</p>
            <p>Email: <a href="mailto:grievance@gullygood.app" className="text-[#22C55E] font-medium underline">grievance@gullygood.app</a></p>
            <p>Response SLA: Within 48 business hours</p>
            <p>Location: Mumbai, Maharashtra, India</p>
          </div>
        </div>
      </section>
    </div>
  );
}
