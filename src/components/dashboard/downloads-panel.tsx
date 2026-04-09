"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useQuery } from "convex/react";
import Link from "next/link";

export function DownloadsPanel() {
  const downloads = useQuery(api.downloads.viewerDownloads, {});

  if (downloads === undefined) {
    return <p className="text-sm text-[color:var(--text-muted)]">Loading downloads...</p>;
  }

  if (!downloads.allowed) {
    return (
      <div className="space-y-4">
        <PageIntro title="Downloads" description="Active access is required for current delivery." />
        <StateCard
          title="Downloads unavailable"
          description={downloads.reason ?? "Active access is required for current delivery."}
          actionHref="/purchase"
          actionLabel="View purchase"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageIntro title="Downloads" description="Current release channel." />
      {downloads.items.length ? (
        <div className="overflow-hidden border border-[color:var(--border)] bg-[color:var(--panel)]">
          {downloads.items.map((item: any) => (
            <div
              className="flex flex-col gap-4 border-b border-[color:var(--border)] px-4 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between"
              key={item._id}
            >
              <div className="min-w-0 space-y-1">
                <h2 className="text-base font-semibold text-white">{item.title}</h2>
                <p className="text-sm text-[color:var(--text-dim)]">
                  {item.version} · {item.platform} · {new Date(item.publishedAt).toLocaleDateString()}
                </p>
                {item.summary ? (
                  <p className="text-sm text-[color:var(--text-muted)]">{item.summary}</p>
                ) : null}
              </div>
              <a href={item.downloadUrl}>
                <Button>Download</Button>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <StateCard
          title="No release available"
          description="A download will appear here after a release is published."
        />
      )}
      <div className="text-sm text-[color:var(--text-dim)]">
        <Link className="hover:text-white" href="/changelog">
          View changelog
        </Link>
      </div>
    </div>
  );
}
