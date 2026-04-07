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

function sortChangelogs(items: any[]) {
  return [...items].sort((a, b) => b.releasedAt - a.releasedAt);
}

export const publicChangelogIndex = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("changelogs").collect();
    return {
      items: sortChangelogs(items.filter((item) => item.published)),
    };
  },
});

export const publicChangelogDetail = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const changelog = await ctx.db
      .query("changelogs")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!changelog || !changelog.published) {
      return { ok: false, message: "Changelog entry not found.", changelog: null };
    }
    return {
      ok: true,
      message: null,
      changelog,
    };
  },
});

export const latestPublishedChangelog = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("changelogs").collect();
    return sortChangelogs(items.filter((item) => item.published))[0] ?? null;
  },
});

export const adminChangelogIndex = query({
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
    const items = await ctx.db.query("changelogs").collect();
    return {
      ok: true,
      message: null,
      items: sortChangelogs(items),
    };
  },
});

export const adminChangelogDetail = query({
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
        changelog: null,
      };
    }
    const changelog = await ctx.db
      .query("changelogs")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .unique();
    return {
      ok: true,
      message: null,
      changelog,
    };
  },
});

export const upsertChangelog = mutation({
  args: {
    changelogId: v.optional(v.id("changelogs")),
    version: v.string(),
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    entries: v.array(
      v.object({
        type: v.union(
          v.literal("added"),
          v.literal("improved"),
          v.literal("fixed"),
          v.literal("knownIssues"),
        ),
        body: v.string(),
      }),
    ),
    releasedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }
    const version = trimText(args.version, 32);
    const title = trimText(args.title, 120);
    const slug = normalizeSlug(args.slug || `${args.version}-${args.title}`);
    const summary = trimText(args.summary, 240);
    const entries = args.entries
      .map((entry) => ({
        type: entry.type,
        body: entry.body.trim(),
      }))
      .filter((entry) => entry.body.length > 0);
    if (version.length < 2) {
      throw new Error("Version is required.");
    }
    if (title.length < 4) {
      throw new Error("Changelog title must be at least 4 characters.");
    }
    if (!slug) {
      throw new Error("Changelog slug is required.");
    }
    if (summary.length < 12) {
      throw new Error("Changelog summary must be at least 12 characters.");
    }
    if (!entries.length) {
      throw new Error("At least one changelog entry is required.");
    }
    const existingBySlug = await ctx.db
      .query("changelogs")
      .withIndex("slug", (q) => q.eq("slug", slug))
      .unique();
    if (existingBySlug && existingBySlug._id !== args.changelogId) {
      throw new Error("Changelog slug must be unique.");
    }
    const now = Date.now();
    const patch = {
      version,
      title,
      slug,
      summary,
      entries,
      releasedAt: args.releasedAt,
      updatedByUserId: viewer.userId,
      updatedAt: now,
    };
    let changelogId = args.changelogId;
    if (args.changelogId) {
      await ctx.db.patch(args.changelogId, patch);
    } else {
      changelogId = await ctx.db.insert("changelogs", {
        ...patch,
        published: false,
        createdByUserId: viewer.userId,
        createdAt: now,
      });
    }
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: args.changelogId ? "changelog.updated" : "changelog.created",
      targetTable: "changelogs",
      targetId: changelogId!,
      metadata: { slug, version },
    });
    return changelogId;
  },
});

export const setChangelogPublished = mutation({
  args: {
    changelogId: v.id("changelogs"),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }
    const changelog = await ctx.db.get(args.changelogId);
    if (!changelog) {
      throw new Error("Changelog entry not found.");
    }
    await ctx.db.patch(args.changelogId, {
      published: args.published,
      updatedByUserId: viewer.userId,
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: args.published ? "changelog.published" : "changelog.unpublished",
      targetTable: "changelogs",
      targetId: args.changelogId,
      metadata: { slug: changelog.slug, version: changelog.version },
    });
  },
});
