import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { getAccessTierFromState, assertAdminLookupAccess } from "./rbac";
import { getLatestSubscriptionForUser } from "./subscriptions";
import { v } from "convex/values";

export const findUsers = query({
  args: {
    search: v.string(),
  },
  handler: async (ctx, args) => {
    const actorUserId = await getAuthUserId(ctx);
    if (!actorUserId) {
      return { ok: false, message: "Authentication required.", actorTier: "guest", items: [] as any[] };
    }
    const actor = await ctx.db.get(actorUserId);
    const actorSubscription = await getLatestSubscriptionForUser(ctx, actorUserId);
    const accessTier = getAccessTierFromState({
      role: actor?.role ?? "registered",
      accountState: actor?.accountState ?? "active",
      subscriptionStatus: actorSubscription?.status ?? "none",
    });
    try {
      assertAdminLookupAccess(accessTier);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Access denied.",
        actorTier: accessTier,
        items: [] as any[],
      };
    }
    const search = args.search.trim().toLowerCase();
    const users = await ctx.db.query("users").collect();
    const items = (
      await Promise.all(
        users.map(async (user) => {
          const subscription = await getLatestSubscriptionForUser(ctx, user._id);
          const lastIp = await ctx.db
            .query("ipLogs")
            .withIndex("userId", (q) => q.eq("userId", user._id))
            .collect();
          return {
            _id: user._id,
            displayName: user.displayName ?? user.name ?? user.email ?? "Member",
            email: user.email,
            handle: user.handle ?? null,
            role: user.role ?? "registered",
            accountState: user.accountState ?? "active",
            subscriptionStatus: subscription?.status ?? "none",
            accessTier: getAccessTierFromState({
              role: user.role ?? "registered",
              accountState: user.accountState ?? "active",
              subscriptionStatus: subscription?.status ?? "none",
            }),
            lastIpSeenAt: lastIp.sort((a, b) => b.createdAt - a.createdAt)[0]?.createdAt,
          };
        }),
      )
    ).filter((item) => {
      if (!search) {
        return true;
      }
      return [item.displayName, item.email ?? ""].some((value) =>
        value.toLowerCase().includes(search),
      ) || (item.handle ?? "").toLowerCase().includes(search);
    });
    return { ok: true, message: null, actorTier: accessTier, items: items.slice(0, 20) };
  },
});

export const auditLogIndex = query({
  args: {
    actorSearch: v.optional(v.string()),
    actionSearch: v.optional(v.string()),
    targetTable: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actorUserId = await getAuthUserId(ctx);
    if (!actorUserId) {
      return {
        ok: false,
        message: "Authentication required.",
        items: [] as any[],
        summary: null,
      };
    }
    const actor = await ctx.db.get(actorUserId);
    const actorSubscription = await getLatestSubscriptionForUser(ctx, actorUserId);
    const accessTier = getAccessTierFromState({
      role: actor?.role ?? "registered",
      accountState: actor?.accountState ?? "active",
      subscriptionStatus: actorSubscription?.status ?? "none",
    });
    if (accessTier !== "admin") {
      return {
        ok: false,
        message: "Audit log access denied.",
        items: [] as any[],
        summary: null,
      };
    }

    const actorSearch = args.actorSearch?.trim().toLowerCase() ?? "";
    const actionSearch = args.actionSearch?.trim().toLowerCase() ?? "";
    const targetTable = args.targetTable?.trim() ?? "";
    const logs = await ctx.db.query("auditLogs").withIndex("createdAt").collect();

    const items = (
      await Promise.all(
        logs
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(async (log) => {
            const actorUser = log.actorUserId ? await ctx.db.get(log.actorUserId) : null;
            return {
              ...log,
              actorName:
                actorUser?.displayName ?? actorUser?.name ?? actorUser?.email ?? null,
              actorHandle: actorUser?.handle ?? null,
            };
          }),
      )
    ).filter((log) => {
      if (actorSearch) {
        const actorText = `${log.actorName ?? ""} ${log.actorHandle ?? ""}`.toLowerCase();
        if (!actorText.includes(actorSearch)) {
          return false;
        }
      }
      if (actionSearch && !log.action.toLowerCase().includes(actionSearch)) {
        return false;
      }
      if (targetTable && log.targetTable !== targetTable) {
        return false;
      }
      return true;
    });

    const recent = items.slice(0, 80);
    const summary = {
      total: items.length,
      staffActions: recent.filter((item) => item.actorType === "staff").length,
      userActions: recent.filter((item) => item.actorType === "user").length,
      sensitive: recent.filter((item) =>
        [
          "user.setAccountState",
          "reseller.key.revoked",
          "reseller.key.redeemed",
          "ticket.assigned",
          "ticket.statusUpdated",
          "forum.threadModerated",
          "forum.postModerated",
        ].includes(item.action),
      ).length,
    };

    return {
      ok: true,
      message: null,
      items: items.slice(0, 120),
      summary,
    };
  },
});
