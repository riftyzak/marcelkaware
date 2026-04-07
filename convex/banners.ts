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

function canViewBanner(audienceScope: string, tier: string) {
  if (audienceScope === "public") {
    return true;
  }
  if (tier === "guest" || tier === "banned") {
    return false;
  }
  if (audienceScope === "authenticated") {
    return true;
  }
  if (audienceScope === "subscribers") {
    return (
      tier === "activeSubscriber" ||
      tier === "moderator" ||
      tier === "supportStaff" ||
      tier === "admin"
    );
  }
  return tier === "moderator" || tier === "supportStaff" || tier === "admin";
}

function isInWindow(item: any, now: number) {
  if (item.startsAt && item.startsAt > now) {
    return false;
  }
  if (item.endsAt && item.endsAt < now) {
    return false;
  }
  return true;
}

function sortBanners(items: any[]) {
  return [...items].sort((a, b) => (b.publishedAt ?? b.updatedAt) - (a.publishedAt ?? a.updatedAt));
}

export const activeBanner = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerState(ctx);
    const now = Date.now();
    const items = await ctx.db.query("siteBanners").collect();
    return (
      sortBanners(
        items.filter(
          (item) =>
            item.published &&
            isInWindow(item, now) &&
            canViewBanner(item.audienceScope, viewer.tier),
        ),
      )[0] ?? null
    );
  },
});

export const adminBannerIndex = query({
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
    const items = await ctx.db.query("siteBanners").collect();
    return {
      ok: true,
      message: null,
      items: sortBanners(items),
    };
  },
});

export const adminBannerDetail = query({
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
        banner: null,
      };
    }
    const banner = await ctx.db
      .query("siteBanners")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .unique();
    return {
      ok: true,
      message: null,
      banner,
    };
  },
});

export const upsertBanner = mutation({
  args: {
    bannerId: v.optional(v.id("siteBanners")),
    slug: v.string(),
    severity: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("critical"),
    ),
    message: v.string(),
    ctaLabel: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    audienceScope: v.union(
      v.literal("public"),
      v.literal("authenticated"),
      v.literal("subscribers"),
      v.literal("staff"),
    ),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }
    const slug = normalizeSlug(args.slug || args.message);
    const message = trimText(args.message, 280);
    const ctaLabel = args.ctaLabel ? trimText(args.ctaLabel, 48) : undefined;
    const ctaUrl = args.ctaUrl?.trim() || undefined;
    if (!slug) {
      throw new Error("Banner slug is required.");
    }
    if (message.length < 8) {
      throw new Error("Banner message must be at least 8 characters.");
    }
    if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
      throw new Error("CTA label and URL must be provided together.");
    }
    if (args.startsAt && args.endsAt && args.startsAt >= args.endsAt) {
      throw new Error("Banner end time must be after the start time.");
    }
    const existingBySlug = await ctx.db
      .query("siteBanners")
      .withIndex("slug", (q) => q.eq("slug", slug))
      .unique();
    if (existingBySlug && existingBySlug._id !== args.bannerId) {
      throw new Error("Banner slug must be unique.");
    }
    const now = Date.now();
    const patch = {
      slug,
      severity: args.severity,
      message,
      ctaLabel,
      ctaUrl,
      audienceScope: args.audienceScope,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      updatedByUserId: viewer.userId,
      updatedAt: now,
    };
    let bannerId = args.bannerId;
    if (args.bannerId) {
      await ctx.db.patch(args.bannerId, patch);
    } else {
      bannerId = await ctx.db.insert("siteBanners", {
        ...patch,
        published: false,
        createdByUserId: viewer.userId,
        createdAt: now,
      });
    }
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: args.bannerId ? "banner.updated" : "banner.created",
      targetTable: "siteBanners",
      targetId: bannerId!,
      metadata: {
        slug,
        severity: args.severity,
        audienceScope: args.audienceScope,
      },
    });
    return bannerId;
  },
});

export const setBannerPublished = mutation({
  args: {
    bannerId: v.id("siteBanners"),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }
    const banner = await ctx.db.get(args.bannerId);
    if (!banner) {
      throw new Error("Banner not found.");
    }
    const now = Date.now();
    if (args.published) {
      const allBanners = await ctx.db.query("siteBanners").collect();
      for (const item of allBanners) {
        if (item._id !== banner._id && item.published) {
          await ctx.db.patch(item._id, {
            published: false,
            updatedByUserId: viewer.userId,
            updatedAt: now,
          });
        }
      }
    }
    await ctx.db.patch(args.bannerId, {
      published: args.published,
      publishedAt: args.published ? now : undefined,
      updatedByUserId: viewer.userId,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: args.published ? "banner.published" : "banner.unpublished",
      targetTable: "siteBanners",
      targetId: args.bannerId,
      metadata: { slug: banner.slug },
    });
  },
});
