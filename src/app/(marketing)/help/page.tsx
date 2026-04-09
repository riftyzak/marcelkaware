import type { ReactNode } from "react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqItems = [
  {
    question: "How do I contact support?",
    answer: (
      <>
        If you have access to tickets in your account, start there. For account restrictions, appeals, or anything
        that cannot be solved through the normal support flow, use the{" "}
        <Link className="font-medium !text-[#8fb0d8] transition-colors hover:!text-white" href="/contact">
          contact page
        </Link>{" "}
        or email{" "}
        <Link
          className="font-medium !text-[#8fb0d8] transition-colors hover:!text-white"
          href="mailto:legal@marcelkaware.dev"
        >
          legal@marcelkaware.dev
        </Link>
        .
      </>
    ),
  },
 {
  question: "When is paid access granted?",
  answer:
    "Access is unlocked only after payment is confirmed or a valid key is redeemed successfully. Starting checkout or opening an invoice does not activate access on its own.",
},
{
  question: "What payment methods are supported?",
  answer:
    "We currently support crypto payments (LTC and BTC) only. If you need another payment method, you may be able to purchase through an approved reseller.",
},
{
  question: "Can I get a refund?",
  answer:
    "Refunds are not automatic. They may be considered if the issue was clearly on our side, access was not delivered properly, or applicable law requires it. Incomplete, abusive, or fraudulent requests may be refused.",
},
{
  question: "Can I share or transfer my account?",
  answer: (
    <>
      No. Sharing, lending, selling, or otherwise transferring your account to another person is prohibited. Violating
      this rule is a breach of the{" "}
      <Link className="font-medium !text-[#8fb0d8] transition-colors hover:!text-white" href="/tos">
        Terms of Use
      </Link>{" "}
      and may result in permanent account suspension. If you need to switch devices, you must request an HWID reset
      through support.
    </>
  ),
},
{
  question: "Can I use the software in an internet café or on public devices?",
  answer:
    "No. Access is intended for use on a personal device only. Use on shared or public devices, including internet cafés, is prohibited. Repeated or suspicious HWID reset requests may be treated as abuse or account sharing and may lead to suspension.",
},
{
  question: "Can I appeal a banned account?",
  answer: (
    <>
      If your account is banned, you may appeal using the contact details provided on the{" "}
      <Link className="font-medium !text-[#8fb0d8] transition-colors hover:!text-white" href="/contact">
        contact page
      </Link>
      . Each appeal is reviewed individually, but submitting an appeal does not guarantee that the ban will be
      reversed.
    </>
  ),
},
{
  question: "What should I include in an appeal request?",
  answer:
    "Include your account email, payment reference if available, any useful screenshots, relevant ticket references, and a short clear description of the issue. The more complete your request is, the faster it can usually be reviewed.",
},
] as const satisfies readonly { question: string; answer: ReactNode }[];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-[980px] space-y-10">
      <header className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Help (FAQ)</h1>
        <p className="max-w-[720px] text-sm leading-7 text-[color:var(--text-muted)] sm:text-[0.98rem]">
          If you need direct help outside the tickets, use{" "}
          <Link className="font-medium !text-[#8fb0d8] transition-colors hover:!text-white" href="/contact">
            Contact
          </Link>
          .
        </p>
      </header>

      <section className="space-y-2">
        <Accordion className="border-t border-[#2a2f36]" defaultValue={["item-0"]}>
          {faqItems.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>
                <p>{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
