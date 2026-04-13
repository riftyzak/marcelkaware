"use client";

import { api } from "../../../convex/_generated/api";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { normalizeClientErrorMessage } from "@/lib/errors/normalize-client-error";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

export function AdminAnnouncementsManager() {
  const result = useQuery(api.announcements.adminAnnouncementIndex, {});
  const setPublished = useMutation(api.announcements.setAnnouncementPublished);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function togglePublished(announcementId: string, published: boolean) {
    try {
      setPendingId(announcementId);
      setError(null);
      await setPublished({ announcementId: announcementId as any, published });
    } catch (cause) {
      setError(normalizeClientErrorMessage(cause, "Unable to update announcement."));
    } finally {
      setPendingId(null);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro title="Announcements" description="Loading announcements." />
        <StateCard title="Loading announcements" description="Preparing the admin announcement index." />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <PageIntro title="Announcements" description="Admins only." />
        <StateCard title="Access unavailable" description={result.message ?? "Access unavailable."} tone="error" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageIntro
        actions={
          <Link href="/admin/announcements/new">
            <Button>Create announcement</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Announcements" }]}
        title="Announcements"
        description="Manage announcement entries."
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
                      {item.audienceScope}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.published ? "Published" : "Draft"}
                    </span>
                    {item.pinned ? (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                        Pinned
                      </span>
                    ) : null}
                  </div>
                  {item.summary ? <p className="text-sm text-slate-400">{item.summary}</p> : null}
                  <p className="text-xs text-slate-500">
                    {item.slug} · {new Date(item.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/admin/announcements/${item.slug}`}>
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
        <StateCard title="No announcements created" description="Create the first announcement to start the content flow." actionHref="/admin/announcements/new" actionLabel="Create announcement" />
      )}
    </div>
  );
}
