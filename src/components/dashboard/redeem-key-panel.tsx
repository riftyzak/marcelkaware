"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useAction, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

export function RedeemKeyPanel() {
  const entitlement = useQuery(api.users.getViewerEntitlementState, {});
  const redeemKey = useAction(api.resellerNode.redeemKey);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPending(true);
      setError(null);
      setSuccess(null);
      const result = await redeemKey({ code });
      setCode("");
      setSuccess(`Access updated successfully. ${result.durationDays} days were applied to this account.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to redeem this key.");
    } finally {
      setPending(false);
    }
  }

  if (entitlement === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Account" title="Redeem access key" description="Loading your account state." />
        <StateCard title="Loading redemption flow" description="Preparing account state and redemption access." />
      </div>
    );
  }

  if (!entitlement) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Account" title="Redeem access key" description="Redeeming a key requires an authenticated account." />
        <StateCard title="Sign in required" description="Use an existing account before redeeming an internal access key." actionHref="/login" actionLabel="Go to login" />
      </div>
    );
  }

  if (entitlement.accountState === "banned") {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Account" title="Redeem access key" description="Restricted accounts cannot redeem new access." />
        <StateCard title="Redemption unavailable" description="This account is restricted. Use the existing appeal path if you need assistance." tone="error" actionHref="/contact" actionLabel="Contact support" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <Link href="/app">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Redeem" }]}
        eyebrow="Account"
        title="Redeem access key"
        description="Apply a reseller-issued access key to this account. Redemption is server-validated and audit-logged."
      />
      <Card className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Access key</label>
            <Input
              onChange={(event) => setCode(event.target.value)}
              placeholder="VX12ABCD-34EFGH-56JKLM"
              value={code}
            />
          </div>
          <div className="flex justify-end">
            <Button disabled={pending} type="submit">
              {pending ? "Redeeming..." : "Redeem key"}
            </Button>
          </div>
        </form>
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </Card>
    </div>
  );
}
