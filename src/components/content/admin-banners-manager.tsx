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

export function AdminBannersManager() {
  const result = useQuery(api.banners.adminBannerIndex, {});
  const setPublished = useMutation(api.banners.setBannerPublished);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function togglePublished(bannerId: string, published: boolean) {
    try {
      setPendingId(bannerId);
      setError(null);
      await setPublished({ bannerId: bannerId as any, published });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update banner.");
    } finally {
      setPendingId(null);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Banners" description="Loading banner controls." />
        <StateCard title="Loading banners" description="Preparing the active banner management flow." />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Banners" description="Banner management is restricted to admins." />
        <StateCard title="Access unavailable" description={result.message ?? "Access unavailable."} tone="error" />
      </div>
    );
  }

  const now = Date.now();

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <Link href="/admin/banners/new">
            <Button>Create banner</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Banners" }]}
        eyebrow="Admin"
        title="Site banners"
        description="Controlled announcement banners for maintenance notices, operational updates, and targeted status messaging."
      />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {result.items.length ? (
        <div className="grid gap-4">
          {result.items.map((item: any) => (
            <Card className="space-y-4" key={item._id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{item.message}</h2>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.severity}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.audienceScope}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.slug}
                    {item.startsAt ? ` · starts ${new Date(item.startsAt).toLocaleString()}` : ""}
                    {item.endsAt ? ` · ends ${new Date(item.endsAt).toLocaleString()}` : ""}
                  </p>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Window preview</p>
                    <p className="mt-2">
                      {!item.startsAt && !item.endsAt
                        ? "Always eligible when published."
                        : item.startsAt && item.startsAt > now
                          ? "Scheduled for a future window."
                          : item.endsAt && item.endsAt < now
                            ? "Visibility window has elapsed."
                            : "Currently inside the configured visibility window."}
                    </p>
                    {item.ctaLabel && item.ctaUrl ? (
                      <p className="mt-2 text-xs text-slate-500">
                        CTA {item.ctaLabel} → {item.ctaUrl}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/admin/banners/${item.slug}`}>
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
          title="No banners configured"
          description="Create a banner when you need a controlled site-wide message."
          actionHref="/admin/banners/new"
          actionLabel="Create banner"
        />
      )}
    </div>
  );
}
