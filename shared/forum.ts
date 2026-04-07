import type { AccessTier } from "./auth";

export const forumThreadStatuses = ["open", "locked", "hidden"] as const;
export const forumPostStatuses = ["visible", "hidden"] as const;
export const forumReactionKinds = ["like"] as const;

export type ForumThreadStatus = (typeof forumThreadStatuses)[number];
export type ForumPostStatus = (typeof forumPostStatuses)[number];
export type ForumReactionKind = (typeof forumReactionKinds)[number];

export type ForumCategoryVisibility = {
  guests: boolean;
  registeredUsers: boolean;
  activeSubscribers: boolean;
};

export type ForumCategoryPosting = {
  allowThreads: boolean;
  allowReplies: boolean;
};

export function canViewForumCategory(
  tier: AccessTier,
  visibility: ForumCategoryVisibility,
) {
  if (tier === "banned" || tier === "resellerOps") {
    return false;
  }
  if (tier === "moderator" || tier === "supportStaff" || tier === "admin") {
    return true;
  }
  if (tier === "activeSubscriber") {
    return visibility.guests || visibility.registeredUsers || visibility.activeSubscribers;
  }
  if (tier === "registered" || tier === "expiredSubscriber") {
    return visibility.guests || visibility.registeredUsers;
  }
  return visibility.guests;
}

export function canCreateForumThread(
  tier: AccessTier,
  visibility: ForumCategoryVisibility,
  posting: ForumCategoryPosting,
) {
  if (tier === "banned" || tier === "guest" || tier === "resellerOps") {
    return false;
  }
  if (tier === "moderator" || tier === "supportStaff" || tier === "admin") {
    return true;
  }
  if (!posting.allowThreads) {
    return false;
  }
  return canViewForumCategory(tier, visibility);
}

export function canReplyInForumThread(
  tier: AccessTier,
  visibility: ForumCategoryVisibility,
  posting: ForumCategoryPosting,
) {
  if (tier === "banned" || tier === "guest" || tier === "resellerOps") {
    return false;
  }
  if (tier === "moderator" || tier === "supportStaff" || tier === "admin") {
    return true;
  }
  if (!posting.allowReplies) {
    return false;
  }
  return canViewForumCategory(tier, visibility);
}
