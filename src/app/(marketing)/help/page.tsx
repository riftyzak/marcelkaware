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
    <div className="mx-auto max-w-[980px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Help</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/#pricing">
            <Button>View pricing</Button>
          </Link>
          <Link href="/contact">
            <Button variant="secondary">Appeals</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-5 border-t border-[color:var(--border)] pt-6">
        {faqs.map((item, index) => (
          <div className="space-y-2" key={item.question}>
            {index > 0 ? <Separator /> : null}
            <h2 className="pt-1 text-base font-semibold text-white">{item.question}</h2>
            <p className="text-sm leading-7 text-[color:var(--text-muted)]">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
