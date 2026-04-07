"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useQuery } from "convex/react";
import Link from "next/link";

function getAudienceLabel(item: any) {
  if (item.visibleToActiveSubscribers && !item.visibleToGuests && !item.visibleToRegisteredUsers) {
    return "Subscriber area";
  }
  if (item.visibleToRegisteredUsers && !item.visibleToGuests) {
    return "Member area";
  }
  return "Open access";
}

function getCommunityDescription(viewerTier: string) {
  if (viewerTier === "guest") {
    return "Public boards and member areas.";
  }
  if (viewerTier === "expiredSubscriber" || viewerTier === "registered") {
    return "Public and member boards are visible.";
  }
  if (viewerTier === "activeSubscriber") {
    return "All boards available to your account.";
  }
  return "Board access follows account permissions.";
}

export function CommunityIndex() {
  const result = useQuery(api.forum.categoryIndex, {});

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro eyebrow="Community" title="Community" description="Loading boards." />
        <StateCard description="Fetching available categories and visibility rules." title="Loading community" />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <PageIntro
          eyebrow="Community"
          title="Community"
          description="Board access follows account state."
        />
        <StateCard
          actionHref={result.viewerTier === "banned" ? "/contact" : "/#pricing"}
          actionLabel={result.viewerTier === "banned" ? "Open contact page" : "View access options"}
          description={result.message ?? "Community access is currently unavailable."}
          title="Community unavailable"
          tone="warning"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageIntro
        actions={
          result.viewerTier === "guest" ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/register">
                <Button variant="secondary">Register</Button>
              </Link>
              <Link href="/#pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
            </div>
          ) : result.viewerTier === "registered" || result.viewerTier === "expiredSubscriber" ? (
            <Link href="/#pricing">
              <Button variant="secondary">View access options</Button>
            </Link>
          ) : undefined
        }
        eyebrow="Forum"
        title="Community"
        description={getCommunityDescription(result.viewerTier)}
      />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] pb-3 text-sm text-[color:var(--text-muted)]">
          <p>{result.items.length} visible {result.items.length === 1 ? "category" : "categories"}</p>
          <p>Forum index</p>
        </div>

        <div className="overflow-hidden border border-[color:var(--border)] bg-[#15191e]">
          <div className="grid grid-cols-[minmax(0,1fr)_120px_160px] gap-4 border-b border-[color:var(--border)] bg-[#11151a] px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] text-[color:var(--text-dim)] sm:px-5">
            <p>Boards</p>
            <p className="hidden text-right md:block">Threads</p>
            <p className="hidden text-right md:block">Last post</p>
          </div>
          {result.items.length ? (
            result.items.map((item: any) => (
              <Link href={`/community/c/${item.slug}`} key={item._id}>
                <div className="grid grid-cols-1 gap-3 border-b border-[color:var(--border)] px-4 py-4 transition-colors last:border-b-0 hover:bg-[#1d232b] md:grid-cols-[minmax(0,1fr)_120px_160px] md:items-center sm:px-5">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold text-[color:var(--text)]">{item.title}</h2>
                      <span className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--text-dim)]">
                        {getAudienceLabel(item)}
                      </span>
                      {item.isArchived ? (
                        <span className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--warning)]">
                          Archived
                        </span>
                      ) : null}
                    </div>
                    <p className="max-w-3xl text-sm leading-6 text-[color:var(--text-muted)]">
                      {item.description ?? "No description available."}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-[color:var(--text-dim)] md:hidden">
                      <span>{item.threadCount} threads</span>
                      <span>{item.latestThread ? `Last post by ${item.latestThread.lastPostBy}` : "No posts"}</span>
                    </div>
                  </div>

                  <div className="hidden text-right md:block">
                    <p className="text-sm font-medium text-[color:var(--text)]">{item.threadCount}</p>
                    <p className="mt-1 text-xs text-[color:var(--text-dim)]">
                      {item.isArchived ? "Read only" : "Active"}
                    </p>
                  </div>

                  <div className="hidden text-right md:block">
                    {item.latestThread ? (
                      <>
                        <p className="truncate text-sm font-medium text-[color:var(--text)]">
                          {item.latestThread.lastPostBy}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--text-dim)]">
                          {new Date(item.latestThread.lastPostAt).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-[color:var(--text-dim)]">No posts</p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-4 py-4 sm:px-5">
              <p className="text-sm font-medium text-[color:var(--text)]">No visible boards right now.</p>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                {result.viewerTier === "guest"
                  ? "Create an account to unlock member areas when they are available."
                  : "This account does not currently have access to any visible categories."}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link className="text-[#9fc0ec] hover:text-white" href={result.viewerTier === "guest" ? "/register" : "/#pricing"}>
                  {result.viewerTier === "guest" ? "Create account" : "View access options"}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
