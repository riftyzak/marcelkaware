"use client";

import { api } from "../../../convex/_generated/api";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

export function AdminResellerBatchDetail({ batchId }: { batchId: string }) {
  const result = useQuery(api.resellers.adminBatchDetail, { batchId: batchId as any });
  const issueBatch = useMutation(api.resellers.issueBatch);
  const revokeKey = useMutation(api.resellers.revokeKey);
  const [revokeNotes, setRevokeNotes] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onIssueBatch() {
    if (!result?.batch) {
      return;
    }
    try {
      setPendingAction("issue-batch");
      setError(null);
      await issueBatch({ batchId: result.batch._id });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to issue batch.");
    } finally {
      setPendingAction(null);
    }
  }

  async function onRevokeKey(keyId: string) {
    try {
      setPendingAction(keyId);
      setError(null);
      await revokeKey({
        keyId: keyId as any,
        internalNote: revokeNotes[keyId]?.trim() || undefined,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to revoke key.");
    } finally {
      setPendingAction(null);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Internal" title="Batch detail" description="Loading batch state, key previews, and redemption history." />
        <StateCard title="Loading batch" description="Preparing batch detail." />
      </div>
    );
  }

  if (!result.ok || !result.batch || !result.reseller) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Internal" title="Batch detail" description="Batch detail is restricted to internal roles." />
        <StateCard
          title="Batch unavailable"
          description={result.message ?? "Batch unavailable."}
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
          <Link href={`/admin/resellers/${result.reseller.slug}`}>
            <Button variant="secondary">Back to reseller</Button>
          </Link>
        }
        breadcrumbs={[
          { label: "Admin", href: "/admin/users" },
          { label: "Resellers", href: "/admin/resellers" },
          { label: result.reseller.name, href: `/admin/resellers/${result.reseller.slug}` },
          { label: result.batch.batchRef },
        ]}
        eyebrow="Internal"
        title={result.batch.batchRef}
        description="Preview-only key inventory with issuance state, redemption history, and revocation controls."
      />

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="space-y-2 bg-slate-950/40">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reseller</p>
          <p className="text-lg font-semibold text-white">{result.reseller.name}</p>
        </Card>
        <Card className="space-y-2 bg-slate-950/40">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Duration</p>
          <p className="text-lg font-semibold text-white">{result.batch.durationDays} days</p>
        </Card>
        <Card className="space-y-2 bg-slate-950/40">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quantity</p>
          <p className="text-lg font-semibold text-white">{result.batch.quantity}</p>
        </Card>
        <Card className="space-y-2 bg-slate-950/40">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
          <p className="text-lg font-semibold text-white">{result.batch.status}</p>
        </Card>
      </div>

      {result.canManage && result.batch.status === "draft" ? (
        <Card className="space-y-4">
          <p className="text-sm text-slate-300">
            Newly generated keys remain unissued until explicitly marked as issued for the reseller.
          </p>
          <div className="flex justify-end">
            <ConfirmActionButton
              confirmLabel="Confirm issue"
              disabled={pendingAction === "issue-batch"}
              idleLabel="Mark batch issued"
              onConfirm={onIssueBatch}
              pendingLabel="Issuing..."
              variant="secondary"
            />
          </div>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Keys</h2>
        {result.keys.length ? (
          <div className="space-y-3">
            {result.keys.map((key: any) => (
              <div
                className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                key={key._id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs text-slate-200">
                        {key.keyPreview}
                      </code>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {key.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      created {new Date(key.createdAt).toLocaleString()}
                      {key.expiresAt ? ` · expires ${new Date(key.expiresAt).toLocaleString()}` : ""}
                    </p>
                    {key.redeemedBy ? (
                      <p className="text-sm text-slate-400">
                        Redeemed by {key.redeemedBy.displayName}
                        {key.redeemedBy.handle ? ` (@${key.redeemedBy.handle})` : ""}
                        {key.redeemedAt ? ` · ${new Date(key.redeemedAt).toLocaleString()}` : ""}
                      </p>
                    ) : null}
                    {key.internalNote ? <p className="text-sm text-slate-500">{key.internalNote}</p> : null}
                  </div>
                  {result.canManage && key.status !== "redeemed" && key.status !== "revoked" ? (
                    <div className="w-full space-y-3 lg:w-80">
                      <Input
                        onChange={(event) =>
                          setRevokeNotes((current) => ({ ...current, [key._id]: event.target.value }))
                        }
                        placeholder="Optional revoke note"
                        value={revokeNotes[key._id] ?? ""}
                      />
                      <ConfirmActionButton
                        confirmLabel="Confirm revoke"
                        disabled={pendingAction === key._id}
                        idleLabel="Revoke key"
                        onConfirm={() => onRevokeKey(key._id)}
                        pendingLabel="Revoking..."
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <StateCard title="No keys found" description="Key previews will appear here once the batch is generated." />
        )}
      </Card>
    </div>
  );
}
