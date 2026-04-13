import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import {
  assertTicketCreationAccess,
  assertTicketStaffAccess,
  assertTicketViewAccess,
  getAccessTierFromState,
} from "./rbac";
import { getLatestSubscriptionForUser } from "./subscriptions";
import {
  buildCommunityTicketPath,
  mapDepartmentToLegacyTicketCategory,
  mapLegacyTicketCategoryToDepartment,
  supportStateKey,
} from "../shared/support";

const ticketStatusValidator = v.union(
  v.literal("open"),
  v.literal("staffWaiting"),
  v.literal("userWaiting"),
  v.literal("resolved"),
  v.literal("closed"),
);

const ticketPriorityValidator = v.union(v.literal("normal"), v.literal("high"));

const ticketDepartmentValidator = v.union(
  v.literal("technicalQuestions"),
  v.literal("accountRecovery"),
  v.literal("emailChange"),
  v.literal("unbanRequest"),
  v.literal("other"),
);

const requesterTypeValidator = v.union(v.literal("user"), v.literal("guest"));

const ticketBodyFormatValidator = v.union(
  v.literal("plainText"),
  v.literal("richText"),
);

function trimText(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function normalizeTicketActorRole(tier: string) {
  if (tier === "activeSubscriber") return "activeSubscriber" as const;
  if (tier === "expiredSubscriber") return "expiredSubscriber" as const;
  if (tier === "supportStaff") return "supportStaff" as const;
  if (tier === "admin") return "admin" as const;
  if (tier === "moderator") return "moderator" as const;
  return "registered" as const;
}

function getTicketDepartment(ticket: {
  department?: string | null;
  category?: "general" | "technical" | "billing" | "account";
}) {
  if (
    ticket.department === "technicalQuestions" ||
    ticket.department === "accountRecovery" ||
    ticket.department === "emailChange" ||
    ticket.department === "unbanRequest" ||
    ticket.department === "other"
  ) {
    return ticket.department;
  }

  return mapLegacyTicketCategoryToDepartment(ticket.category ?? "general");
}

function formatReplyBody(reply: {
  body: string;
  bodyHtml?: string | null;
  bodyFormat?: string | null;
}) {
  return {
    body: reply.body,
    bodyHtml: reply.bodyHtml ?? null,
    bodyFormat: reply.bodyFormat ?? "plainText",
  };
}

async function getViewerState(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;

  const user = await ctx.db.get(userId);
  if (!user) return null;

  const subscription = await getLatestSubscriptionForUser(ctx, userId);
  const tier = getAccessTierFromState({
    role: user.role ?? "registered",
    accountState: user.accountState ?? "active",
    subscriptionStatus: subscription?.status ?? "none",
  });

  return { userId, user, subscription, tier };
}

async function getActiveDeviceCount(ctx: any, userId: Id<"users">) {
  const devices = await ctx.db
    .query("launcherDevices")
    .withIndex("userId", (q: any) => q.eq("userId", userId))
    .collect();

  return devices.filter((device: any) => device.status === "active").length;
}

export const getActiveDeviceCountInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => getActiveDeviceCount(ctx, args.userId),
});

async function getSupportState(ctx: any) {
  return ctx.db
    .query("supportState")
    .withIndex("by_key", (q: any) => q.eq("key", supportStateKey))
    .unique();
}

async function ensureSupportState(ctx: any) {
  const existing = await getSupportState(ctx);
  if (existing) return existing;

  const stateId = await ctx.db.insert("supportState", {
    key: supportStateKey,
    nextPublicTicketNumber: 1,
  });
  const created = await ctx.db.get(stateId);
  if (!created) {
    throw new Error("Unable to initialize support state.");
  }
  return created;
}

async function allocatePublicTicketNumber(ctx: any) {
  const state = await ensureSupportState(ctx);
  const nextNumber = state.nextPublicTicketNumber;
  await ctx.db.patch(state._id, {
    nextPublicTicketNumber: nextNumber + 1,
  });
  return nextNumber;
}

async function getUserTicketByPublicNumber(ctx: any, ticketNumber: number) {
  return ctx.db
    .query("tickets")
    .withIndex("publicTicketNumber", (q: any) =>
      q.eq("publicTicketNumber", ticketNumber),
    )
    .unique();
}

async function getGuestTicketByPublicNumber(ctx: any, ticketNumber: number) {
  return ctx.db
    .query("guestTickets")
    .withIndex("publicTicketNumber", (q: any) =>
      q.eq("publicTicketNumber", ticketNumber),
    )
    .unique();
}

export const getUserTicketByPublicNumberInternal = internalQuery({
  args: { ticketNumber: v.number() },
  handler: async (ctx, args) => getUserTicketByPublicNumber(ctx, args.ticketNumber),
});

export const getGuestTicketByPublicNumberInternal = internalQuery({
  args: { ticketNumber: v.number() },
  handler: async (ctx, args) => getGuestTicketByPublicNumber(ctx, args.ticketNumber),
});

async function getAssignableStaff(ctx: any) {
  const supportStaff = await ctx.db
    .query("users")
    .withIndex("role", (q: any) => q.eq("role", "supportStaff"))
    .collect();
  const admins = await ctx.db
    .query("users")
    .withIndex("role", (q: any) => q.eq("role", "admin"))
    .collect();

  return supportStaff.concat(admins).map((staff: any) => ({
    _id: staff._id,
    displayName: staff.displayName ?? staff.name ?? staff.email ?? "Staff",
    role: staff.role ?? "supportStaff",
  }));
}

export const resolveViewerLegacyTicketPath = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) return null;

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || !ticket.visibleToUser || typeof ticket.publicTicketNumber !== "number") {
      return null;
    }

    try {
      assertTicketViewAccess({
        tier: viewer.tier,
        viewerUserId: viewer.userId,
        ticketOwnerUserId: ticket.userId,
      });
    } catch {
      return null;
    }

    return buildCommunityTicketPath(ticket.publicTicketNumber);
  },
});

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
      .withIndex("userId", (q: any) => q.eq("userId", viewer.userId))
      .collect();

    return {
      ok: true,
      message: null,
      items: tickets
        .filter((ticket: any) => ticket.visibleToUser)
        .sort((a: any, b: any) => b.latestReplyAt - a.latestReplyAt)
        .map((ticket: any) => ({
          _id: ticket._id,
          requesterType: "user" as const,
          publicTicketNumber: ticket.publicTicketNumber ?? null,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          department: getTicketDepartment(ticket),
          latestReplyAt: ticket.latestReplyAt,
          updatedAt: ticket.updatedAt,
          href:
            typeof ticket.publicTicketNumber === "number"
              ? buildCommunityTicketPath(ticket.publicTicketNumber)
              : null,
        })),
    };
  },
});

export const viewerTicketDetail = query({
  args: {
    ticketNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) {
      return { ok: false, message: "Authentication required.", ticket: null };
    }

    const ticket = await getUserTicketByPublicNumber(ctx, args.ticketNumber);
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
      .withIndex("ticketId", (q: any) => q.eq("ticketId", ticket._id))
      .collect();
    const currentSubscription = await getLatestSubscriptionForUser(
      ctx,
      ticket.userId,
    );
    const owner: any = await ctx.db.get(ticket.userId);
    const assignedTo: any = ticket.assignedToUserId
      ? await ctx.db.get(ticket.assignedToUserId)
      : null;

    return {
      ok: true,
      message: null,
      requesterType: "user" as const,
      ticket: {
        _id: ticket._id,
        publicTicketNumber: ticket.publicTicketNumber ?? null,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        department: getTicketDepartment(ticket),
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        latestReplyAt: ticket.latestReplyAt,
        assignedToUserId: ticket.assignedToUserId ?? null,
      },
      replies: replies
        .filter((reply: any) => !reply.isInternalNote)
        .sort((a: any, b: any) => a.createdAt - b.createdAt)
        .map((reply: any) => ({
          _id: reply._id,
          authorRole: reply.authorRole,
          isInternalNote: reply.isInternalNote,
          createdAt: reply.createdAt,
          ...formatReplyBody(reply),
        })),
      context: {
        owner: owner
          ? {
              displayName:
                owner.displayName ?? owner.name ?? owner.email ?? "Member",
              email: owner.email ?? null,
            }
          : null,
        assignedTo: assignedTo
          ? {
              _id: assignedTo._id,
              displayName:
                assignedTo.displayName ??
                assignedTo.name ??
                assignedTo.email ??
                "Staff",
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

    const userTickets = await ctx.db.query("tickets").collect();
    const guestTickets = await ctx.db.query("guestTickets").collect();

    const enrichedUserTickets = await Promise.all(
      userTickets
        .filter((ticket: any) => ticket.visibleToStaff)
        .map(async (ticket: any) => {
          const owner: any = await ctx.db.get(ticket.userId);
          const assigned: any = ticket.assignedToUserId
            ? await ctx.db.get(ticket.assignedToUserId)
            : null;

          return {
            requesterType: "user" as const,
            publicTicketNumber: ticket.publicTicketNumber ?? null,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            department: getTicketDepartment(ticket),
            latestReplyAt: ticket.latestReplyAt,
            ownerDisplayName:
              owner?.displayName ?? owner?.name ?? owner?.email ?? "Member",
            ownerEmail: owner?.email ?? null,
            assignedToUserId: ticket.assignedToUserId ?? null,
            assignedDisplayName:
              assigned?.displayName ?? assigned?.name ?? assigned?.email ?? null,
            adminHref:
              typeof ticket.publicTicketNumber === "number"
                ? `/admin/tickets/user/${ticket.publicTicketNumber}`
                : null,
          };
        }),
    );

    const enrichedGuestTickets = await Promise.all(
      guestTickets
        .filter((ticket: any) => ticket.visibleToStaff)
        .map(async (ticket: any) => {
          const assigned: any = ticket.assignedToUserId
            ? await ctx.db.get(ticket.assignedToUserId)
            : null;

          return {
            requesterType: "guest" as const,
            publicTicketNumber: ticket.publicTicketNumber,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            department: ticket.department,
            latestReplyAt: ticket.latestReplyAt,
            ownerDisplayName: ticket.guestName,
            ownerEmail: ticket.guestEmail,
            assignedToUserId: ticket.assignedToUserId ?? null,
            assignedDisplayName:
              assigned?.displayName ?? assigned?.name ?? assigned?.email ?? null,
            adminHref: `/admin/tickets/guest/${ticket.publicTicketNumber}`,
          };
        }),
    );

    return {
      ok: true,
      message: null,
      items: [...(enrichedUserTickets as any[]), ...(enrichedGuestTickets as any[])].sort(
        (a, b) => b.latestReplyAt - a.latestReplyAt,
      ),
    };
  },
});

export const staffTicketDetail = query({
  args: {
    requesterType: requesterTypeValidator,
    ticketNumber: v.number(),
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

    const assignableStaff = await getAssignableStaff(ctx);

    if (args.requesterType === "user") {
      const ticket = await getUserTicketByPublicNumber(ctx, args.ticketNumber);
      if (!ticket || !ticket.visibleToStaff) {
        return { ok: false, message: "Ticket not found.", ticket: null };
      }

      const replies = await ctx.db
        .query("ticketReplies")
        .withIndex("ticketId", (q: any) => q.eq("ticketId", ticket._id))
        .collect();
      const owner: any = await ctx.db.get(ticket.userId);
      const assignedTo: any = ticket.assignedToUserId
        ? await ctx.db.get(ticket.assignedToUserId)
        : null;
      const currentSubscription = await getLatestSubscriptionForUser(
        ctx,
        ticket.userId,
      );
      const activeDeviceCount = await getActiveDeviceCount(ctx, ticket.userId);

      return {
        ok: true,
        message: null,
        requesterType: "user" as const,
        ticket: {
          _id: ticket._id,
          publicTicketNumber: ticket.publicTicketNumber ?? null,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          department: getTicketDepartment(ticket),
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          latestReplyAt: ticket.latestReplyAt,
          assignedToUserId: ticket.assignedToUserId ?? null,
        },
        replies: replies
          .sort((a: any, b: any) => a.createdAt - b.createdAt)
          .map((reply: any) => ({
            _id: reply._id,
            authorRole: reply.authorRole,
            authorType:
              reply.authorRole === "supportStaff" || reply.authorRole === "admin"
                ? "staff"
                : "user",
            isInternalNote: reply.isInternalNote,
            createdAt: reply.createdAt,
            ...formatReplyBody(reply),
          })),
        context: {
          owner: owner
            ? {
                _id: owner._id,
                displayName:
                  owner.displayName ?? owner.name ?? owner.email ?? "Member",
                email: owner.email ?? null,
                accountState: owner.accountState ?? "active",
                role: owner.role ?? "registered",
              }
            : null,
          guest: null,
          assignedTo: assignedTo
            ? {
                _id: assignedTo._id,
                displayName:
                  assignedTo.displayName ??
                  assignedTo.name ??
                  assignedTo.email ??
                  "Staff",
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
    }

    const ticket = await getGuestTicketByPublicNumber(ctx, args.ticketNumber);
    if (!ticket || !ticket.visibleToStaff) {
      return { ok: false, message: "Ticket not found.", ticket: null };
    }

    const replies = await ctx.db
      .query("guestTicketReplies")
      .withIndex("guestTicketId", (q: any) => q.eq("guestTicketId", ticket._id))
      .collect();
    const assignedTo: any = ticket.assignedToUserId
      ? await ctx.db.get(ticket.assignedToUserId)
      : null;

    return {
      ok: true,
      message: null,
      requesterType: "guest" as const,
      ticket: {
        _id: ticket._id,
        publicTicketNumber: ticket.publicTicketNumber,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        department: ticket.department,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        latestReplyAt: ticket.latestReplyAt,
        assignedToUserId: ticket.assignedToUserId ?? null,
      },
      replies: replies
        .sort((a: any, b: any) => a.createdAt - b.createdAt)
        .map((reply: any) => ({
          _id: reply._id,
          authorRole: reply.authorType,
          authorType: reply.authorType === "guest" ? "guest" : "staff",
          isInternalNote: reply.isInternalNote,
          createdAt: reply.createdAt,
          ...formatReplyBody(reply),
        })),
      context: {
        owner: null,
        guest: {
          name: ticket.guestName,
          email: ticket.guestEmail,
        },
        assignedTo: assignedTo
          ? {
              _id: assignedTo._id,
              displayName:
                assignedTo.displayName ??
                assignedTo.name ??
                assignedTo.email ??
                "Staff",
            }
          : null,
        currentSubscription: null,
        activeDeviceCount: null,
        snapshot: null,
        assignableStaff,
      },
    };
  },
});

export const getGuestTicketForAccess = internalQuery({
  args: {
    ticketNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const ticket = await getGuestTicketByPublicNumber(ctx, args.ticketNumber);
    if (!ticket) {
      return null;
    }

    const replies = await ctx.db
      .query("guestTicketReplies")
      .withIndex("guestTicketId", (q: any) => q.eq("guestTicketId", ticket._id))
      .collect();

    return {
      ticket,
      replies: replies
        .filter((reply: any) => !reply.isInternalNote)
        .sort((a: any, b: any) => a.createdAt - b.createdAt)
        .map((reply: any) => ({
          _id: reply._id,
          authorType: reply.authorType,
          createdAt: reply.createdAt,
          ...formatReplyBody(reply),
        })),
    };
  },
});

export const createUserTicketInternal = internalMutation({
  args: {
    userId: v.id("users"),
    subject: v.string(),
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    bodyFormat: ticketBodyFormatValidator,
    department: ticketDepartmentValidator,
    priority: ticketPriorityValidator,
    tier: v.string(),
    subscriptionStatus: v.union(
      v.literal("none"),
      v.literal("pending"),
      v.literal("active"),
      v.literal("pastDue"),
      v.literal("expired"),
      v.literal("canceled"),
      v.literal("revoked"),
    ),
    renewalAt: v.optional(v.number()),
    accountState: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("banned"),
    ),
    role: v.union(
      v.literal("registered"),
      v.literal("moderator"),
      v.literal("supportStaff"),
      v.literal("admin"),
      v.literal("resellerOps"),
    ),
    activeDeviceCount: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const publicTicketNumber = await allocatePublicTicketNumber(ctx);
    const ticketId = await ctx.db.insert("tickets", {
      userId: args.userId,
      createdByUserId: args.userId,
      publicTicketNumber,
      subject: args.subject,
      status: "open",
      priority: args.priority,
      category: mapDepartmentToLegacyTicketCategory(args.department),
      department: args.department,
      latestReplyAt: now,
      latestReplyByUserId: args.userId,
      visibleToUser: true,
      visibleToStaff: true,
      subscriptionSnapshot: {
        status: args.subscriptionStatus,
        accessTier: args.tier as any,
        renewalAt: args.renewalAt,
      },
      accountSnapshot: {
        accountState: args.accountState,
        role: args.role,
        activeDeviceCount: args.activeDeviceCount,
      },
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("ticketReplies", {
      ticketId,
      authorUserId: args.userId,
      authorRole: normalizeTicketActorRole(args.tier),
      body: args.body,
      bodyHtml: args.bodyHtml,
      bodyFormat: args.bodyFormat,
      isInternalNote: false,
      createdAt: now,
    });

    await ctx.runMutation(internal.audit.record, {
      actorUserId: args.userId,
      actorType: "user",
      action: "ticket.created",
      targetTable: "tickets",
      targetId: ticketId,
      metadata: {
        department: args.department,
        priority: args.priority,
        publicTicketNumber,
      },
    });

    return { ticketId, publicTicketNumber };
  },
});

export const addUserTicketReplyInternal = internalMutation({
  args: {
    ticketNumber: v.number(),
    actorUserId: v.id("users"),
    actorTier: v.string(),
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    bodyFormat: ticketBodyFormatValidator,
    isInternalNote: v.boolean(),
  },
  handler: async (ctx, args) => {
    const ticket = await getUserTicketByPublicNumber(ctx, args.ticketNumber);
    if (!ticket) {
      throw new Error("Ticket not found.");
    }

    const isStaff = args.actorTier === "supportStaff" || args.actorTier === "admin";
    if (ticket.status === "closed") {
      throw new Error("Closed tickets must be reopened before replying.");
    }
    if (args.isInternalNote && !isStaff) {
      throw new Error("Internal notes are staff-only.");
    }

    const now = Date.now();
    await ctx.db.insert("ticketReplies", {
      ticketId: ticket._id,
      authorUserId: args.actorUserId,
      authorRole: normalizeTicketActorRole(args.actorTier),
      body: args.body,
      bodyHtml: args.bodyHtml,
      bodyFormat: args.bodyFormat,
      isInternalNote: args.isInternalNote,
      createdAt: now,
    });

    await ctx.db.patch(ticket._id, {
      status: args.isInternalNote
        ? ticket.status
        : isStaff
          ? "userWaiting"
          : "staffWaiting",
      latestReplyAt: now,
      latestReplyByUserId: args.actorUserId,
      updatedAt: now,
      closedAt: undefined,
      closedByUserId: undefined,
    });

    await ctx.runMutation(internal.audit.record, {
      actorUserId: args.actorUserId,
      actorType: isStaff ? "staff" : "user",
      action: args.isInternalNote ? "ticket.internalNoteAdded" : "ticket.replyAdded",
      targetTable: "tickets",
      targetId: ticket._id,
      metadata: { publicTicketNumber: args.ticketNumber, isInternalNote: args.isInternalNote },
    });

    return { ok: true };
  },
});

export const createGuestTicketInternal = internalMutation({
  args: {
    guestName: v.string(),
    guestEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    bodyFormat: ticketBodyFormatValidator,
    department: ticketDepartmentValidator,
    accessPasswordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const publicTicketNumber = await allocatePublicTicketNumber(ctx);
    const ticketId = await ctx.db.insert("guestTickets", {
      publicTicketNumber,
      guestName: args.guestName,
      guestEmail: args.guestEmail,
      subject: args.subject,
      department: args.department,
      priority: "normal",
      status: "open",
      latestReplyAt: now,
      latestReplyByType: "guest",
      accessPasswordHash: args.accessPasswordHash,
      visibleToStaff: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("guestTicketReplies", {
      guestTicketId: ticketId,
      authorType: "guest",
      body: args.body,
      bodyHtml: args.bodyHtml,
      bodyFormat: args.bodyFormat,
      isInternalNote: false,
      createdAt: now,
    });

    await ctx.runMutation(internal.audit.record, {
      actorType: "system",
      action: "guestTicket.created",
      targetTable: "guestTickets",
      targetId: ticketId,
      metadata: {
        department: args.department,
        publicTicketNumber,
        guestEmailPreview: `${args.guestEmail.slice(0, 3)}***`,
      },
    });

    return { ticketId, publicTicketNumber };
  },
});

export const addGuestTicketReplyInternal = internalMutation({
  args: {
    ticketNumber: v.number(),
    actorType: v.union(v.literal("guest"), v.literal("supportStaff"), v.literal("admin")),
    actorUserId: v.optional(v.id("users")),
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    bodyFormat: ticketBodyFormatValidator,
    isInternalNote: v.boolean(),
  },
  handler: async (ctx, args) => {
    const ticket = await getGuestTicketByPublicNumber(ctx, args.ticketNumber);
    if (!ticket) {
      throw new Error("Ticket not found.");
    }

    const isStaff = args.actorType === "supportStaff" || args.actorType === "admin";
    if (ticket.status === "closed") {
      throw new Error("Closed tickets must be reopened before replying.");
    }
    if (args.isInternalNote && !isStaff) {
      throw new Error("Internal notes are staff-only.");
    }

    const now = Date.now();
    await ctx.db.insert("guestTicketReplies", {
      guestTicketId: ticket._id,
      authorType: args.actorType,
      authorUserId: args.actorUserId,
      body: args.body,
      bodyHtml: args.bodyHtml,
      bodyFormat: args.bodyFormat,
      isInternalNote: args.isInternalNote,
      createdAt: now,
    });

    await ctx.db.patch(ticket._id, {
      status: args.isInternalNote
        ? ticket.status
        : isStaff
          ? "userWaiting"
          : "staffWaiting",
      latestReplyAt: now,
      latestReplyByType: isStaff ? "staff" : "guest",
      latestReplyByUserId: args.actorUserId,
      updatedAt: now,
      closedAt: undefined,
      closedByUserId: undefined,
    });

    await ctx.runMutation(internal.audit.record, {
      actorUserId: args.actorUserId,
      actorType: isStaff ? "staff" : "system",
      action: args.isInternalNote ? "guestTicket.internalNoteAdded" : "guestTicket.replyAdded",
      targetTable: "guestTickets",
      targetId: ticket._id,
      metadata: { publicTicketNumber: args.ticketNumber, isInternalNote: args.isInternalNote },
    });

    return { ok: true };
  },
});

export const closeViewerTicket = mutation({
  args: { ticketNumber: v.number() },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) throw new Error("Authentication required.");

    const ticket = await getUserTicketByPublicNumber(ctx, args.ticketNumber);
    if (!ticket) throw new Error("Ticket not found.");

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
  },
});

export const reopenViewerTicket = mutation({
  args: { ticketNumber: v.number() },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) throw new Error("Authentication required.");

    const ticket = await getUserTicketByPublicNumber(ctx, args.ticketNumber);
    if (!ticket) throw new Error("Ticket not found.");

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
  },
});

export const assignTicket = mutation({
  args: {
    requesterType: requesterTypeValidator,
    ticketNumber: v.number(),
    assignedToUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) throw new Error("Authentication required.");
    assertTicketStaffAccess(viewer.tier);

    if (args.assignedToUserId) {
      const assignee = await ctx.db.get(args.assignedToUserId);
      if (!assignee || (assignee.role !== "supportStaff" && assignee.role !== "admin")) {
        throw new Error("Assignee must be support staff or admin.");
      }
    }

    const tableName = args.requesterType === "user" ? "tickets" : "guestTickets";
    const ticket =
      args.requesterType === "user"
        ? await getUserTicketByPublicNumber(ctx, args.ticketNumber)
        : await getGuestTicketByPublicNumber(ctx, args.ticketNumber);

    if (!ticket) throw new Error("Ticket not found.");

    await ctx.db.patch(ticket._id, {
      assignedToUserId: args.assignedToUserId,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: `${args.requesterType === "user" ? "ticket" : "guestTicket"}.assigned`,
      targetTable: tableName,
      targetId: ticket._id,
      metadata: {
        publicTicketNumber: args.ticketNumber,
        assignedToUserId: args.assignedToUserId ?? null,
      },
    });
  },
});

export const staffSetTicketStatus = mutation({
  args: {
    requesterType: requesterTypeValidator,
    ticketNumber: v.number(),
    status: ticketStatusValidator,
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerState(ctx);
    if (!viewer) throw new Error("Authentication required.");
    assertTicketStaffAccess(viewer.tier);

    const tableName = args.requesterType === "user" ? "tickets" : "guestTickets";
    const ticket =
      args.requesterType === "user"
        ? await getUserTicketByPublicNumber(ctx, args.ticketNumber)
        : await getGuestTicketByPublicNumber(ctx, args.ticketNumber);

    if (!ticket) throw new Error("Ticket not found.");

    const patch: Record<string, any> = {
      status: args.status,
      updatedAt: Date.now(),
      closedAt: args.status === "closed" ? Date.now() : undefined,
      closedByUserId: args.status === "closed" ? viewer.userId : undefined,
    };

    await ctx.db.patch(ticket._id, patch);
    await ctx.runMutation(internal.audit.record, {
      actorUserId: viewer.userId,
      actorType: "staff",
      action: `${args.requesterType === "user" ? "ticket" : "guestTicket"}.statusUpdated`,
      targetTable: tableName,
      targetId: ticket._id,
      metadata: { publicTicketNumber: args.ticketNumber, status: args.status },
    });
  },
});

export const backfillPublicTicketNumbers = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerState(ctx);
    if (!viewer || viewer.tier !== "admin") {
      throw new Error("Admin only.");
    }

    const userTickets = await ctx.db.query("tickets").collect();
    const guestTickets = await ctx.db.query("guestTickets").collect();
    const state = await ensureSupportState(ctx);
    let nextNumber = state.nextPublicTicketNumber;

    for (const ticket of userTickets) {
      if (typeof ticket.publicTicketNumber === "number" && ticket.publicTicketNumber >= nextNumber) {
        nextNumber = ticket.publicTicketNumber + 1;
      }
    }
    for (const ticket of guestTickets) {
      if (ticket.publicTicketNumber >= nextNumber) {
        nextNumber = ticket.publicTicketNumber + 1;
      }
    }

    let assignedCount = 0;
    for (const ticket of [...userTickets].sort((a, b) => a.createdAt - b.createdAt)) {
      if (typeof ticket.publicTicketNumber === "number") continue;
      await ctx.db.patch(ticket._id, { publicTicketNumber: nextNumber });
      nextNumber += 1;
      assignedCount += 1;
    }

    await ctx.db.patch(state._id, {
      nextPublicTicketNumber: nextNumber,
      backfillCompletedAt: Date.now(),
    });

    return { ok: true, assignedCount };
  },
});
