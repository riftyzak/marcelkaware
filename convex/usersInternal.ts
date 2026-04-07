import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getLatestSubscriptionForUser } from "./subscriptions";

function normalizeHandle(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export const getById = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => ctx.db.get(args.userId),
});

export const getLatestSubscription = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => getLatestSubscriptionForUser(ctx, args.userId),
});

export const resolveLoginEmailByHandle = internalQuery({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = normalizeHandle(args.username.trim());
    if (!normalized) {
      return null;
    }

    const users = await ctx.db
      .query("users")
      .withIndex("handle", (q) => q.eq("handle", normalized))
      .take(2);

    if (users.length !== 1) {
      return null;
    }

    return users[0]?.email ?? null;
  },
});
