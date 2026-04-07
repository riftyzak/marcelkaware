import { internalMutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export async function getLatestSubscriptionForUser(ctx: any, userId: string) {
  const subscriptions = await ctx.db
    .query("subscriptions")
    .withIndex("userId", (q: any) => q.eq("userId", userId))
    .collect();
  return subscriptions.sort((a: any, b: any) => b.updatedAt - a.updatedAt)[0] ?? null;
}

export async function grantSubscriptionDuration(ctx: any, userId: string, durationDays: number) {
  if (durationDays <= 0) {
    throw new Error("Duration must be greater than zero.");
  }

  const now = Date.now();
  const durationMs = durationDays * 24 * 60 * 60 * 1000;
  const existingSubscription = await getLatestSubscriptionForUser(ctx, userId);

  if (!existingSubscription) {
    return ctx.db.insert("subscriptions", {
      userId,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: now + durationMs,
      updatedAt: now,
    });
  }

  const currentPeriodEnd =
    existingSubscription.status === "active" &&
    existingSubscription.currentPeriodEnd &&
    existingSubscription.currentPeriodEnd > now
      ? existingSubscription.currentPeriodEnd
      : now;

  await ctx.db.patch(existingSubscription._id, {
    status: "active",
    currentPeriodStart: existingSubscription.currentPeriodStart ?? now,
    currentPeriodEnd: currentPeriodEnd + durationMs,
    cancelAtPeriodEnd: false,
    updatedAt: now,
  });

  return existingSubscription._id;
}

export const viewerSubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return getLatestSubscriptionForUser(ctx, userId);
  },
});

export const expireOverdueSubscriptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const subscriptions = await ctx.db.query("subscriptions").collect();
    for (const subscription of subscriptions) {
      if (
        subscription.status === "active" &&
        subscription.currentPeriodEnd !== undefined &&
        subscription.currentPeriodEnd < now
      ) {
        await ctx.db.patch(subscription._id, {
          status: "expired",
          updatedAt: now,
        });
      }
    }
  },
});

export const grantDuration = internalMutation({
  args: {
    userId: v.id("users"),
    durationDays: v.number(),
  },
  handler: async (ctx, args) => grantSubscriptionDuration(ctx, args.userId, args.durationDays),
});
