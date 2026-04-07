"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useQuery } from "convex/react";
import Link from "next/link";

export function ChangelogFeed() {
  const result = useQuery(api.changelogs.publicChangelogIndex, {});

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Changelog" title="Changelog" description="Loading published release notes." />
        <StateCard title="Loading changelog" description="Preparing published release history." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Changelog"
        title="Changelog"
        description="Structured release notes for published changes, fixes, and known issues."
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
                      {item.version}
                    </span>
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-slate-400">{item.summary}</p>
                </div>
                <p className="text-sm text-slate-500">{new Date(item.releasedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-end">
                <Link href={`/changelog/${item.slug}`}>
                  <Button variant="secondary">Read release</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <StateCard title="No changelog entries published" description="Release notes will appear here once a published changelog exists." />
      )}
    </div>
  );
}
