"use client";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useQuery } from "convex/react";
import Link from "next/link";
import { UserBadgeRow } from "./user-badge-row";

function getInitials(name: string | null | undefined) {
  if (!name) {
    return "MB";
  }
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "MB";
}

function getPublicRank(role: string) {
  if (role === "admin" || role === "supportStaff" || role === "moderator") {
    return "Staff";
  }
  return "Member";
}

export function MemberProfileCard({ handle }: { handle: string }) {
  const result = useQuery(api.forum.memberProfile, { handle });

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro
          breadcrumbs={[
            { label: "Community", href: "/community" },
            { label: "Member" },
          ]}
          eyebrow="Community"
          title="Loading member"
          description="Fetching the public profile and visible discussion activity."
        />
        <StateCard description="Loading public profile data and visible thread history." title="Preparing member profile" />
      </div>
    );
  }

  if (!result.ok || !result.profile) {
    return (
      <div className="space-y-6">
        <PageIntro
          breadcrumbs={[
            { label: "Community", href: "/community" },
            { label: "Member" },
          ]}
          eyebrow="Community"
          title="Member unavailable"
          description="This profile may be missing or outside the current community visibility."
        />
        <StateCard
          actionHref="/community"
          actionLabel="Back to community"
          description={result.message ?? "This profile is not available."}
          title="Profile not available"
          tone="warning"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        breadcrumbs={[
          { label: "Community", href: "/community" },
          { label: result.profile.displayName },
        ]}
        eyebrow="Community"
        title={result.profile.displayName}
        description="Public profile view. Only activity visible to the current viewer is reflected here."
      />

      <Card className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-lg font-semibold text-slate-100">
              {getInitials(result.profile.displayName)}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-white">{result.profile.displayName}</h1>
                {result.profile.handle ? <Badge>@{result.profile.handle}</Badge> : null}
                <Badge>{getPublicRank(result.profile.role)}</Badge>
              </div>
              <p className="text-sm text-slate-400">
                Joined {result.profile.joinedAt ? new Date(result.profile.joinedAt).toLocaleDateString() : "Unknown"}
              </p>
              {result.profile.badges.length ? (
                <UserBadgeRow badges={result.profile.badges} />
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-56">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Threads</p>
              <p className="mt-1 text-xl font-semibold text-white">{result.profile.stats.threadCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Posts</p>
              <p className="mt-1 text-xl font-semibold text-white">{result.profile.stats.postCount}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Recent visible threads</h2>
        <p className="text-sm text-slate-500">
          This list only includes threads visible to the current viewer. Subscriber-only or restricted activity is not surfaced here.
        </p>
        {result.profile.recentThreads.length ? (
          <div className="space-y-3">
            {result.profile.recentThreads.map((thread: any) => (
              <Link
                className="block rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/30"
                href={`/community/t/${thread._id}`}
                key={thread._id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-white">{thread.title}</p>
                    <p className="text-xs text-slate-500">
                      {thread.status !== "open" ? `${thread.status} · ` : ""}
                      {new Date(thread.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-cyan-300">Open thread</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <StateCard description="No public or currently visible threads are available on this profile." title="No visible thread history" />
        )}
      </Card>
    </div>
  );
}
