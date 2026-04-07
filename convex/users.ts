import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAccessTierFromState } from "./rbac";
import { getLatestSubscriptionForUser } from "./subscriptions";
import { v } from "convex/values";

function normalizeHandle(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export const ensureViewerDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required.");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    const fallbackHandle = normalizeHandle(
      user.handle ?? user.displayName ?? user.name ?? user.email?.split("@")[0] ?? `user-${userId}`,
    );
    await ctx.db.patch(userId, {
      role: user.role ?? "registered",
      accountState: user.accountState ?? "active",
      joinedAt: user.joinedAt ?? Date.now(),
      displayName: user.displayName ?? user.name ?? user.email ?? "Member",
      handle: user.handle ?? fallbackHandle,
      lastSeenAt: Date.now(),
    });
    return userId;
  },
});

export const viewerDashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    const subscription = (await getLatestSubscriptionForUser(ctx, userId)) ?? {
      status: "none",
      currentPeriodEnd: undefined,
    };
    const accessTier = getAccessTierFromState({
      role: user.role ?? "registered",
      accountState: user.accountState ?? "active",
      subscriptionStatus: subscription.status,
    });
    const payments = await ctx.db
      .query("payments")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    const devices = await ctx.db
      .query("launcherDevices")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    return {
      user: {
        _id: user._id,
        displayName: user.displayName ?? user.name ?? user.email ?? "Member",
        accountState: user.accountState ?? "active",
      },
      accessTier,
      subscription,
      payments: payments.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
      devices: devices.filter((device) => device.status === "active"),
    };
  },
});

export const getViewerEntitlementState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    const subscription = await getLatestSubscriptionForUser(ctx, userId);
    return {
      userId,
      accountState: user.accountState ?? "active",
      role: user.role ?? "registered",
      subscriptionStatus: subscription?.status ?? "none",
    };
  },
});

export const setAccountState = mutation({
  args: {
    userId: v.id("users"),
    state: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actorUserId = await getAuthUserId(ctx);
    const actor = actorUserId ? await ctx.db.get(actorUserId) : null;
    if (!actor || actor.role !== "admin") {
      throw new Error("Admin only.");
    }
    await ctx.db.patch(args.userId, {
      accountState: args.state,
      banReason: args.state === "banned" ? args.reason : undefined,
      bannedAt: args.state === "banned" ? Date.now() : undefined,
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: actorUserId ?? undefined,
      actorType: "staff",
      action: "user.setAccountState",
      targetTable: "users",
      targetId: args.userId,
      metadata: { state: args.state, reason: args.reason },
    });
  },
});
