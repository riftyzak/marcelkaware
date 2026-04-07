export const baseRoles = [
  "registered",
  "moderator",
  "supportStaff",
  "admin",
  "resellerOps",
] as const;

export const accessTiers = [
  "guest",
  "registered",
  "activeSubscriber",
  "expiredSubscriber",
  "moderator",
  "supportStaff",
  "admin",
  "resellerOps",
  "banned",
] as const;

export const subscriptionStatuses = [
  "none",
  "pending",
  "active",
  "pastDue",
  "expired",
  "canceled",
  "revoked",
] as const;

export const accountStates = ["active", "suspended", "banned"] as const;

export type BaseRole = (typeof baseRoles)[number];
export type AccessTier = (typeof accessTiers)[number];
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];
export type AccountState = (typeof accountStates)[number];

export type PermissionSummary = {
  canBuy: boolean;
  canAccessDashboard: boolean;
  canAccessTickets: boolean;
  canAccessCommunity: boolean;
  canAccessDownloads: boolean;
  canUseLauncher: boolean;
  canOpenAppealFlow: boolean;
  canUseAdminLookup: boolean;
};

export function isPaidSubscription(status: SubscriptionStatus | null | undefined) {
  return status === "active";
}

export function resolveAccessTier(input: {
  accountState?: AccountState | null;
  role?: BaseRole | null;
  subscriptionStatus?: SubscriptionStatus | null;
}): AccessTier {
  if (input.accountState === "banned") {
    return "banned";
  }
  if (input.role === "admin") {
    return "admin";
  }
  if (input.role === "supportStaff") {
    return "supportStaff";
  }
  if (input.role === "moderator") {
    return "moderator";
  }
  if (input.role === "resellerOps") {
    return "resellerOps";
  }
  if (isPaidSubscription(input.subscriptionStatus)) {
    return "activeSubscriber";
  }
  if (
    input.subscriptionStatus === "expired" ||
    input.subscriptionStatus === "canceled" ||
    input.subscriptionStatus === "pastDue" ||
    input.subscriptionStatus === "revoked"
  ) {
    return "expiredSubscriber";
  }
  if (input.role === "registered") {
    return "registered";
  }
  return "guest";
}

export function getPermissionSummary(
  tier: AccessTier,
  accountState: AccountState | null | undefined,
): PermissionSummary {
  const banned = accountState === "banned" || tier === "banned";
  return {
    canBuy: !banned,
    canAccessDashboard: tier !== "guest",
    canAccessTickets: tier !== "guest" && !banned,
    canAccessCommunity: tier !== "banned" && tier !== "resellerOps",
    canAccessDownloads: tier === "activeSubscriber",
    canUseLauncher: tier === "activeSubscriber" && !banned,
    canOpenAppealFlow: banned || tier !== "guest",
    canUseAdminLookup: tier === "admin" || tier === "supportStaff",
  };
}

export const launcherScope = "launcher:entitlement";
export const launcherAccessTokenMinutes = 20;
export const launcherRefreshTokenDays = 14;
export const launcherPairingMinutes = 10;
