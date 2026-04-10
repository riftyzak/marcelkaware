"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useQuery } from "convex/react";
import Link from "next/link";

function audienceLabel(scope: string) {
  switch (scope) {
    case "members":
      return "Members";
    case "subscribers":
      return "Subscribers";
    case "staff":
      return "Staff";
    default:
      return "Public";
  }
}

export function AnnouncementsFeed() {
  const result = useQuery(api.announcements.publicAnnouncementIndex, {});

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Announcements" title="Announcements" description="Loading the latest public and viewer-visible notices." />
        <StateCard title="Loading announcements" description="Preparing published notices for the current viewer." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          result.viewerTier === "guest" ? (
            <Link href="/login">
              <Button variant="secondary">Login</Button>
            </Link>
          ) : undefined
        }
        eyebrow="Announcements"
        title="Announcements"
        description="Operational notices, release communication, and account-relevant updates. Visibility remains scoped by published state and audience."
      />

      {result.items.length ? (
        <div className="grid gap-4">
          {result.items.map((item: any) => (
            <Card className="space-y-4" key={item._id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {audienceLabel(item.audienceScope)}
                    </span>
                    {item.pinned ? (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                        Pinned
                      </span>
                    ) : null}
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-slate-400">{item.summary}</p>
                </div>
                <p className="text-sm text-slate-500">
                  {new Date(item.publishedAt ?? item.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-end">
                <Link href={`/announcements/${item.slug}`}>
                  <Button variant="secondary">Read announcement</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <StateCard
          title="No announcements published"
          description="There are no viewer-visible announcements yet."
        />
      )}
    </div>
  );
}
