"use client";

import { api } from "../../../convex/_generated/api";
import { ticketDepartmentDescriptions, ticketDepartmentLabels } from "../../../shared/support";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { normalizeClientErrorMessage } from "@/lib/errors/normalize-client-error";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { Check, Copy, KeyRound, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TicketRichTextEditor } from "./ticket-rich-text-editor";

const ticketStatusLabels: Record<string, string> = {
  open: "Open",
  staffWaiting: "Waiting on staff",
  userWaiting: "Waiting on you",
  resolved: "Resolved",
  closed: "Closed",
};

const departmentOptions = [
  "technicalQuestions",
  "accountRecovery",
  "emailChange",
  "unbanRequest",
  "other",
] as const;

function storageKey(ticketNumber: number) {
  return `guest-ticket:${ticketNumber}:password`;
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function TicketList() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const viewerTickets = useQuery(api.communitySupport.viewerTickets, isAuthenticated ? {} : "skip");
  const submitGuestTicket = useAction(api.communitySupportNode.submitGuestTicket);
  const [viewerSearch, setViewerSearch] = useState("");
  const [viewerStatusFilter, setViewerStatusFilter] = useState("all");
  const [guestForm, setGuestForm] = useState({
    guestName: "",
    guestEmail: "",
    department: "technicalQuestions",
    subject: "",
    bodyHtml: "",
  });
  const [guestLookup, setGuestLookup] = useState({
    ticketNumber: "",
    password: "",
  });
  const [guestPending, setGuestPending] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"password" | "link" | null>(null);
  const [createdGuestTicket, setCreatedGuestTicket] = useState<{
    publicTicketNumber: number;
    ticketPassword: string;
    href: string;
  } | null>(null);

  const filteredViewerTickets = useMemo(() => {
    const items = viewerTickets?.ok ? viewerTickets.items : [];
    const query = viewerSearch.trim().toLowerCase();

    return items.filter((ticket: any) => {
      if (viewerStatusFilter !== "all" && ticket.status !== viewerStatusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [ticket.subject, ticket.department, ticket.priority, ticket.status].some((value) =>
        String(value).toLowerCase().includes(query),
      );
    });
  }, [viewerSearch, viewerStatusFilter, viewerTickets]);

  async function handleGuestSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setGuestPending(true);
      setGuestError(null);
      setCreatedGuestTicket(null);
      const created = await submitGuestTicket({
        guestName: guestForm.guestName,
        guestEmail: guestForm.guestEmail,
        department: guestForm.department as any,
        subject: guestForm.subject,
        bodyHtml: guestForm.bodyHtml,
      });
      if (!created.ok) {
        setGuestError(created.message ?? "Unable to create guest ticket.");
        return;
      }

      window.sessionStorage.setItem(storageKey(created.publicTicketNumber), created.ticketPassword);
      setCreatedGuestTicket(created);
      setGuestLookup({
        ticketNumber: String(created.publicTicketNumber),
        password: created.ticketPassword,
      });
      setGuestForm({
        guestName: "",
        guestEmail: "",
        department: "technicalQuestions",
        subject: "",
        bodyHtml: "",
      });
    } catch (error) {
      setGuestError(normalizeClientErrorMessage(error, "Unable to create guest ticket."));
    } finally {
      setGuestPending(false);
    }
  }

  function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticketNumber = Number(guestLookup.ticketNumber.trim());
    const password = guestLookup.password.trim().toUpperCase();

    if (!Number.isInteger(ticketNumber) || ticketNumber < 1) {
      setLookupError("Enter a valid ticket number.");
      return;
    }

    if (password.length < 6) {
      setLookupError("Enter the ticket password.");
      return;
    }

    window.sessionStorage.setItem(storageKey(ticketNumber), password);
    window.location.assign(`/community/tickets/${ticketNumber}`);
  }

  async function handleCopy(field: "password" | "link", value: string) {
    await copyText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1400);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageIntro title="Support" description="Loading support workspace." />
        <StateCard title="Loading support" description="Preparing ticket access and current support state." />
      </div>
    );
  }

  if (isAuthenticated) {
    if (viewerTickets === undefined) {
      return (
        <div className="space-y-4">
          <PageIntro title="Support" description="Loading your tickets." />
          <StateCard title="Loading support" description="Fetching your private ticket list." />
        </div>
      );
    }

    if (!viewerTickets.ok) {
      return (
        <div className="space-y-4">
          <PageIntro title="Support" description="Your account does not currently have support access." />
          <StateCard
            title="Support unavailable"
            description={viewerTickets.message ?? "Support access is currently unavailable."}
            tone="warning"
          />
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <PageIntro
          title="Support"
          description="Private tickets tied to your account."
          breadcrumbs={[{ label: "Community", href: "/community" }, { label: "Support" }]}
          actions={
            <Link href="/community/support/new">
              <Button>New ticket</Button>
            </Link>
          }
        />

        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            onChange={(event) => setViewerSearch(event.target.value)}
            placeholder="Search by subject or department"
            value={viewerSearch}
          />
          <select
            className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 text-sm text-[color:var(--text)] outline-none"
            onChange={(event) => setViewerStatusFilter(event.target.value)}
            value={viewerStatusFilter}
          >
            <option value="all">All states</option>
            <option value="open">Open</option>
            <option value="staffWaiting">Waiting on staff</option>
            <option value="userWaiting">Waiting on you</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {filteredViewerTickets.length ? (
          <div className="divide-y divide-[color:var(--border)] border-y border-[color:var(--border)]">
            {filteredViewerTickets.map((ticket: any) => {
              const href =
                typeof ticket.href === "string"
                  ? ticket.href
                  : typeof ticket.publicTicketNumber === "number"
                    ? `/community/tickets/${ticket.publicTicketNumber}`
                    : null;

              const content = (
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-white">
                        {typeof ticket.publicTicketNumber === "number"
                          ? `#${ticket.publicTicketNumber} · ${ticket.subject}`
                          : ticket.subject}
                      </h2>
                      <Badge>{ticketStatusLabels[ticket.status] ?? ticket.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-[color:var(--text-dim)]">
                      <span>{ticketDepartmentLabels[ticket.department as keyof typeof ticketDepartmentLabels]}</span>
                      <span>{ticket.priority === "high" ? "High priority" : "Normal priority"}</span>
                      <span>{new Date(ticket.latestReplyAt).toLocaleDateString()}</span>
                      {!href ? <span className="text-[#caa36a]">Pending route migration</span> : null}
                    </div>
                  </div>
                </div>
              );

              if (!href) {
                return (
                  <div className="px-1 py-4" key={ticket._id ?? ticket.subject}>
                    {content}
                  </div>
                );
              }

              return (
                <Link className="block px-1 py-4 transition hover:bg-white/[0.02]" href={href} key={ticket.publicTicketNumber}>
                  {content}
                </Link>
              );
            })}
          </div>
        ) : (
          <StateCard
            title={viewerTickets.items.length ? "No matching tickets" : "No tickets yet"}
            description={
              viewerTickets.items.length
                ? "Try a different search or status filter."
                : "Open a ticket when you need direct support."
            }
            actionHref={viewerTickets.items.length ? undefined : "/community/support/new"}
            actionLabel={viewerTickets.items.length ? undefined : "Open ticket"}
            secondaryAction={
              viewerTickets.items.length ? (
                <Button
                  onClick={() => {
                    setViewerSearch("");
                    setViewerStatusFilter("all");
                  }}
                  variant="secondary"
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageIntro
        title="Support"
        description="Open a guest ticket or resume an existing one with your ticket number and password."
      />

      {createdGuestTicket ? (
        <div className="space-y-4 rounded-[16px] border border-[#8fb0d8]/30 bg-[#10161d] p-5">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#8fb0d8]">Guest ticket created</p>
            <h2 className="text-xl font-semibold text-white">
              Ticket #{createdGuestTicket.publicTicketNumber}
            </h2>
            <p className="text-sm text-[color:var(--text-muted)]">
              Save the password. Access to guest replies depends on both the link and the ticket password.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[12px] border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-dim)]">Ticket link</p>
              <p className="mt-2 break-all text-sm text-white">{createdGuestTicket.href}</p>
              <Button
                className="mt-3"
                onClick={() => void handleCopy("link", `${window.location.origin}${createdGuestTicket.href}`)}
                size="sm"
                variant="secondary"
              >
                {copiedField === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy link
              </Button>
            </div>
            <div className="rounded-[12px] border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-dim)]">Ticket password</p>
              <div className="mt-2 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#8fb0d8]" />
                <p className="text-base font-semibold tracking-[0.18em] text-white">{createdGuestTicket.ticketPassword}</p>
              </div>
              <Button
                className="mt-3"
                onClick={() => void handleCopy("password", createdGuestTicket.ticketPassword)}
                size="sm"
                variant="secondary"
              >
                {copiedField === "password" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy password
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <form className="space-y-5 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--panel)] p-5" onSubmit={handleGuestSubmit}>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white">Open guest ticket</h2>
            <p className="text-sm text-[color:var(--text-muted)]">
              Use this if you cannot sign in or need contact before account access exists.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-[color:var(--text)]">Name</label>
              <Input
                onChange={(event) => setGuestForm((current) => ({ ...current, guestName: event.target.value }))}
                required
                value={guestForm.guestName}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[color:var(--text)]">Email</label>
              <Input
                onChange={(event) => setGuestForm((current) => ({ ...current, guestEmail: event.target.value }))}
                required
                type="email"
                value={guestForm.guestEmail}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[color:var(--text)]">Department</label>
            <select
              className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 text-sm text-[color:var(--text)] outline-none"
              onChange={(event) => setGuestForm((current) => ({ ...current, department: event.target.value }))}
              value={guestForm.department}
            >
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {ticketDepartmentLabels[department]}
                </option>
              ))}
            </select>
            <p className="text-xs text-[color:var(--text-dim)]">
              Select the department that most suitable with your ticket.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[color:var(--text)]">Title</label>
            <Input
              onChange={(event) => setGuestForm((current) => ({ ...current, subject: event.target.value }))}
              required
              value={guestForm.subject}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[color:var(--text)]">Message</label>
            <TicketRichTextEditor
              onChange={(bodyHtml) => setGuestForm((current) => ({ ...current, bodyHtml }))}
              placeholder="Describe the issue. You can use alignment, links, colors, or emphasis if it helps."
              value={guestForm.bodyHtml}
            />
            <p className="text-xs text-[color:var(--text-dim)]">
              {ticketDepartmentDescriptions[guestForm.department as keyof typeof ticketDepartmentDescriptions]}
            </p>
          </div>

          {guestError ? <p className="text-sm text-[#e39a9a]">{guestError}</p> : null}

          <div className="flex justify-end">
            <Button disabled={guestPending} type="submit">
              {guestPending ? "Creating..." : "Create guest ticket"}
            </Button>
          </div>
        </form>

        <div className="space-y-5">
          <form className="space-y-4 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--panel)] p-5" onSubmit={handleLookup}>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-white">Open existing guest ticket</h2>
              <p className="text-sm text-[color:var(--text-muted)]">
                Enter the ticket number and the password generated when the guest ticket was created.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[color:var(--text)]">Ticket number</label>
              <Input
                onChange={(event) => setGuestLookup((current) => ({ ...current, ticketNumber: event.target.value }))}
                placeholder="125"
                value={guestLookup.ticketNumber}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[color:var(--text)]">Ticket password</label>
              <Input
                onChange={(event) => setGuestLookup((current) => ({ ...current, password: event.target.value.toUpperCase() }))}
                placeholder="IZNVFWXV"
                value={guestLookup.password}
              />
            </div>

            {lookupError ? <p className="text-sm text-[#e39a9a]">{lookupError}</p> : null}

            <Button className="w-full" type="submit" variant="secondary">
              <Search className="h-4 w-4" />
              Open ticket
            </Button>
          </form>

          <StateCard
            title="Guest ticket rules"
            description="Guest tickets are isolated from account support. Keep the generated password. Without it, the guest ticket page will stay locked even if someone knows the link."
          />
        </div>
      </div>
    </div>
  );
}
