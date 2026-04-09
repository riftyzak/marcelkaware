import Link from "next/link";
import { LogoFull } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="bg-[#13161a] py-6 sm:py-5">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-6 px-4 text-center text-sm text-[color:var(--text-dim)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:text-left">
        <div className="inline-flex items-center justify-center pb-1 leading-none lg:justify-start lg:pb-0">
          <LogoFull className="h-8 sm:h-7" />
        </div>
        <div className="grid grid-cols-2 justify-items-center gap-x-6 gap-y-3 text-sm sm:grid-cols-3 sm:gap-x-5 sm:gap-y-2.5 lg:flex lg:flex-wrap lg:items-center lg:justify-items-stretch lg:gap-4">
          <Link className="transition-colors hover:!text-[#8fb0d8]" href="/help" scroll>
            Help
          </Link>
          <Link className="transition-colors hover:!text-[#8fb0d8]" href="/contact" scroll>
            Contact
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
