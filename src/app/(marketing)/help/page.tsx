import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const faqs = [
  {
    question: "Can I share or transfer my account?",
    answer:
      "No. Account sharing or transfer to third parties is not allowed. Access stays tied to one user and one personal machine profile. To move to a different device, request an HWID reset through support.",
  },
  {
    question: "Can I use the software on public or shared devices?",
    answer:
      "No. The account is intended for a personal computer only. Shared environments, public devices, or repeated reset requests can be treated as account sharing and may lead to restriction.",
  },
  {
    question: "Which operating systems are supported?",
    answer:
      "Supported systems are official stable releases of Windows 10 and Windows 11 that are still supported by Microsoft. Preview builds, unsupported Windows versions, and other operating systems are not supported.",
  },
  {
    question: "How long does access take after payment?",
    answer:
      "Access is granted automatically after payment confirmation. Timing depends on the payment method. Reseller-issued access can also depend on reseller processing time.",
  },
  {
    question: "What happens if an update temporarily affects availability?",
    answer:
      "Compatibility updates are handled as quickly as possible. If a major update causes a temporary interruption, status and release information will be posted through the forum and update channels.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "No. Access is provided through the paid plan only. If you need purchase or account clarification before buying, use the public help and appeal paths first.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-[980px] space-y-8">
      <section className="space-y-3">
        <p className="text-sm text-[color:var(--text-dim)]">Help</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Help and FAQ
        </h1>
        <p className="max-w-3xl text-base leading-8 text-[color:var(--text-muted)]">
          Use this page for the common rules around access, supported systems, delivery timing,
          device resets, and account handling. Private ticket support stays in the account area.
        </p>
      </section>

      <div className="grid gap-10 border-t border-[color:var(--border)] pt-8 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-white">Quick links</h2>
          <div className="space-y-3 text-sm leading-7 text-[color:var(--text-muted)]">
            <p>Need direct access details? Pricing is shown on the landing page.</p>
            <p>Need private support? Sign in and open a ticket from your account area.</p>
            <p>Need an appeal or restricted account review? Use the separate appeals contact path.</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/#pricing">
              <Button>View pricing</Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary">Appeals contact</Button>
            </Link>
          </div>
        </section>

        <section className="space-y-6">
          {faqs.map((item, index) => (
            <div className="space-y-3" key={item.question}>
              {index > 0 ? <Separator /> : null}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-white">
                  {index + 1}. {item.question}
                </h2>
                <p className="text-sm leading-7 text-[color:var(--text-muted)]">{item.answer}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
