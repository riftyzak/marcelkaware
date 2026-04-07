import Link from "next/link";
import { LogoFull } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="bg-[#13161a] py-5">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 text-sm text-[color:var(--text-dim)] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex items-center leading-none">
          <LogoFull className="h-7" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link className="transition-colors hover:!text-[#8fb0d8]" href="/help" scroll>
            Help
          </Link>
          <Link className="transition-colors hover:!text-[#8fb0d8]" href="/tos" scroll>
            Terms of use
          </Link>
          <Link className="transition-colors hover:!text-[#8fb0d8]" href="/legal" scroll>
            User License Agreement
          </Link>
          <Link className="transition-colors hover:!text-[#8fb0d8]" href="/behavior" scroll>
            Behavior rules
          </Link>
          <Link className="transition-colors hover:!text-[#8fb0d8]" href="/privacy" scroll>
            Privacy policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
