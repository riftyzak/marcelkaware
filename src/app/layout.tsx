import type { Metadata } from "next";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { IBM_Plex_Sans, Geist } from "next/font/google";
import { SiteBanner } from "@/components/content/site-banner";
import { siteConfig } from "@/lib/config/site";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MainShell } from "@/components/layout/main-shell";
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
    icon: "/branding/favicon-icon.svg",
    shortcut: "/branding/favicon-icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={cn("font-sans", geist.variable)}
        data-scroll-behavior="smooth"
      >
        <body className={`${ibmPlexSans.className} min-h-screen bg-slate-950 text-slate-100 antialiased`}>
          <ConvexClientProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <SiteBanner />
              <MainShell>{children}</MainShell>
              <SiteFooter />
            </div>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
