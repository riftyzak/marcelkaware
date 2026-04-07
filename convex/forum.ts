import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import {
  assertForumCategoryManageAccess,
  assertForumCategoryViewAccess,
  assertForumModerationAccess,
  assertForumReplyAccess,
  assertForumThreadCreateAccess,
  getAccessTierFromState,
} from "./rbac";
import { getLatestSubscriptionForUser } from "./subscriptions";

function trimText(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function getDisplayName(user: any) {
  return user?.displayName ?? user?.name ?? user?.email ?? "Member";
}

async function getPublishedBadgesForUser(ctx: any, userId: any) {
  const assignments = await ctx.db
    .query("userBadges")
    .withIndex("userId", (q: any) => q.eq("userId", userId))
    .collect();

  const badges = (
    await Promise.all(
      assignments.map(async (assignment: any) => {
        const badge = await ctx.db.get(assignment.badgeId);
        if (!badge || !badge.published) {
          return null;
        }
        return {
          _id: badge._id,
          name: badge.name,
          slug: badge.slug,
          description: badge.description,
          styleVariant: badge.styleVariant,
          iconKey: badge.iconKey ?? null,
          sortOrder: badge.sortOrder,
        };
      }),
    )
  ).filter(Boolean) as any[];

  return badges.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.name.localeCompare(b.name);
  });
}

function categoryVisibility(category: any) {
  return {
    guests: category.visibleToGuests,
    registeredUsers: category.visibleToRegisteredUsers,
    activeSubscribers: category.visibleToActiveSubscribers,
  };
}

function categoryPosting(category: any) {
  return {
    allowThreads: category.allowThreads,
    allowReplies: category.allowReplies,
  };
}

function canSeeHiddenContent(tier: string) {
  return tier === "moderator" || tier === "admin";
}

function canReactToForum(tier: string) {
  return (
    tier !== "guest" &&
    tier !== "banned" &&
    tier !== "resellerOps"
  );
}

async function getViewerState(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return {
      userId: null,
      user: null,
      subscription: null,
      tier: "guest" as const,
    };
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    return {
      userId: null,
      user: null,
      subscription: null,
      tier: "guest" as const,
    };
  }
  const subscription = await getLatestSubscriptionForUser(ctx, userId);
  const tier = getAccessTierFromState({
    role: user.role ?? "registered",
    accountState: user.accountState ?? "active",
    subscriptionStatus: subscription?.status ?? "none",
  });
  return {
    userId,
    user,
    subscription,
    tier,
  };
}

async function getThreadVisiblePostCount(ctx: any, threadId: any) {
  const posts = await ctx.db
    .query("forumPosts")
    .withIndex("threadId", (q: any) => q.eq("threadId", threadId))
    .collect();
  return posts.filter((post: any) => post.status === "visible").length;
}

export const categoryIndex = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerState(ctx);
    if (viewer.tier === "banned") {
      return {
        ok: false,
        message: "Restricted accounts must use the appeal contact path.",
        viewerTier: viewer.tier,
        items: [] as any[],
      };
    }
    if (viewer.tier === "resellerOps") {
      return {
        ok: false,
        message: "Community access is not enabled for this account.",
        viewerTier: viewer.tier,
        items: [] as any[],
      };
    }
    const categories = await ctx.db
      .query("forumCategories")
      .withIndex("sortOrder")
      .collect();
    const visibleCategories = await Promise.all(
      categories.map(async (category) => {
        try {
          assertForumCategoryViewAccess({
            tier: viewer.tier,
            visibility: categoryVisibility(category),
          });
        } catch {
          return null;
        }
        const threads = await ctx.db
          .query("forumThreads")
          .withIndex("categoryId", (q) => q.eq("categoryId", category._id))
          .collect();
        const visibleThreads = threads.filter((thread) =>
          thread.status === "hidden" ? canSeeHiddenContent(viewer.tier) : true,
        );
        const latestThread = visibleThreads
          .sort((a, b) => b.lastPostAt - a.lastPostAt)[0];
        const latestPoster = latestThread
          ? await ctx.db.get(latestThread.lastPostUserId)
          : null;
        return {
          ...category,
          threadCount: visibleThreads.length,
          latestThread: latestThread
            ? {
                _id: latestThread._id,
                title: latestThread.title,
                lastPostAt: latestThread.lastPostAt,
                lastPostBy: getDisplayName(latestPoster),
              }
            : null,
        };
      }),
    );
    return {
      ok: true,
      message: null,
      viewerTier: viewer.tier,
      items: visibleCategories.filter(Boolean),
    };
  },
});

export const publicPortalOverview = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerState(ctx);

    if (viewer.tier === "banned") {
      return {
        ok: false,
        message: "Restricted accounts must use the appeal contact path.",
        viewerTier: viewer.tier,
        categories: [] as any[],
        recentThreads: [] as any[],
        totals: { visibleCategories: 0, visibleThreads: 0 },
      };
    }

    if (viewer.tier === "resellerOps") {
      return {
        ok: false,
        message: "Community access is not enabled for this account.",
        viewerTier: viewer.tier,
        categories: [] as any[],
        recentThreads: [] as any[],
        totals: { visibleCategories: 0, visibleThreads: 0 },
      };
    }

    const categories = await ctx.db
      .query("forumCategories")
      .withIndex("sortOrder")
      .collect();

    const visibleCategories = (
      await Promise.all(
        categories.map(async (category) => {
          try {
            assertForumCategoryViewAccess({
              tier: viewer.tier,
              visibility: categoryVisibility(category),
            });
          } catch {
            return null;
          }

          const threads = await ctx.db
            .query("forumThreads")
            .withIndex("categoryId", (q) => q.eq("categoryId", category._id))
            .collect();

          const visibleThreads = threads.filter((thread) =>
            thread.status === "hidden" ? canSeeHiddenContent(viewer.tier) : true,
          );

          const latestThread = visibleThreads.sort((a, b) => b.lastPostAt - a.lastPostAt)[0];
          const latestPoster = latestThread
            ? await ctx.db.get(latestThread.lastPostUserId)
            : null;

          return {
            _id: category._id,
            title: category.title,
            slug: category.slug,
            description: category.description ?? null,
            isArchived: category.isArchived,
            sortOrder: category.sortOrder,
            visibleToGuests: category.visibleToGuests,
            visibleToRegisteredUsers: category.visibleToRegisteredUsers,
            visibleToActiveSubscribers: category.visibleToActiveSubscribers,
            allowThreads: category.allowThreads,
            allowReplies: category.allowReplies,
            threadCount: visibleThreads.length,
            latestThread: latestThread
              ? {
                  _id: latestThread._id,
                  title: latestThread.title,
                  lastPostAt: latestThread.lastPostAt,
                  lastPostBy: getDisplayName(latestPoster),
                }
              : null,
          };
        }),
      )
    ).filter(Boolean) as any[];

    const allVisibleThreads = (
      await Promise.all(
        visibleCategories.flatMap(async (category: any) => {
          const threads = await ctx.db
            .query("forumThreads")
            .withIndex("categoryId", (q) => q.eq("categoryId", category._id))
            .collect();

          return Promise.all(
            threads
              .filter((thread) =>
                thread.status === "hidden" ? canSeeHiddenContent(viewer.tier) : true,
              )
              .map(async (thread) => {
                const author = await ctx.db.get(thread.authorUserId);
                const lastPoster = await ctx.db.get(thread.lastPostUserId);
                const visiblePostCount = await getThreadVisiblePostCount(ctx, thread._id);
                return {
                  _id: thread._id,
                  title: thread.title,
                  slugCategory: category.slug,
                  categoryTitle: category.title,
                  categoryArchived: category.isArchived,
                  status: thread.status,
                  isLocked: thread.status === "locked",
                  isPinned: thread.isPinned,
                  authorName: getDisplayName(author),
                  lastPostBy: getDisplayName(lastPoster),
                  lastPostAt: thread.lastPostAt,
                  replyCount: Math.max(visiblePostCount - 1, 0),
                };
              }),
          );
        }),
      )
    )
      .flat()
      .sort((a, b) => b.lastPostAt - a.lastPostAt);

    return {
      ok: true,
      message: null,
      viewerTier: viewer.tier,
      categories: visibleCategories.slice(0, 6),
      recentThreads: allVisibleThreads.slice(0, 8),
      totals: {
        visibleCategories: visibleCategories.length,
        visibleThreads: allVisibleThreads.length,
      },
    };
  },
});

export const categoryDetail = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (viewer.tier === "banned") {
      return {
        ok: false,
        message: "Restricted accounts must use the appeal contact path.",
        category: null,
      };
    }
    if (viewer.tier === "resellerOps") {
      return {
        ok: false,
        message: "Community access is not enabled for this account.",
        category: null,
      };
    }
    const category = await ctx.db
      .query("forumCategories")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!category) {
      return { ok: false, message: "Category not found.", category: null };
    }
    try {
      assertForumCategoryViewAccess({
        tier: viewer.tier,
        visibility: categoryVisibility(category),
      });
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Forum category access denied.",
        category: null,
      };
    }
    const threads = await ctx.db
      .query("forumThreads")
      .withIndex("categoryId", (q) => q.eq("categoryId", category._id))
      .collect();
    const visibleThreads = (
      await Promise.all(
        threads
          .filter((thread) =>
            thread.status === "hidden" ? canSeeHiddenContent(viewer.tier) : true,
          )
          .sort((a, b) => {
            if (a.isPinned !== b.isPinned) {
              return a.isPinned ? -1 : 1;
            }
            return b.lastPostAt - a.lastPostAt;
          })
          .map(async (thread) => {
            const author = await ctx.db.get(thread.authorUserId);
            const lastPoster = await ctx.db.get(thread.lastPostUserId);
            const visiblePostCount = await getThreadVisiblePostCount(ctx, thread._id);
            return {
              ...thread,
              visiblePostCount,
              author: author
                ? {
                    handle: author.handle ?? null,
                    displayName: getDisplayName(author),
                  }
                : null,
              lastPoster: lastPoster
                ? {
                    handle: lastPoster.handle ?? null,
                    displayName: getDisplayName(lastPoster),
                  }
                : null,
            };
          }),
      )
    ).filter(Boolean);
    return {
      ok: true,
      message: null,
      category,
      threads: visibleThreads,
      viewer: {
        tier: viewer.tier,
        canCreateThread: (() => {
          try {
            assertForumThreadCreateAccess({
              tier: viewer.tier,
              visibility: categoryVisibility(category),
              posting: categoryPosting(category),
              isArchived: category.isArchived,
            });
            return true;
          } catch {
            return false;
          }
        })(),
        canModerate: viewer.tier === "moderator" || viewer.tier === "admin",
      },
    };
  },
});

export const threadDetail = query({
  args: {
    threadId: v.id("forumThreads"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (viewer.tier === "banned") {
      return {
        ok: false,
        message: "Restricted accounts must use the appeal contact path.",
        thread: null,
      };
    }
    if (viewer.tier === "resellerOps") {
      return {
        ok: false,
        message: "Community access is not enabled for this account.",
        thread: null,
      };
    }
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      return { ok: false, message: "Thread not found.", thread: null };
    }
    if (thread.status === "hidden" && !canSeeHiddenContent(viewer.tier)) {
      return { ok: false, message: "Thread not found.", thread: null };
    }
    const category = await ctx.db.get(thread.categoryId);
    if (!category) {
      return { ok: false, message: "Category not found.", thread: null };
    }
    try {
      assertForumCategoryViewAccess({
        tier: viewer.tier,
        visibility: categoryVisibility(category),
      });
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Forum category access denied.",
        thread: null,
      };
    }
    const posts = await ctx.db
      .query("forumPosts")
      .withIndex("threadId", (q) => q.eq("threadId", thread._id))
      .collect();
    const visiblePosts = await Promise.all(
      posts
        .filter((post) => post.status === "visible" || canSeeHiddenContent(viewer.tier))
        .sort((a, b) => a.createdAt - b.createdAt)
        .map(async (post) => {
          const author = await ctx.db.get(post.authorUserId);
          const myReaction =
            viewer.userId && canReactToForum(viewer.tier)
              ? await ctx.db
                  .query("forumReactions")
                  .withIndex("postIdAndUserId", (q) =>
                    q.eq("postId", post._id).eq("userId", viewer.userId!),
                  )
                  .unique()
              : null;
          return {
            ...post,
            author: author
              ? {
                  handle: author.handle ?? null,
                  displayName: getDisplayName(author),
                  avatarUrl: author.avatarUrl ?? null,
                  joinedAt: author.joinedAt ?? null,
                  badges: await getPublishedBadgesForUser(ctx, author._id),
                }
              : null,
            viewerHasLiked: Boolean(myReaction),
          };
        }),
    );
    return {
      ok: true,
      message: null,
      category,
      thread,
      posts: visiblePosts,
      viewer: {
        tier: viewer.tier,
        canReply: (() => {
          try {
            assertForumReplyAccess({
              tier: viewer.tier,
              visibility: categoryVisibility(category),
              posting: categoryPosting(category),
              isArchived: category.isArchived,
              threadStatus: thread.status,
            });
            return true;
          } catch {
            return false;
          }
        })(),
        canReact: canReactToForum(viewer.tier),
        canModerate: viewer.tier === "moderator" || viewer.tier === "admin",
      },
    };
  },
});

export const memberProfile = query({
  args: {
    handle: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (viewer.tier === "banned") {
      return {
        ok: false,
        message: "Restricted accounts must use the appeal contact path.",
        profile: null,
      };
    }
    if (viewer.tier === "resellerOps") {
      return {
        ok: false,
        message: "Community access is not enabled for this account.",
        profile: null,
      };
    }
    const user = await ctx.db
      .query("users")
      .withIndex("handle", (q) => q.eq("handle", args.handle.toLowerCase()))
      .unique();
    if (!user) {
      return { ok: false, message: "Member not found.", profile: null };
    }
    const authoredThreads = await ctx.db
      .query("forumThreads")
      .withIndex("authorUserId", (q) => q.eq("authorUserId", user._id))
      .collect();
    const authoredPosts = await ctx.db
      .query("forumPosts")
      .withIndex("authorUserId", (q) => q.eq("authorUserId", user._id))
      .collect();
    const visibleThreads = (
      await Promise.all(
        authoredThreads.map(async (thread) => {
          if (thread.status === "hidden") {
            return null;
          }
          const category = await ctx.db.get(thread.categoryId);
          if (!category) {
            return null;
          }
          try {
            assertForumCategoryViewAccess({
              tier: viewer.tier,
              visibility: categoryVisibility(category),
            });
            return thread;
          } catch {
            return null;
          }
        }),
      )
    ).filter((thread): thread is NonNullable<typeof thread> => Boolean(thread));
    const visiblePosts = (
      await Promise.all(
        authoredPosts.map(async (post) => {
          if (post.status !== "visible") {
            return null;
          }
          const category = await ctx.db.get(post.categoryId);
          if (!category) {
            return null;
          }
          try {
            assertForumCategoryViewAccess({
              tier: viewer.tier,
              visibility: categoryVisibility(category),
            });
            return post;
          } catch {
            return null;
          }
        }),
      )
    ).filter((post): post is NonNullable<typeof post> => Boolean(post));
    return {
      ok: true,
      message: null,
      profile: {
        handle: user.handle ?? null,
        displayName: getDisplayName(user),
        avatarUrl: user.avatarUrl ?? null,
        joinedAt: user.joinedAt ?? null,
        role: user.role ?? "registered",
        badges: await getPublishedBadgesForUser(ctx, user._id),
        stats: {
          threadCount: visibleThreads.length,
          postCount: visiblePosts.length,
        },
        recentThreads: visibleThreads
          .sort((a, b) => b.lastPostAt - a.lastPostAt)
          .slice(0, 5)
          .map((thread) => ({
            _id: thread._id,
            title: thread.title,
            createdAt: thread.createdAt,
            status: thread.status,
          })),
      },
    };
  },
});

export const adminCategoryIndex = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerState(ctx);
    try {
      assertForumCategoryManageAccess(viewer.tier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Forum category access denied.",
        items: [] as any[],
      };
    }
    const categories = await ctx.db
      .query("forumCategories")
      .withIndex("sortOrder")
      .collect();
    return {
      ok: true,
      message: null,
      items: categories,
    };
  },
});

export const upsertCategory = mutation({
  args: {
    categoryId: v.optional(v.id("forumCategories")),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    sortOrder: v.number(),
    visibleToGuests: v.boolean(),
    visibleToRegisteredUsers: v.boolean(),
    visibleToActiveSubscribers: v.boolean(),
    allowThreads: v.boolean(),
    allowReplies: v.boolean(),
    isArchived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertForumCategoryManageAccess(viewer.tier);
    const now = Date.now();
    const title = trimText(args.title, 80);
    const slug = normalizeSlug(args.slug || args.title);
    if (title.length < 3) {
      throw new Error("Category title must be at least 3 characters.");
    }
    if (!slug) {
      throw new Error("Category slug is required.");
    }
    const existing = await ctx.db
      .query("forumCategories")
      .withIndex("slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing && existing._id !== args.categoryId) {
      throw new Error("Category slug must be unique.");
    }
    const payload = {
      title,
      slug,
      description: args.description?.trim() || undefined,
      sortOrder: args.sortOrder,
      visibleToGuests: args.visibleToGuests,
      visibleToRegisteredUsers: args.visibleToRegisteredUsers,
      visibleToActiveSubscribers: args.visibleToActiveSubscribers,
      allowThreads: args.allowThreads,
      allowReplies: args.allowReplies,
      isArchived: args.isArchived,
      updatedAt: now,
    };
    let categoryId = args.categoryId;
    if (args.categoryId) {
      await ctx.db.patch(args.categoryId, payload);
    } else {
      categoryId = await ctx.db.insert("forumCategories", {
        ...payload,
        createdAt: now,
      });
    }
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId ?? undefined,
      actorType: "staff",
      action: args.categoryId ? "forum.categoryUpdated" : "forum.categoryCreated",
      targetTable: "forumCategories",
      targetId: categoryId!,
      metadata: {
        slug,
        visibleToGuests: args.visibleToGuests,
        visibleToRegisteredUsers: args.visibleToRegisteredUsers,
        visibleToActiveSubscribers: args.visibleToActiveSubscribers,
      },
    });
    return categoryId;
  },
});

export const reorderCategories = mutation({
  args: {
    orderedIds: v.array(v.id("forumCategories")),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertForumCategoryManageAccess(viewer.tier);
    const now = Date.now();
    for (let index = 0; index < args.orderedIds.length; index += 1) {
      await ctx.db.patch(args.orderedIds[index], {
        sortOrder: index,
        updatedAt: now,
      });
    }
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId ?? undefined,
      actorType: "staff",
      action: "forum.categoriesReordered",
      targetTable: "forumCategories",
      metadata: { orderedIds: args.orderedIds },
    });
  },
});

export const createThread = mutation({
  args: {
    categoryId: v.id("forumCategories"),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found.");
    }
    assertForumThreadCreateAccess({
      tier: viewer.tier,
      visibility: categoryVisibility(category),
      posting: categoryPosting(category),
      isArchived: category.isArchived,
    });
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }
    const title = trimText(args.title, 120);
    const body = args.body.trim();
    if (title.length < 6) {
      throw new Error("Thread title must be at least 6 characters.");
    }
    if (body.length < 20) {
      throw new Error("Thread body must be at least 20 characters.");
    }
    const now = Date.now();
    const threadId = await ctx.db.insert("forumThreads", {
      categoryId: category._id,
      authorUserId: viewer.userId,
      title,
      status: "open",
      isPinned: false,
      replyCount: 0,
      reactionCount: 0,
      lastPostAt: now,
      lastPostUserId: viewer.userId,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("forumPosts", {
      threadId,
      categoryId: category._id,
      authorUserId: viewer.userId,
      body,
      status: "visible",
      reactionCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return threadId;
  },
});

export const addReply = mutation({
  args: {
    threadId: v.id("forumThreads"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found.");
    }
    const category = await ctx.db.get(thread.categoryId);
    if (!category) {
      throw new Error("Category not found.");
    }
    assertForumReplyAccess({
      tier: viewer.tier,
      visibility: categoryVisibility(category),
      posting: categoryPosting(category),
      isArchived: category.isArchived,
      threadStatus: thread.status,
    });
    if (!viewer.userId) {
      throw new Error("Authentication required.");
    }
    const body = args.body.trim();
    if (body.length < 2) {
      throw new Error("Reply cannot be empty.");
    }
    const now = Date.now();
    await ctx.db.insert("forumPosts", {
      threadId: thread._id,
      categoryId: category._id,
      authorUserId: viewer.userId,
      body,
      status: "visible",
      reactionCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(thread._id, {
      replyCount: thread.replyCount + 1,
      lastPostAt: now,
      lastPostUserId: viewer.userId,
      updatedAt: now,
    });
  },
});

export const toggleReaction = mutation({
  args: {
    postId: v.id("forumPosts"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer.userId || !canReactToForum(viewer.tier)) {
      throw new Error("Forum reaction access denied.");
    }
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found.");
    }
    const thread = await ctx.db.get(post.threadId);
    if (!thread) {
      throw new Error("Thread not found.");
    }
    if (thread.status === "hidden" && !canSeeHiddenContent(viewer.tier)) {
      throw new Error("Post not found.");
    }
    const category = await ctx.db.get(post.categoryId);
    if (!category) {
      throw new Error("Category not found.");
    }
    assertForumCategoryViewAccess({
      tier: viewer.tier,
      visibility: categoryVisibility(category),
    });
    if (post.status === "hidden" && !canSeeHiddenContent(viewer.tier)) {
      throw new Error("Post not found.");
    }
    const existing = await ctx.db
      .query("forumReactions")
      .withIndex("postIdAndUserId", (q) =>
        q.eq("postId", post._id).eq("userId", viewer.userId!),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(post._id, {
        reactionCount: Math.max(0, post.reactionCount - 1),
        updatedAt: Date.now(),
      });
      await ctx.db.patch(thread._id, {
        reactionCount: Math.max(0, thread.reactionCount - 1),
        updatedAt: Date.now(),
      });
      return { liked: false };
    }
    await ctx.db.insert("forumReactions", {
      postId: post._id,
      threadId: thread._id,
      userId: viewer.userId,
      kind: "like",
      createdAt: Date.now(),
    });
    await ctx.db.patch(post._id, {
      reactionCount: post.reactionCount + 1,
      updatedAt: Date.now(),
    });
    await ctx.db.patch(thread._id, {
      reactionCount: thread.reactionCount + 1,
      updatedAt: Date.now(),
    });
    return { liked: true };
  },
});

export const moderateThread = mutation({
  args: {
    threadId: v.id("forumThreads"),
    status: v.optional(v.union(v.literal("open"), v.literal("locked"), v.literal("hidden"))),
    isPinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertForumModerationAccess(viewer.tier);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found.");
    }
    const patch: Record<string, any> = {
      updatedAt: Date.now(),
    };
    if (args.status) {
      patch.status = args.status;
    }
    if (args.isPinned !== undefined) {
      patch.isPinned = args.isPinned;
    }
    await ctx.db.patch(thread._id, patch);
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId ?? undefined,
      actorType: "staff",
      action: "forum.threadModerated",
      targetTable: "forumThreads",
      targetId: thread._id,
      metadata: {
        status: args.status ?? thread.status,
        isPinned: args.isPinned ?? thread.isPinned,
      },
    });
  },
});

export const moderatePost = mutation({
  args: {
    postId: v.id("forumPosts"),
    status: v.union(v.literal("visible"), v.literal("hidden")),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    assertForumModerationAccess(viewer.tier);
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found.");
    }
    const now = Date.now();
    await ctx.db.patch(post._id, {
      status: args.status,
      hiddenAt: args.status === "hidden" ? now : undefined,
      hiddenByUserId: args.status === "hidden" ? viewer.userId ?? undefined : undefined,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId ?? undefined,
      actorType: "staff",
      action: "forum.postModerated",
      targetTable: "forumPosts",
      targetId: post._id,
      metadata: {
        status: args.status,
      },
    });
  },
});
