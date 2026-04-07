import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  assertTicketCreationAccess,
  assertTicketStaffAccess,
  assertTicketViewAccess,
  getAccessTierFromState,
} from "./rbac";
import { getLatestSubscriptionForUser } from "./subscriptions";
import { v } from "convex/values";

function normalizeTicketActorRole(tier: string) {
  if (tier === "activeSubscriber") {
    return "activeSubscriber" as const;
  }
  if (tier === "expiredSubscriber") {
    return "expiredSubscriber" as const;
  }
  if (tier === "supportStaff") {
    return "supportStaff" as const;
  }
  if (tier === "admin") {
    return "admin" as const;
  }
  if (tier === "moderator") {
    return "moderator" as const;
  }
  return "registered" as const;
}

async function getViewerState(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    return null;
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

async function getActiveDeviceCount(ctx: any, userId: any) {
  const devices = await ctx.db
    .query("launcherDevices")
    .withIndex("userId", (q: any) => q.eq("userId", userId))
    .collect();
  return devices.filter((device: any) => device.status === "active").length;
}

function trimText(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

export const viewerTickets = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) {
      return { ok: false, message: "Authentication required.", items: [] as any[] };
    }
    try {
      assertTicketCreationAccess(viewer.tier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Ticket access denied.",
        items: [] as any[],
      };
    }
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("userId", (q) => q.eq("userId", viewer.userId))
      .collect();
    return {
      ok: true,
      message: null,
      items: tickets
        .filter((ticket) => ticket.visibleToUser)
        .sort((a, b) => b.latestReplyAt - a.latestReplyAt),
    };
  },
});

export const viewerTicketDetail = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) {
      return { ok: false, message: "Authentication required.", ticket: null };
    }
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || !ticket.visibleToUser) {
      return { ok: false, message: "Ticket not found.", ticket: null };
    }
    try {
      assertTicketViewAccess({
        tier: viewer.tier,
        viewerUserId: viewer.userId,
        ticketOwnerUserId: ticket.userId,
      });
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Ticket access denied.",
        ticket: null,
      };
    }
    const replies = await ctx.db
      .query("ticketReplies")
      .withIndex("ticketId", (q) => q.eq("ticketId", ticket._id))
      .collect();
    const currentSubscription = await getLatestSubscriptionForUser(ctx, ticket.userId);
    const owner = await ctx.db.get(ticket.userId);
    const assignedTo = ticket.assignedToUserId
      ? await ctx.db.get(ticket.assignedToUserId)
      : null;
    return {
      ok: true,
      message: null,
      ticket,
      replies: replies
        .filter((reply) => !reply.isInternalNote)
        .sort((a, b) => a.createdAt - b.createdAt),
      context: {
        owner: owner
          ? {
              displayName: owner.displayName ?? owner.name ?? owner.email ?? "Member",
              email: owner.email ?? null,
            }
          : null,
        assignedTo: assignedTo
          ? {
              _id: assignedTo._id,
              displayName:
                assignedTo.displayName ?? assignedTo.name ?? assignedTo.email ?? "Staff",
            }
          : null,
        currentSubscription: {
          status: currentSubscription?.status ?? "none",
          renewalAt: currentSubscription?.currentPeriodEnd ?? null,
        },
        snapshot: {
          subscription: ticket.subscriptionSnapshot,
          account: ticket.accountSnapshot,
        },
      },
    };
  },
});

export const staffTicketQueue = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) {
      return { ok: false, message: "Authentication required.", items: [] as any[] };
    }
    try {
      assertTicketStaffAccess(viewer.tier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Ticket access denied.",
        items: [] as any[],
      };
    }
    const tickets = await ctx.db.query("tickets").collect();
    const enriched = await Promise.all(
      tickets
        .filter((ticket) => ticket.visibleToStaff)
        .sort((a, b) => b.latestReplyAt - a.latestReplyAt)
        .map(async (ticket) => {
          const owner = await ctx.db.get(ticket.userId);
          const assigned = ticket.assignedToUserId
            ? await ctx.db.get(ticket.assignedToUserId)
            : null;
          return {
            ...ticket,
            ownerDisplayName: owner?.displayName ?? owner?.name ?? owner?.email ?? "Member",
            ownerEmail: owner?.email ?? null,
            assignedDisplayName:
              assigned?.displayName ?? assigned?.name ?? assigned?.email ?? null,
          };
        }),
    );
    return { ok: true, message: null, items: enriched };
  },
});

export const staffTicketDetail = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) {
      return { ok: false, message: "Authentication required.", ticket: null };
    }
    try {
      assertTicketStaffAccess(viewer.tier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Ticket access denied.",
        ticket: null,
      };
    }
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || !ticket.visibleToStaff) {
      return { ok: false, message: "Ticket not found.", ticket: null };
    }
    const replies = await ctx.db
      .query("ticketReplies")
      .withIndex("ticketId", (q) => q.eq("ticketId", ticket._id))
      .collect();
    const owner = await ctx.db.get(ticket.userId);
    const assignedTo = ticket.assignedToUserId
      ? await ctx.db.get(ticket.assignedToUserId)
      : null;
    const currentSubscription = await getLatestSubscriptionForUser(ctx, ticket.userId);
    const activeDeviceCount = await getActiveDeviceCount(ctx, ticket.userId);
    const assignableStaff = (
      await ctx.db
        .query("users")
        .withIndex("role", (q) => q.eq("role", "supportStaff"))
        .collect()
    )
      .concat(
        await ctx.db
          .query("users")
          .withIndex("role", (q) => q.eq("role", "admin"))
          .collect(),
      )
      .map((staff) => ({
        _id: staff._id,
        displayName: staff.displayName ?? staff.name ?? staff.email ?? "Staff",
        role: staff.role ?? "supportStaff",
      }));
    return {
      ok: true,
      message: null,
      ticket,
      replies: replies.sort((a, b) => a.createdAt - b.createdAt),
      context: {
        owner: owner
          ? {
              _id: owner._id,
              displayName: owner.displayName ?? owner.name ?? owner.email ?? "Member",
              email: owner.email ?? null,
              accountState: owner.accountState ?? "active",
              role: owner.role ?? "registered",
            }
          : null,
        assignedTo: assignedTo
          ? {
              _id: assignedTo._id,
              displayName:
                assignedTo.displayName ?? assignedTo.name ?? assignedTo.email ?? "Staff",
            }
          : null,
        currentSubscription: {
          status: currentSubscription?.status ?? "none",
          renewalAt: currentSubscription?.currentPeriodEnd ?? null,
        },
        activeDeviceCount,
        snapshot: {
          subscription: ticket.subscriptionSnapshot,
          account: ticket.accountSnapshot,
        },
        assignableStaff,
      },
    };
  },
});

export const createTicket = mutation({
  args: {
    subject: v.string(),
    body: v.string(),
    category: v.union(
      v.literal("general"),
      v.literal("technical"),
      v.literal("billing"),
      v.literal("account"),
    ),
    priority: v.union(v.literal("normal"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) {
      throw new Error("Authentication required.");
    }
    assertTicketCreationAccess(viewer.tier);
    const subject = trimText(args.subject, 120);
    const body = args.body.trim();
    if (subject.length < 6) {
      throw new Error("Subject must be at least 6 characters.");
    }
    if (body.length < 20) {
      throw new Error("Message must be at least 20 characters.");
    }
    const activeDeviceCount = await getActiveDeviceCount(ctx, viewer.userId);
    const now = Date.now();
    const ticketId = await ctx.db.insert("tickets", {
      userId: viewer.userId,
      createdByUserId: viewer.userId,
      subject,
      status: "open",
      priority: args.priority,
      category: args.category,
      latestReplyAt: now,
      latestReplyByUserId: viewer.userId,
      visibleToUser: true,
      visibleToStaff: true,
      subscriptionSnapshot: {
        status: viewer.subscription?.status ?? "none",
        accessTier: viewer.tier,
        renewalAt: viewer.subscription?.currentPeriodEnd,
      },
      accountSnapshot: {
        accountState: viewer.user.accountState ?? "active",
        role: viewer.user.role ?? "registered",
        activeDeviceCount,
      },
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("ticketReplies", {
      ticketId,
      authorUserId: viewer.userId,
      authorRole: normalizeTicketActorRole(viewer.tier),
      body,
      isInternalNote: false,
      createdAt: now,
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "user",
      action: "ticket.created",
      targetTable: "tickets",
      targetId: ticketId,
      metadata: {
        category: args.category,
        priority: args.priority,
      },
    });
    return ticketId;
  },
});

export const addTicketReply = mutation({
  args: {
    ticketId: v.id("tickets"),
    body: v.string(),
    isInternalNote: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) {
      throw new Error("Authentication required.");
    }
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found.");
    }
    const isStaff = viewer.tier === "supportStaff" || viewer.tier === "admin";
    if (isStaff) {
      assertTicketStaffAccess(viewer.tier);
    } else {
      assertTicketViewAccess({
        tier: viewer.tier,
        viewerUserId: viewer.userId,
        ticketOwnerUserId: ticket.userId,
      });
    }
    if (ticket.status === "closed") {
      throw new Error("Closed tickets must be reopened before replying.");
    }
    const body = args.body.trim();
    if (body.length < 2) {
      throw new Error("Reply cannot be empty.");
    }
    const isInternalNote = Boolean(args.isInternalNote);
    if (isInternalNote && !isStaff) {
      throw new Error("Internal notes are staff-only.");
    }
    const now = Date.now();
    await ctx.db.insert("ticketReplies", {
      ticketId: ticket._id,
      authorUserId: viewer.userId,
      authorRole: normalizeTicketActorRole(viewer.tier),
      body,
      isInternalNote,
      createdAt: now,
    });
    const status = isInternalNote
      ? ticket.status
      : isStaff
        ? "userWaiting"
        : "staffWaiting";
    await ctx.db.patch(ticket._id, {
      status,
      latestReplyAt: now,
      latestReplyByUserId: viewer.userId,
      updatedAt: now,
      closedAt: undefined,
      closedByUserId: undefined,
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: isStaff ? "staff" : "user",
      action: isInternalNote ? "ticket.internalNoteAdded" : "ticket.replyAdded",
      targetTable: "tickets",
      targetId: ticket._id,
      metadata: { isInternalNote },
    });
  },
});

export const closeTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) {
      throw new Error("Authentication required.");
    }
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found.");
    }
    const isStaff = viewer.tier === "supportStaff" || viewer.tier === "admin";
    if (!isStaff) {
      assertTicketViewAccess({
        tier: viewer.tier,
        viewerUserId: viewer.userId,
        ticketOwnerUserId: ticket.userId,
      });
    }
    const now = Date.now();
    await ctx.db.patch(ticket._id, {
      status: "closed",
      closedAt: now,
      closedByUserId: viewer.userId,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: isStaff ? "staff" : "user",
      action: "ticket.closed",
      targetTable: "tickets",
      targetId: ticket._id,
    });
  },
});

export const reopenTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) {
      throw new Error("Authentication required.");
    }
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found.");
    }
    const isStaff = viewer.tier === "supportStaff" || viewer.tier === "admin";
    if (!isStaff) {
      assertTicketViewAccess({
        tier: viewer.tier,
        viewerUserId: viewer.userId,
        ticketOwnerUserId: ticket.userId,
      });
    }
    const now = Date.now();
    await ctx.db.patch(ticket._id, {
      status: "open",
      reopenedAt: now,
      closedAt: undefined,
      closedByUserId: undefined,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: isStaff ? "staff" : "user",
      action: "ticket.reopened",
      targetTable: "tickets",
      targetId: ticket._id,
    });
  },
});

export const assignTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
    assignedToUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) {
      throw new Error("Authentication required.");
    }
    assertTicketStaffAccess(viewer.tier);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found.");
    }
    if (args.assignedToUserId) {
      const assignee = await ctx.db.get(args.assignedToUserId);
      if (!assignee || (assignee.role !== "supportStaff" && assignee.role !== "admin")) {
        throw new Error("Assignee must be support staff or admin.");
      }
    }
    await ctx.db.patch(ticket._id, {
      assignedToUserId: args.assignedToUserId,
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: "ticket.assigned",
      targetTable: "tickets",
      targetId: ticket._id,
      metadata: { assignedToUserId: args.assignedToUserId ?? null },
    });
  },
});

export const staffSetTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal("open"),
      v.literal("staffWaiting"),
      v.literal("userWaiting"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) {
      throw new Error("Authentication required.");
    }
    assertTicketStaffAccess(viewer.tier);
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found.");
    }
    const patch: Record<string, any> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.status === "closed") {
      patch.closedAt = Date.now();
      patch.closedByUserId = viewer.userId;
    } else {
      patch.closedAt = undefined;
      patch.closedByUserId = undefined;
    }
    await ctx.db.patch(ticket._id, patch);
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: "ticket.statusUpdated",
      targetTable: "tickets",
      targetId: ticket._id,
      metadata: { status: args.status },
    });
  },
});
