"use client";

import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useQuery } from "convex/react";

const sectionTitles: Record<string, string> = {
  added: "Added",
  improved: "Improved",
  fixed: "Fixed",
  knownIssues: "Known Issues",
};

export function ChangelogDetail({ slug }: { slug: string }) {
  const result = useQuery(api.changelogs.publicChangelogDetail, { slug });

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro breadcrumbs={[{ label: "Changelog", href: "/changelog" }, { label: "Release" }]} eyebrow="Changelog" title="Loading release" description="Fetching the published changelog entry." />
        <StateCard title="Loading release" description="Preparing structured release notes." />
      </div>
    );
  }

  if (!result.ok || !result.changelog) {
    return (
      <div className="space-y-6">
        <PageIntro breadcrumbs={[{ label: "Changelog", href: "/changelog" }, { label: "Release" }]} eyebrow="Changelog" title="Release unavailable" description="This release note may be unpublished or unavailable." />
        <StateCard title="Release not available" description={result.message ?? "Release not available."} tone="warning" actionHref="/changelog" actionLabel="Back to changelog" />
      </div>
    );
  }

  const grouped = Object.entries(
    result.changelog.entries.reduce((acc: Record<string, string[]>, entry: any) => {
      acc[entry.type] = acc[entry.type] ?? [];
      acc[entry.type].push(entry.body);
      return acc;
    }, {}),
  ) as Array<[string, string[]]>;

  return (
    <div className="space-y-6">
      <PageIntro
        breadcrumbs={[{ label: "Changelog", href: "/changelog" }, { label: result.changelog.title }]}
        eyebrow="Changelog"
        title={result.changelog.title}
        description={result.changelog.summary}
      />
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {result.changelog.version}
          </span>
          <span>Released {new Date(result.changelog.releasedAt).toLocaleDateString()}</span>
        </div>
      </Card>
      {grouped.map(([type, entries]) => (
        <Card className="space-y-4" key={type}>
          <h2 className="text-lg font-semibold text-white">{sectionTitles[type] ?? type}</h2>
          <ul className="space-y-3 text-sm leading-7 text-slate-200">
            {entries.map((entry: string, index: number) => (
              <li key={`${type}-${index}`}>{entry}</li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
