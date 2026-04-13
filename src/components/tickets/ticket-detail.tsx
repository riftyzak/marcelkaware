"use client";

import { api } from "../../../convex/_generated/api";
import { ticketDepartmentLabels } from "../../../shared/support";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { normalizeClientErrorMessage } from "@/lib/errors/normalize-client-error";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { KeyRound, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TicketRichTextEditor } from "./ticket-rich-text-editor";
import { TicketRichTextRenderer } from "./ticket-rich-text-renderer";

const ticketStatusLabels: Record<string, string> = {
  open: "Open",
  staffWaiting: "Waiting on staff",
  userWaiting: "Waiting on you",
  resolved: "Resolved",
  closed: "Closed",
};

function guestStorageKey(ticketNumber: number) {
  return `guest-ticket:${ticketNumber}:password`;
}

function ActorBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-dim)]">{label}</p>
      <p className="text-sm text-[color:var(--text)]">{value}</p>
    </div>
  );
}

export function TicketDetail({ ticketNumber }: { ticketNumber: number }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const viewerTicket = useQuery(
    api.communitySupport.viewerTicketDetail,
    isAuthenticated ? { ticketNumber } : "skip",
  );
  const addViewerReply = useAction(api.communitySupportNode.submitViewerTicketReply);
  const addGuestReply = useAction(api.communitySupportNode.submitGuestTicketReply);
  const readGuestTicket = useAction(api.communitySupportNode.readGuestTicket);
  const closeTicket = useMutation(api.communitySupport.closeViewerTicket);
  const reopenTicket = useMutation(api.communitySupport.reopenViewerTicket);
  const [guestPassword, setGuestPassword] = useState("");
  const [guestReplyHtml, setGuestReplyHtml] = useState("");
  const [viewerReplyHtml, setViewerReplyHtml] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [guestPending, setGuestPending] = useState(false);
  const [replyPending, setReplyPending] = useState(false);
  const [actionPending, setActionPending] = useState<"close" | "reopen" | null>(null);
  const [guestTicketData, setGuestTicketData] = useState<any | null>(null);

  useEffect(() => {
    if (isAuthenticated || typeof window === "undefined") {
      return;
    }

    const storedPassword = window.sessionStorage.getItem(guestStorageKey(ticketNumber));
    if (!storedPassword) {
      return;
    }

    setGuestPassword(storedPassword);
    void (async () => {
      try {
        const result = await readGuestTicket({
          ticketNumber,
          password: storedPassword,
        });
        if (!result.ok) {
          setGuestTicketData(null);
          setGuestError(result.message ?? "Unable to unlock ticket.");
          return;
        }
        setGuestTicketData(result);
        setGuestError(null);
      } catch (error) {
        setGuestTicketData(null);
        setGuestError(normalizeClientErrorMessage(error, "Unable to unlock ticket."));
      }
    })();
  }, [isAuthenticated, readGuestTicket, ticketNumber]);

  const resolvedTicket = useMemo(() => {
    if (isAuthenticated) {
      return viewerTicket?.ok ? viewerTicket : null;
    }
    return guestTicketData;
  }, [guestTicketData, isAuthenticated, viewerTicket]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Community", href: "/community" },
            { label: "Support", href: "/community/support" },
            { label: "Ticket" },
          ]}
          title="Loading ticket"
          description="Preparing the ticket view."
        />
        <StateCard title="Loading ticket" description="Fetching replies, current state, and access context." />
      </div>
    );
  }

  if (isAuthenticated && viewerTicket === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Community", href: "/community" },
            { label: "Support", href: "/community/support" },
            { label: "Ticket" },
          ]}
          title="Loading ticket"
          description="Fetching account-bound ticket details."
        />
        <StateCard title="Loading ticket" description="Fetching replies, current state, and account context." />
      </div>
    );
  }

  async function unlockGuestTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setGuestPending(true);
      const normalizedPassword = guestPassword.trim().toUpperCase();
      const result = await readGuestTicket({
        ticketNumber,
        password: normalizedPassword,
      });
      if (!result.ok) {
        setGuestTicketData(null);
        setGuestError(result.message ?? "Unable to unlock ticket.");
        return;
      }
      window.sessionStorage.setItem(guestStorageKey(ticketNumber), normalizedPassword);
      setGuestPassword(normalizedPassword);
      setGuestTicketData(result);
      setGuestError(null);
    } catch (error) {
      setGuestTicketData(null);
      setGuestError(normalizeClientErrorMessage(error, "Unable to unlock ticket."));
    } finally {
      setGuestPending(false);
    }
  }

  async function submitViewerReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setReplyPending(true);
      setViewerError(null);
      const result = await addViewerReply({
        ticketNumber,
        bodyHtml: viewerReplyHtml,
      });
      if (!result.ok) {
        setViewerError(result.message ?? "Unable to send reply.");
        return;
      }
      setViewerReplyHtml("");
    } catch (error) {
      setViewerError(normalizeClientErrorMessage(error, "Unable to send reply."));
    } finally {
      setReplyPending(false);
    }
  }

  async function submitGuestReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setReplyPending(true);
      setGuestError(null);
      const replyResult = await addGuestReply({
        ticketNumber,
        password: guestPassword,
        bodyHtml: guestReplyHtml,
      });
      if (!replyResult.ok) {
        setGuestError(replyResult.message ?? "Unable to send reply.");
        return;
      }
      const refreshed = await readGuestTicket({
        ticketNumber,
        password: guestPassword,
      });
      if (!refreshed.ok) {
        setGuestTicketData(null);
        setGuestError(refreshed.message ?? "Unable to unlock ticket.");
        return;
      }
      setGuestTicketData(refreshed);
      setGuestReplyHtml("");
    } catch (error) {
      setGuestError(normalizeClientErrorMessage(error, "Unable to send reply."));
    } finally {
      setReplyPending(false);
    }
  }

  async function runViewerAction(action: "close" | "reopen") {
    try {
      setActionPending(action);
      setActionError(null);
      if (action === "close") {
        await closeTicket({ ticketNumber });
      } else {
        await reopenTicket({ ticketNumber });
      }
    } catch (error) {
      setActionError(normalizeClientErrorMessage(error, "Unable to update ticket."));
    } finally {
      setActionPending(null);
    }
  }

  if (!isAuthenticated && !resolvedTicket) {
    return (
      <div className="space-y-5">
        <PageIntro
          breadcrumbs={[
            { label: "Community", href: "/community" },
            { label: "Support", href: "/community/support" },
            { label: `Ticket #${ticketNumber}` },
          ]}
          title={`Ticket #${ticketNumber}`}
          description="Guest tickets require the generated ticket password."
        />

        <form className="mx-auto max-w-xl space-y-4 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--panel)] p-5" onSubmit={unlockGuestTicket}>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">Unlock guest ticket</h2>
            <p className="text-sm text-[color:var(--text-muted)]">
              Enter the ticket password generated when this guest ticket was opened.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[color:var(--text)]">Ticket password</label>
            <Input
              onChange={(event) => setGuestPassword(event.target.value.toUpperCase())}
              placeholder="IZNVFWXV"
              value={guestPassword}
            />
          </div>
          {guestError ? <p className="text-sm text-[#e39a9a]">{guestError}</p> : null}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-[color:var(--text-dim)]">
              <LockKeyhole className="h-4 w-4" />
              <span>Link + password access</span>
            </div>
            <Button disabled={guestPending} type="submit">
              {guestPending ? "Checking..." : "Unlock ticket"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (isAuthenticated && viewerTicket && (!viewerTicket.ok || !viewerTicket.ticket)) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Community", href: "/community" },
            { label: "Support", href: "/community/support" },
            { label: "Ticket" },
          ]}
          title="Ticket unavailable"
          description="This ticket is not available."
        />
        <StateCard
          actionHref="/community/support"
          actionLabel="Back to support"
          description={viewerTicket.message ?? "This ticket is not available."}
          title="Ticket not available"
          tone="warning"
        />
      </div>
    );
  }

  const ticket = resolvedTicket?.ticket;
  const replies = resolvedTicket?.replies ?? [];
  const isClosed = ticket?.status === "closed";
  const isGuestMode = !isAuthenticated;

  if (!ticket) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Community", href: "/community" },
            { label: "Support", href: "/community/support" },
            { label: "Ticket" },
          ]}
          title="Ticket unavailable"
          description="The ticket data could not be resolved."
        />
        <StateCard
          actionHref="/community/support"
          actionLabel="Back to support"
          description="This ticket could not be loaded. It may still be migrating or no longer exists."
          title="Ticket unavailable"
          tone="warning"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageIntro
        breadcrumbs={[
          { label: "Community", href: "/community" },
          { label: "Support", href: "/community/support" },
          { label: `Ticket #${ticket.publicTicketNumber}` },
        ]}
        title={`#${ticket.publicTicketNumber} · ${ticket.subject}`}
        actions={
          <>
            <Link href="/community/support">
              <Button variant="secondary">Back to support</Button>
            </Link>
            {!isGuestMode ? (
              isClosed ? (
                <Button
                  disabled={actionPending !== null}
                  onClick={() => void runViewerAction("reopen")}
                  variant="secondary"
                >
                  {actionPending === "reopen" ? "Reopening..." : "Reopen ticket"}
                </Button>
              ) : (
                <Button
                  disabled={actionPending !== null}
                  onClick={() => void runViewerAction("close")}
                  variant="secondary"
                >
                  {actionPending === "close" ? "Closing..." : "Close ticket"}
                </Button>
              )
            ) : null}
          </>
        }
      />

      <div className="space-y-3 border-b border-[color:var(--border)] pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{ticketStatusLabels[ticket.status] ?? ticket.status}</Badge>
          <Badge>{ticketDepartmentLabels[ticket.department as keyof typeof ticketDepartmentLabels]}</Badge>
          <Badge className={ticket.priority === "high" ? "border-amber-400/20 bg-amber-400/10 text-amber-100" : undefined}>
            {ticket.priority === "high" ? "High priority" : "Normal priority"}
          </Badge>
          {isGuestMode ? (
            <Badge className="border-[#8fb0d8]/20 bg-[#8fb0d8]/10 text-[#c8d9f0]">Guest ticket</Badge>
          ) : null}
        </div>

        <div className="grid gap-3 text-sm text-[color:var(--text-muted)] md:grid-cols-2">
          <ActorBadge label="Created" value={new Date(ticket.createdAt).toLocaleString()} />
          <ActorBadge label="Last activity" value={new Date(ticket.latestReplyAt).toLocaleString()} />
          {isGuestMode ? (
            <>
              <ActorBadge label="Guest name" value={resolvedTicket.guest.name} />
              <ActorBadge label="Guest email" value={resolvedTicket.guest.email} />
            </>
          ) : (
            <>
              <ActorBadge
                label="Assigned staff"
                value={resolvedTicket.context.assignedTo?.displayName ?? "Unassigned"}
              />
              <ActorBadge
                label="Subscription"
                value={
                  resolvedTicket.context.currentSubscription.renewalAt
                    ? `${resolvedTicket.context.currentSubscription.status} · renews ${new Date(
                        resolvedTicket.context.currentSubscription.renewalAt,
                      ).toLocaleDateString()}`
                    : resolvedTicket.context.currentSubscription.status
                }
              />
            </>
          )}
        </div>

        {actionError ? <p className="text-sm text-[#e39a9a]">{actionError}</p> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-4">
          {replies.map((reply: any) => {
            const isStaffReply =
              reply.authorType === "staff" ||
              reply.authorRole === "supportStaff" ||
              reply.authorRole === "admin";

            return (
              <div className="space-y-3 rounded-[14px] border border-[color:var(--border)] bg-[color:var(--panel)] p-4" key={reply._id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/10 bg-[#0e1319] text-xs font-semibold text-white">
                      {isGuestMode ? (isStaffReply ? "ST" : "GE") : isStaffReply ? "ST" : "YO"}
                    </div>
                    <div className="space-y-1">
                      <Badge className="capitalize">
                        {isGuestMode
                          ? isStaffReply
                            ? "Staff"
                            : "Guest"
                          : isStaffReply
                            ? "Staff"
                            : "You"}
                      </Badge>
                      <p className="text-xs text-[color:var(--text-dim)]">{new Date(reply.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <TicketRichTextRenderer body={reply.body} bodyHtml={reply.bodyHtml} />
              </div>
            );
          })}

          {isClosed ? (
            <StateCard
              title="This ticket is closed"
              description={
                isGuestMode
                  ? "Closed guest tickets are view-only."
                  : "Closed tickets cannot receive new replies until reopened."
              }
              tone="warning"
            />
          ) : isGuestMode ? (
            <form className="space-y-4 rounded-[14px] border border-[color:var(--border)] bg-[color:var(--panel)] p-4" onSubmit={submitGuestReply}>
              <h2 className="text-lg font-semibold text-white">Reply as guest</h2>
              <TicketRichTextEditor
                onChange={setGuestReplyHtml}
                placeholder="Write the next guest reply."
                value={guestReplyHtml}
              />
              {guestError ? <p className="text-sm text-[#e39a9a]">{guestError}</p> : null}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-[color:var(--text-dim)]">
                  <KeyRound className="h-4 w-4" />
                  <span>Password-locked guest thread</span>
                </div>
                <Button disabled={replyPending} type="submit">
                  {replyPending ? "Sending..." : "Send reply"}
                </Button>
              </div>
            </form>
          ) : (
            <form className="space-y-4 rounded-[14px] border border-[color:var(--border)] bg-[color:var(--panel)] p-4" onSubmit={submitViewerReply}>
              <h2 className="text-lg font-semibold text-white">Reply</h2>
              <TicketRichTextEditor
                onChange={setViewerReplyHtml}
                placeholder="Write the next update."
                value={viewerReplyHtml}
              />
              {viewerError ? <p className="text-sm text-[#e39a9a]">{viewerError}</p> : null}
              <div className="flex justify-end">
                <Button disabled={replyPending} type="submit">
                  {replyPending ? "Sending..." : "Send reply"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-4">
          {!isGuestMode ? (
            <>
              <div className="space-y-3 rounded-[14px] border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
                <h2 className="text-lg font-semibold text-white">Current account context</h2>
                <div className="space-y-3 text-sm text-[color:var(--text-muted)]">
                  <p>Owner {resolvedTicket.context.owner?.displayName ?? "Unknown"}</p>
                  <p>Account {resolvedTicket.context.snapshot.account.accountState}</p>
                  <p>Active launcher devices {resolvedTicket.context.snapshot.account.activeDeviceCount}</p>
                </div>
              </div>
              <div className="space-y-3 rounded-[14px] border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
                <h2 className="text-lg font-semibold text-white">Creation snapshot</h2>
                <div className="space-y-3 text-sm text-[color:var(--text-muted)]">
                  <p>
                    Access {resolvedTicket.context.snapshot.subscription.accessTier} · subscription{" "}
                    {resolvedTicket.context.snapshot.subscription.status}
                  </p>
                  <p>
                    Account {resolvedTicket.context.snapshot.account.accountState} · devices{" "}
                    {resolvedTicket.context.snapshot.account.activeDeviceCount}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <StateCard
              title="Guest ticket access"
              description="This ticket is not bound to an account. Keep the ticket number and password together if you need to open it again later."
            />
          )}
        </div>
      </div>
    </div>
  );
}
