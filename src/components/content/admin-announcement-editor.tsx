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

export function AdminAnnouncementEditor({ slug }: { slug: string }) {
  const router = useRouter();
  const result = useQuery(
    api.announcements.adminAnnouncementDetail,
    slug === "new" ? "skip" : { slug },
  );
  const upsertAnnouncement = useMutation(api.announcements.upsertAnnouncement);
  const setPublished = useMutation(api.announcements.setAnnouncementPublished);
  const [title, setTitle] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [audienceScope, setAudienceScope] = useState("public");
  const [pinned, setPinned] = useState(false);
  const [published, setPublishedState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (result?.announcement) {
      setTitle(result.announcement.title);
      setCustomSlug(result.announcement.slug);
      setSummary(result.announcement.summary);
      setBody(result.announcement.body);
      setAudienceScope(result.announcement.audienceScope);
      setPinned(result.announcement.pinned);
      setPublishedState(result.announcement.published);
    }
  }, [result]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPending(true);
      setError(null);
      const announcementId = await upsertAnnouncement({
        announcementId: result?.announcement?._id,
        title,
        slug: customSlug,
        summary,
        body,
        audienceScope: audienceScope as any,
        pinned,
      });
      if (announcementId && published !== Boolean(result?.announcement?.published)) {
        await setPublished({ announcementId, published });
      }
      router.push("/admin/announcements");
    } catch (cause) {
      setError(normalizeClientErrorMessage(cause, "Unable to save announcement."));
    } finally {
      setPending(false);
    }
  }

  if (slug !== "new" && result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Announcement editor" description="Loading announcement data." />
        <StateCard title="Loading announcement" description="Preparing the editor state." />
      </div>
    );
  }

  if (slug !== "new" && result && !result.ok) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Announcement editor" description="Announcement editing is restricted to admins." />
        <StateCard title="Announcement unavailable" description={result.message ?? "Announcement unavailable."} tone="error" actionHref="/admin/announcements" actionLabel="Back to announcements" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <Link href="/admin/announcements">
            <Button variant="secondary">Back to announcements</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Announcements", href: "/admin/announcements" }, { label: slug === "new" ? "New" : "Edit" }]}
        eyebrow="Admin"
        title={slug === "new" ? "Create announcement" : "Edit announcement"}
        description="Separate admin flow for published notices with scoped audience and pinning controls."
      />
      <Card className="space-y-5">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Title</label>
            <Input onChange={(event) => setTitle(event.target.value)} value={title} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Slug</label>
            <Input onChange={(event) => setCustomSlug(event.target.value)} value={customSlug} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Summary</label>
            <Textarea onChange={(event) => setSummary(event.target.value)} rows={4} value={summary} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Body</label>
            <Textarea onChange={(event) => setBody(event.target.value)} rows={10} value={body} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Audience</label>
              <select className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100" onChange={(event) => setAudienceScope(event.target.value)} value={audienceScope}>
                <option value="public">Public</option>
                <option value="members">Members</option>
                <option value="subscribers">Subscribers</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="flex flex-col justify-end gap-3 text-sm text-slate-300">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <input checked={pinned} className="h-4 w-4 accent-cyan-400" onChange={(event) => setPinned(event.target.checked)} type="checkbox" />
                Pinned
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <input checked={published} className="h-4 w-4 accent-cyan-400" onChange={(event) => setPublishedState(event.target.checked)} type="checkbox" />
                Published
              </label>
            </div>
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="flex justify-end">
            <Button disabled={pending} type="submit">
              {pending ? "Saving..." : "Save announcement"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
