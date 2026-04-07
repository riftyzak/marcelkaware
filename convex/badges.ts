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

function sortBadges(items: any[]) {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.name.localeCompare(b.name);
  });
}

function sortAssignedBadges(items: any[]) {
  return [...items].sort((a, b) => {
    if (a.badge.sortOrder !== b.badge.sortOrder) {
      return a.badge.sortOrder - b.badge.sortOrder;
    }
    return a.badge.name.localeCompare(b.badge.name);
  });
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

export const adminBadgeIndex = query({
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

    const badges = await ctx.db.query("badges").collect();
    const assignments = await ctx.db.query("userBadges").collect();
    const items = sortBadges(badges).map((badge) => ({
      ...badge,
      assignmentCount: assignments.filter((assignment) => assignment.badgeId === badge._id).length,
    }));

    return {
      ok: true,
      message: null,
      items,
    };
  },
});

export const adminBadgeDetail = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    try {
      assertAdminContentAccess(viewer.tier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Access denied.",
        badge: null,
      };
    }

    const badge = await ctx.db
      .query("badges")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .unique();

    return {
      ok: true,
      message: null,
      badge,
    };
  },
});

export const adminUserBadgeAssignments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    try {
      assertAdminContentAccess(viewer.tier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Access denied.",
        targetUser: null,
        assignments: [] as any[],
        badges: [] as any[],
      };
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      return {
        ok: false,
        message: "User not found.",
        targetUser: null,
        assignments: [] as any[],
        badges: [] as any[],
      };
    }

    const badges = sortBadges(await ctx.db.query("badges").collect());
    const assignments = await ctx.db
      .query("userBadges")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    const hydratedAssignments = sortAssignedBadges(
      (
        await Promise.all(
          assignments.map(async (assignment) => {
            const badge = await ctx.db.get(assignment.badgeId);
            const assignedBy = await ctx.db.get(assignment.assignedByUserId);
            if (!badge) {
              return null;
            }
            return {
              ...assignment,
              badge,
              assignedByName:
                assignedBy?.displayName ?? assignedBy?.name ?? assignedBy?.email ?? "Staff",
            };
          }),
        )
      ).filter(Boolean) as any[],
    );

    return {
      ok: true,
      message: null,
      targetUser: {
        _id: targetUser._id,
        displayName: targetUser.displayName ?? targetUser.name ?? targetUser.email ?? "Member",
        email: targetUser.email ?? null,
        handle: targetUser.handle ?? null,
      },
      assignments: hydratedAssignments,
      badges,
    };
  },
});

export const upsertBadge = mutation({
  args: {
    badgeId: v.optional(v.id("badges")),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    styleVariant: v.union(
      v.literal("neutral"),
      v.literal("cyan"),
      v.literal("emerald"),
      v.literal("amber"),
      v.literal("rose"),
      v.literal("violet"),
    ),
    iconKey: v.optional(v.string()),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }

    const name = trimText(args.name, 80);
    const slug = normalizeSlug(args.slug || name);
    const description = trimText(args.description, 240);
    const iconKey = args.iconKey ? trimText(args.iconKey, 32) : undefined;

    if (name.length < 2) {
      throw new Error("Badge name must be at least 2 characters.");
    }
    if (!slug) {
      throw new Error("Badge slug is required.");
    }
    if (description.length < 8) {
      throw new Error("Badge description must be at least 8 characters.");
    }

    const existingBySlug = await ctx.db
      .query("badges")
      .withIndex("slug", (q) => q.eq("slug", slug))
      .unique();
    if (existingBySlug && existingBySlug._id !== args.badgeId) {
      throw new Error("Badge slug must be unique.");
    }

    const now = Date.now();
    const patch = {
      name,
      slug,
      description,
      styleVariant: args.styleVariant,
      iconKey,
      sortOrder: args.sortOrder,
      updatedByUserId: viewer.userId,
      updatedAt: now,
    };

    let badgeId = args.badgeId;
    if (args.badgeId) {
      await ctx.db.patch(args.badgeId, patch);
    } else {
      badgeId = await ctx.db.insert("badges", {
        ...patch,
        published: false,
        createdByUserId: viewer.userId,
        createdAt: now,
      });
    }

    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: args.badgeId ? "badge.updated" : "badge.created",
      targetTable: "badges",
      targetId: badgeId!,
      metadata: {
        slug,
        styleVariant: args.styleVariant,
      },
    });

    return badgeId;
  },
});

export const setBadgePublished = mutation({
  args: {
    badgeId: v.id("badges"),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }

    const badge = await ctx.db.get(args.badgeId);
    if (!badge) {
      throw new Error("Badge not found.");
    }

    await ctx.db.patch(args.badgeId, {
      published: args.published,
      updatedByUserId: viewer.userId,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: args.published ? "badge.published" : "badge.unpublished",
      targetTable: "badges",
      targetId: args.badgeId,
      metadata: { slug: badge.slug },
    });
  },
});

export const assignBadgeToUser = mutation({
  args: {
    userId: v.id("users"),
    badgeId: v.id("badges"),
    internalNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }

    const targetUser = await ctx.db.get(args.userId);
    const badge = await ctx.db.get(args.badgeId);
    if (!targetUser) {
      throw new Error("User not found.");
    }
    if (!badge) {
      throw new Error("Badge not found.");
    }

    const existing = await ctx.db
      .query("userBadges")
      .withIndex("userIdAndBadgeId", (q) => q.eq("userId", args.userId).eq("badgeId", args.badgeId))
      .unique();
    if (existing) {
      throw new Error("Badge is already assigned to this user.");
    }

    const assignmentId = await ctx.db.insert("userBadges", {
      userId: args.userId,
      badgeId: args.badgeId,
      assignedByUserId: viewer.userId,
      assignedAt: Date.now(),
      internalNote: args.internalNote ? trimText(args.internalNote, 240) : undefined,
    });

    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: "badge.assigned",
      targetTable: "userBadges",
      targetId: assignmentId,
      metadata: {
        userId: args.userId,
        badgeId: args.badgeId,
        badgeSlug: badge.slug,
      },
    });

    return assignmentId;
  },
});

export const removeBadgeFromUser = mutation({
  args: {
    userBadgeId: v.id("userBadges"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertAdminContentAccess(viewer.tier);
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }

    const assignment = await ctx.db.get(args.userBadgeId);
    if (!assignment) {
      throw new Error("Badge assignment not found.");
    }
    const badge = await ctx.db.get(assignment.badgeId);

    await ctx.db.delete(args.userBadgeId);

    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: "badge.removed",
      targetTable: "userBadges",
      targetId: args.userBadgeId,
      metadata: {
        userId: assignment.userId,
        badgeId: assignment.badgeId,
        badgeSlug: badge?.slug ?? null,
      },
    });
  },
});
