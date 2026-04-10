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

export type CommunityProfileLink = {
  label: string;
  url: string;
};

function normalizeProfileHandleSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function buildCommunityProfileSlug(input: {
  handle?: string | null;
  displayName?: string | null;
  publicUserNumber: number;
}) {
  const base =
    normalizeProfileHandleSegment(input.handle ?? "") ||
    normalizeProfileHandleSegment(input.displayName ?? "") ||
    "member";

  return `${base}.${input.publicUserNumber}`;
}

export function buildCommunityProfilePath(input: {
  handle?: string | null;
  displayName?: string | null;
  publicUserNumber: number;
}) {
  return `/community/profiles/${buildCommunityProfileSlug(input)}`;
}

export function parseCommunityProfileSlug(slug: string) {
  const trimmed = slug.trim().replace(/^\/+|\/+$/g, "");
  const match = trimmed.match(/^(?<handle>[a-z0-9-]+)\.(?<uid>\d+)$/i);
  if (!match?.groups?.uid) {
    return null;
  }

  return {
    handle: normalizeProfileHandleSegment(match.groups.handle ?? ""),
    publicUserNumber: Number(match.groups.uid),
  };
}

export function normalizeCommunityProfileLinks(links: CommunityProfileLink[]) {
  return links
    .map((item) => ({
      label: item.label.trim().slice(0, 40),
      url: item.url.trim(),
    }))
    .filter((item) => item.label && item.url)
    .slice(0, 4);
}

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
