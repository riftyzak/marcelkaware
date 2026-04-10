import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAccessTierFromState } from "./rbac";
import { getLatestSubscriptionForUser } from "./subscriptions";
import { v } from "convex/values";
import { normalizeCommunityProfileLinks } from "../shared/forum";

function normalizeHandle(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

const communityProfileStateKey = "global";

function trimOptionalText(value: string | undefined, max: number) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function sanitizeProfileUrl(value: string) {
  const normalized = value.trim();
  const parsed = new URL(normalized);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Profile links must use http or https.");
  }
  return parsed.toString();
}

function getRegistrationOrderValue(user: { joinedAt?: number; _creationTime: number }) {
  return user.joinedAt ?? user._creationTime;
}

async function getCommunityProfileState(ctx: any) {
  return ctx.db
    .query("communityProfileState")
    .withIndex("key", (q: any) => q.eq("key", communityProfileStateKey))
    .unique();
}

async function ensureCommunityProfileState(ctx: any) {
  const existing = await getCommunityProfileState(ctx);
  if (existing) {
    return existing;
  }

  const stateId = await ctx.db.insert("communityProfileState", {
    key: communityProfileStateKey,
    nextPublicUserNumber: 1,
  });
  const created = await ctx.db.get(stateId);
  if (!created) {
    throw new Error("Unable to initialize community profile state.");
  }
  return created;
}

async function allocatePublicUserNumber(ctx: any) {
  const state = await ensureCommunityProfileState(ctx);
  const nextNumber = state.nextPublicUserNumber;
  await ctx.db.patch(state._id, {
    nextPublicUserNumber: nextNumber + 1,
  });
  return nextNumber;
}

async function findAvailableHandle(ctx: any, preferred: string, excludeUserId?: any) {
  const base = normalizeHandle(preferred) || "member";

  for (let attempt = 1; attempt <= 1000; attempt += 1) {
    const suffix = attempt === 1 ? "" : `-${attempt}`;
    const candidate = `${base.slice(0, Math.max(1, 24 - suffix.length))}${suffix}`;
    const matches = await ctx.db
      .query("users")
      .withIndex("handle", (q: any) => q.eq("handle", candidate))
      .take(5);

    if (matches.every((match: any) => match._id === excludeUserId)) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique handle.");
}

export const ensureViewerDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required.");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    const fallbackHandle = normalizeHandle(
      user.handle ?? user.displayName ?? user.name ?? user.email?.split("@")[0] ?? `user-${userId}`,
    );
    const uniqueHandle = await findAvailableHandle(ctx, user.handle ?? fallbackHandle, userId);
    const publicUserNumber = user.publicUserNumber ?? (await allocatePublicUserNumber(ctx));
    await ctx.db.patch(userId, {
      role: user.role ?? "registered",
      accountState: user.accountState ?? "active",
      joinedAt: user.joinedAt ?? Date.now(),
      displayName: user.displayName ?? user.name ?? user.email ?? "Member",
      handle: uniqueHandle,
      publicUserNumber,
      lastSeenAt: Date.now(),
    });
    return userId;
  },
});

export const viewerCommunityIdentity = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      displayName: user.displayName ?? user.name ?? user.email ?? "Member",
      handle: user.handle ?? null,
      publicUserNumber: user.publicUserNumber ?? null,
      avatarUrl: user.avatarUrl ?? user.image ?? null,
    };
  },
});

export const viewerCommunityProfileEditor = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    return {
      displayName: user.displayName ?? user.name ?? user.email ?? "Member",
      handle: user.handle ?? null,
      publicUserNumber: user.publicUserNumber ?? null,
      avatarUrl: user.avatarUrl ?? user.image ?? null,
      bio: user.bio ?? "",
      location: user.location ?? "",
      links: user.links ?? [],
    };
  },
});

export const updateViewerCommunityProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    links: v.array(
      v.object({
        label: v.string(),
        url: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required.");
    }

    const bio = trimOptionalText(args.bio, 280);
    const location = trimOptionalText(args.location, 80);
    const links = normalizeCommunityProfileLinks(
      args.links
        .filter((item) => item.label.trim() && item.url.trim())
        .map((item) => ({
          label: item.label,
          url: sanitizeProfileUrl(item.url),
        })),
    );

    await ctx.db.patch(userId, {
      bio,
      location,
      links,
      lastSeenAt: Date.now(),
    });

    return { ok: true };
  },
});

export const backfillCommunityPublicUserNumbers = mutation({
  args: {},
  handler: async (ctx) => {
    const actorUserId = await getAuthUserId(ctx);
    const actor = actorUserId ? await ctx.db.get(actorUserId) : null;
    if (!actor || actor.role !== "admin") {
      throw new Error("Admin only.");
    }

    const users = await ctx.db.query("users").collect();
    const ordered = [...users].sort((a, b) => {
      const delta = getRegistrationOrderValue(a) - getRegistrationOrderValue(b);
      if (delta !== 0) {
        return delta;
      }
      return a._creationTime - b._creationTime;
    });

    const state = await ensureCommunityProfileState(ctx);
    let nextNumber = 1;

    for (const user of ordered) {
      if (user.publicUserNumber && user.publicUserNumber >= nextNumber) {
        nextNumber = user.publicUserNumber + 1;
      }
    }

    let assignedCount = 0;
    for (const user of ordered) {
      if (user.publicUserNumber) {
        continue;
      }
      await ctx.db.patch(user._id, { publicUserNumber: nextNumber });
      nextNumber += 1;
      assignedCount += 1;
    }

    await ctx.db.patch(state._id, {
      nextPublicUserNumber: nextNumber,
      backfillCompletedAt: Date.now(),
    });

    return { ok: true, assignedCount };
  },
});

export const viewerDashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    const subscription = (await getLatestSubscriptionForUser(ctx, userId)) ?? {
      status: "none",
      currentPeriodEnd: undefined,
    };
    const accessTier = getAccessTierFromState({
      role: user.role ?? "registered",
      accountState: user.accountState ?? "active",
      subscriptionStatus: subscription.status,
    });
    const payments = await ctx.db
      .query("payments")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    const devices = await ctx.db
      .query("launcherDevices")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    return {
      user: {
        _id: user._id,
        displayName: user.displayName ?? user.name ?? user.email ?? "Member",
        accountState: user.accountState ?? "active",
      },
      accessTier,
      subscription,
      payments: payments.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
      devices: devices.filter((device) => device.status === "active"),
    };
  },
});

export const getViewerEntitlementState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    const subscription = await getLatestSubscriptionForUser(ctx, userId);
    return {
      userId,
      accountState: user.accountState ?? "active",
      role: user.role ?? "registered",
      subscriptionStatus: subscription?.status ?? "none",
    };
  },
});

export const setAccountState = mutation({
  args: {
    userId: v.id("users"),
    state: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actorUserId = await getAuthUserId(ctx);
    const actor = actorUserId ? await ctx.db.get(actorUserId) : null;
    if (!actor || actor.role !== "admin") {
      throw new Error("Admin only.");
    }
    await ctx.db.patch(args.userId, {
      accountState: args.state,
      banReason: args.state === "banned" ? args.reason : undefined,
      bannedAt: args.state === "banned" ? Date.now() : undefined,
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: actorUserId ?? undefined,
      actorType: "staff",
      action: "user.setAccountState",
      targetTable: "users",
      targetId: args.userId,
      metadata: { state: args.state, reason: args.reason },
    });
  },
});
