"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { HomepageBlocks } from "@/components/content/homepage-blocks";
import { PricingCard } from "@/components/marketing/pricing-card";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/lib/config/site";
import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";

function formatRelativeDate(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))}m ago`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  }
  return `${Math.floor(diff / day)}d ago`;
}

function HomeFeatureRow() {
  return (
    <div className="space-y-4 text-left">
      <Separator className="bg-white/10" />
      <div className="grid gap-6 sm:grid-cols-3">
      {[
        {
          title: "Fast delivery",
          body: "Access opens after confirmed payment.",
        },
        {
          title: "Launcher ready",
          body: "Downloads and pairing stay in one place.",
        },
        {
          title: "Forum and help",
          body: "Updates, discussion, and support stay close.",
        },
      ].map((item) => (
        <div className="space-y-2" key={item.title}>
          <p className="text-sm font-medium text-white">{item.title}</p>
          <p className="text-sm leading-6 text-slate-300/80">{item.body}</p>
        </div>
      ))}
      </div>
    </div>
  );
}

export function HomePortal() {
  const portal = useQuery(api.forum.publicPortalOverview, {});
  const announcements = useQuery(api.announcements.publicAnnouncementIndex, {});
  const changelogs = useQuery(api.changelogs.publicChangelogIndex, {});
  const dashboard = useQuery(api.users.viewerDashboard, {});
  const tickets = useQuery(api.tickets.viewerTickets, {});

  const latestAnnouncement = announcements?.items?.[0] ?? null;
  const latestChangelog = changelogs?.items?.[0] ?? null;
  const recentThreads = portal?.ok ? portal.recentThreads.slice(0, 3) : [];
  const visibleTickets = tickets && tickets.ok ? tickets.items.length : 0;

  return (
    <div className="space-y-18 pb-10">
      <section className="relative left-1/2 right-1/2 -mt-6 min-h-[calc(100vh-92px)] w-screen -translate-x-1/2 overflow-hidden bg-[#070c12]">
        <div className="relative min-h-[calc(100vh-92px)]">
          <Image
            alt="Atmospheric product backdrop"
            className="object-cover object-center opacity-86"
            fill
            priority
            src="/hero-backdrop.svg"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,10,0.14),rgba(5,8,12,0.46)_18%,rgba(6,9,14,0.72)_52%,rgba(8,11,16,0.96)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(94,133,184,0.08),transparent_30%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,14,0.08),rgba(7,10,14,0.1)_42%,rgba(7,10,14,0.68)_72%,rgba(7,10,14,0.92)_100%)]" />
          <div className="absolute inset-y-0 right-[-10%] hidden w-[58vw] max-w-[900px] lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_48%,rgba(130,163,204,0.16),rgba(10,14,20,0)_42%)]" />
            <div className="absolute inset-y-[14%] right-[4%] w-[78%] rounded-[32px] border border-white/6 bg-white/4 blur-3xl" />
            <div className="absolute inset-y-[19%] right-[10%] w-[68%] rounded-[32px] bg-[#8fb0d8]/8 blur-[90px]" />
            <Image
              alt="Blurred launcher visual"
              className="absolute right-[2%] top-[13%] h-auto w-[88%] rotate-[-8deg] opacity-34 blur-[2px] saturate-[0.76]"
              height={780}
              src="/launcher-showcase.svg"
              width={1180}
            />
          </div>

          <div className="relative mx-auto flex min-h-[calc(100vh-92px)] max-w-[1240px] items-center px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-4xl space-y-9 pt-8 text-center">
              <div className="space-y-5">
                <p className="text-sm text-slate-300/68">{siteConfig.name}</p>
                <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-[5.5rem] lg:leading-[0.98]">
                  Direct access. Fast updates. One account.
                </h1>
                <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-200/82">
                  Buy access, download the launcher, follow release notes, and use the forum and
                  support from the same account.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Link href={dashboard ? "/app/downloads" : "/#pricing"}>
                  <Button>{dashboard ? "Open downloads" : "Get access"}</Button>
                </Link>
                <Link href={dashboard ? "/app" : "/community"}>
                  <Button variant="secondary">{dashboard ? "Open account" : "Open forum"}</Button>
                </Link>
              </div>

              <HomeFeatureRow />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1160px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Built around one account.
            </h2>
            <p className="text-base leading-8 text-slate-300">
              Sign in, unlock access, install the launcher, and keep everything tied to the same account.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={dashboard ? "/app" : "/register"}>
                <Button variant="secondary">{dashboard ? "Open account" : "Create account"}</Button>
              </Link>
              <Link href="/changelog">
                <Button variant="secondary">Release notes</Button>
              </Link>
            </div>
          </div>

        <div className="rounded-[14px] border border-white/8 bg-[#0d1218] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <Image
            alt="Launcher showcase mockup"
            className="h-auto w-full rounded-[12px]"
            height={780}
            src="/launcher-showcase.svg"
            width={1180}
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] space-y-8 px-4 sm:px-6" id="pricing">
        <div className="grid gap-10 border-t border-white/10 pt-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">One plan. One account.</h2>
              <p className="text-base leading-8 text-slate-300">
                Payment unlocks access on the account. Downloads, launcher pairing, support, and forum access stay tied to the same login.
              </p>
            </div>
            <div className="space-y-4 text-sm leading-7 text-slate-300">
              <p>1. Register or log in.</p>
              <p>2. Pay with card or hosted crypto checkout.</p>
              <p>3. Open downloads from the account area and pair the launcher.</p>
            </div>
          </div>
          <PricingCard />
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] space-y-6 px-4 sm:px-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Forum, help, updates.</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Forum</h3>
              <Link className="text-sm text-[#9fc0ec]" href="/community">
                Open
              </Link>
            </div>
            {portal === undefined ? (
              <p className="text-sm text-slate-500">Loading forum activity.</p>
            ) : !portal.ok ? (
              <p className="text-sm text-slate-500">{portal.message}</p>
            ) : recentThreads.length ? (
              <div className="space-y-3">
                {recentThreads.map((thread: any) => (
                  <Link
                    className="block border-b border-white/10 pb-3 last:border-b-0 last:pb-0"
                    href={`/community/t/${thread._id}`}
                    key={thread._id}
                  >
                    <p className="text-sm font-medium text-white">{thread.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {thread.categoryTitle} · {formatRelativeDate(thread.lastPostAt)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No visible threads yet.</p>
            )}
          </div>

          <Separator className="bg-white/10 lg:hidden" />

          <div className="space-y-4 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Help</h3>
              <Link className="text-sm text-[#9fc0ec]" href="/help">
                Read FAQ
              </Link>
            </div>
            {dashboard ? (
              <div className="space-y-2 text-sm text-slate-400">
                <p>Access: <span className="capitalize text-white">{dashboard.subscription.status}</span></p>
                <p>
                  {dashboard.user.accountState === "banned"
                    ? "This account is restricted. Use the appeals path for account review."
                    : `${visibleTickets} visible support ticket${visibleTickets === 1 ? "" : "s"} in your account.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-slate-400">
                <p>Help covers account rules, supported systems, payment timing, and updates.</p>
                <p>Private tickets open after sign in.</p>
              </div>
            )}
            {dashboard && dashboard.user.accountState !== "banned" ? (
              <div>
                <Link href="/app/tickets">
                  <Button variant="secondary">Open support tickets</Button>
                </Link>
              </div>
            ) : null}
          </div>

          <Separator className="bg-white/10 lg:hidden" />

          <div className="space-y-4 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Updates</h3>
              <Link className="text-sm text-[#9fc0ec]" href="/announcements">
                Open
              </Link>
            </div>
            <div className="space-y-3">
              <div className="border-b border-white/10 pb-3">
                <p className="text-sm text-slate-500">Announcement</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {latestAnnouncement?.title ?? "No announcement published yet."}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Changelog</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {latestChangelog?.title ?? "No release notes published yet."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
        <HomepageBlocks excludeTypes={["heroSupportText", "trustStrip"]} fallback={false} />
      </div>
    </div>
  );
}
