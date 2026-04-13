"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { normalizeClientErrorMessage } from "@/lib/errors/normalize-client-error";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function toDateTimeInput(value?: number) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeInput(value: string) {
  return value ? new Date(value).getTime() : undefined;
}

export function AdminBannerEditor({ slug }: { slug: string }) {
  const router = useRouter();
  const result = useQuery(api.banners.adminBannerDetail, slug === "new" ? "skip" : { slug });
  const upsertBanner = useMutation(api.banners.upsertBanner);
  const setPublished = useMutation(api.banners.setBannerPublished);

  const [customSlug, setCustomSlug] = useState("");
  const [severity, setSeverity] = useState("info");
  const [message, setMessage] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [audienceScope, setAudienceScope] = useState("public");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [published, setPublishedState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (result?.banner) {
      setCustomSlug(result.banner.slug);
      setSeverity(result.banner.severity);
      setMessage(result.banner.message);
      setCtaLabel(result.banner.ctaLabel ?? "");
      setCtaUrl(result.banner.ctaUrl ?? "");
      setAudienceScope(result.banner.audienceScope);
      setStartsAt(toDateTimeInput(result.banner.startsAt));
      setEndsAt(toDateTimeInput(result.banner.endsAt));
      setPublishedState(result.banner.published);
    }
  }, [result]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPending(true);
      setError(null);
      const bannerId = await upsertBanner({
        bannerId: result?.banner?._id,
        slug: customSlug,
        severity: severity as any,
        message,
        ctaLabel: ctaLabel.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
        audienceScope: audienceScope as any,
        startsAt: fromDateTimeInput(startsAt),
        endsAt: fromDateTimeInput(endsAt),
      });
      if (bannerId && published !== Boolean(result?.banner?.published)) {
        await setPublished({ bannerId, published });
      }
      router.push("/admin/banners");
    } catch (cause) {
      setError(normalizeClientErrorMessage(cause, "Unable to save banner."));
    } finally {
      setPending(false);
    }
  }

  if (slug !== "new" && result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Banner editor" description="Loading banner data." />
        <StateCard title="Loading banner" description="Preparing the banner editor." />
      </div>
    );
  }

  if (slug !== "new" && result && !result.ok) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Banner editor" description="Banner editing is restricted to admins." />
        <StateCard
          title="Banner unavailable"
          description={result.message ?? "Banner unavailable."}
          tone="error"
          actionHref="/admin/banners"
          actionLabel="Back to banners"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <Link href="/admin/banners">
            <Button variant="secondary">Back to banners</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Banners", href: "/admin/banners" }, { label: slug === "new" ? "New" : "Edit" }]}
        eyebrow="Admin"
        title={slug === "new" ? "Create banner" : "Edit banner"}
        description="One active banner at a time, with constrained severity, audience, and optional visibility windows."
      />
      <Card className="space-y-5">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Slug</label>
            <Input onChange={(event) => setCustomSlug(event.target.value)} value={customSlug} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Severity</label>
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100"
                onChange={(event) => setSeverity(event.target.value)}
                value={severity}
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Audience</label>
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100"
                onChange={(event) => setAudienceScope(event.target.value)}
                value={audienceScope}
              >
                <option value="public">Public</option>
                <option value="authenticated">Authenticated</option>
                <option value="subscribers">Subscribers</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Message</label>
            <Textarea onChange={(event) => setMessage(event.target.value)} rows={4} value={message} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">CTA label</label>
              <Input onChange={(event) => setCtaLabel(event.target.value)} value={ctaLabel} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">CTA URL</label>
              <Input onChange={(event) => setCtaUrl(event.target.value)} value={ctaUrl} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Start time</label>
              <Input onChange={(event) => setStartsAt(event.target.value)} type="datetime-local" value={startsAt} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">End time</label>
              <Input onChange={(event) => setEndsAt(event.target.value)} type="datetime-local" value={endsAt} />
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
              {pending ? "Saving..." : "Save banner"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
