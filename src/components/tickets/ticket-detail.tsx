"use client";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

const ticketStatusLabels: Record<string, string> = {
  open: "Open",
  staffWaiting: "Waiting on staff",
  userWaiting: "Waiting on you",
  resolved: "Resolved",
  closed: "Closed",
};

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const result = useQuery(api.tickets.viewerTicketDetail, { ticketId: ticketId as any });
  const addReply = useMutation(api.tickets.addTicketReply);
  const closeTicket = useMutation(api.tickets.closeTicket);
  const reopenTicket = useMutation(api.tickets.reopenTicket);
  const [body, setBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [replyPending, setReplyPending] = useState(false);
  const [actionPending, setActionPending] = useState<"close" | "reopen" | null>(null);

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Dashboard", href: "/app" },
            { label: "Support", href: "/app/tickets" },
            { label: "Ticket" },
          ]}
          title="Loading ticket"
          description="Loading ticket."
        />
        <StateCard description="Loading replies, status, and the current support context." title="Preparing ticket view" />
      </div>
    );
  }

  if (!result.ok || !result.ticket) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Dashboard", href: "/app" },
            { label: "Support", href: "/app/tickets" },
            { label: "Ticket" },
          ]}
          title="Ticket unavailable"
          description="This ticket is not available."
        />
        <StateCard
          actionHref="/app/tickets"
          actionLabel="Back to tickets"
          description={result.message ?? "This ticket is not available."}
          title="Ticket not available"
          tone="warning"
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
      });
      setBody("");
    } catch (cause) {
      setReplyError(cause instanceof Error ? cause.message : "Unable to send reply.");
    } finally {
      setReplyPending(false);
    }
  }

  async function runTicketAction(action: "close" | "reopen") {
    try {
      setActionPending(action);
      setActionError(null);
      if (action === "close") {
        await closeTicket({ ticketId: ticket._id });
      } else {
        await reopenTicket({ ticketId: ticket._id });
      }
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to update ticket.");
    } finally {
      setActionPending(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageIntro
        actions={
          <>
            <Link href="/app/tickets">
              <Button variant="secondary">Back to tickets</Button>
            </Link>
            {ticket.status === "closed" ? (
              <Button
                disabled={actionPending !== null}
                onClick={() => void runTicketAction("reopen")}
                variant="secondary"
              >
                {actionPending === "reopen" ? "Reopening..." : "Reopen ticket"}
              </Button>
            ) : (
              <Button
                disabled={actionPending !== null}
                onClick={() => void runTicketAction("close")}
                variant="secondary"
              >
                {actionPending === "close" ? "Closing..." : "Close ticket"}
              </Button>
            )}
          </>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Support", href: "/app/tickets" },
          { label: ticket.subject },
        ]}
        title={ticket.subject}
        description={undefined}
      />

      <div className="space-y-3 border-b border-[color:var(--border)] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{ticketStatusLabels[ticket.status] ?? ticket.status}</Badge>
          <Badge className="capitalize">{ticket.category}</Badge>
          <Badge className={ticket.priority === "high" ? "border-amber-400/20 bg-amber-400/10 text-amber-100" : undefined}>
            {ticket.priority === "high" ? "High priority" : "Normal priority"}
          </Badge>
        </div>
        <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
          <p>Created {new Date(ticket.createdAt).toLocaleString()}</p>
          <p>Last updated {new Date(ticket.updatedAt).toLocaleString()}</p>
        </div>
        {actionError ? <p className="text-sm text-red-300">{actionError}</p> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          {result.replies.map((reply: any) => (
            <div className="space-y-3 border-b border-[color:var(--border)] pb-4" key={reply._id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/10 bg-slate-950/60 text-sm font-medium text-slate-200">
                    {reply.authorRole === "supportStaff" || reply.authorRole === "admin" ? "ST" : "YO"}
                  </div>
                  <div className="space-y-1">
                    <Badge className="capitalize">{reply.authorRole === "supportStaff" || reply.authorRole === "admin" ? "Staff" : "You"}</Badge>
                    <p className="text-xs text-slate-500">{new Date(reply.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{reply.body}</p>
            </div>
          ))}

          {ticket.status !== "closed" ? (
            <div className="space-y-4 border-t border-[color:var(--border)] pt-4">
              <form className="space-y-4" onSubmit={submitReply}>
                <h2 className="text-lg font-semibold text-white">Reply</h2>
                <Textarea
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write your reply."
                  required
                  rows={7}
                  value={body}
                />
                {replyError ? <p className="text-sm text-red-300">{replyError}</p> : null}
                <div className="flex justify-end">
                  <Button disabled={replyPending} type="submit">
                    {replyPending ? "Sending..." : "Send reply"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <StateCard
              description="Closed tickets cannot receive new replies until reopened."
              title="This ticket is closed"
              tone="warning"
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-3 border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
            <h2 className="text-lg font-semibold text-white">Current account context</h2>
            <div className="space-y-3 text-sm text-slate-400">
              <p>
                Subscription {result.context.currentSubscription.status}
                {result.context.currentSubscription.renewalAt
                  ? ` · renews ${new Date(result.context.currentSubscription.renewalAt).toLocaleString()}`
                  : ""}
              </p>
              <p>Assigned staff {result.context.assignedTo?.displayName ?? "Unassigned"}</p>
              <p>Ticket ID {ticket._id}</p>
            </div>
          </div>
          <div className="space-y-3 border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
            <h2 className="text-lg font-semibold text-white">Snapshot at creation</h2>
            <div className="space-y-3 text-sm text-slate-400">
              <p>
                Access {result.context.snapshot.subscription.accessTier} · subscription {result.context.snapshot.subscription.status}
              </p>
              <p>
                Account {result.context.snapshot.account.accountState} · active devices {result.context.snapshot.account.activeDeviceCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
