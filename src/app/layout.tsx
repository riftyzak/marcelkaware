import type { Metadata } from "next";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { SiteBanner } from "@/components/content/site-banner";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vector Access",
  description: "Premium account-aware Windows client delivery with gated access and structured member tooling.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
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
