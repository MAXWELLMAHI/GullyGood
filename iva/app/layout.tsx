import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IVA | Hyperlocal Donation Loop",
  description:
    "Mumbai-first donation workflow connecting donors, verified NGOs, and admins on a secure Supabase backbone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(234,140,67,0.16),_transparent_32%),linear-gradient(180deg,_rgba(20,74,52,0.06),_transparent_25%),var(--background)]">
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
