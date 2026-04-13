"use client";

import { api } from "../../../convex/_generated/api";
import { ticketDepartmentLabels } from "../../../shared/support";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { normalizeClientErrorMessage } from "@/lib/errors/normalize-client-error";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { TicketRichTextEditor } from "./ticket-rich-text-editor";
import { TicketRichTextRenderer } from "./ticket-rich-text-renderer";

type RequesterType = "user" | "guest";

export function StaffTicketDetail({
  requesterType,
  ticketNumber,
}: {
  requesterType: RequesterType;
  ticketNumber: number;
}) {
  const result = useQuery(api.communitySupport.staffTicketDetail, { requesterType, ticketNumber });
  const addReply = useAction(api.communitySupportNode.submitStaffTicketReply);
  const assignTicket = useMutation(api.communitySupport.assignTicket);
  const setStatus = useMutation(api.communitySupport.staffSetTicketStatus);
  const [bodyHtml, setBodyHtml] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [replyPending, setReplyPending] = useState(false);
  const [assignmentPending, setAssignmentPending] = useState(false);
  const [statusPending, setStatusPending] = useState(false);

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Admin", href: "/admin/users" },
            { label: "Ticket queue", href: "/admin/tickets" },
            { label: "Ticket" },
          ]}
          title="Loading ticket"
          description="Loading staff ticket workspace."
        />
        <StateCard title="Preparing ticket" description="Loading staff-visible history, requester data, and lifecycle state." />
      </div>
    );
  }

  if (!result.ok || !result.ticket) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Admin", href: "/admin/users" },
            { label: "Ticket queue", href: "/admin/tickets" },
            { label: "Ticket" },
          ]}
          title="Ticket unavailable"
          description="This ticket is not available."
        />
        <StateCard
          title="Ticket not available"
          description={result.message ?? "This ticket is not available."}
          actionHref="/admin/tickets"
          actionLabel="Back to queue"
          tone="error"
        />
      </div>
    );
  }

  const ticket = result.ticket;
  const userContext = requesterType === "user" ? result.context : null;

  async function submitReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setReplyPending(true);
      setReplyError(null);
      const result = await addReply({
        requesterType,
        ticketNumber,
        bodyHtml,
        isInternalNote,
      });
      if (!result.ok) {
        setReplyError(result.message ?? "Unable to send reply.");
        return;
      }
      setBodyHtml("");
      setIsInternalNote(false);
    } catch (cause) {
      setReplyError(normalizeClientErrorMessage(cause, "Unable to send reply."));
    } finally {
      setReplyPending(false);
    }
  }

  async function updateAssignment(nextAssignee: string) {
    try {
      setAssignmentPending(true);
      setActionError(null);
      await assignTicket({
        requesterType,
        ticketNumber,
        assignedToUserId: nextAssignee ? (nextAssignee as any) : undefined,
      });
    } catch (cause) {
      setActionError(normalizeClientErrorMessage(cause, "Unable to update assignment."));
    } finally {
      setAssignmentPending(false);
    }
  }

  async function updateStatus(nextStatus: string) {
    try {
      setStatusPending(true);
      setActionError(null);
      await setStatus({
        requesterType,
        ticketNumber,
        status: nextStatus as any,
      });
    } catch (cause) {
      setActionError(normalizeClientErrorMessage(cause, "Unable to update lifecycle."));
    } finally {
      setStatusPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageIntro
        breadcrumbs={[
          { label: "Admin", href: "/admin/users" },
          { label: "Ticket queue", href: "/admin/tickets" },
          { label: `#${ticket.publicTicketNumber}` },
        ]}
        title={`#${ticket.publicTicketNumber} · ${ticket.subject}`}
        actions={
          <Link href="/admin/tickets">
            <Button variant="secondary">Back to queue</Button>
          </Link>
        }
      />

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{requesterType === "guest" ? "Guest" : "User"}</Badge>
          <Badge className="capitalize">{ticket.status}</Badge>
          <Badge>{ticketDepartmentLabels[ticket.department as keyof typeof ticketDepartmentLabels]}</Badge>
          <Badge className={ticket.priority === "high" ? "border-amber-400/20 bg-amber-400/10 text-amber-100" : undefined}>
            {ticket.priority === "high" ? "High priority" : "Normal priority"}
          </Badge>
          <Badge>{ticket.assignedToUserId ? "Assigned" : "Unassigned"}</Badge>
        </div>

        <div className="grid gap-2 text-sm text-[color:var(--text-muted)] sm:grid-cols-2">
          <p>
            Requester{" "}
            {requesterType === "guest"
              ? result.context.guest?.name ?? "Unknown"
              : result.context.owner?.displayName ?? "Unknown"}
          </p>
          <p>Created {new Date(ticket.createdAt).toLocaleString()}</p>
          <p>Latest activity {new Date(ticket.latestReplyAt).toLocaleString()}</p>
          <p>Current assignee {result.context.assignedTo?.displayName ?? "Unassigned"}</p>
        </div>

        {actionError ? <p className="text-sm text-[#e39a9a]">{actionError}</p> : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-4">
          {result.replies.map((reply: any) => {
            const isStaffReply = reply.authorType === "staff";

            return (
              <Card className="space-y-3" key={reply._id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/10 bg-[#0e1319] text-xs font-semibold text-white">
                      {reply.isInternalNote ? "IN" : isStaffReply ? "ST" : requesterType === "guest" ? "GE" : "US"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="capitalize">
                          {reply.isInternalNote
                            ? "Internal note"
                            : isStaffReply
                              ? "Staff"
                              : requesterType === "guest"
                                ? "Guest"
                                : "User"}
                        </Badge>
                      </div>
                      <p className="text-xs text-[color:var(--text-dim)]">{new Date(reply.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <TicketRichTextRenderer body={reply.body} bodyHtml={reply.bodyHtml} />
              </Card>
            );
          })}

          <Card className="space-y-4">
            <form className="space-y-4" onSubmit={submitReply}>
              <h2 className="text-lg font-semibold text-white">Reply</h2>
              <TicketRichTextEditor
                onChange={setBodyHtml}
                placeholder="Write the next staff update or internal note."
                value={bodyHtml}
              />
              <label className="flex items-center gap-3 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-4 py-3 text-sm text-[color:var(--text)]">
                <input
                  checked={isInternalNote}
                  className="h-4 w-4 rounded border border-white/10 bg-slate-950"
                  onChange={(event) => setIsInternalNote(event.target.checked)}
                  type="checkbox"
                />
                Add as internal note
              </label>
              {replyError ? <p className="text-sm text-[#e39a9a]">{replyError}</p> : null}
              <div className="flex justify-end">
                <Button disabled={replyPending} type="submit">
                  {replyPending ? "Sending..." : isInternalNote ? "Save note" : "Send update"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Assignment</h2>
            <select
              className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 text-sm text-[color:var(--text)] outline-none"
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
            <p className="text-sm text-[color:var(--text-dim)]">
              {assignmentPending ? "Updating assignment..." : "Assignments are audited."}
            </p>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Lifecycle</h2>
            <select
              className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 text-sm text-[color:var(--text)] outline-none"
              disabled={statusPending}
              onChange={(event) => void updateStatus(event.target.value)}
              value={ticket.status}
            >
              <option value="open">Open</option>
              <option value="staffWaiting">Waiting on staff</option>
              <option value="userWaiting">Waiting on requester</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <p className="text-sm text-[color:var(--text-dim)]">
              {statusPending ? "Updating lifecycle..." : "Lifecycle state is shared across the staff queue."}
            </p>
          </Card>

          {requesterType === "user" ? (
            <>
              <Card className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Account context</h2>
                <div className="space-y-3 text-sm text-[color:var(--text-muted)]">
                  <p>
                    {result.context.owner?.displayName ?? "Unknown"}
                    {result.context.owner?.email ? ` · ${result.context.owner.email}` : ""}
                  </p>
                  <p>
                    Account {result.context.owner?.accountState ?? "unknown"} · role {result.context.owner?.role ?? "unknown"}
                  </p>
                  <p>
                    Subscription {userContext?.currentSubscription?.status ?? "none"}
                    {userContext?.currentSubscription?.renewalAt
                      ? ` · renews ${new Date(userContext.currentSubscription.renewalAt).toLocaleDateString()}`
                      : ""}
                  </p>
                  <p>Active launcher devices {userContext?.activeDeviceCount ?? 0}</p>
                </div>
              </Card>

              <Card className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Creation snapshot</h2>
                <div className="space-y-3 text-sm text-[color:var(--text-muted)]">
                  <p>
                    Access {userContext?.snapshot?.subscription.accessTier ?? "unknown"} · subscription {userContext?.snapshot?.subscription.status ?? "unknown"}
                  </p>
                  <p>
                    Account {userContext?.snapshot?.account.accountState ?? "unknown"} · devices {userContext?.snapshot?.account.activeDeviceCount ?? 0}
                  </p>
                </div>
              </Card>
            </>
          ) : (
            <Card className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Guest details</h2>
              <div className="space-y-3 text-sm text-[color:var(--text-muted)]">
                <p>{result.context.guest?.name ?? "Unknown guest"}</p>
                <p>{result.context.guest?.email ?? "No guest email"}</p>
                <p>Guest tickets are unlocked with link + password outside the account system.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
