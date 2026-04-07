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
import { useState } from "react";

export function AdminResellersManager() {
  const result = useQuery(api.resellers.adminResellerIndex, {});
  const upsertReseller = useMutation(api.resellers.upsertReseller);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactHandleOrEmail, setContactHandleOrEmail] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPending(true);
      setError(null);
      await upsertReseller({
        name,
        slug,
        contactName,
        contactHandleOrEmail,
        status: status as any,
        notes: notes.trim() || undefined,
      });
      setName("");
      setSlug("");
      setContactName("");
      setContactHandleOrEmail("");
      setStatus("active");
      setNotes("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save reseller.");
    } finally {
      setPending(false);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Internal" title="Resellers" description="Loading reseller records and key activity." />
        <StateCard title="Loading reseller records" description="Preparing the internal reseller tooling view." />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Internal" title="Resellers" description="Reseller tooling is restricted to internal roles." />
        <StateCard title="Access unavailable" description={result.message ?? "Access unavailable."} tone="error" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Resellers" }]}
        eyebrow="Internal"
        title="Reseller tools"
        description="Internal reseller records, key batches, issuance, and redemption visibility. No reseller-facing dashboard is exposed."
      />

      {result.canManage ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Create reseller record</h2>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Name</label>
                <Input onChange={(event) => setName(event.target.value)} value={name} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Slug</label>
                <Input onChange={(event) => setSlug(event.target.value)} value={slug} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Contact name</label>
                <Input onChange={(event) => setContactName(event.target.value)} value={contactName} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Contact handle or email</label>
                <Input onChange={(event) => setContactHandleOrEmail(event.target.value)} value={contactHandleOrEmail} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Status</label>
                <select
                  className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100"
                  onChange={(event) => setStatus(event.target.value)}
                  value={status}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Notes</label>
                <Textarea onChange={(event) => setNotes(event.target.value)} rows={4} value={notes} />
              </div>
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <div className="flex justify-end">
              <Button disabled={pending} type="submit">
                {pending ? "Saving..." : "Create reseller"}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <StateCard
          title="Read-only access"
          description="This role can inspect reseller records and redemption history but cannot create or modify reseller data."
          tone="warning"
        />
      )}

      {result.items.length ? (
        <div className="grid gap-4">
          {result.items.map((item: any) => (
            <Card className="space-y-4" key={item._id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{item.name}</h2>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.status}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.batchCount} batches
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.redeemedCount}/{item.keyCount} redeemed
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {item.contactName} · {item.contactHandleOrEmail}
                  </p>
                  {item.notes ? <p className="text-sm text-slate-500">{item.notes}</p> : null}
                </div>
                <Link href={`/admin/resellers/${item.slug}`}>
                  <Button variant="secondary">Open reseller</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <StateCard title="No reseller records yet" description="Create the first reseller record to begin internal batch management." />
      )}
    </div>
  );
}
