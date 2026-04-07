"use client";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

const ticketStatusLabels: Record<string, string> = {
  open: "Open",
  staffWaiting: "Waiting on staff",
  userWaiting: "Waiting on user",
  resolved: "Resolved",
  closed: "Closed",
};

export function StaffTicketDetail({ ticketId }: { ticketId: string }) {
  const result = useQuery(api.tickets.staffTicketDetail, { ticketId: ticketId as any });
  const addReply = useMutation(api.tickets.addTicketReply);
  const assignTicket = useMutation(api.tickets.assignTicket);
  const setStatus = useMutation(api.tickets.staffSetTicketStatus);
  const [body, setBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [replyPending, setReplyPending] = useState(false);
  const [assignmentPending, setAssignmentPending] = useState(false);
  const [statusPending, setStatusPending] = useState(false);

  if (result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro
          breadcrumbs={[
            { label: "Admin", href: "/admin/users" },
            { label: "Ticket queue", href: "/admin/tickets" },
            { label: "Ticket" },
          ]}
          eyebrow="Operations"
          title="Loading ticket"
          description="Preparing the staff timeline, context, and assignment controls."
        />
        <StateCard description="Loading staff-visible ticket history and current lifecycle." title="Preparing ticket workspace" />
      </div>
    );
  }

  if (!result.ok || !result.ticket) {
    return (
      <div className="space-y-6">
        <PageIntro
          breadcrumbs={[
            { label: "Admin", href: "/admin/users" },
            { label: "Ticket queue", href: "/admin/tickets" },
            { label: "Ticket" },
          ]}
          eyebrow="Operations"
          title="Ticket unavailable"
          description="This ticket may be missing or outside the access allowed for the current staff role."
        />
        <StateCard
          actionHref="/admin/tickets"
          actionLabel="Back to queue"
          description={result.message ?? "This ticket is not available."}
          title="Ticket not available"
          tone="error"
        />
      </div>
    );
  }

  const ticket = result.ticket;

  async function submitReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setReplyPending(true);
      setReplyError(null);
      await addReply({
        ticketId: ticket._id,
        body,
        isInternalNote,
      });
      setBody("");
      setIsInternalNote(false);
    } catch (cause) {
      setReplyError(cause instanceof Error ? cause.message : "Unable to send reply.");
    } finally {
      setReplyPending(false);
    }
  }

  async function updateAssignment(nextAssignee: string) {
    try {
      setAssignmentPending(true);
      setActionError(null);
      await assignTicket({
        ticketId: ticket._id,
        assignedToUserId: nextAssignee ? (nextAssignee as any) : undefined,
      });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to update assignment.");
    } finally {
      setAssignmentPending(false);
    }
  }

  async function updateStatus(nextStatus: string) {
    try {
      setStatusPending(true);
      setActionError(null);
      await setStatus({
        ticketId: ticket._id,
        status: nextStatus as any,
      });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to update lifecycle.");
    } finally {
      setStatusPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <Link href="/admin/tickets">
            <Button variant="secondary">Back to queue</Button>
          </Link>
        }
        breadcrumbs={[
          { label: "Admin", href: "/admin/users" },
          { label: "Ticket queue", href: "/admin/tickets" },
          { label: ticket.subject },
        ]}
        eyebrow="Operations"
        title={ticket.subject}
        description="Staff-side ticket workspace with lifecycle controls, assignment, account context, and internal-note support."
      />

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{ticketStatusLabels[ticket.status] ?? ticket.status}</Badge>
          <Badge className="capitalize">{ticket.category}</Badge>
          <Badge className={ticket.priority === "high" ? "border-amber-400/20 bg-amber-400/10 text-amber-100" : undefined}>
            {ticket.priority === "high" ? "High priority" : "Normal priority"}
          </Badge>
          <Badge>{ticket.assignedToUserId ? "Assigned" : "Unassigned"}</Badge>
        </div>
        <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
          <p>
            Owner {result.context.owner?.displayName ?? "Unknown"}
            {result.context.owner?.email ? ` · ${result.context.owner.email}` : ""}
          </p>
          <p>Created {new Date(ticket.createdAt).toLocaleString()}</p>
          <p>Latest activity {new Date(ticket.latestReplyAt).toLocaleString()}</p>
          <p>Current assignee {result.context.assignedTo?.displayName ?? "Unassigned"}</p>
        </div>
        {actionError ? <p className="text-sm text-red-300">{actionError}</p> : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {result.replies.map((reply: any) => (
            <Card className="space-y-3" key={reply._id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-sm font-medium text-slate-200">
                    {reply.isInternalNote ? "IN" : reply.authorRole === "supportStaff" || reply.authorRole === "admin" ? "ST" : "US"}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="capitalize">{reply.authorRole}</Badge>
                      {reply.isInternalNote ? <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-100">Internal note</Badge> : null}
                    </div>
                    <p className="text-xs text-slate-500">{new Date(reply.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{reply.body}</p>
            </Card>
          ))}

          <Card className="space-y-4">
            <form className="space-y-4" onSubmit={submitReply}>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white">Staff reply</h2>
                <p className="text-sm text-slate-400">
                  Public replies move the lifecycle automatically. Internal notes stay staff-only and preserve the current user-facing status.
                </p>
              </div>
              <Textarea
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write the next user-facing update or internal note."
                required
                rows={8}
                value={body}
              />
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                <input
                  checked={isInternalNote}
                  className="h-4 w-4 rounded border border-white/10 bg-slate-950"
                  onChange={(event) => setIsInternalNote(event.target.checked)}
                  type="checkbox"
                />
                Add as internal note
              </label>
              {replyError ? <p className="text-sm text-red-300">{replyError}</p> : null}
              <div className="flex justify-end">
                <Button disabled={replyPending} type="submit">
                  {replyPending ? "Sending..." : isInternalNote ? "Save internal note" : "Send update"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Assignment</h2>
            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100"
              disabled={assignmentPending}
              onChange={(event) => void updateAssignment(event.target.value)}
              value={ticket.assignedToUserId ?? ""}
            >
              <option value="">Unassigned</option>
              {result.context.assignableStaff.map((staff: any) => (
                <option key={staff._id} value={staff._id}>
                  {staff.displayName} ({staff.role})
                </option>
              ))}
            </select>
            <p className="text-sm text-slate-500">
              {assignmentPending ? "Updating assignment..." : "Ticket ownership is tracked server-side and audited."}
            </p>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Lifecycle</h2>
            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100"
              disabled={statusPending}
              onChange={(event) => void updateStatus(event.target.value)}
              value={ticket.status}
            >
              <option value="open">Open</option>
              <option value="staffWaiting">Staff waiting</option>
              <option value="userWaiting">User waiting</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <p className="text-sm text-slate-500">
              {statusPending ? "Updating lifecycle..." : "Use lifecycle only when the queue state needs manual correction."}
            </p>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Current context</h2>
            <div className="space-y-3 text-sm text-slate-400">
              <p>
                Account {result.context.owner?.accountState ?? "unknown"} · role {result.context.owner?.role ?? "unknown"}
              </p>
              <p>
                Subscription {result.context.currentSubscription.status}
                {result.context.currentSubscription.renewalAt
                  ? ` · renews ${new Date(result.context.currentSubscription.renewalAt).toLocaleString()}`
                  : ""}
              </p>
              <p>Active launcher devices {result.context.activeDeviceCount}</p>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Creation snapshot</h2>
            <div className="space-y-3 text-sm text-slate-400">
              <p>
                Access {result.context.snapshot.subscription.accessTier} · subscription {result.context.snapshot.subscription.status}
              </p>
              <p>
                Account {result.context.snapshot.account.accountState} · devices {result.context.snapshot.account.activeDeviceCount}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
