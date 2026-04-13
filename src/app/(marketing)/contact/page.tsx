import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { contactConfig, contactMailto } from "@/lib/config/contact";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        Contact
      </h1>

      <div className="space-y-6 border-t border-[color:var(--border)] pt-6">
        <section className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
          <h2 className="text-base font-semibold text-white">Primary channel</h2>
          <div className="space-y-2">
            <Link
              className="text-base font-medium !text-[#8fb0d8] transition-colors hover:!text-white"
              href={contactMailto}
            >
              {contactConfig.email}
            </Link>
            <p className="text-sm leading-7 text-slate-400">
              Use this for restricted-account cases or direct contact outside the normal support flow.
            </p>
          </div>
        </section>
        <Separator />
        <section className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
          <h2 className="text-base font-semibold text-white">Support</h2>
          <div className="space-y-2">
            <p className="text-sm leading-7 text-slate-300">
              For tickets, guest access, or account-bound support, use{" "}
              <Link
                className="font-medium !text-[#8fb0d8] transition-colors hover:!text-white"
                href="/community/support"
              >
                /community/support
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
