"use client";

import { PricingCard } from "@/components/marketing/pricing-card";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-[720px] space-y-8 py-4">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Pricing</h1>
        <p className="text-base text-[color:var(--text-muted)]">
          One plan. Account-bound access.
        </p>
      </div>
      <PricingCard />
    </div>
  );
}
