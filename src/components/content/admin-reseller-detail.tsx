"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { normalizeClientErrorMessage } from "@/lib/errors/normalize-client-error";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
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

export function AdminResellerDetail({ slug }: { slug: string }) {
  const result = useQuery(api.resellers.adminResellerDetail, { slug });
  const upsertReseller = useMutation(api.resellers.upsertReseller);
  const createBatchWithKeys = useAction(api.resellerNode.createBatchWithGeneratedKeys);

  const [name, setName] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactHandleOrEmail, setContactHandleOrEmail] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [batchRef, setBatchRef] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [quantity, setQuantity] = useState("10");
  const [expiresAt, setExpiresAt] = useState("");
  const [batchNote, setBatchNote] = useState("");
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [savePending, setSavePending] = useState(false);
  const [batchPending, setBatchPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (result?.reseller) {
      setName(result.reseller.name);
      setCustomSlug(result.reseller.slug);
      setContactName(result.reseller.contactName);
      setContactHandleOrEmail(result.reseller.contactHandleOrEmail);
      setStatus(result.reseller.status);
      setNotes(result.reseller.notes ?? "");
    }
  }, [result]);

  async function onSaveReseller(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result?.reseller) {
      return;
    }
    try {
      setSavePending(true);
      setError(null);
      await upsertReseller({
        resellerId: result.reseller._id,
        name,
        slug: customSlug,
        contactName,
        contactHandleOrEmail,
        status: status as any,
        notes: notes.trim() || undefined,
      });
    } catch (cause) {
      setError(normalizeClientErrorMessage(cause, "Unable to save reseller."));
    } finally {
      setSavePending(false);
    }
  }

  async function onCreateBatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result?.reseller) {
      return;
    }
    try {
      setBatchPending(true);
      setError(null);
      const response = await createBatchWithKeys({
        resellerId: result.reseller._id,
        batchRef,
        durationDays: Number.parseInt(durationDays, 10) || 0,
        quantity: Number.parseInt(quantity, 10) || 0,
        expiresAt: fromDateTimeInput(expiresAt),
        internalNote: batchNote.trim() || undefined,
      });
      setGeneratedKeys(response.keys);
      setBatchRef("");
      setDurationDays("30");
      setQuantity("10");
      setExpiresAt("");
      setBatchNote("");
    } catch (cause) {
      setError(normalizeClientErrorMessage(cause, "Unable to generate batch."));
    } finally {
      setBatchPending(false);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Internal" title="Reseller" description="Loading reseller record and batch history." />
        <StateCard title="Loading reseller" description="Preparing reseller detail and key activity." />
      </div>
    );
  }

  if (!result.ok || !result.reseller) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Internal" title="Reseller" description="Reseller detail is restricted to internal roles." />
        <StateCard
          title="Reseller unavailable"
          description={result.message ?? "Reseller unavailable."}
          tone="error"
          actionHref="/admin/resellers"
          actionLabel="Back to resellers"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <Link href="/admin/resellers">
            <Button variant="secondary">Back to resellers</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Resellers", href: "/admin/resellers" }, { label: result.reseller.name }]}
        eyebrow="Internal"
        title={result.reseller.name}
        description="Internal reseller record, batch creation, and redemption visibility."
      />

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {result.reseller.status}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            created {new Date(result.reseller.createdAt).toLocaleDateString()}
          </span>
        </div>
        {result.canManage ? (
          <form className="space-y-4" onSubmit={onSaveReseller}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Name</label>
                <Input onChange={(event) => setName(event.target.value)} value={name} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Slug</label>
                <Input onChange={(event) => setCustomSlug(event.target.value)} value={customSlug} />
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
            <div className="flex justify-end">
              <Button disabled={savePending} type="submit">
                {savePending ? "Saving..." : "Save reseller"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-sm text-slate-300">
            <p>{result.reseller.contactName} · {result.reseller.contactHandleOrEmail}</p>
            {result.reseller.notes ? <p className="text-slate-400">{result.reseller.notes}</p> : null}
          </div>
        )}
      </Card>

      {result.canManage ? (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Create key batch</h2>
          <form className="space-y-4" onSubmit={onCreateBatch}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Internal batch reference</label>
                <Input onChange={(event) => setBatchRef(event.target.value)} value={batchRef} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Expires at</label>
                <Input onChange={(event) => setExpiresAt(event.target.value)} type="datetime-local" value={expiresAt} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Duration days</label>
                <Input onChange={(event) => setDurationDays(event.target.value)} type="number" value={durationDays} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Quantity</label>
                <Input onChange={(event) => setQuantity(event.target.value)} type="number" value={quantity} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Internal note</label>
                <Input onChange={(event) => setBatchNote(event.target.value)} value={batchNote} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button disabled={batchPending} type="submit">
                {batchPending ? "Generating..." : "Generate batch"}
              </Button>
            </div>
          </form>
          {generatedKeys.length ? (
            <div className="space-y-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
              <p className="text-sm font-medium text-cyan-50">Generated keys</p>
              <p className="text-xs text-cyan-100/80">
                Raw keys are shown once here for internal issuance. Only previews remain stored afterward.
              </p>
              <div className="grid gap-2">
                {generatedKeys.map((key) => (
                  <code className="rounded-2xl bg-slate-950/60 px-4 py-2 text-sm text-cyan-100" key={key}>
                    {key}
                  </code>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Batch history</h2>
        <p className="text-sm text-slate-400">
          Batch detail shows issue state, redemption history, preview-only keys, and revoke controls.
        </p>
        {result.batches.length ? (
          <div className="space-y-3">
            {result.batches.map((batch: any) => (
              <Link href={`/admin/resellers/batches/${batch._id}`} key={batch._id}>
                <Card className="space-y-3 transition hover:border-cyan-400/30 hover:bg-white/[0.06]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{batch.batchRef}</h3>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          {batch.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {batch.durationDays} days · {batch.quantity} requested · created {new Date(batch.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-xs text-slate-400 md:text-right">
                      <div><p>Total</p><p className="mt-1 text-white">{batch.counts.total}</p></div>
                      <div><p>Unissued</p><p className="mt-1 text-white">{batch.counts.unissued}</p></div>
                      <div><p>Issued</p><p className="mt-1 text-white">{batch.counts.issued}</p></div>
                      <div><p>Redeemed</p><p className="mt-1 text-white">{batch.counts.redeemed}</p></div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <StateCard title="No batches created" description="Batch history appears here after the first generation event." />
        )}
      </Card>
    </div>
  );
}
