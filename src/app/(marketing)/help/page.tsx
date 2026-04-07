import { PolicyPage } from "@/components/content/policy-page";

const intro = [
  "This page explains how billing, support, refunds, resets, moderation appeals, and restricted-account contact paths work on the Platform.",
];

const sections = [
  {
    title: "1. Support Access",
    blocks: [
      { type: "paragraph", content: "Normal support is available through the Platform’s ticket system for eligible accounts." },
      { type: "paragraph", content: "Support availability may depend on:" },
      {
        type: "list",
        items: [
          "account state,",
          "payment state,",
          "subscription state,",
          "restriction status,",
          "category of request.",
        ],
      },
      { type: "paragraph", content: "We may request additional information where needed to review your case." },
    ],
  },
  {
    title: "2. Billing and Access",
    blocks: [
      { type: "paragraph", content: "Paid access is granted only after successful payment confirmation or successful approved key redemption." },
      { type: "paragraph", content: "Supported access paths may include:" },
      {
        type: "list",
        items: [
          "card payments through Stripe,",
          "crypto invoice payments through self-hosted BTCPay Server flows,",
          "reseller key redemption,",
          "other methods expressly approved by us.",
        ],
      },
      { type: "paragraph", content: "Access is always tied to the account that completed the purchase or redemption." },
    ],
  },
  {
    title: "3. Refund Policy",
    blocks: [
      { type: "paragraph", content: "Payments are final except:" },
      {
        type: "list",
        items: [
          "where required by applicable law, or",
          "where we approve a refund because the issue is on our end.",
        ],
      },
      { type: "paragraph", content: "Examples where we may consider a refund include:" },
      {
        type: "list",
        items: [
          "confirmed failure to deliver paid access due to our technical fault,",
          "confirmed account-side entitlement issue caused by our systems,",
          "duplicate billing caused by our systems,",
          "other cases we determine justify a refund.",
        ],
      },
      { type: "paragraph", content: "We may refuse refunds where:" },
      {
        type: "list",
        items: [
          "the issue was not caused by us,",
          "the account was misused,",
          "device or security rules were violated,",
          "the payment flow was abused,",
          "the request is fraudulent or incomplete,",
          "access was delivered as intended.",
        ],
      },
      { type: "paragraph", content: "Nothing here limits any non-waivable consumer rights granted by applicable law." },
    ],
  },
  {
    title: "4. Chargebacks and Disputes",
    blocks: [
      { type: "paragraph", content: "If you initiate a chargeback, dispute, or fraudulent payment reversal, we may immediately suspend the related account and its access while the matter is reviewed." },
      { type: "paragraph", content: "Chargeback abuse, fraudulent disputes, or payment manipulation may result in:" },
      {
        type: "list",
        items: [
          "suspension,",
          "permanent termination,",
          "key revocation,",
          "loss of access,",
          "refusal of future service.",
        ],
      },
    ],
  },
  {
    title: "5. Crypto Payment Handling",
    blocks: [
      { type: "paragraph", content: "Crypto payment flows may rely on invoice-based confirmation." },
      { type: "paragraph", content: "Until payment is properly confirmed, we do not treat access as completed or delivered." },
      { type: "paragraph", content: "Incorrect transfers, stale invoices, underpayments, or unsupported payment behavior may delay or prevent fulfillment." },
      { type: "paragraph", content: "Any approved crypto refund remains discretionary except where required by law." },
    ],
  },
  {
    title: "6. Device Resets and Account Reviews",
    blocks: [
      { type: "paragraph", content: "Access may be tied to device or hardware state." },
      { type: "paragraph", content: "If you need a device-related reset or review, you must use the intended support or appeal path." },
      { type: "paragraph", content: "We may:" },
      {
        type: "list",
        items: [
          "request verification,",
          "deny incomplete or suspicious requests,",
          "limit repeated reset requests,",
          "refuse requests where abuse or account-sharing is suspected.",
        ],
      },
    ],
  },
  {
    title: "7. Reseller Keys",
    blocks: [
      { type: "paragraph", content: "Approved keys may be redeemed by the person who uses the key on the target account, unless a specific issuance rule states otherwise." },
      { type: "paragraph", content: "We may reject, revoke, or invalidate keys where we reasonably suspect:" },
      {
        type: "list",
        items: [
          "fraud,",
          "duplication,",
          "prior redemption,",
          "unauthorized resale or distribution,",
          "payment abuse,",
          "chargeback-related misuse.",
        ],
      },
    ],
  },
  {
    title: "8. Restricted Accounts and Appeals",
    blocks: [
      { type: "paragraph", content: "Restricted or banned accounts may lose normal support access." },
      { type: "paragraph", content: "Such accounts may retain only the dedicated appeal or contact path made available by us." },
      { type: "paragraph", content: "We may provide:" },
      {
        type: "list",
        items: [
          "onsite appeal submission,",
          "moderation appeal workflows,",
          "email-based contact through legal@marcelkaware.dev or another stated support channel.",
        ],
      },
      { type: "paragraph", content: "An appeal does not guarantee reversal." },
    ],
  },
  {
    title: "9. Moderation Reports",
    blocks: [
      { type: "paragraph", content: "We may provide onsite reporting for:" },
      {
        type: "list",
        items: [
          "forum content,",
          "user conduct,",
          "moderation disputes,",
          "abuse reports.",
        ],
      },
      { type: "paragraph", content: "We may review reports and appeals in our discretion and may request additional details." },
    ],
  },
  {
    title: "10. Response Times",
    blocks: [
      { type: "paragraph", content: "We do not guarantee fixed support, billing, or appeal response times." },
      { type: "paragraph", content: "Response priority may depend on:" },
      {
        type: "list",
        items: [
          "severity,",
          "account status,",
          "payment status,",
          "security risk,",
          "operational volume.",
        ],
      },
    ],
  },
  {
    title: "11. Evidence and Verification",
    blocks: [
      { type: "paragraph", content: "To review billing, reset, or appeal requests, we may request:" },
      {
        type: "list",
        items: [
          "account information,",
          "payment references,",
          "relevant screenshots,",
          "ticket references,",
          "redemption details,",
          "device-related details,",
          "any other information reasonably required for review.",
        ],
      },
    ],
  },
  {
    title: "12. Contact",
    blocks: [
      { type: "paragraph", content: "General legal and appeals contact: legal@marcelkaware.dev" },
      { type: "paragraph", content: "Where the Platform provides onsite support, ticketing, or reporting tools, you should use those channels first unless the issue specifically requires legal or appeal contact." },
    ],
  },
] as const;

export default function HelpPage() {
  return <PolicyPage eyebrow="Help / Billing / Refund / Appeals" effectiveDate="April 7, 2026" intro={intro} sections={sections} title="Help / Billing / Refund / Appeals" />;
}
