"use client";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/payments/display";
import { DashboardUpdatesPanel } from "@/components/content/dashboard-updates-panel";
import { LauncherPairingCard } from "./launcher-pairing-card";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { getPermissionSummary } from "../../../shared/auth";
import { useQuery } from "convex/react";
import Link from "next/link";

export function AccountDashboard() {
  const dashboard = useQuery(api.users.viewerDashboard, {});

  if (dashboard === undefined) {
    return <p className="text-sm text-[color:var(--text-muted)]">Loading account...</p>;
  }

  if (!dashboard) {
    return (
      <div className="space-y-4">
        <PageIntro title="Account" description="Sign in to manage access, downloads, support, and launcher status." />
        <StateCard
          title="Sign in required"
          description="This area is only available after login."
          actionHref="/login"
          actionLabel="Open login"
        />
      </div>
    );
  }

  const permissions = getPermissionSummary(dashboard.accessTier, dashboard.user.accountState);
  const internalLinks =
    dashboard.accessTier === "admin"
      ? [
          { href: "/admin/tickets", label: "Ticket queue" },
          { href: "/admin/users", label: "User lookup" },
          { href: "/admin/forum", label: "Forum admin" },
          { href: "/admin/announcements", label: "Announcements" },
          { href: "/admin/changelog", label: "Changelog" },
          { href: "/admin/banners", label: "Banners" },
          { href: "/admin/homepage", label: "Homepage" },
          { href: "/admin/badges", label: "Badges" },
          { href: "/admin/resellers", label: "Resellers" },
          { href: "/admin/audit", label: "Audit log" },
        ]
      : dashboard.accessTier === "supportStaff"
        ? [
            { href: "/admin/tickets", label: "Ticket queue" },
            { href: "/admin/users", label: "User lookup" },
            { href: "/admin/resellers", label: "Resellers" },
          ]
        : dashboard.accessTier === "resellerOps"
          ? [{ href: "/admin/resellers", label: "Resellers" }]
          : [];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <PageIntro
          title={dashboard.user.displayName}
          description="Access, downloads, support, and launcher status."
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge>{dashboard.accessTier}</Badge>
              <Badge className="capitalize">{dashboard.subscription.status}</Badge>
            </div>
          }
        />

        {dashboard.user.accountState === "banned" ? (
          <div className="border border-red-400/30 bg-red-400/8 px-4 py-3 text-sm text-red-100">
            This account is restricted. Use the appeals page for review.
          </div>
        ) : null}

        <div className="grid gap-4 border-t border-[color:var(--border)] pt-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-[color:var(--text-dim)]">Status</p>
            <p className="mt-1 text-base text-white capitalize">{dashboard.subscription.status}</p>
          </div>
          <div>
            <p className="text-sm text-[color:var(--text-dim)]">Renewal</p>
            <p className="mt-1 text-base text-white">
              {dashboard.subscription.currentPeriodEnd
                ? new Date(dashboard.subscription.currentPeriodEnd).toLocaleDateString()
                : "No active period"}
            </p>
          </div>
          <div>
            <p className="text-sm text-[color:var(--text-dim)]">Devices</p>
            <p className="mt-1 text-base text-white">{dashboard.devices.length}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[color:var(--border)] pt-4">
          <Link href="/app/downloads">
            <Button>Downloads</Button>
          </Link>
          <Link href="/app/tickets">
            <Button variant="secondary">Tickets</Button>
          </Link>
          <Link href="/community">
            <Button variant="secondary">Forum</Button>
          </Link>
          <Link href="/app/redeem">
            <Button variant="secondary">Redeem key</Button>
          </Link>
          {internalLinks.length ? (
            <Link href={internalLinks[0].href}>
              <Button variant="secondary">Admin</Button>
            </Link>
          ) : null}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Payments</h2>
            {!permissions.canBuy ? null : (
              <Link className="text-sm text-[color:var(--accent)] hover:text-white" href="/#pricing">
                Buy access
              </Link>
            )}
          </div>
          <div className="border border-[color:var(--border)] bg-[color:var(--panel)]">
            {dashboard.payments.length ? (
              dashboard.payments.map((payment: any) => (
                <div
                  className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] px-4 py-3 last:border-b-0"
                  key={payment._id}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{payment.provider}</p>
                    <p className="text-sm text-[color:var(--text-dim)]">
                      {new Date(payment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {formatMoney(payment.amountCents, payment.currency)}
                    </p>
                    <p className="text-sm capitalize text-[color:var(--text-dim)]">{payment.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-[color:var(--text-muted)]">
                No payments yet.
              </div>
            )}
          </div>

          {internalLinks.length ? (
            <div className="space-y-3 border-t border-[color:var(--border)] pt-4">
              <h2 className="text-lg font-semibold text-white">Internal tools</h2>
              <div className="flex flex-wrap gap-3 text-sm">
                {internalLinks.map((item) => (
                  <Link className="text-[color:var(--accent)] hover:text-white" href={item.href} key={item.href}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <div className="space-y-6">
          <LauncherPairingCard />
          <DashboardUpdatesPanel />
        </div>
      </div>
    </div>
  );
}
