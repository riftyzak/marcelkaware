"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
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
  return null;
}

export function CommunityIndex() {
  const result = useQuery(api.forum.categoryIndex, {});

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Community</h1>
        <p className="text-sm text-[color:var(--text-muted)]">Loading boards.</p>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Community</h1>
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Community</h1>
        {result.viewerTier === "guest" ? (
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
        ) : null}
      </div>

      <div className="border-b border-[color:var(--border)] pb-2 text-sm text-[color:var(--text-dim)]">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_160px] gap-4">
          <p>{result.items.length} {result.items.length === 1 ? "board" : "boards"}</p>
          <p className="hidden text-right md:block">Threads</p>
          <p className="hidden text-right md:block">Last post</p>
        </div>
      </div>

      {result.items.length ? (
        result.items.map((item: any) => (
          <Link href={`/community/c/${item.slug}`} key={item._id}>
            <div className="grid grid-cols-1 gap-3 border-b border-[color:var(--border)] py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[minmax(0,1fr)_120px_160px] md:items-center">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-[color:var(--text)]">{item.title}</h2>
                  {getAudienceLabel(item) ? (
                    <span className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--text-dim)]">
                      {getAudienceLabel(item)}
                    </span>
                  ) : null}
                  {item.isArchived ? (
                    <span className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--warning)]">
                      Archived
                    </span>
                  ) : null}
                </div>
                {item.description ? (
                  <p className="max-w-3xl text-sm text-[color:var(--text-muted)]">{item.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-4 text-sm text-[color:var(--text-dim)] md:hidden">
                  <span>{item.threadCount} threads</span>
                  <span>{item.latestThread ? `Last by ${item.latestThread.lastPostBy}` : "No posts"}</span>
                </div>
              </div>

              <div className="hidden text-right md:block">
                <p className="text-sm font-medium text-[color:var(--text)]">{item.threadCount}</p>
              </div>

              <div className="hidden text-right md:block">
                {item.latestThread ? (
                  <>
                    <p className="truncate text-sm text-[color:var(--text)]">
                      {item.latestThread.lastPostBy}
                    </p>
                    <p className="mt-0.5 text-xs text-[color:var(--text-dim)]">
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
        <div className="py-4">
          <p className="text-sm text-[color:var(--text-muted)]">
            {result.viewerTier === "guest"
              ? "Create an account to unlock member areas."
              : "No visible boards for this account."}
          </p>
          <Link
            className="mt-2 inline-block text-sm text-[color:var(--accent)] hover:text-white"
            href={result.viewerTier === "guest" ? "/register" : "/#pricing"}
          >
            {result.viewerTier === "guest" ? "Create account" : "View access options"}
          </Link>
        </div>
      )}
    </div>
  );
}
