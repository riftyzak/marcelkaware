"use node";

import Stripe from "stripe";
import { createHash, createHmac } from "node:crypto";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAccessTierFromState } from "./rbac";
import { v } from "convex/values";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getStripeClient() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2026-02-25.clover",
  });
}

export const createStripeCheckoutSession = action({
  args: {
    successPath: v.optional(v.string()),
    cancelPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Sign in before starting checkout.");
    }
    const user = await ctx.runQuery(internal.usersInternal.getById, { userId });
    const subscription = await ctx.runQuery(internal.usersInternal.getLatestSubscription, {
      userId,
    });
    const accessTier = getAccessTierFromState({
      role: user?.role ?? "registered",
      accountState: user?.accountState ?? "active",
      subscriptionStatus: subscription?.status ?? "none",
    });
    if (user?.accountState === "banned" || accessTier === "banned") {
      throw new Error("Restricted accounts cannot start a new checkout.");
    }

    const stripe = getStripeClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: requireEnv("STRIPE_PRICE_ID_MONTHLY"),
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}${args.successPath ?? "/app"}?checkout=success`,
      cancel_url: `${siteUrl}${args.cancelPath ?? "/pricing"}?checkout=canceled`,
      customer_email: user?.email ?? undefined,
      client_reference_id: String(userId),
      metadata: {
        userId: String(userId),
      },
    });

    await ctx.runMutation(internal.audit.record, {
      actorUserId: userId,
      actorType: "user",
      action: "payments.stripe.checkoutCreated",
      targetTable: "payments",
      targetId: session.id,
      metadata: { checkoutId: session.id },
    });

    return { url: session.url ?? `${siteUrl}/pricing` };
  },
});

export const createHostedCryptoCheckout = action({
  args: {
    returnPath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Sign in before starting checkout.");
    }
    const user = await ctx.runQuery(internal.usersInternal.getById, { userId });
    if (user?.accountState === "banned") {
      throw new Error("Restricted accounts cannot start a new checkout.");
    }

    const checkoutBase = process.env.CRYPTO_PROVIDER_CHECKOUT_URL;
    if (!checkoutBase) {
      return {
        ok: false,
        url: null,
        message: "Hosted crypto checkout has not been configured yet.",
      };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const url = new URL(checkoutBase);
    url.searchParams.set("userId", String(userId));
    url.searchParams.set("email", user?.email ?? "");
    url.searchParams.set("returnUrl", `${siteUrl}${args.returnPath ?? "/app"}`);

    await ctx.runMutation(internal.audit.record, {
      actorUserId: userId,
      actorType: "user",
      action: "payments.crypto.checkoutCreated",
      targetTable: "payments",
      targetId: String(userId),
      metadata: { checkoutUrl: url.toString() },
    });

    return { ok: true, url: url.toString(), message: "" };
  },
});

export const processStripeWebhook = internalAction({
  args: {
    rawBody: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = getStripeClient();
    const secret = requireEnv("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(args.rawBody, args.signature, secret);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Invalid Stripe signature.");
    }

    const object = event.data.object as Record<string, any>;
    const digest = createHash("sha256").update(args.rawBody).digest("hex");
    const rawUserId = object.metadata?.userId ?? object.client_reference_id;
    const userId = typeof rawUserId === "string" ? (rawUserId as any) : undefined;

    const normalizedPayment =
      event.type === "checkout.session.completed" || event.type === "invoice.paid"
        ? {
            amountCents: Number(object.amount_total ?? object.amount_paid ?? 0),
            currency: String(object.currency ?? "usd"),
            status: "confirmed" as const,
            providerPaymentId: object.payment_intent ?? object.id,
            providerCheckoutId: object.id,
            providerCustomerId: object.customer ?? undefined,
            providerSubscriptionId: object.subscription ?? undefined,
            confirmedAt: Date.now(),
            metadata: { stripeEventType: event.type },
          }
        : event.type === "invoice.payment_failed"
          ? {
              amountCents: Number(object.amount_due ?? 0),
              currency: String(object.currency ?? "usd"),
              status: "failed" as const,
              providerPaymentId: object.payment_intent ?? object.id,
              providerCheckoutId: object.id,
              providerCustomerId: object.customer ?? undefined,
              providerSubscriptionId: object.subscription ?? undefined,
              metadata: { stripeEventType: event.type },
            }
          : event.type === "charge.dispute.created"
            ? {
                amountCents: Number(object.amount ?? 0),
                currency: String(object.currency ?? "usd"),
                status: "chargeback" as const,
                providerPaymentId: object.payment_intent ?? object.charge ?? object.id,
                metadata: { stripeEventType: event.type },
              }
            : undefined;

    const normalizedSubscription =
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.deleted" ||
      event.type === "checkout.session.completed" ||
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_failed"
        ? {
            status:
              object.status === "active"
                ? ("active" as const)
                : object.status === "past_due"
                  ? ("pastDue" as const)
                  : object.status === "canceled" || object.status === "cancelled"
                    ? ("canceled" as const)
                    : object.status === "incomplete"
                      ? ("pending" as const)
                      : ("expired" as const),
            providerCustomerId: object.customer ?? undefined,
            providerSubscriptionId: object.subscription ?? object.id ?? undefined,
            currentPeriodStart:
              typeof object.current_period_start === "number"
                ? object.current_period_start * 1000
                : undefined,
            currentPeriodEnd:
              typeof object.current_period_end === "number"
                ? object.current_period_end * 1000
                : undefined,
            cancelAtPeriodEnd: object.cancel_at_period_end ?? undefined,
          }
        : undefined;

    await ctx.runMutation(internal.payments.recordStripeEvent, {
      eventId: event.id,
      eventType: event.type,
      payloadDigest: digest,
      preview: args.rawBody.slice(0, 500),
      userId,
      payment: normalizedPayment,
      subscription: normalizedSubscription,
    });
    await ctx.runMutation(internal.audit.record, {
      actorType: "webhook",
      action: "payments.stripe.webhookProcessed",
      targetTable: "paymentEvents",
      targetId: event.id,
      metadata: { eventType: event.type },
    });

    return { received: true };
  },
});

export const processCryptoWebhook = internalAction({
  args: {
    rawBody: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const secret = requireEnv("CRYPTO_WEBHOOK_SECRET");
    const computedSignature = createHmac("sha256", secret)
      .update(args.rawBody)
      .digest("hex");
    if (computedSignature !== args.signature) {
      throw new Error("Invalid signature.");
    }

    const body = JSON.parse(args.rawBody) as {
      eventId: string;
      eventType: string;
      userId?: string;
      transactionId?: string;
      status: "pending" | "confirmed" | "failed" | "expired" | "canceled";
      amountCents: number;
      currency: string;
    };

    await ctx.runMutation(internal.payments.recordCryptoEvent, {
      eventId: body.eventId,
      eventType: body.eventType,
      userId: body.userId as any,
      status: body.status,
      amountCents: body.amountCents,
      currency: body.currency,
      providerPaymentId: body.transactionId,
      preview: args.rawBody.slice(0, 500),
    });
    await ctx.runMutation(internal.audit.record, {
      actorType: "webhook",
      action: "payments.crypto.webhookProcessed",
      targetTable: "paymentEvents",
      targetId: body.eventId,
      metadata: { eventType: body.eventType },
    });

    return { received: true };
  },
});
