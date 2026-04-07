"use node";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  launcherAccessTokenMinutes,
  launcherPairingMinutes,
  launcherRefreshTokenDays,
  launcherScope,
} from "../shared/auth";
import { getAccessTierFromState } from "./rbac";
import { v } from "convex/values";

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeCompareHash(input: string, expectedHash: string) {
  const left = Buffer.from(hashValue(input), "hex");
  const right = Buffer.from(expectedHash, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function generateOpaqueToken(prefix: string) {
  return `${prefix}_${randomBytes(24).toString("hex")}`;
}

type ValidateEntitlementResult =
  | { ok: false; reason: "token_expired" | "device_revoked" | "hardware_mismatch" | "entitlement_lost" }
  | {
      ok: true;
      reason: null;
      accessTier: string;
      subscriptionStatus: string;
      userId: string;
    };

export const issuePairingChallenge = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Sign in to generate a pairing code.");
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
    if (user?.accountState === "banned") {
      throw new Error("Restricted accounts cannot pair launcher devices.");
    }
    if (accessTier !== "activeSubscriber") {
      throw new Error("Active subscription required before pairing a device.");
    }

    const code = randomBytes(4).toString("hex").toUpperCase();
    await ctx.runMutation(internal.launcher.createPairingChallenge, {
      userId,
      codeHash: hashValue(code),
      expiresAt: Date.now() + launcherPairingMinutes * 60 * 1000,
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: userId,
      actorType: "user",
      action: "launcher.pairingChallengeIssued",
      targetTable: "launcherPairingChallenges",
      targetId: String(userId),
      metadata: { expiresInMinutes: launcherPairingMinutes },
    });
    return { code };
  },
});

export const exchangePairingChallenge = internalAction({
  args: {
    code: v.string(),
    deviceId: v.string(),
    deviceName: v.string(),
    hardwareFingerprint: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.runQuery(internal.launcher.findPairingChallenge, {
      codeHash: hashValue(args.code),
    });
    if (!challenge || challenge.expiresAt < Date.now() || challenge.consumedAt) {
      throw new Error("Pairing code expired or invalid.");
    }

    const user = await ctx.runQuery(internal.usersInternal.getById, {
      userId: challenge.userId,
    });
    const subscription = await ctx.runQuery(internal.usersInternal.getLatestSubscription, {
      userId: challenge.userId,
    });
    const accessTier = getAccessTierFromState({
      role: user?.role ?? "registered",
      accountState: user?.accountState ?? "active",
      subscriptionStatus: subscription?.status ?? "none",
    });
    if (user?.accountState === "banned" || accessTier !== "activeSubscriber") {
      throw new Error("Account is not entitled to launcher access.");
    }

    const now = Date.now();
    const accessExpiresAt = now + launcherAccessTokenMinutes * 60 * 1000;
    const refreshExpiresAt = now + launcherRefreshTokenDays * 24 * 60 * 60 * 1000;
    const accessToken = generateOpaqueToken("la");
    const refreshToken = generateOpaqueToken("lr");

    const deviceDocId = await ctx.runMutation(internal.launcher.upsertDevice, {
      userId: challenge.userId,
      deviceId: args.deviceId,
      deviceName: args.deviceName,
      hardwareFingerprintHash: hashValue(args.hardwareFingerprint),
      ipHash: args.ipAddress ? hashValue(args.ipAddress) : undefined,
    });

    const sessionId = await ctx.runMutation(internal.launcher.insertSession, {
      userId: challenge.userId,
      deviceId: deviceDocId,
      accessTokenHash: hashValue(accessToken),
      refreshTokenHash: hashValue(refreshToken),
      scope: [launcherScope],
      accessExpiresAt,
      refreshExpiresAt,
    });

    await ctx.runMutation(internal.launcher.consumePairingChallenge, {
      challengeId: challenge._id,
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: challenge.userId,
      actorType: "launcher",
      action: "launcher.sessionIssued",
      targetTable: "launcherSessions",
      targetId: String(sessionId),
      metadata: { deviceId: args.deviceId, userAgent: args.userAgent },
    });

    return {
      accessToken,
      refreshToken,
      accessExpiresAt,
      refreshExpiresAt,
    };
  },
});

export const refreshSession = internalAction({
  args: {
    refreshToken: v.string(),
    hardwareFingerprint: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.launcher.findSessionByRefreshHash, {
      refreshTokenHash: hashValue(args.refreshToken),
    });
    if (!session || session.revokedAt || session.refreshExpiresAt < Date.now()) {
      throw new Error("Refresh token expired.");
    }

    const device = await ctx.runQuery(internal.launcher.getDeviceById, {
      deviceId: session.deviceId,
    });
    if (!device || device.status !== "active") {
      throw new Error("Device access revoked.");
    }
    if (!safeCompareHash(args.hardwareFingerprint, device.hardwareFingerprintHash)) {
      throw new Error("Device mismatch detected.");
    }

    const user = await ctx.runQuery(internal.usersInternal.getById, { userId: session.userId });
    const subscription = await ctx.runQuery(internal.usersInternal.getLatestSubscription, {
      userId: session.userId,
    });
    const accessTier = getAccessTierFromState({
      role: user?.role ?? "registered",
      accountState: user?.accountState ?? "active",
      subscriptionStatus: subscription?.status ?? "none",
    });
    if (user?.accountState === "banned" || accessTier !== "activeSubscriber") {
      await ctx.runMutation(internal.launcher.revokeSession, {
        sessionId: session._id,
        reason: "entitlement_lost",
      });
      throw new Error("Launcher access is no longer valid.");
    }

    const now = Date.now();
    const accessExpiresAt = now + launcherAccessTokenMinutes * 60 * 1000;
    const refreshExpiresAt = now + launcherRefreshTokenDays * 24 * 60 * 60 * 1000;
    const accessToken = generateOpaqueToken("la");
    const refreshToken = generateOpaqueToken("lr");

    await ctx.runMutation(internal.launcher.rotateSession, {
      sessionId: session._id,
      accessTokenHash: hashValue(accessToken),
      refreshTokenHash: hashValue(refreshToken),
      accessExpiresAt,
      refreshExpiresAt,
      ipHash: args.ipAddress ? hashValue(args.ipAddress) : undefined,
    });

    return {
      accessToken,
      refreshToken,
      accessExpiresAt,
      refreshExpiresAt,
    };
  },
});

export const validateEntitlement = internalAction({
  args: {
    accessToken: v.string(),
    hardwareFingerprint: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ValidateEntitlementResult> => {
    const session: any = await ctx.runQuery(internal.launcher.findSessionByAccessHash, {
      accessTokenHash: hashValue(args.accessToken),
    });
    if (!session || session.revokedAt || session.accessExpiresAt < Date.now()) {
      return { ok: false, reason: "token_expired" };
    }

    const device = await ctx.runQuery(internal.launcher.getDeviceById, {
      deviceId: session.deviceId,
    });
    if (!device || device.status !== "active") {
      return { ok: false, reason: "device_revoked" };
    }
    if (!safeCompareHash(args.hardwareFingerprint, device.hardwareFingerprintHash)) {
      await ctx.runMutation(internal.launcher.revokeSession, {
        sessionId: session._id,
        reason: "hardware_mismatch",
      });
      return { ok: false, reason: "hardware_mismatch" };
    }

    const user = await ctx.runQuery(internal.usersInternal.getById, { userId: session.userId });
    const subscription: any = await ctx.runQuery(internal.usersInternal.getLatestSubscription, {
      userId: session.userId,
    });
    const accessTier = getAccessTierFromState({
      role: user?.role ?? "registered",
      accountState: user?.accountState ?? "active",
      subscriptionStatus: subscription?.status ?? "none",
    });
    if (user?.accountState === "banned" || accessTier !== "activeSubscriber") {
      await ctx.runMutation(internal.launcher.revokeSession, {
        sessionId: session._id,
        reason: "entitlement_lost",
      });
      return { ok: false, reason: "entitlement_lost" };
    }

    await ctx.runMutation(internal.launcher.touchSession, {
      sessionId: session._id,
      ipHash: args.ipAddress ? hashValue(args.ipAddress) : undefined,
    });

    return {
      ok: true,
      reason: null,
      accessTier,
      subscriptionStatus: subscription?.status ?? "none",
      userId: String(session.userId),
    };
  },
});
