"use client";

import { api } from "../../../convex/_generated/api";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { UserBadgeRow } from "@/components/community/user-badge-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { normalizeClientErrorMessage } from "@/lib/errors/normalize-client-error";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function AdminUserBadgeAssignment({ userId }: { userId: string }) {
  const result = useQuery(api.badges.adminUserBadgeAssignments, { userId: userId as any });
  const assignBadge = useMutation(api.badges.assignBadgeToUser);
  const removeBadge = useMutation(api.badges.removeBadgeFromUser);
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [pending, setPending] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableBadges = useMemo(() => {
    if (!result?.ok) {
      return [];
    }
    const assignedIds = new Set(result.assignments.map((assignment: any) => assignment.badge._id));
    return result.badges.filter((badge: any) => !assignedIds.has(badge._id));
  }, [result]);

  async function onAssign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBadgeId) {
      setError("Select a badge to assign.");
      return;
    }
    try {
      setPending(true);
      setError(null);
      await assignBadge({
        userId: userId as any,
        badgeId: selectedBadgeId as any,
        internalNote: internalNote.trim() || undefined,
      });
      setSelectedBadgeId("");
      setInternalNote("");
    } catch (cause) {
      setError(normalizeClientErrorMessage(cause, "Unable to assign badge."));
    } finally {
      setPending(false);
    }
  }

  async function onRemove(userBadgeId: string) {
    try {
      setRemovingId(userBadgeId);
      setError(null);
      await removeBadge({ userBadgeId: userBadgeId as any });
    } catch (cause) {
      setError(normalizeClientErrorMessage(cause, "Unable to remove badge."));
    } finally {
      setRemovingId(null);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro title="User badges" description="Loading assignments." />
        <StateCard title="Loading assignments" description="Preparing badge definitions and current assignments." />
      </div>
    );
  }

  if (!result.ok || !result.targetUser) {
    return (
      <div className="space-y-4">
        <PageIntro title="User badges" description="Admins only." />
        <StateCard
          title="Assignment view unavailable"
          description={result.message ?? "Assignment view unavailable."}
          tone="error"
          actionHref="/admin/users"
          actionLabel="Back to users"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageIntro
        actions={
          <Link href="/admin/users">
            <Button variant="secondary">Back to users</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Users", href: "/admin/users" }, { label: result.targetUser.displayName }, { label: "Badges" }]}
        title={`Badges for ${result.targetUser.displayName}`}
        description="Manual badge assignment."
      />

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Current badges</h2>
        {result.assignments.length ? (
          <div className="space-y-4">
            {result.assignments.map((assignment: any) => (
              <div
                className="flex flex-col gap-4 border border-white/10 bg-slate-950/40 px-4 py-4 md:flex-row md:items-start md:justify-between"
                key={assignment._id}
              >
                <div className="space-y-2">
                  <UserBadgeRow badges={[assignment.badge]} />
                  <p className="text-sm text-slate-400">{assignment.badge.description}</p>
                  <p className="text-xs text-slate-500">
                    Assigned by {assignment.assignedByName} · {new Date(assignment.assignedAt).toLocaleString()}
                    {assignment.internalNote ? ` · note: ${assignment.internalNote}` : ""}
                  </p>
                </div>
                <ConfirmActionButton
                  confirmLabel="Confirm remove"
                  disabled={removingId === assignment._id}
                  idleLabel="Remove"
                  onConfirm={() => onRemove(assignment._id)}
                  pendingLabel="Removing..."
                />
              </div>
            ))}
          </div>
        ) : (
          <StateCard title="No badges assigned" description="This member does not have any manually assigned badges yet." />
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Assign badge</h2>
        {!availableBadges.length ? (
          <StateCard
            title="All badge definitions already assigned"
            description="No additional badge definitions are available for this member."
          />
        ) : null}
        <form className="space-y-4" onSubmit={onAssign}>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Badge</label>
            <select
              className="h-11 w-full rounded-[8px] border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100"
              onChange={(event) => setSelectedBadgeId(event.target.value)}
              value={selectedBadgeId}
            >
              <option value="">Select badge</option>
              {availableBadges.map((badge: any) => (
                <option key={badge._id} value={badge._id}>
                  {badge.name} · {badge.published ? "published" : "draft"}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Internal note</label>
            <Textarea
              onChange={(event) => setInternalNote(event.target.value)}
              placeholder="Optional assignment note for internal context."
              rows={4}
              value={internalNote}
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="flex justify-end">
            <Button disabled={pending || !availableBadges.length} type="submit">
              {pending ? "Assigning..." : "Assign badge"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
