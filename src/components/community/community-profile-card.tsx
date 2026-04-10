"use client";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { StateCard } from "@/components/ui/state-card";
import { CommunityAvatar } from "./community-avatar";
import { UserBadgeRow } from "./user-badge-row";
import { parseCommunityProfileSlug } from "../../../shared/forum";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function getPublicRank(role: string) {
  if (role === "admin" || role === "supportStaff" || role === "moderator") {
    return "Staff";
  }
  return "Member";
}

export function CommunityProfileCard({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const parsedSlug = parseCommunityProfileSlug(slug);
  const result = useQuery(
    api.forum.memberProfile,
    parsedSlug ? { publicUserNumber: parsedSlug.publicUserNumber } : "skip",
  );

  useEffect(() => {
    if (!parsedSlug || result === undefined || !result?.ok || !result.profile?.canonicalPath) {
      return;
    }

    if (pathname !== result.profile.canonicalPath) {
      router.replace(result.profile.canonicalPath);
    }
  }, [parsedSlug, pathname, result, router]);

  if (!parsedSlug) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: "Profile" }]} />
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Profile unavailable</h1>
        <StateCard
          actionHref="/community"
          actionLabel="Back to community"
          description="This profile URL is invalid."
          title="Profile not available"
          tone="warning"
        />
      </div>
    );
  }

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: "Profile" }]} />
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Loading profile</h1>
        <p className="text-sm text-[color:var(--text-muted)]">Loading public profile and recent thread history.</p>
      </div>
    );
  }

  if (!result.ok || !result.profile) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: "Profile" }]} />
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Profile unavailable</h1>
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

  const { profile } = result;

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: profile.displayName }]} />

      <div className="flex flex-col gap-4 border-b border-[color:var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <CommunityAvatar
            avatarUrl={profile.avatarUrl}
            className="h-16 w-16"
            displayName={profile.displayName}
            fallbackClassName="text-lg"
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">
                {profile.displayName}
              </h1>
              {profile.handle ? <Badge>@{profile.handle}</Badge> : null}
              <Badge>#{profile.publicUserNumber}</Badge>
              <Badge>{getPublicRank(profile.role)}</Badge>
            </div>
            <p className="text-sm text-[color:var(--text-dim)]">
              Joined {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : "Unknown"}
            </p>
            {profile.badges.length ? <UserBadgeRow badges={profile.badges} /> : null}
          </div>
        </div>

        {result.viewer?.isOwner ? (
          <Link href="/community/profile/edit">
            <Button variant="secondary">Edit profile</Button>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          {profile.bio ? (
            <Card className="space-y-3">
              <h2 className="text-base font-semibold text-[color:var(--text)]">About</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--text-muted)]">{profile.bio}</p>
            </Card>
          ) : null}

          {(profile.location || profile.links.length) ? (
            <Card className="space-y-4">
              <h2 className="text-base font-semibold text-[color:var(--text)]">Profile details</h2>
              {profile.location ? (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-dim)]">Location</p>
                  <p className="text-sm text-[color:var(--text)]">{profile.location}</p>
                </div>
              ) : null}
              {profile.links.length ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-dim)]">Links</p>
                  <div className="flex flex-col gap-2">
                    {profile.links.map((link: { label: string; url: string }) => (
                      <a
                        className="text-sm text-[color:var(--accent)] transition hover:text-white"
                        href={link.url}
                        key={`${link.label}-${link.url}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          ) : null}

          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[color:var(--text)]">Recent threads</h2>
              <span className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-dim)]">
                {profile.stats.threadCount} total
              </span>
            </div>
            {profile.recentThreads.length ? (
              <div className="space-y-3">
                {profile.recentThreads.map((thread: any) => (
                  <Link
                    className="block border-b border-[color:var(--border)] pb-3 last:border-b-0 last:pb-0"
                    href={`/community/t/${thread._id}`}
                    key={thread._id}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[color:var(--text)] transition hover:text-[color:var(--accent)]">
                        {thread.title}
                      </p>
                      <p className="text-xs text-[color:var(--text-dim)]">
                        {thread.status !== "open" ? `${thread.status} · ` : ""}
                        {new Date(thread.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <StateCard
                description="No visible thread history is available on this profile."
                title="No recent threads"
              />
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-[color:var(--text)]">Activity</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-dim)]">Threads</p>
                <p className="mt-1 text-2xl font-semibold text-[color:var(--text)]">{profile.stats.threadCount}</p>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-dim)]">Posts</p>
                <p className="mt-1 text-2xl font-semibold text-[color:var(--text)]">{profile.stats.postCount}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
