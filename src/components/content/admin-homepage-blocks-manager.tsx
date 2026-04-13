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

const blockTypes = [
  "heroSupportText",
  "trustStrip",
  "featureRow",
  "faqRow",
  "ctaBlock",
] as const;

const blockTypeLabels: Record<(typeof blockTypes)[number], string> = {
  heroSupportText: "Hero support text",
  trustStrip: "Trust strip",
  featureRow: "Feature row",
  faqRow: "FAQ row",
  ctaBlock: "CTA block",
};

function blockPreview(item: any) {
  if (item.type === "heroSupportText") {
    return item.data.title;
  }
  if (item.type === "trustStrip") {
    return item.data.items.join(" · ");
  }
  if (item.type === "featureRow") {
    return `${item.data.title} · ${item.data.features.length} features`;
  }
  if (item.type === "faqRow") {
    return `${item.data.title} · ${item.data.items.length} FAQs`;
  }
  return item.data.title;
}

export function AdminHomepageBlocksManager() {
  const result = useQuery(api.homepageContent.adminHomepageBlockIndex, {});
  const setPublished = useMutation(api.homepageContent.setHomepageBlockPublished);
  const reorderBlocks = useMutation(api.homepageContent.reorderHomepageBlocks);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  async function togglePublished(blockId: string, published: boolean) {
    try {
      setPendingId(blockId);
      setError(null);
      await setPublished({ blockId: blockId as any, published });
    } catch (cause) {
      setError(normalizeClientErrorMessage(cause, "Unable to update homepage block."));
    } finally {
      setPendingId(null);
    }
  }

  async function moveBlock(blockId: string, direction: -1 | 1) {
    if (!result?.ok) {
      return;
    }
    const currentIndex = result.items.findIndex((item: any) => item._id === blockId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= result.items.length) {
      return;
    }
    const orderedIds = [...result.items.map((item: any) => item._id)];
    [orderedIds[currentIndex], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[currentIndex]];

    try {
      setReordering(true);
      setError(null);
      await reorderBlocks({ orderedIds: orderedIds as any });
    } catch (cause) {
      setError(normalizeClientErrorMessage(cause, "Unable to reorder homepage blocks."));
    } finally {
      setReordering(false);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Homepage content" description="Loading homepage content controls." />
        <StateCard title="Loading homepage blocks" description="Preparing the homepage block index." />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Homepage content" description="Homepage content management is restricted to admins." />
        <StateCard title="Access unavailable" description={result.message ?? "Access unavailable."} tone="error" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <>
            {blockTypes.map((type) => (
              <Link href={`/admin/homepage/new?type=${type}`} key={type}>
                <Button variant="secondary">New {blockTypeLabels[type]}</Button>
              </Link>
            ))}
          </>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Homepage content" }]}
        eyebrow="Admin"
        title="Homepage content"
        description="Typed, predictable homepage modules with explicit publish and ordering controls."
      />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {result.items.length ? (
        <div className="grid gap-4">
          {result.items.map((item: any, index: number) => (
            <Card className="space-y-4" key={item._id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{item.label}</h2>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {blockTypeLabels[item.type as keyof typeof blockTypeLabels] ?? item.type}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.published ? "Published" : "Draft"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      Order {item.sortOrder}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{item.slug}</p>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Preview</p>
                    <p className="mt-2 line-clamp-2">{blockPreview(item)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={reordering || index === 0}
                    onClick={() => void moveBlock(item._id, -1)}
                    variant="secondary"
                  >
                    Up
                  </Button>
                  <Button
                    disabled={reordering || index === result.items.length - 1}
                    onClick={() => void moveBlock(item._id, 1)}
                    variant="secondary"
                  >
                    Down
                  </Button>
                  <Link href={`/admin/homepage/${item.slug}`}>
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
          title="No homepage blocks configured"
          description="Create a typed homepage block to replace the static fallback sections."
          actionHref="/admin/homepage/new?type=heroSupportText"
          actionLabel="Create hero block"
        />
      )}
    </div>
  );
}
