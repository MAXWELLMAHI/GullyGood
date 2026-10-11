import type { Metadata, Viewport } from "next";
import { Fredoka, Manrope } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getAuthContext } from "@/lib/auth";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GullyGood — Hyperlocal Essentials Loop",
  description:
    "Give something in ~90 seconds. Moving essentials directly to verified nearby NGOs in Mumbai without coordination drag.",
  icons: {
    icon: "/favicon.ico",
    apple: "/gullygood-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14251C",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await getAuthContext();

  return (
    <html lang="en" className={`${fredoka.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--paper)] text-[var(--text)] font-sans antialiased" suppressHydrationWarning>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-32 pt-4 sm:px-6 lg:px-8 lg:pb-14">
            {children}
          </main>
          <SiteFooter />
          <MobileNav hasUser={Boolean(auth.user)} role={auth.role} />
        </div>
      </body>
    </html>
  );
}

