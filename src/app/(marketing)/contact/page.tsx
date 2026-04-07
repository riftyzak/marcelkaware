import { Separator } from "@/components/ui/separator";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        Appeals
      </h1>

      <div className="space-y-6 border-t border-[color:var(--border)] pt-6">
        <section className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
          <h2 className="text-base font-semibold text-white">Primary channel</h2>
          <div className="space-y-2">
            <p className="text-base text-slate-200">support@example.com</p>
            <p className="text-sm leading-7 text-slate-400">
              Use this for appeals, account review, or contact outside the normal ticket flow.
            </p>
          </div>
        </section>
        <Separator />
        <section className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
          <h2 className="text-base font-semibold text-white">Include</h2>
          <div className="space-y-2">
            <p className="text-sm leading-7 text-slate-300">
              Account email, approximate purchase date, and a short description of the issue.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
