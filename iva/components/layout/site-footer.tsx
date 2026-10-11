import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ShieldCheck, Heart, MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          {/* Brand Info */}
          <div className="space-y-3 max-w-sm">
            <Link href="/" className="inline-block transition-transform hover:opacity-90">
              <BrandLogo size="md" />
            </Link>
            <p className="text-xs leading-relaxed text-[#6B7280]">
              Mumbai&apos;s hyperlocal essentials loop. Moving useful clothes, blankets, books, and meals to verified nearby NGOs in ~90 seconds with zero friction.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#14251C]">
              <MapPin className="h-3.5 w-3.5 text-[#22C55E]" />
              <span>Built for Mumbai, India</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#14251C]">Platform</p>
              <ul className="mt-3 space-y-2 text-xs text-[#6B7280]">
                <li>
                  <Link href="/donor/donate" className="hover:text-[#22C55E] transition">
                    Give Essentials
                  </Link>
                </li>
                <li>
                  <Link href="/donor/dashboard" className="hover:text-[#22C55E] transition">
                    Donor Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/ngo/dashboard" className="hover:text-[#22C55E] transition">
                    NGO Radar
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#14251C]">Legal & Trust</p>
              <ul className="mt-3 space-y-2 text-xs text-[#6B7280]">
                <li>
                  <Link href="/privacy" className="hover:text-[#22C55E] transition font-medium text-[#14251C]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[#22C55E] transition font-medium text-[#14251C]">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#17A34A] font-semibold">
                    <ShieldCheck className="h-3 w-3" /> DPDP Aligned
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#14251C]">Contact & Ops</p>
              <ul className="mt-3 space-y-2 text-xs text-[#6B7280]">
                <li>
                  <span className="text-[#14251C] font-medium">contact@gullygood.app</span>
                </li>
                <li>
                  <span>Mumbai Outreach HQ</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#F3F4F6] pt-6 text-[11px] text-[#9CA3AF] sm:flex-row">
          <p>© {new Date().getFullYear()} GullyGood. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 fill-[#EF4444] text-[#EF4444]" /> for Mumbai communities
          </p>
        </div>
      </div>
    </footer>
  );
}
