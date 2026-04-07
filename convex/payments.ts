import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const recordStripeEvent = internalMutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    payloadDigest: v.optional(v.string()),
    preview: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    payment: v.optional(
      v.object({
        amountCents: v.number(),
        currency: v.string(),
        status: v.union(
          v.literal("pending"),
          v.literal("confirmed"),
          v.literal("failed"),
          v.literal("expired"),
          v.literal("refunded"),
          v.literal("chargeback"),
          v.literal("canceled"),
        ),
        providerPaymentId: v.optional(v.string()),
        providerCheckoutId: v.optional(v.string()),
        providerCustomerId: v.optional(v.string()),
        providerSubscriptionId: v.optional(v.string()),
        confirmedAt: v.optional(v.number()),
        metadata: v.optional(v.any()),
      }),
    ),
    subscription: v.optional(
      v.object({
        status: v.union(
          v.literal("none"),
          v.literal("pending"),
          v.literal("active"),
          v.literal("pastDue"),
          v.literal("expired"),
          v.literal("canceled"),
          v.literal("revoked"),
        ),
        providerCustomerId: v.optional(v.string()),
        providerSubscriptionId: v.optional(v.string()),
        currentPeriodStart: v.optional(v.number()),
        currentPeriodEnd: v.optional(v.number()),
        cancelAtPeriodEnd: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = (await ctx.db.query("paymentEvents").collect()).find(
      (event) => event.provider === "stripe" && event.eventId === args.eventId,
    );
    if (existing) {
      return existing._id;
    }
    await ctx.db.insert("paymentEvents", {
      provider: "stripe",
      eventId: args.eventId,
      eventType: args.eventType,
      payloadDigest: args.payloadDigest,
      rawPreview: args.preview,
      processedAt: Date.now(),
    });
    let paymentId;
    if (args.userId && args.payment) {
      paymentId = await ctx.db.insert("payments", {
        userId: args.userId,
        provider: "stripe",
        status: args.payment.status,
        amountCents: args.payment.amountCents,
        currency: args.payment.currency,
        providerEventId: args.eventId,
        providerPaymentId: args.payment.providerPaymentId,
        providerCheckoutId: args.payment.providerCheckoutId,
        providerCustomerId: args.payment.providerCustomerId,
        providerSubscriptionId: args.payment.providerSubscriptionId,
        confirmedAt: args.payment.confirmedAt,
        metadata: args.payment.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    if (args.userId && args.subscription) {
      const existingSubscription = args.subscription.providerSubscriptionId
        ? (await ctx.db.query("subscriptions").collect()).find(
            (subscription) =>
              subscription.providerSubscriptionId ===
              args.subscription?.providerSubscriptionId,
          )
        : null;
      const patch = {
        userId: args.userId,
        provider: "stripe" as const,
        status: args.subscription.status,
        providerCustomerId: args.subscription.providerCustomerId,
        providerSubscriptionId: args.subscription.providerSubscriptionId,
        currentPeriodStart: args.subscription.currentPeriodStart,
        currentPeriodEnd: args.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: args.subscription.cancelAtPeriodEnd,
        lastPaymentId: paymentId,
        updatedAt: Date.now(),
      };
      if (existingSubscription) {
        await ctx.db.patch(existingSubscription._id, patch);
      } else {
        await ctx.db.insert("subscriptions", patch);
      }
    }
  },
});

export const recordCryptoEvent = internalMutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    userId: v.optional(v.id("users")),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("failed"),
      v.literal("expired"),
      v.literal("refunded"),
      v.literal("chargeback"),
      v.literal("canceled"),
    ),
    amountCents: v.number(),
    currency: v.string(),
    providerPaymentId: v.optional(v.string()),
    preview: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = (await ctx.db.query("paymentEvents").collect()).find(
      (event) => event.provider === "crypto" && event.eventId === args.eventId,
    );
    if (existing) {
      return existing._id;
    }
    await ctx.db.insert("paymentEvents", {
      provider: "crypto",
      eventId: args.eventId,
      eventType: args.eventType,
      rawPreview: args.preview,
      processedAt: Date.now(),
    });
    if (args.userId) {
      const paymentId = await ctx.db.insert("payments", {
        userId: args.userId,
        provider: "crypto",
        status: args.status,
        amountCents: args.amountCents,
        currency: args.currency,
        providerEventId: args.eventId,
        providerPaymentId: args.providerPaymentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const mappedStatus: "active" | "pending" | "expired" | "pastDue" =
        args.status === "confirmed"
          ? "active"
          : args.status === "pending"
            ? "pending"
            : args.status === "expired"
              ? "expired"
              : "pastDue";
      const subscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("userId", (q) => q.eq("userId", args.userId!))
        .collect();
      const existingSubscription = subscriptions.sort((a, b) => b.updatedAt - a.updatedAt)[0];
      const patch = {
        userId: args.userId,
        provider: "crypto" as const,
        status: mappedStatus,
        lastPaymentId: paymentId,
        updatedAt: Date.now(),
      };
      if (existingSubscription) {
        await ctx.db.patch(existingSubscription._id, patch);
      } else {
        await ctx.db.insert("subscriptions", patch);
      }
    }
  },
});
