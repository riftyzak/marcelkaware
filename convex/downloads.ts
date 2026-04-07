import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getAccessTierFromState } from "./rbac";
import { getLatestSubscriptionForUser } from "./subscriptions";

export const viewerDownloads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { allowed: false, reason: "Sign in to access gated downloads.", items: [] as any[] };
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return { allowed: false, reason: "User account unavailable.", items: [] as any[] };
    }
    const subscription = await getLatestSubscriptionForUser(ctx, userId);
    const tier = getAccessTierFromState({
      role: user.role ?? "registered",
      accountState: user.accountState ?? "active",
      subscriptionStatus: subscription?.status ?? "none",
    });
    if (tier !== "activeSubscriber") {
      return {
        allowed: false,
        reason:
          user.accountState === "banned"
            ? "This account is restricted and cannot access gated downloads."
            : "An active subscription is required for the current release channel.",
        items: [] as any[],
      };
    }
    const items = await ctx.db
      .query("downloads")
      .withIndex("isPublished", (q) => q.eq("isPublished", true))
      .collect();
    return {
      allowed: true,
      reason: null,
      items: items
        .filter((item) => item.requiresActiveSubscription)
        .sort((a, b) => b.publishedAt - a.publishedAt),
    };
  },
});
