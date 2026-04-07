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

export function AdminBadgesManager() {
  const result = useQuery(api.badges.adminBadgeIndex, {});
  const setPublished = useMutation(api.badges.setBadgePublished);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function togglePublished(badgeId: string, published: boolean) {
    try {
      setPendingId(badgeId);
      setError(null);
      await setPublished({ badgeId: badgeId as any, published });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update badge.");
    } finally {
      setPendingId(null);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Badges" description="Loading badge definitions." />
        <StateCard title="Loading badges" description="Preparing badge definitions and current assignment counts." />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Badges" description="Badge management is restricted to admins." />
        <StateCard title="Access unavailable" description={result.message ?? "Access unavailable."} tone="error" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <Link href="/admin/badges/new">
            <Button>Create badge</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Badges" }]}
        eyebrow="Admin"
        title="Badges"
        description="Controlled public identity markers with separate definition and user assignment flows."
      />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {result.items.length ? (
        <div className="grid gap-4">
          {result.items.map((item: any) => (
            <Card className="space-y-4" key={item._id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{item.name}</h2>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.styleVariant}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.published ? "Published" : "Draft"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.assignmentCount} assignments
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{item.description}</p>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Public display</p>
                    <p className="mt-2">
                      {item.published
                        ? "Visible on public profiles and discussion posts when assigned."
                        : "Draft only. Assignments can exist, but the badge stays hidden publicly."}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.slug} · order {item.sortOrder}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/admin/badges/${item.slug}`}>
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
        <StateCard
          title="No badges created"
          description="Create the first badge definition before assigning badges to members."
          actionHref="/admin/badges/new"
          actionLabel="Create badge"
        />
      )}
    </div>
  );
}
