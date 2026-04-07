import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const record = internalMutation({
  args: {
    actorUserId: v.optional(v.id("users")),
    actorType: v.union(
      v.literal("user"),
      v.literal("staff"),
      v.literal("system"),
      v.literal("webhook"),
      v.literal("launcher"),
    ),
    action: v.string(),
    targetTable: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
