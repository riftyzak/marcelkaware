"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/lib/config/site";
import { api } from "../../../convex/_generated/api";
import { useAction, useConvexAuth } from "convex/react";
import Link from "next/link";
import { useState } from "react";

export function PricingCard() {
  const { isAuthenticated } = useConvexAuth();
  const createStripeCheckoutSession = useAction(api.paymentsNode.createStripeCheckoutSession);
  const createCryptoCheckout = useAction(api.paymentsNode.createHostedCryptoCheckout);
  const [loading, setLoading] = useState<"stripe" | "crypto" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startStripeCheckout() {
    try {
      setLoading("stripe");
      setError(null);
      const result = await createStripeCheckoutSession({
        cancelPath: "/pricing",
        successPath: "/app",
      });
      window.location.href = result.url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start checkout.");
    } finally {
      setLoading(null);
    }
  }

  async function startCryptoCheckout() {
    try {
      setLoading("crypto");
      setError(null);
      const result = await createCryptoCheckout({
        returnPath: "/app",
      });
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setError(result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Crypto checkout is unavailable.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="mx-auto max-w-xl space-y-5 border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <Badge>Monthly plan</Badge>
          <h2 className="text-3xl font-semibold text-white">{siteConfig.monthlyPrice}</h2>
          <p className="text-sm leading-6 text-slate-300">
            Account-bound access with gated downloads and launcher validation.
          </p>
        </div>
        <div className="space-y-2 text-sm text-slate-300">
          <p>Unlocks after confirmed payment.</p>
          <p>Removed on expiry, revocation, or ban.</p>
          <p>Launcher pairing uses revocable device-aware tokens.</p>
        </div>
        <Separator />
        {isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Choose a payment method.</p>
            <div className="grid gap-3 sm:grid-cols-2">
            <Button disabled={loading !== null} onClick={() => void startStripeCheckout()}>
              {loading === "stripe" ? "Opening Stripe..." : "Pay with card"}
            </Button>
            <Button
              disabled={loading !== null}
              onClick={() => void startCryptoCheckout()}
              variant="secondary"
            >
              {loading === "crypto" ? "Preparing..." : "Pay with crypto"}
            </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Create an account first.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/register">
                <Button className="w-full">Register</Button>
              </Link>
              <Link href="/login">
                <Button className="w-full" variant="secondary">Login</Button>
              </Link>
            </div>
          </div>
        )}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </div>
    </section>
  );
}
