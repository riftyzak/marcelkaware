import { PageIntro } from "@/components/ui/page-intro";
import { Separator } from "@/components/ui/separator";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageIntro
        eyebrow="Appeals"
        title="Appeals and restricted account contact"
        description="Banned users may still use this path for account review or appeal requests. A restriction does not restore downloads, purchase, or launcher access while it remains active."
      />
      <Separator />
      <div className="space-y-6">
        <section className="grid gap-4 py-1 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
          <div>
            <h2 className="text-base font-semibold text-white">Primary channel</h2>
          </div>
          <div className="space-y-2">
            <p className="text-base text-slate-200">support@example.com</p>
            <p className="text-sm leading-7 text-slate-400">
              Use this for appeals, account review, or contact that should not go through the normal ticket flow.
            </p>
          </div>
        </section>
        <Separator />
        <section className="grid gap-4 py-1 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
          <div>
            <h2 className="text-base font-semibold text-white">Include</h2>
          </div>
          <div className="space-y-2">
            <p className="text-sm leading-7 text-slate-300">
              Account email, approximate purchase date, and a short description of the issue or appeal reason.
            </p>
            <p className="text-sm leading-7 text-slate-400">
              Keep it brief and specific so the review can be handled without follow-up delays.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
