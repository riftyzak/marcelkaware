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

const entryTypes = [
  ["added", "Added"],
  ["improved", "Improved"],
  ["fixed", "Fixed"],
  ["knownIssues", "Known Issues"],
] as const;

function toText(entries: any[], type: string) {
  return entries.filter((entry) => entry.type === type).map((entry) => entry.body).join("\n");
}

export function AdminChangelogEditor({ slug }: { slug: string }) {
  const router = useRouter();
  const result = useQuery(
    api.changelogs.adminChangelogDetail,
    slug === "new" ? "skip" : { slug },
  );
  const upsertChangelog = useMutation(api.changelogs.upsertChangelog);
  const setPublished = useMutation(api.changelogs.setChangelogPublished);
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [releasedAt, setReleasedAt] = useState("");
  const [published, setPublishedState] = useState(false);
  const [entryBodies, setEntryBodies] = useState<Record<string, string>>({
    added: "",
    improved: "",
    fixed: "",
    knownIssues: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (result?.changelog) {
      setVersion(result.changelog.version);
      setTitle(result.changelog.title);
      setCustomSlug(result.changelog.slug);
      setSummary(result.changelog.summary);
      setReleasedAt(new Date(result.changelog.releasedAt).toISOString().slice(0, 10));
      setPublishedState(result.changelog.published);
      setEntryBodies({
        added: toText(result.changelog.entries, "added"),
        improved: toText(result.changelog.entries, "improved"),
        fixed: toText(result.changelog.entries, "fixed"),
        knownIssues: toText(result.changelog.entries, "knownIssues"),
      });
    }
  }, [result]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPending(true);
      setError(null);
      const entries = Object.entries(entryBodies).flatMap(([type, body]) =>
        body
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => ({ type, body: line })),
      );
      const releaseTimestamp = releasedAt
        ? new Date(`${releasedAt}T00:00:00`).getTime()
        : Date.now();
      const changelogId = await upsertChangelog({
        changelogId: result?.changelog?._id,
        version,
        title,
        slug: customSlug,
        summary,
        entries: entries as any,
        releasedAt: releaseTimestamp,
      });
      if (changelogId && published !== Boolean(result?.changelog?.published)) {
        await setPublished({ changelogId, published });
      }
      router.push("/admin/changelog");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save changelog.");
    } finally {
      setPending(false);
    }
  }

  if (slug !== "new" && result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Changelog editor" description="Loading changelog data." />
        <StateCard title="Loading changelog" description="Preparing the editor state." />
      </div>
    );
  }

  if (slug !== "new" && result && !result.ok) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Changelog editor" description="Changelog editing is restricted to admins." />
        <StateCard title="Changelog unavailable" description={result.message ?? "Changelog unavailable."} tone="error" actionHref="/admin/changelog" actionLabel="Back to changelog" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <Link href="/admin/changelog">
            <Button variant="secondary">Back to changelog</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Changelog", href: "/admin/changelog" }, { label: slug === "new" ? "New" : "Edit" }]}
        eyebrow="Admin"
        title={slug === "new" ? "Create changelog" : "Edit changelog"}
        description="Separate admin flow for versioned, structured release notes grouped by change type."
      />
      <Card className="space-y-5">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Version</label>
              <Input onChange={(event) => setVersion(event.target.value)} value={version} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Release date</label>
              <Input onChange={(event) => setReleasedAt(event.target.value)} type="date" value={releasedAt} />
            </div>
          </div>
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
          {entryTypes.map(([type, label]) => (
            <div className="space-y-2" key={type}>
              <label className="text-sm text-slate-300">{label}</label>
              <Textarea
                onChange={(event) =>
                  setEntryBodies((current) => ({
                    ...current,
                    [type]: event.target.value,
                  }))
                }
                placeholder="One line per changelog entry."
                rows={4}
                value={entryBodies[type]}
              />
            </div>
          ))}
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
            <input checked={published} className="h-4 w-4 accent-cyan-400" onChange={(event) => setPublishedState(event.target.checked)} type="checkbox" />
            Published
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="flex justify-end">
            <Button disabled={pending} type="submit">
              {pending ? "Saving..." : "Save changelog"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
