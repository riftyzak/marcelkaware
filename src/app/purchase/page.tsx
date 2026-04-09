import { PurchaseCard } from "@/components/marketing/purchase-card";
import { requireAuthenticatedPage } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export default async function PurchasePage() {
  await requireAuthenticatedPage();

  return (
    <div className="mx-auto max-w-[720px] space-y-8 py-4">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Purchase</h1>
        <p className="text-base text-[color:var(--text-muted)]">One plan. Account-bound access.</p>
      </div>
      <PurchaseCard />
    </div>
  );
}
