"use node";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getAuthUserId } from "@convex-dev/auth/server";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  assertTicketCreationAccess,
  assertTicketStaffAccess,
  assertTicketViewAccess,
  getAccessTierFromState,
} from "./rbac";
import { buildCommunityTicketPath } from "../shared/support";

const guestTicketPasswordAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeCompareHash(input: string, expectedHash: string) {
  const left = Buffer.from(hashValue(input), "hex");
  const right = Buffer.from(expectedHash, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function generateGuestTicketPassword(length = 8) {
  let output = "";
  while (output.length < length) {
    const bytes = randomBytes(length);
    for (const byte of bytes) {
      output += guestTicketPasswordAlphabet[byte % guestTicketPasswordAlphabet.length];
      if (output.length === length) {
        break;
      }
    }
  }
  return output;
}

function getActionErrorMessage(cause: unknown, fallback: string) {
  if (cause instanceof z.ZodError) {
    return "Enter a valid email address.";
  }

  if (cause instanceof Error && cause.message) {
    return cause.message;
  }

  return fallback;
}

function sanitizeTicketHtml(input: string) {
  const cleaned = sanitizeHtml(input, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "span",
      "div",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "a",
      "font",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["style"],
      div: ["style"],
      p: ["style"],
      font: ["size", "color"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName: string, attribs: Record<string, string>) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      }),
    },
    allowedStyles: {
      p: {
        "text-align": [/^(left|center|right)$/],
        color: [/^#[0-9a-fA-F]{3,8}$/],
        "font-size": [/^\d+(px|rem|em|%)$/],
      },
      div: {
        "text-align": [/^(left|center|right)$/],
        color: [/^#[0-9a-fA-F]{3,8}$/],
        "font-size": [/^\d+(px|rem|em|%)$/],
      },
      span: {
        color: [/^#[0-9a-fA-F]{3,8}$/],
        "font-size": [/^\d+(px|rem|em|%)$/],
      },
    },
  }).trim();

  const plainText = sanitizeHtml(cleaned, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();

  return {
    bodyHtml: cleaned,
    body: plainText,
    bodyFormat: "richText" as const,
  };
}

async function getViewerSupportActor(ctx: any): Promise<any> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required.");
  }

  const user: any = await ctx.runQuery(internal.usersInternal.getById, { userId });
  const subscription: any = await ctx.runQuery(internal.usersInternal.getLatestSubscription, {
    userId,
  });
  const activeDeviceCount: number = await ctx.runQuery(
    internal.communitySupport.getActiveDeviceCountInternal,
    { userId },
  );

  if (!user) {
    throw new Error("User not found.");
  }

  const tier = getAccessTierFromState({
    role: user.role ?? "registered",
    accountState: user.accountState ?? "active",
    subscriptionStatus: subscription?.status ?? "none",
  });

  return {
    userId,
    user,
    subscription,
    activeDeviceCount,
    tier,
  };
}

export const submitViewerTicket = action({
  args: {
    subject: v.string(),
    bodyHtml: v.string(),
    department: v.union(
      v.literal("technicalQuestions"),
      v.literal("accountRecovery"),
      v.literal("emailChange"),
      v.literal("unbanRequest"),
      v.literal("other"),
    ),
    priority: v.union(v.literal("normal"), v.literal("high")),
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      const viewer: any = await getViewerSupportActor(ctx);
      assertTicketCreationAccess(viewer.tier);

      const subject = args.subject.trim().replace(/\s+/g, " ").slice(0, 120);
      const body = sanitizeTicketHtml(args.bodyHtml);

      if (subject.length < 6) {
        throw new Error("Subject must be at least 6 characters.");
      }
      if (body.body.length < 20) {
        throw new Error("Message must be at least 20 characters.");
      }

      const created: any = await ctx.runMutation(
        internal.communitySupport.createUserTicketInternal,
        {
          userId: viewer.userId,
          subject,
          body: body.body,
          bodyHtml: body.bodyHtml,
          bodyFormat: body.bodyFormat,
          department: args.department,
          priority: args.priority,
          tier: viewer.tier,
          subscriptionStatus: viewer.subscription?.status ?? "none",
          renewalAt: viewer.subscription?.currentPeriodEnd,
          accountState: viewer.user.accountState ?? "active",
          role: viewer.user.role ?? "registered",
          activeDeviceCount: viewer.activeDeviceCount,
        },
      );

      return {
        ok: true,
        publicTicketNumber: created.publicTicketNumber,
        href: buildCommunityTicketPath(created.publicTicketNumber),
      };
    } catch (cause) {
      return {
        ok: false,
        message: getActionErrorMessage(cause, "Unable to create ticket."),
      };
    }
  },
});

export const submitGuestTicket = action({
  args: {
    guestName: v.string(),
    guestEmail: v.string(),
    subject: v.string(),
    bodyHtml: v.string(),
    department: v.union(
      v.literal("technicalQuestions"),
      v.literal("accountRecovery"),
      v.literal("emailChange"),
      v.literal("unbanRequest"),
      v.literal("other"),
    ),
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      const email = z.string().email().parse(args.guestEmail.trim().toLowerCase());
      const guestName = args.guestName.trim().replace(/\s+/g, " ").slice(0, 80);
      const subject = args.subject.trim().replace(/\s+/g, " ").slice(0, 120);
      const body = sanitizeTicketHtml(args.bodyHtml);

      if (guestName.length < 2) {
        throw new Error("Name must be at least 2 characters.");
      }
      if (subject.length < 6) {
        throw new Error("Title must be at least 6 characters.");
      }
      if (body.body.length < 20) {
        throw new Error("Message must be at least 20 characters.");
      }

      const password = generateGuestTicketPassword();
      const created: any = await ctx.runMutation(
        internal.communitySupport.createGuestTicketInternal,
        {
          guestName,
          guestEmail: email,
          subject,
          body: body.body,
          bodyHtml: body.bodyHtml,
          bodyFormat: body.bodyFormat,
          department: args.department,
          accessPasswordHash: hashValue(password),
        },
      );

      return {
        ok: true,
        publicTicketNumber: created.publicTicketNumber,
        ticketPassword: password,
        href: buildCommunityTicketPath(created.publicTicketNumber),
      };
    } catch (cause) {
      return {
        ok: false,
        message: getActionErrorMessage(cause, "Unable to create guest ticket."),
      };
    }
  },
});

export const readGuestTicket = action({
  args: {
    ticketNumber: v.number(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      const result: any = await ctx.runQuery(internal.communitySupport.getGuestTicketForAccess, {
        ticketNumber: args.ticketNumber,
      });
      if (!result) {
        throw new Error("Ticket not found.");
      }
      if (!safeCompareHash(args.password.trim().toUpperCase(), result.ticket.accessPasswordHash)) {
        throw new Error("Invalid ticket password.");
      }

      return {
        ok: true,
        requesterType: "guest" as const,
        ticket: {
          publicTicketNumber: result.ticket.publicTicketNumber,
          subject: result.ticket.subject,
          status: result.ticket.status,
          priority: result.ticket.priority,
          department: result.ticket.department,
          createdAt: result.ticket.createdAt,
          updatedAt: result.ticket.updatedAt,
          latestReplyAt: result.ticket.latestReplyAt,
        },
        guest: {
          name: result.ticket.guestName,
          email: result.ticket.guestEmail,
        },
        replies: result.replies,
      };
    } catch (cause) {
      return {
        ok: false,
        message: getActionErrorMessage(cause, "Unable to unlock ticket."),
      };
    }
  },
});

export const submitViewerTicketReply = action({
  args: {
    ticketNumber: v.number(),
    bodyHtml: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      const viewer: any = await getViewerSupportActor(ctx);
      const ticket: any = await ctx.runQuery(
        internal.communitySupport.getUserTicketByPublicNumberInternal,
        { ticketNumber: args.ticketNumber },
      );
      if (!ticket) {
        throw new Error("Ticket not found.");
      }

      assertTicketViewAccess({
        tier: viewer.tier,
        viewerUserId: viewer.userId,
        ticketOwnerUserId: ticket.userId,
      });

      const body = sanitizeTicketHtml(args.bodyHtml);
      if (body.body.length < 2) {
        throw new Error("Reply cannot be empty.");
      }

      await ctx.runMutation(internal.communitySupport.addUserTicketReplyInternal, {
        ticketNumber: args.ticketNumber,
        actorUserId: viewer.userId,
        actorTier: viewer.tier,
        body: body.body,
        bodyHtml: body.bodyHtml,
        bodyFormat: body.bodyFormat,
        isInternalNote: false,
      });

      return { ok: true };
    } catch (cause) {
      return {
        ok: false,
        message: getActionErrorMessage(cause, "Unable to send reply."),
      };
    }
  },
});

export const submitGuestTicketReply = action({
  args: {
    ticketNumber: v.number(),
    password: v.string(),
    bodyHtml: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      const ticket: any = await ctx.runQuery(
        internal.communitySupport.getGuestTicketByPublicNumberInternal,
        { ticketNumber: args.ticketNumber },
      );
      if (!ticket) {
        throw new Error("Ticket not found.");
      }
      if (!safeCompareHash(args.password.trim().toUpperCase(), ticket.accessPasswordHash)) {
        throw new Error("Invalid ticket password.");
      }

      const body = sanitizeTicketHtml(args.bodyHtml);
      if (body.body.length < 2) {
        throw new Error("Reply cannot be empty.");
      }

      await ctx.runMutation(internal.communitySupport.addGuestTicketReplyInternal, {
        ticketNumber: args.ticketNumber,
        actorType: "guest",
        body: body.body,
        bodyHtml: body.bodyHtml,
        bodyFormat: body.bodyFormat,
        isInternalNote: false,
      });

      return { ok: true };
    } catch (cause) {
      return {
        ok: false,
        message: getActionErrorMessage(cause, "Unable to send reply."),
      };
    }
  },
});

export const submitStaffTicketReply = action({
  args: {
    requesterType: v.union(v.literal("user"), v.literal("guest")),
    ticketNumber: v.number(),
    bodyHtml: v.string(),
    isInternalNote: v.boolean(),
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      const viewer: any = await getViewerSupportActor(ctx);
      assertTicketStaffAccess(viewer.tier);

      const body = sanitizeTicketHtml(args.bodyHtml);
      if (body.body.length < 2) {
        throw new Error("Reply cannot be empty.");
      }

      if (args.requesterType === "user") {
        await ctx.runMutation(internal.communitySupport.addUserTicketReplyInternal, {
          ticketNumber: args.ticketNumber,
          actorUserId: viewer.userId,
          actorTier: viewer.tier,
          body: body.body,
          bodyHtml: body.bodyHtml,
          bodyFormat: body.bodyFormat,
          isInternalNote: args.isInternalNote,
        });
        return { ok: true };
      }

      await ctx.runMutation(internal.communitySupport.addGuestTicketReplyInternal, {
        ticketNumber: args.ticketNumber,
        actorType: viewer.tier === "admin" ? "admin" : "supportStaff",
        actorUserId: viewer.userId,
        body: body.body,
        bodyHtml: body.bodyHtml,
        bodyFormat: body.bodyFormat,
        isInternalNote: args.isInternalNote,
      });

      return { ok: true };
    } catch (cause) {
      return {
        ok: false,
        message: getActionErrorMessage(cause, "Unable to send reply."),
      };
    }
  },
});
