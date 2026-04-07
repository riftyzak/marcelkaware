"use node";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAccessTierFromState } from "./rbac";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeCompareHash(input: string, expectedHash: string) {
  const left = Buffer.from(hashValue(input), "hex");
  const right = Buffer.from(expectedHash, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function normalizeRedeemCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function generateSegment(length: number) {
  let output = "";
  while (output.length < length) {
    const bytes = randomBytes(length);
    for (const byte of bytes) {
      output += alphabet[byte % alphabet.length];
      if (output.length === length) {
        break;
      }
    }
  }
  return output;
}

function generateKeyMaterial() {
  const normalized = `VX${generateSegment(6)}${generateSegment(6)}${generateSegment(6)}`;
  const rendered = `${normalized.slice(0, 8)}-${normalized.slice(8, 14)}-${normalized.slice(14)}`;
  return {
    normalized,
    rendered,
    lookupPrefix: normalized.slice(0, 8),
    keyPreview: `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-****-${normalized.slice(-4)}`,
    keyHash: hashValue(normalized),
  };
}

type GeneratedKeyMaterial = ReturnType<typeof generateKeyMaterial>;

export const createBatchWithGeneratedKeys = action({
  args: {
    resellerId: v.id("resellers"),
    batchRef: v.string(),
    durationDays: v.number(),
    quantity: v.number(),
    expiresAt: v.optional(v.number()),
    internalNote: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ batchId: string; keys: string[] }> => {
    const actorUserId = await getAuthUserId(ctx);
    if (!actorUserId) {
      throw new Error("Authentication required.");
    }

    const actor = await ctx.runQuery(internal.usersInternal.getById, { userId: actorUserId });
    const actorSubscription = await ctx.runQuery(internal.usersInternal.getLatestSubscription, {
      userId: actorUserId,
    });
    const accessTier = getAccessTierFromState({
      role: actor?.role ?? "registered",
      accountState: actor?.accountState ?? "active",
      subscriptionStatus: actorSubscription?.status ?? "none",
    });
    if (accessTier !== "admin" && accessTier !== "resellerOps") {
      throw new Error("Reseller tool management access denied.");
    }
    if (args.quantity <= 0 || args.quantity > 500) {
      throw new Error("Quantity must be between 1 and 500.");
    }
    if (args.durationDays <= 0 || args.durationDays > 3650) {
      throw new Error("Duration must be between 1 and 3650 days.");
    }

    const generatedKeys: GeneratedKeyMaterial[] = Array.from({ length: args.quantity }, () =>
      generateKeyMaterial(),
    );
    const batchId: string = await ctx.runMutation(internal.resellers.createBatchWithKeys, {
      resellerId: args.resellerId,
      batchRef: args.batchRef.trim(),
      durationDays: args.durationDays,
      quantity: args.quantity,
      createdByUserId: actorUserId,
      keys: generatedKeys.map((key) => ({
        lookupPrefix: key.lookupPrefix,
        keyPreview: key.keyPreview,
        keyHash: key.keyHash,
      })),
      expiresAt: args.expiresAt,
      internalNote: args.internalNote?.trim() || undefined,
    });

    return {
      batchId,
      keys: generatedKeys.map((key) => key.rendered),
    };
  },
});

export const redeemKey = action({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args): Promise<{ ok: true; durationDays: number }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Sign in before redeeming a key.");
    }

    const normalized = normalizeRedeemCode(args.code);
    if (normalized.length < 12) {
      throw new Error("Enter a valid access key.");
    }

    const user = await ctx.runQuery(internal.usersInternal.getById, { userId });
    const subscription = await ctx.runQuery(internal.usersInternal.getLatestSubscription, { userId });
    const accessTier = getAccessTierFromState({
      role: user?.role ?? "registered",
      accountState: user?.accountState ?? "active",
      subscriptionStatus: subscription?.status ?? "none",
    });
    if (accessTier === "banned") {
      throw new Error("Restricted accounts cannot redeem access keys.");
    }

    const candidates: Array<{ _id: any; keyHash: string }> = await ctx.runQuery(
      internal.resellers.findKeyCandidatesByPrefix,
      {
      lookupPrefix: normalized.slice(0, 8),
      },
    );
    const matched = candidates.find((candidate) => safeCompareHash(normalized, candidate.keyHash));
    if (!matched) {
      throw new Error("Key is invalid or no longer available.");
    }

    const result: { durationDays: number; batchId: string } = await ctx.runMutation(
      internal.resellers.redeemKeyForUser,
      {
      keyId: matched._id,
      userId,
      redeemedAt: Date.now(),
      },
    );

    return {
      ok: true,
      durationDays: result.durationDays,
    };
  },
});
