"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useQuery } from "convex/react";
import Link from "next/link";

export function AnnouncementDetail({ slug }: { slug: string }) {
  const result = useQuery(api.announcements.publicAnnouncementDetail, { slug });

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro breadcrumbs={[{ label: "Announcements", href: "/announcements" }, { label: "Announcement" }]} eyebrow="Announcements" title="Loading announcement" description="Fetching the published notice and audience-safe body." />
        <StateCard title="Loading announcement" description="Preparing the announcement body and metadata." />
      </div>
    );
  }

  if (!result.ok || !result.announcement) {
    return (
      <div className="space-y-6">
        <PageIntro breadcrumbs={[{ label: "Announcements", href: "/announcements" }, { label: "Announcement" }]} eyebrow="Announcements" title="Announcement unavailable" description="This announcement may be unpublished or outside the current audience scope." />
        <StateCard title="Announcement not available" description={result.message ?? "Announcement not available."} tone="warning" actionHref="/announcements" actionLabel="Back to announcements" />
      </div>
    );
  }

  const announcement = result.announcement;

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <Link href="/announcements">
            <Button variant="secondary">Back to announcements</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Announcements", href: "/announcements" }, { label: announcement.title }]}
        eyebrow="Announcements"
        title={announcement.title}
        description={announcement.summary}
      />
      <Card className="space-y-4">
        <p className="text-sm text-slate-500">
          Published {new Date(announcement.publishedAt ?? announcement.updatedAt).toLocaleString()}
        </p>
        <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{announcement.body}</div>
      </Card>
    </div>
  );
}
