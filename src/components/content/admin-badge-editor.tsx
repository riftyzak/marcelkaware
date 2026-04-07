"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminBadgeEditor({ slug }: { slug: string }) {
  const router = useRouter();
  const result = useQuery(api.badges.adminBadgeDetail, slug === "new" ? "skip" : { slug });
  const upsertBadge = useMutation(api.badges.upsertBadge);
  const setPublished = useMutation(api.badges.setBadgePublished);
  const [name, setName] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [description, setDescription] = useState("");
  const [styleVariant, setStyleVariant] = useState("neutral");
  const [iconKey, setIconKey] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [published, setPublishedState] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (result?.badge) {
      setName(result.badge.name);
      setCustomSlug(result.badge.slug);
      setDescription(result.badge.description);
      setStyleVariant(result.badge.styleVariant);
      setIconKey(result.badge.iconKey ?? "");
      setSortOrder(String(result.badge.sortOrder));
      setPublishedState(result.badge.published);
    }
  }, [result]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPending(true);
      setError(null);
      const badgeId = await upsertBadge({
        badgeId: result?.badge?._id,
        name,
        slug: customSlug,
        description,
        styleVariant: styleVariant as any,
        iconKey: iconKey.trim() || undefined,
        sortOrder: Number.parseInt(sortOrder, 10) || 0,
      });
      if (badgeId && published !== Boolean(result?.badge?.published)) {
        await setPublished({ badgeId, published });
      }
      router.push("/admin/badges");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save badge.");
    } finally {
      setPending(false);
    }
  }

  if (slug !== "new" && result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Badge editor" description="Loading badge data." />
        <StateCard title="Loading badge" description="Preparing the badge editor." />
      </div>
    );
  }

  if (slug !== "new" && result && !result.ok) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Badge editor" description="Badge editing is restricted to admins." />
        <StateCard
          title="Badge unavailable"
          description={result.message ?? "Badge unavailable."}
          tone="error"
          actionHref="/admin/badges"
          actionLabel="Back to badges"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <Link href="/admin/badges">
            <Button variant="secondary">Back to badges</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Badges", href: "/admin/badges" }, { label: slug === "new" ? "New" : "Edit" }]}
        eyebrow="Admin"
        title={slug === "new" ? "Create badge" : "Edit badge"}
        description="Badge definitions stay separate from user assignments and remain purely visual."
      />
      <Card className="space-y-5">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Name</label>
            <Input onChange={(event) => setName(event.target.value)} value={name} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Slug</label>
              <Input onChange={(event) => setCustomSlug(event.target.value)} value={customSlug} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Sort order</label>
              <Input onChange={(event) => setSortOrder(event.target.value)} type="number" value={sortOrder} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Description</label>
            <Textarea onChange={(event) => setDescription(event.target.value)} rows={4} value={description} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Style</label>
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100"
                onChange={(event) => setStyleVariant(event.target.value)}
                value={styleVariant}
              >
                <option value="neutral">Neutral</option>
                <option value="cyan">Cyan</option>
                <option value="emerald">Emerald</option>
                <option value="amber">Amber</option>
                <option value="rose">Rose</option>
                <option value="violet">Violet</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Icon key</label>
              <Input onChange={(event) => setIconKey(event.target.value)} placeholder="Optional, e.g. shield" value={iconKey} />
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
            <input
              checked={published}
              className="h-4 w-4 accent-cyan-400"
              onChange={(event) => setPublishedState(event.target.checked)}
              type="checkbox"
            />
            Published
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="flex justify-end">
            <Button disabled={pending} type="submit">
              {pending ? "Saving..." : "Save badge"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
