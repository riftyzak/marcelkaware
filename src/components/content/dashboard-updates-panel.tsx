"use client";

import { api } from "../../../convex/_generated/api";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "convex/react";
import Link from "next/link";

export function DashboardUpdatesPanel() {
  const latestAnnouncement = useQuery(api.announcements.latestVisibleAnnouncement, {});
  const latestChangelog = useQuery(api.changelogs.latestPublishedChangelog, {});

  return (
    <section className="space-y-4 border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Updates</h2>
        <div className="flex gap-3 text-sm">
          <Link className="text-[color:var(--accent)] hover:text-white" href="/announcements">
            Announcements
          </Link>
          <Link className="text-[color:var(--accent)] hover:text-white" href="/changelog">
            Changelog
          </Link>
        </div>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm text-[color:var(--text-dim)]">Announcement</p>
          <p className="text-sm font-medium text-white">
            {latestAnnouncement === undefined
              ? "Loading..."
              : latestAnnouncement?.title ?? "No published announcements"}
          </p>
          {latestAnnouncement?.summary ? (
            <p className="text-sm text-[color:var(--text-muted)]">{latestAnnouncement.summary}</p>
          ) : null}
        </div>
        <Separator />
        <div className="space-y-1">
          <p className="text-sm text-[color:var(--text-dim)]">Changelog</p>
          <p className="text-sm font-medium text-white">
            {latestChangelog === undefined
              ? "Loading..."
              : latestChangelog?.title ?? "No published changelog"}
          </p>
          {latestChangelog?.summary ? (
            <p className="text-sm text-[color:var(--text-muted)]">{latestChangelog.summary}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
