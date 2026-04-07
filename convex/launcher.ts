import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

export const viewerDevices = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    return ctx.db
      .query("launcherDevices")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const createPairingChallenge = internalMutation({
  args: {
    userId: v.id("users"),
    codeHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("launcherPairingChallenges", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const findPairingChallenge = internalQuery({
  args: {
    codeHash: v.string(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db
      .query("launcherPairingChallenges")
      .withIndex("codeHash", (q) => q.eq("codeHash", args.codeHash))
      .collect();
    return challenge.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
  },
});

export const consumePairingChallenge = internalMutation({
  args: {
    challengeId: v.id("launcherPairingChallenges"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.challengeId, {
      consumedAt: Date.now(),
    });
  },
});

export const upsertDevice = internalMutation({
  args: {
    userId: v.id("users"),
    deviceId: v.string(),
    deviceName: v.string(),
    hardwareFingerprintHash: v.string(),
    ipHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("launcherDevices")
      .withIndex("deviceId", (q) => q.eq("deviceId", args.deviceId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        deviceName: args.deviceName,
        hardwareFingerprintHash: args.hardwareFingerprintHash,
        lastSeenAt: Date.now(),
        lastIpHash: args.ipHash,
        status: "active",
      });
      return existing._id;
    }
    return await ctx.db.insert("launcherDevices", {
      ...args,
      lastIpHash: args.ipHash,
      firstSeenAt: Date.now(),
      lastSeenAt: Date.now(),
      status: "active",
    });
  },
});

export const insertSession = internalMutation({
  args: {
    userId: v.id("users"),
    deviceId: v.id("launcherDevices"),
    accessTokenHash: v.string(),
    refreshTokenHash: v.string(),
    scope: v.array(v.string()),
    accessExpiresAt: v.number(),
    refreshExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("launcherSessions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const rotateSession = internalMutation({
  args: {
    sessionId: v.id("launcherSessions"),
    accessTokenHash: v.string(),
    refreshTokenHash: v.string(),
    accessExpiresAt: v.number(),
    refreshExpiresAt: v.number(),
    ipHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found.");
    }
    await ctx.db.patch(args.sessionId, {
      accessTokenHash: args.accessTokenHash,
      refreshTokenHash: args.refreshTokenHash,
      accessExpiresAt: args.accessExpiresAt,
      refreshExpiresAt: args.refreshExpiresAt,
      rotatedAt: Date.now(),
      lastValidatedAt: Date.now(),
    });
    const device = await ctx.db.get(session.deviceId);
    if (device) {
      await ctx.db.patch(device._id, {
        lastSeenAt: Date.now(),
        lastIpHash: args.ipHash ?? device.lastIpHash,
      });
    }
  },
});

export const touchSession = internalMutation({
  args: {
    sessionId: v.id("launcherSessions"),
    ipHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return;
    }
    await ctx.db.patch(args.sessionId, {
      lastValidatedAt: Date.now(),
    });
    const device = await ctx.db.get(session.deviceId);
    if (device) {
      await ctx.db.patch(device._id, {
        lastSeenAt: Date.now(),
        lastIpHash: args.ipHash ?? device.lastIpHash,
      });
    }
  },
});

export const revokeSession = internalMutation({
  args: {
    sessionId: v.id("launcherSessions"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      revokedAt: Date.now(),
      revokedReason: args.reason,
    });
  },
});

export const findSessionByRefreshHash = internalQuery({
  args: {
    refreshTokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("launcherSessions")
      .withIndex("refreshTokenHash", (q) => q.eq("refreshTokenHash", args.refreshTokenHash))
      .unique();
  },
});

export const findSessionByAccessHash = internalQuery({
  args: {
    accessTokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("launcherSessions")
      .withIndex("accessTokenHash", (q) => q.eq("accessTokenHash", args.accessTokenHash))
      .unique();
  },
});

export const getDeviceById = internalQuery({
  args: {
    deviceId: v.id("launcherDevices"),
  },
  handler: async (ctx, args) => ctx.db.get(args.deviceId),
});
