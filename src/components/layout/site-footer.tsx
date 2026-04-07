import Link from "next/link";
import { LogoFull } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--border)] bg-[#13161a] py-5">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 text-sm text-[color:var(--text-dim)] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex items-center leading-none">
          <LogoFull className="h-7" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/community">Forum</Link>
          <Link href="/help">Help</Link>
          <Link href="/app/downloads">Downloads</Link>
          <Link href="/#pricing">Buy</Link>
          <Link href="/announcements">Announcements</Link>
          <Link href="/contact">Appeals</Link>
        </div>
      </div>
    </footer>
  );
}
