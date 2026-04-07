"use client";

import { api } from "../../../convex/_generated/api";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

export function AdminChangelogManager() {
  const result = useQuery(api.changelogs.adminChangelogIndex, {});
  const setPublished = useMutation(api.changelogs.setChangelogPublished);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function togglePublished(changelogId: string, published: boolean) {
    try {
      setPendingId(changelogId);
      setError(null);
      await setPublished({ changelogId: changelogId as any, published });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update changelog.");
    } finally {
      setPendingId(null);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro title="Changelog" description="Loading changelog." />
        <StateCard title="Loading changelog" description="Preparing the admin release-note index." />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <PageIntro title="Changelog" description="Admins only." />
        <StateCard title="Access unavailable" description={result.message ?? "Access unavailable."} tone="error" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageIntro
        actions={
          <Link href="/admin/changelog/new">
            <Button>Create changelog</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Changelog" }]}
        title="Changelog"
        description="Manage release notes."
      />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {result.items.length ? (
        <div className="grid gap-4">
          {result.items.map((item: any) => (
            <Card className="space-y-3" key={item._id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.version}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  {item.summary ? <p className="text-sm text-slate-400">{item.summary}</p> : null}
                  <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                    {["added", "improved", "fixed", "knownIssues"].map((type) => {
                      const count = item.entries.filter((entry: any) => entry.type === type).length;
                      return count ? (
                        <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1" key={type}>
                          {type} {count}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.slug} · release {new Date(item.releasedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/admin/changelog/${item.slug}`}>
                    <Button variant="secondary">Edit</Button>
                  </Link>
                  <ConfirmActionButton
                    confirmLabel={item.published ? "Confirm unpublish" : "Confirm publish"}
                    disabled={pendingId === item._id}
                    idleLabel={item.published ? "Unpublish" : "Publish"}
                    onConfirm={() => togglePublished(item._id, !item.published)}
                    pendingLabel="Saving..."
                    variant={item.published ? "danger" : "secondary"}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <StateCard title="No changelog entries created" description="Create the first changelog entry to begin publishing release notes." actionHref="/admin/changelog/new" actionLabel="Create changelog" />
      )}
    </div>
  );
}
