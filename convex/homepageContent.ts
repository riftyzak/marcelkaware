import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { assertAdminContentAccess, getAccessTierFromState } from "./rbac";
import { getLatestSubscriptionForUser } from "./subscriptions";

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

function sortBlocks(items: any[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function validateBlockData(type: string, data: any) {
  if (data.type !== type) {
    throw new Error("Homepage block data type mismatch.");
  }
  if (type === "heroSupportText") {
    if (trimText(data.title ?? "", 160).length < 8 || trimText(data.body ?? "", 400).length < 20) {
      throw new Error("Hero block requires title and body content.");
    }
    if (!trimText(data.primaryLabel ?? "", 48) || !trimText(data.primaryHref ?? "", 200)) {
      throw new Error("Hero block requires a primary CTA label and URL.");
    }
    return {
      type,
      eyebrow: data.eyebrow ? trimText(data.eyebrow, 48) : undefined,
      title: trimText(data.title, 160),
      body: trimText(data.body, 400),
      primaryLabel: trimText(data.primaryLabel, 48),
      primaryHref: trimText(data.primaryHref, 200),
      secondaryLabel: data.secondaryLabel ? trimText(data.secondaryLabel, 48) : undefined,
      secondaryHref: data.secondaryHref ? trimText(data.secondaryHref, 200) : undefined,
    };
  }
  if (type === "trustStrip") {
    const items = (data.items ?? []).map((item: string) => trimText(item, 80)).filter(Boolean);
    if (items.length < 3) {
      throw new Error("Trust strip requires at least three items.");
    }
    return { type, items };
  }
  if (type === "featureRow") {
    const features = (data.features ?? [])
      .map((item: any) => ({
        title: trimText(item.title ?? "", 80),
        body: trimText(item.body ?? "", 200),
      }))
      .filter((item: any) => item.title && item.body);
    if (!trimText(data.title ?? "", 120) || features.length < 2) {
      throw new Error("Feature row requires a title and at least two features.");
    }
    return {
      type,
      title: trimText(data.title, 120),
      intro: data.intro ? trimText(data.intro, 240) : undefined,
      features,
    };
  }
  if (type === "faqRow") {
    const items = (data.items ?? [])
      .map((item: any) => ({
        question: trimText(item.question ?? "", 120),
        answer: trimText(item.answer ?? "", 260),
      }))
      .filter((item: any) => item.question && item.answer);
    if (!trimText(data.title ?? "", 120) || items.length < 2) {
      throw new Error("FAQ row requires a title and at least two items.");
    }
    return {
      type,
      title: trimText(data.title, 120),
      items,
    };
  }
  const title = trimText(data.title ?? "", 120);
  const body = trimText(data.body ?? "", 240);
  const primaryLabel = trimText(data.primaryLabel ?? "", 48);
  const primaryHref = trimText(data.primaryHref ?? "", 200);
  if (!title || !body || !primaryLabel || !primaryHref) {
    throw new Error("CTA block requires title, body, primary label, and primary URL.");
  }
  return {
    type,
    title,
    body,
    primaryLabel,
    primaryHref,
    secondaryLabel: data.secondaryLabel ? trimText(data.secondaryLabel, 48) : undefined,
    secondaryHref: data.secondaryHref ? trimText(data.secondaryHref, 200) : undefined,
  };
}

export const publicHomepageBlocks = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("homepageBlocks").collect();
    return sortBlocks(items.filter((item) => item.published));
  },
});

export const adminHomepageBlockIndex = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerState(ctx);
    try {
      assertAdminContentAccess(viewer.tier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Access denied.",
        items: [] as any[],
      };
    }
    const items = await ctx.db.query("homepageBlocks").collect();
    return {
      ok: true,
      message: null,
      items: sortBlocks(items),
    };
  },
});

export const adminHomepageBlockDetail = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    try {
      assertAdminContentAccess(viewer.tier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Access denied.",
        block: null,
      };
    }
    const block = await ctx.db
      .query("homepageBlocks")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .unique();
    return {
      ok: true,
      message: null,
      block,
    };
  },
});

export const upsertHomepageBlock = mutation({
  args: {
    blockId: v.optional(v.id("homepageBlocks")),
    slug: v.string(),
    type: v.union(
      v.literal("heroSupportText"),
      v.literal("trustStrip"),
      v.literal("featureRow"),
      v.literal("faqRow"),
      v.literal("ctaBlock"),
    ),
    label: v.string(),
    sortOrder: v.number(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }
    const slug = normalizeSlug(args.slug || `${args.type}-${args.label}`);
    const label = trimText(args.label, 80);
    if (!slug) {
      throw new Error("Homepage block slug is required.");
    }
    if (label.length < 3) {
      throw new Error("Homepage block label must be at least 3 characters.");
    }
    const existingBySlug = await ctx.db
      .query("homepageBlocks")
      .withIndex("slug", (q) => q.eq("slug", slug))
      .unique();
    if (existingBySlug && existingBySlug._id !== args.blockId) {
      throw new Error("Homepage block slug must be unique.");
    }
    const normalizedData = validateBlockData(args.type, args.data) as any;
    const now = Date.now();
    const patch = {
      slug,
      type: args.type,
      label,
      sortOrder: args.sortOrder,
      data: normalizedData,
      updatedByUserId: viewer.userId,
      updatedAt: now,
    };
    let blockId = args.blockId;
    if (args.blockId) {
      await ctx.db.patch(args.blockId, patch);
    } else {
      blockId = await ctx.db.insert("homepageBlocks", {
        ...patch,
        published: false,
        createdByUserId: viewer.userId,
        createdAt: now,
      });
    }
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: args.blockId ? "homepageBlock.updated" : "homepageBlock.created",
      targetTable: "homepageBlocks",
      targetId: blockId!,
      metadata: {
        slug,
        type: args.type,
        sortOrder: args.sortOrder,
      },
    });
    return blockId;
  },
});

export const setHomepageBlockPublished = mutation({
  args: {
    blockId: v.id("homepageBlocks"),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }
    const block = await ctx.db.get(args.blockId);
    if (!block) {
      throw new Error("Homepage block not found.");
    }
    await ctx.db.patch(args.blockId, {
      published: args.published,
      updatedByUserId: viewer.userId,
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: args.published ? "homepageBlock.published" : "homepageBlock.unpublished",
      targetTable: "homepageBlocks",
      targetId: args.blockId,
      metadata: { slug: block.slug, type: block.type },
    });
  },
});

export const reorderHomepageBlocks = mutation({
  args: {
    orderedIds: v.array(v.id("homepageBlocks")),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }
    const now = Date.now();
    for (let index = 0; index < args.orderedIds.length; index += 1) {
      await ctx.db.patch(args.orderedIds[index], {
        sortOrder: index,
        updatedByUserId: viewer.userId,
        updatedAt: now,
      });
    }
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: "homepageBlock.reordered",
      targetTable: "homepageBlocks",
      metadata: { orderedIds: args.orderedIds },
    });
  },
});
