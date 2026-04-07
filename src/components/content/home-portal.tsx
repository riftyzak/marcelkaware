"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { HomepageBlocks } from "@/components/content/homepage-blocks";
import { PricingCard } from "@/components/marketing/pricing-card";
import { Aurora } from "@/components/reactbits/aurora";
import { BlurText } from "@/components/reactbits/blur-text";
import { FadeContent } from "@/components/reactbits/fade-content";
import { ShinyText } from "@/components/reactbits/shiny-text";
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
    <div className="pb-10">
      {/* Hero */}
      <section className="relative left-1/2 right-1/2 -mt-6 w-screen -translate-x-1/2 overflow-hidden bg-[#070c12]">
        <div className="relative min-h-[calc(100vh-48px)]">
          <Image
            alt=""
            className="object-cover object-center opacity-70"
            fill
            priority
            src="/hero-backdrop.svg"
          />
          <Aurora
            colorStops={["#1a3a5c", "#8fb0d8", "#2a4a6a"]}
            speed={0.6}
            blend={0.25}
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070c12]/10 via-[#070c12]/50 to-[#070c12]/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#070c12]/80" />

          {/* Launcher visual — right side, no card wrapper */}
          <div className="absolute inset-y-0 right-[-6%] hidden w-[52vw] max-w-[820px] lg:block">
            <Image
              alt=""
              className="absolute right-[4%] top-[16%] h-auto w-[84%] rotate-[-6deg] opacity-24 blur-[1px] saturate-75"
              height={780}
              loading="eager"
              src="/launcher-showcase.svg"
              width={1180}
            />
          </div>

          <div className="relative mx-auto flex min-h-[calc(100vh-48px)] max-w-[1240px] items-center justify-center px-4 py-20 text-center sm:px-6">
            <div className="max-w-4xl space-y-8">
              <div className="space-y-4">
                <BlurText
                  as="h1"
                  className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[4.75rem]"
                  delay={55}
                  text="Time to dominate with"
                />
                <FadeContent delay={260}>
                  <p className="text-5xl font-semibold leading-none tracking-tight sm:text-6xl lg:text-[4.75rem]">
                    <span className="relative inline-block">
                      <span className="text-[#8fb0d8]">marcelka</span>
                      <span className="text-white">ware</span>
                      <span aria-hidden className="pointer-events-none absolute inset-0">
                        <ShinyText className="text-white" duration={3} text="marcelkaware" />
                      </span>
                    </span>
                  </p>
                </FadeContent>
              </div>

              <FadeContent delay={420}>
                <p className="mx-auto max-w-2xl text-base leading-7 text-slate-300/80 sm:text-lg">
                  Buy access, download the launcher, get updates fast, and keep support and forum access in one place.
                </p>
              </FadeContent>

              <FadeContent delay={520}>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href={dashboard ? "/app/downloads" : "/#pricing"}>
                    <Button>{dashboard ? "Open downloads" : "Get access"}</Button>
                  </Link>
                  <Link href={dashboard ? "/app" : "/community"}>
                    <Button variant="secondary">{dashboard ? "Open account" : "Open forum"}</Button>
                  </Link>
                </div>
              </FadeContent>

              <FadeContent delay={620}>
                <p className="text-sm text-slate-500">
                  Fast delivery &middot; Launcher ready &middot; Forum and support
                </p>
              </FadeContent>
            </div>
          </div>
        </div>
      </section>

      {/* Launcher showcase — no card wrapper */}
      <section className="mx-auto mt-20 grid max-w-[1160px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
        <FadeContent delay={0}>
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Built around one account.
            </h2>
            <p className="text-base leading-8 text-slate-300/80">
              Sign in, unlock access, install the launcher, and keep everything tied to the same account.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={dashboard ? "/app" : "/register"}>
                <Button variant="secondary">{dashboard ? "Open account" : "Create account"}</Button>
              </Link>
              <Link href="/changelog">
                <Button variant="ghost">Release notes</Button>
              </Link>
            </div>
          </div>
        </FadeContent>

        <FadeContent delay={150}>
          <Image
            alt="Launcher showcase"
            className="h-auto w-full opacity-90"
            height={780}
            src="/launcher-showcase.svg"
            width={1180}
          />
        </FadeContent>
      </section>

      {/* Pricing */}
      <section className="mx-auto mt-24 max-w-[1160px] px-4 sm:px-6" id="pricing">
        <FadeContent>
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div className="space-y-5">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">One plan. One account.</h2>
              <p className="text-base leading-8 text-slate-300/80">
                Payment unlocks access on the account. Downloads, launcher pairing, support, and forum access stay tied to the same login.
              </p>
              <div className="space-y-3 text-sm leading-7 text-slate-400">
                <p>1. Register or log in.</p>
                <p>2. Pay with card or hosted crypto checkout.</p>
                <p>3. Open downloads and pair the launcher.</p>
              </div>
            </div>
            <PricingCard />
          </div>
        </FadeContent>
      </section>

      {/* Forum, Help, Updates */}
      <section className="mx-auto mt-24 max-w-[1160px] space-y-6 px-4 sm:px-6">
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">Forum, help, updates.</h2>

        <div className="grid gap-8 lg:grid-cols-3">
          <FadeContent delay={0}>
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Forum</h3>
                <Link className="text-sm text-[color:var(--accent)] hover:text-white" href="/community">
                  Open
                </Link>
              </div>
              {portal === undefined ? (
                <p className="text-sm text-slate-500">Loading.</p>
              ) : !portal.ok ? (
                <p className="text-sm text-slate-500">{portal.message}</p>
              ) : recentThreads.length ? (
                <div className="space-y-3">
                  {recentThreads.map((thread: any) => (
                    <Link
                      className="block border-b border-white/6 pb-3 last:border-b-0 last:pb-0"
                      href={`/community/t/${thread._id}`}
                      key={thread._id}
                    >
                      <p className="text-sm font-medium text-white">{thread.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {thread.categoryTitle} &middot; {formatRelativeDate(thread.lastPostAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No visible threads yet.</p>
              )}
            </div>
          </FadeContent>

          <FadeContent delay={120}>
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Help</h3>
                <Link className="text-sm text-[color:var(--accent)] hover:text-white" href="/help">
                  Read FAQ
                </Link>
              </div>
              {dashboard ? (
                <div className="space-y-2 text-sm text-slate-400">
                  <p>Access: <span className="capitalize text-white">{dashboard.subscription.status}</span></p>
                  <p>
                    {dashboard.user.accountState === "banned"
                      ? "This account is restricted."
                      : `${visibleTickets} support ticket${visibleTickets === 1 ? "" : "s"}.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-slate-400">
                  <p>Help covers account rules, systems, and payments.</p>
                </div>
              )}
              {dashboard && dashboard.user.accountState !== "banned" ? (
                <Link href="/app/tickets">
                  <Button variant="secondary">Open tickets</Button>
                </Link>
              ) : null}
            </div>
          </FadeContent>

          <FadeContent delay={240}>
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Updates</h3>
                <Link className="text-sm text-[color:var(--accent)] hover:text-white" href="/announcements">
                  Open
                </Link>
              </div>
              <div className="space-y-3">
                <div className="border-b border-white/6 pb-3">
                  <p className="text-xs text-slate-500">Announcement</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {latestAnnouncement?.title ?? "No announcement yet."}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Changelog</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {latestChangelog?.title ?? "No release notes yet."}
                  </p>
                </div>
              </div>
            </div>
          </FadeContent>
        </div>
      </section>

      {/* CMS blocks */}
      <div className="mx-auto mt-20 max-w-[1160px] px-4 sm:px-6">
        <HomepageBlocks excludeTypes={["heroSupportText", "trustStrip"]} fallback={false} />
      </div>
    </div>
  );
}
