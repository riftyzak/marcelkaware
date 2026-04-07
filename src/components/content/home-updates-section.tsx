"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "convex/react";
import Link from "next/link";

export function HomeUpdatesSection() {
  const latestAnnouncement = useQuery(api.announcements.latestVisibleAnnouncement, {});
  const latestChangelog = useQuery(api.changelogs.latestPublishedChangelog, {});

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Announcements</p>
          <h2 className="text-2xl font-semibold text-white">
            {latestAnnouncement === undefined
              ? "Loading notice"
              : latestAnnouncement?.title ?? "No published announcements"}
          </h2>
        </div>
        <p className="text-sm leading-7 text-slate-300">
          {latestAnnouncement === undefined
            ? "Preparing the latest notice."
            : latestAnnouncement?.summary ?? "Operational and release notices will appear here once published."}
        </p>
        <div className="flex justify-end">
          <Link href="/announcements">
            <Button variant="secondary">View announcements</Button>
          </Link>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Changelog</p>
          <h2 className="text-2xl font-semibold text-white">
            {latestChangelog === undefined
              ? "Loading release notes"
              : latestChangelog?.title ?? "No published changelog"}
          </h2>
        </div>
        <p className="text-sm leading-7 text-slate-300">
          {latestChangelog === undefined
            ? "Preparing the latest release notes."
            : latestChangelog?.summary ?? "Structured release notes will appear here once published."}
        </p>
        <div className="flex justify-end">
          <Link href="/changelog">
            <Button variant="secondary">View changelog</Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}
