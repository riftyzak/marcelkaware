import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getLatestSubscriptionForUser } from "./subscriptions";

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
