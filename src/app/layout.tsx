import type { Metadata } from "next";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { IBM_Plex_Sans, Geist } from "next/font/google";
import { SiteBanner } from "@/components/content/site-banner";
import { siteConfig } from "@/lib/config/site";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: "Premium account-aware Windows client delivery with gated access and structured member tooling.",
  icons: {
    icon: "/branding/logo-icon.svg",
    shortcut: "/branding/logo-icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
        <body className={`${ibmPlexSans.className} min-h-screen bg-slate-950 text-slate-100 antialiased`}>
          <ConvexClientProvider>
            <div className="min-h-screen">
              <SiteHeader />
              <SiteBanner />
              <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6">{children}</main>
              <SiteFooter />
            </div>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
