import {
  type AccessTier,
  resolveAccessTier,
} from "../shared/auth";
import {
  canCreateForumThread,
  canReplyInForumThread,
  canViewForumCategory,
  type ForumCategoryPosting,
  type ForumCategoryVisibility,
} from "../shared/forum";

export function getAccessTierFromState(input: {
  role?: "registered" | "moderator" | "supportStaff" | "admin" | "resellerOps" | null;
  accountState?: "active" | "suspended" | "banned" | null;
  subscriptionStatus?:
    | "none"
    | "pending"
    | "active"
    | "pastDue"
    | "expired"
    | "canceled"
    | "revoked"
    | null;
}): AccessTier {
  return resolveAccessTier(input);
}

export function assertPaidDownloadAccess(tier: AccessTier) {
  if (tier !== "activeSubscriber") {
    throw new Error("Active subscription required.");
  }
}

export function assertAdminLookupAccess(tier: AccessTier) {
  if (tier !== "admin" && tier !== "supportStaff") {
    throw new Error("Admin lookup access denied.");
  }
}

export function assertAuthenticatedAccountAccess(tier: AccessTier) {
  if (tier === "guest") {
    throw new Error("Authentication required.");
  }
  if (tier === "banned") {
    throw new Error("Restricted accounts must use the appeal contact path.");
  }
}

export function assertTicketCreationAccess(tier: AccessTier) {
  assertAuthenticatedAccountAccess(tier);
  if (tier === "resellerOps") {
    throw new Error("This account cannot use the ticket system.");
  }
}

export function assertTicketViewAccess(input: {
  tier: AccessTier;
  viewerUserId: string;
  ticketOwnerUserId: string;
}) {
  if (input.tier === "supportStaff" || input.tier === "admin") {
    return;
  }
  assertAuthenticatedAccountAccess(input.tier);
  if (input.tier === "resellerOps") {
    throw new Error("Ticket access denied.");
  }
  if (input.viewerUserId !== input.ticketOwnerUserId) {
    throw new Error("Ticket access denied.");
  }
}

export function assertTicketStaffAccess(tier: AccessTier) {
  if (tier !== "supportStaff" && tier !== "admin") {
    throw new Error("Staff ticket access denied.");
  }
}

export function assertForumCategoryManageAccess(tier: AccessTier) {
  if (tier !== "admin") {
    throw new Error("Forum category management access denied.");
  }
}

export function assertForumModerationAccess(tier: AccessTier) {
  if (tier !== "moderator" && tier !== "admin") {
    throw new Error("Forum moderation access denied.");
  }
}

export function assertAdminContentAccess(tier: AccessTier) {
  if (tier !== "admin") {
    throw new Error("Admin content access denied.");
  }
}

export function assertResellerToolViewAccess(tier: AccessTier) {
  if (tier !== "supportStaff" && tier !== "admin" && tier !== "resellerOps") {
    throw new Error("Reseller tool access denied.");
  }
}

export function assertResellerToolManageAccess(tier: AccessTier) {
  if (tier !== "admin" && tier !== "resellerOps") {
    throw new Error("Reseller tool management access denied.");
  }
}

export function assertForumCategoryViewAccess(input: {
  tier: AccessTier;
  visibility: ForumCategoryVisibility;
}) {
  if (!canViewForumCategory(input.tier, input.visibility)) {
    throw new Error("Forum category access denied.");
  }
}

export function assertForumThreadCreateAccess(input: {
  tier: AccessTier;
  visibility: ForumCategoryVisibility;
  posting: ForumCategoryPosting;
  isArchived: boolean;
}) {
  if (input.isArchived && input.tier !== "moderator" && input.tier !== "supportStaff" && input.tier !== "admin") {
    throw new Error("This category is archived.");
  }
  if (!canCreateForumThread(input.tier, input.visibility, input.posting)) {
    throw new Error("Thread creation is not allowed in this category.");
  }
}

export function assertForumReplyAccess(input: {
  tier: AccessTier;
  visibility: ForumCategoryVisibility;
  posting: ForumCategoryPosting;
  isArchived: boolean;
  threadStatus: "open" | "locked" | "hidden";
}) {
  if (input.threadStatus === "hidden") {
    throw new Error("This thread is not available.");
  }
  if (
    input.threadStatus === "locked" &&
    input.tier !== "moderator" &&
    input.tier !== "supportStaff" &&
    input.tier !== "admin"
  ) {
    throw new Error("This thread is locked.");
  }
  if (input.isArchived && input.tier !== "moderator" && input.tier !== "supportStaff" && input.tier !== "admin") {
    throw new Error("This category is archived.");
  }
  if (!canReplyInForumThread(input.tier, input.visibility, input.posting)) {
    throw new Error("Replying is not allowed in this category.");
  }
}
