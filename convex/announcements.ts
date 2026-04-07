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

function canViewAnnouncement(audienceScope: string, tier: string) {
  if (audienceScope === "public") {
    return true;
  }
  if (tier === "banned" || tier === "guest") {
    return false;
  }
  if (audienceScope === "members") {
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

function sortAnnouncements(items: any[]) {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return (b.publishedAt ?? b.updatedAt) - (a.publishedAt ?? a.updatedAt);
  });
}

export const publicAnnouncementIndex = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerState(ctx);
    const items = await ctx.db.query("announcements").collect();
    return {
      viewerTier: viewer.tier,
      items: sortAnnouncements(
        items.filter(
          (item) => item.published && canViewAnnouncement(item.audienceScope, viewer.tier),
        ),
      ),
    };
  },
});

export const publicAnnouncementDetail = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    const announcement = await ctx.db
      .query("announcements")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!announcement || !announcement.published) {
      return { ok: false, message: "Announcement not found.", announcement: null };
    }
    if (!canViewAnnouncement(announcement.audienceScope, viewer.tier)) {
      return { ok: false, message: "Announcement not available for this account.", announcement: null };
    }
    return {
      ok: true,
      message: null,
      announcement,
      viewerTier: viewer.tier,
    };
  },
});

export const latestVisibleAnnouncement = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerState(ctx);
    const items = await ctx.db.query("announcements").collect();
    return (
      sortAnnouncements(
        items.filter(
          (item) => item.published && canViewAnnouncement(item.audienceScope, viewer.tier),
        ),
      )[0] ?? null
    );
  },
});

export const adminAnnouncementIndex = query({
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
    const items = await ctx.db.query("announcements").collect();
    return {
      ok: true,
      message: null,
      items: sortAnnouncements(items),
    };
  },
});

export const adminAnnouncementDetail = query({
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
        announcement: null,
      };
    }
    const announcement = await ctx.db
      .query("announcements")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .unique();
    return {
      ok: true,
      message: null,
      announcement,
    };
  },
});

export const upsertAnnouncement = mutation({
  args: {
    announcementId: v.optional(v.id("announcements")),
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    body: v.string(),
    audienceScope: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("subscribers"),
      v.literal("staff"),
    ),
    pinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }
    const title = trimText(args.title, 120);
    const slug = normalizeSlug(args.slug || args.title);
    const summary = trimText(args.summary, 240);
    const body = args.body.trim();
    if (title.length < 4) {
      throw new Error("Announcement title must be at least 4 characters.");
    }
    if (!slug) {
      throw new Error("Announcement slug is required.");
    }
    if (summary.length < 12) {
      throw new Error("Announcement summary must be at least 12 characters.");
    }
    if (body.length < 24) {
      throw new Error("Announcement body must be at least 24 characters.");
    }
    const existingBySlug = await ctx.db
      .query("announcements")
      .withIndex("slug", (q) => q.eq("slug", slug))
      .unique();
    if (existingBySlug && existingBySlug._id !== args.announcementId) {
      throw new Error("Announcement slug must be unique.");
    }
    const now = Date.now();
    const patch = {
      title,
      slug,
      summary,
      body,
      audienceScope: args.audienceScope,
      pinned: args.pinned,
      updatedByUserId: viewer.userId,
      updatedAt: now,
    };
    let announcementId = args.announcementId;
    if (args.announcementId) {
      await ctx.db.patch(args.announcementId, patch);
    } else {
      announcementId = await ctx.db.insert("announcements", {
        ...patch,
        published: false,
        createdByUserId: viewer.userId,
        createdAt: now,
      });
    }
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: args.announcementId ? "announcement.updated" : "announcement.created",
      targetTable: "announcements",
      targetId: announcementId!,
      metadata: {
        slug,
        audienceScope: args.audienceScope,
        pinned: args.pinned,
      },
    });
    return announcementId;
  },
});

export const setAnnouncementPublished = mutation({
  args: {
    announcementId: v.id("announcements"),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) {
      throw new Error("Announcement not found.");
    }
    const now = Date.now();
    await ctx.db.patch(args.announcementId, {
      published: args.published,
      publishedAt: args.published ? now : undefined,
      updatedByUserId: viewer.userId,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: args.published ? "announcement.published" : "announcement.unpublished",
      targetTable: "announcements",
      targetId: args.announcementId,
      metadata: { slug: announcement.slug },
    });
  },
});
