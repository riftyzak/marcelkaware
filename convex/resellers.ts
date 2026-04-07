import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import {
  assertResellerToolManageAccess,
  assertResellerToolViewAccess,
  getAccessTierFromState,
} from "./rbac";
import { grantSubscriptionDuration, getLatestSubscriptionForUser } from "./subscriptions";

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function trimText(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function sortResellers(items: any[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

async function getViewerState(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return { userId: null, user: null, subscription: null, tier: "guest" as const };
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    return { userId: null, user: null, subscription: null, tier: "guest" as const };
  }
  const subscription = await getLatestSubscriptionForUser(ctx, userId);
  const tier = getAccessTierFromState({
    role: user.role ?? "registered",
    accountState: user.accountState ?? "active",
    subscriptionStatus: subscription?.status ?? "none",
  });
  return { userId, user, subscription, tier };
}

async function recomputeBatchStatus(ctx: any, batchId: any) {
  const batch = await ctx.db.get(batchId);
  if (!batch) {
    return;
  }
  const keys = await ctx.db
    .query("resellerKeys")
    .withIndex("batchId", (q: any) => q.eq("batchId", batchId))
    .collect();

  let status: "draft" | "issued" | "completed" | "revoked" = "draft";
  if (keys.length && keys.every((key: any) => key.status === "revoked")) {
    status = "revoked";
  } else if (
    keys.length &&
    keys.every((key: any) => key.status === "redeemed" || key.status === "revoked")
  ) {
    status = "completed";
  } else if (keys.some((key: any) => key.status === "issued" || key.status === "redeemed")) {
    status = "issued";
  }

  await ctx.db.patch(batchId, {
    status,
    updatedAt: Date.now(),
  });
}

export const adminResellerIndex = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerState(ctx);
    try {
      assertResellerToolViewAccess(viewer.tier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Access denied.",
        canManage: false,
        items: [] as any[],
      };
    }

    const resellers = sortResellers(await ctx.db.query("resellers").collect());
    const batches = await ctx.db.query("resellerKeyBatches").collect();
    const keys = await ctx.db.query("resellerKeys").collect();

    return {
      ok: true,
      message: null,
      canManage: viewer.tier === "admin" || viewer.tier === "resellerOps",
      items: resellers.map((reseller) => {
        const resellerBatches = batches.filter((batch) => batch.resellerId === reseller._id);
        const resellerKeys = keys.filter((key) => key.assignedResellerId === reseller._id);
        return {
          ...reseller,
          batchCount: resellerBatches.length,
          keyCount: resellerKeys.length,
          redeemedCount: resellerKeys.filter((key) => key.status === "redeemed").length,
        };
      }),
    };
  },
});

export const adminResellerDetail = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    try {
      assertResellerToolViewAccess(viewer.tier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Access denied.",
        canManage: false,
        reseller: null,
        batches: [] as any[],
      };
    }

    const reseller = await ctx.db
      .query("resellers")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!reseller) {
      return {
        ok: false,
        message: "Reseller not found.",
        canManage: false,
        reseller: null,
        batches: [] as any[],
      };
    }

    const batches = await ctx.db
      .query("resellerKeyBatches")
      .withIndex("resellerId", (q) => q.eq("resellerId", reseller._id))
      .collect();
    const keys = await ctx.db.query("resellerKeys").collect();

    return {
      ok: true,
      message: null,
      canManage: viewer.tier === "admin" || viewer.tier === "resellerOps",
      reseller,
      batches: batches
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((batch) => {
          const batchKeys = keys.filter((key) => key.batchId === batch._id);
          return {
            ...batch,
            counts: {
              total: batchKeys.length,
              unissued: batchKeys.filter((key) => key.status === "unissued").length,
              issued: batchKeys.filter((key) => key.status === "issued").length,
              redeemed: batchKeys.filter((key) => key.status === "redeemed").length,
              revoked: batchKeys.filter((key) => key.status === "revoked").length,
            },
          };
        }),
    };
  },
});

export const adminBatchDetail = query({
  args: { batchId: v.id("resellerKeyBatches") },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    try {
      assertResellerToolViewAccess(viewer.tier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Access denied.",
        canManage: false,
        batch: null,
        reseller: null,
        keys: [] as any[],
      };
    }

    const batch = await ctx.db.get(args.batchId);
    if (!batch) {
      return {
        ok: false,
        message: "Batch not found.",
        canManage: false,
        batch: null,
        reseller: null,
        keys: [] as any[],
      };
    }
    const reseller = await ctx.db.get(batch.resellerId);
    const keys = await ctx.db
      .query("resellerKeys")
      .withIndex("batchId", (q) => q.eq("batchId", args.batchId))
      .collect();

    const hydratedKeys = await Promise.all(
      keys
        .sort((a, b) => a.keyPreview.localeCompare(b.keyPreview))
        .map(async (key) => {
          const redeemedBy = key.redeemedByUserId
            ? await ctx.db.get(key.redeemedByUserId)
            : null;
          return {
            ...key,
            redeemedBy: redeemedBy
              ? {
                  displayName:
                    redeemedBy.displayName ??
                    redeemedBy.name ??
                    redeemedBy.email ??
                    "Member",
                  handle: redeemedBy.handle ?? null,
                }
              : null,
          };
        }),
    );

    return {
      ok: true,
      message: null,
      canManage: viewer.tier === "admin" || viewer.tier === "resellerOps",
      batch,
      reseller,
      keys: hydratedKeys,
    };
  },
});

export const upsertReseller = mutation({
  args: {
    resellerId: v.optional(v.id("resellers")),
    name: v.string(),
    slug: v.string(),
    contactName: v.string(),
    contactHandleOrEmail: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertResellerToolManageAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }

    const name = trimText(args.name, 80);
    const slug = normalizeSlug(args.slug || name);
    const contactName = trimText(args.contactName, 80);
    const contactHandleOrEmail = trimText(args.contactHandleOrEmail, 120);
    const notes = args.notes ? trimText(args.notes, 600) : undefined;

    if (name.length < 2 || !slug || contactName.length < 2 || contactHandleOrEmail.length < 3) {
      throw new Error("Reseller record is incomplete.");
    }

    const existingBySlug = await ctx.db
      .query("resellers")
      .withIndex("slug", (q) => q.eq("slug", slug))
      .unique();
    if (existingBySlug && existingBySlug._id !== args.resellerId) {
      throw new Error("Reseller slug must be unique.");
    }

    const now = Date.now();
    const patch = {
      name,
      slug,
      contactName,
      contactHandleOrEmail,
      status: args.status,
      notes,
      updatedByUserId: viewer.userId,
      updatedAt: now,
    };

    let resellerId = args.resellerId;
    if (args.resellerId) {
      await ctx.db.patch(args.resellerId, patch);
    } else {
      resellerId = await ctx.db.insert("resellers", {
        ...patch,
        createdByUserId: viewer.userId,
        createdAt: now,
      });
    }

    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: args.resellerId ? "reseller.updated" : "reseller.created",
      targetTable: "resellers",
      targetId: resellerId!,
      metadata: { slug, status: args.status },
    });

    return resellerId;
  },
});

export const issueBatch = mutation({
  args: {
    batchId: v.id("resellerKeyBatches"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertResellerToolManageAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }

    const batch = await ctx.db.get(args.batchId);
    if (!batch) {
      throw new Error("Batch not found.");
    }
    if (batch.status === "revoked") {
      throw new Error("Revoked batches cannot be issued.");
    }

    const keys = await ctx.db
      .query("resellerKeys")
      .withIndex("batchId", (q) => q.eq("batchId", args.batchId))
      .collect();
    const now = Date.now();
    for (const key of keys) {
      if (key.status === "unissued") {
        await ctx.db.patch(key._id, {
          status: "issued",
          updatedAt: now,
        });
      }
    }
    await ctx.db.patch(args.batchId, {
      status: "issued",
      updatedAt: now,
    });

    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: "reseller.keys.issued",
      targetTable: "resellerKeyBatches",
      targetId: args.batchId,
      metadata: { batchRef: batch.batchRef },
    });
  },
});

export const revokeKey = mutation({
  args: {
    keyId: v.id("resellerKeys"),
    internalNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertResellerToolManageAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }

    const key = await ctx.db.get(args.keyId);
    if (!key) {
      throw new Error("Key not found.");
    }
    if (key.status === "redeemed") {
      throw new Error("Redeemed keys cannot be revoked.");
    }

    await ctx.db.patch(args.keyId, {
      status: "revoked",
      internalNote: args.internalNote ? trimText(args.internalNote, 240) : key.internalNote,
      updatedAt: Date.now(),
    });
    await recomputeBatchStatus(ctx, key.batchId);

    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: "reseller.key.revoked",
      targetTable: "resellerKeys",
      targetId: args.keyId,
      metadata: { batchId: key.batchId, resellerId: key.assignedResellerId },
    });
  },
});

export const createBatchWithKeys = internalMutation({
  args: {
    resellerId: v.id("resellers"),
    batchRef: v.string(),
    durationDays: v.number(),
    quantity: v.number(),
    createdByUserId: v.id("users"),
    keys: v.array(
      v.object({
        lookupPrefix: v.string(),
        keyPreview: v.string(),
        keyHash: v.string(),
      }),
    ),
    expiresAt: v.optional(v.number()),
    internalNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reseller = await ctx.db.get(args.resellerId);
    if (!reseller) {
      throw new Error("Reseller not found.");
    }
    const existingRef = await ctx.db
      .query("resellerKeyBatches")
      .withIndex("batchRef", (q) => q.eq("batchRef", args.batchRef))
      .unique();
    if (existingRef) {
      throw new Error("Batch reference must be unique.");
    }

    const now = Date.now();
    const batchId = await ctx.db.insert("resellerKeyBatches", {
      resellerId: args.resellerId,
      batchRef: args.batchRef,
      durationDays: args.durationDays,
      quantity: args.quantity,
      createdByUserId: args.createdByUserId,
      createdAt: now,
      updatedAt: now,
      status: "draft",
    });

    for (const key of args.keys) {
      await ctx.db.insert("resellerKeys", {
        batchId,
        lookupPrefix: key.lookupPrefix,
        keyPreview: key.keyPreview,
        keyHash: key.keyHash,
        status: "unissued",
        assignedResellerId: args.resellerId,
        expiresAt: args.expiresAt,
        internalNote: args.internalNote,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.runMutation(internal.audit.record, {
      actorUserId: args.createdByUserId,
      actorType: "staff",
      action: "reseller.batch.created",
      targetTable: "resellerKeyBatches",
      targetId: batchId,
      metadata: {
        resellerId: args.resellerId,
        batchRef: args.batchRef,
        quantity: args.quantity,
        durationDays: args.durationDays,
      },
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: args.createdByUserId,
      actorType: "staff",
      action: "reseller.keys.generated",
      targetTable: "resellerKeyBatches",
      targetId: batchId,
      metadata: { quantity: args.quantity },
    });

    return batchId;
  },
});

export const findKeyCandidatesByPrefix = internalQuery({
  args: {
    lookupPrefix: v.string(),
  },
  handler: async (ctx, args) =>
    ctx.db
      .query("resellerKeys")
      .withIndex("lookupPrefix", (q) => q.eq("lookupPrefix", args.lookupPrefix))
      .collect(),
});

export const redeemKeyForUser = internalMutation({
  args: {
    keyId: v.id("resellerKeys"),
    userId: v.id("users"),
    redeemedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.keyId);
    if (!key) {
      throw new Error("Key not found.");
    }
    if (key.status === "redeemed") {
      throw new Error("Key has already been redeemed.");
    }
    if (key.status === "revoked") {
      throw new Error("Key is no longer valid.");
    }
    if (key.expiresAt && key.expiresAt < args.redeemedAt) {
      throw new Error("Key has expired.");
    }

    const batch = await ctx.db.get(key.batchId);
    if (!batch) {
      throw new Error("Batch not found.");
    }

    await ctx.db.patch(args.keyId, {
      status: "redeemed",
      redeemedByUserId: args.userId,
      redeemedAt: args.redeemedAt,
      updatedAt: args.redeemedAt,
    });

    await grantSubscriptionDuration(ctx, args.userId, batch.durationDays);
    await recomputeBatchStatus(ctx, key.batchId);

    await ctx.runMutation(internal.audit.record, {
      actorUserId: args.userId,
      actorType: "user",
      action: "reseller.key.redeemed",
      targetTable: "resellerKeys",
      targetId: args.keyId,
      metadata: {
        batchId: key.batchId,
        resellerId: key.assignedResellerId,
        durationDays: batch.durationDays,
      },
    });

    return {
      durationDays: batch.durationDays,
      batchId: key.batchId,
    };
  },
});
