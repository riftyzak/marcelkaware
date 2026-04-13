"use client";

import { api } from "../../../convex/_generated/api";
import { ticketDepartmentLabels } from "../../../shared/support";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function StaffTicketQueue() {
  const result = useQuery(api.communitySupport.staffTicketQueue, {});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [requesterTypeFilter, setRequesterTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const items = useMemo(() => (result?.ok ? result.items : []), [result]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((ticket: any) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      if (requesterTypeFilter !== "all" && ticket.requesterType !== requesterTypeFilter) return false;
      if (departmentFilter !== "all" && ticket.department !== departmentFilter) return false;
      if (assignmentFilter === "assigned" && !ticket.assignedToUserId) return false;
      if (assignmentFilter === "unassigned" && ticket.assignedToUserId) return false;

      if (!normalizedSearch) return true;

      return [
        ticket.subject,
        ticket.ownerDisplayName,
        ticket.ownerEmail ?? "",
        ticket.assignedDisplayName ?? "",
        ticket.department,
        ticket.requesterType,
      ].some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [assignmentFilter, departmentFilter, items, requesterTypeFilter, search, statusFilter]);

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Admin", href: "/admin/users" },
            { label: "Ticket queue" },
          ]}
          title="Ticket queue"
          description="Loading support queue."
        />
        <StateCard title="Loading queue" description="Fetching requester type, assignment, and latest activity." />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Admin", href: "/admin/users" },
            { label: "Ticket queue" },
          ]}
          title="Ticket queue"
          description="Staff only."
        />
        <StateCard title="Queue unavailable" description={result.message ?? "Queue access is unavailable."} tone="error" />
      </div>
    );
  }

  const queueStats = {
    total: items.length,
    guests: items.filter((ticket: any) => ticket.requesterType === "guest").length,
    users: items.filter((ticket: any) => ticket.requesterType === "user").length,
    unassigned: items.filter((ticket: any) => !ticket.assignedToUserId).length,
  };

  return (
    <div className="space-y-4">
      <PageIntro
        breadcrumbs={[
          { label: "Admin", href: "/admin/users" },
          { label: "Ticket queue" },
        ]}
        title="Ticket queue"
        description="User and guest tickets in one staff queue."
      />

      <Card className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px_180px_180px]">
          <Input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search subject, requester, email, or assignee"
            value={search}
          />
          <select
            className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 text-sm text-[color:var(--text)] outline-none"
            onChange={(event) => setRequesterTypeFilter(event.target.value)}
            value={requesterTypeFilter}
          >
            <option value="all">All requesters</option>
            <option value="user">Logged-in tickets</option>
            <option value="guest">Guest tickets</option>
          </select>
          <select
            className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 text-sm text-[color:var(--text)] outline-none"
            onChange={(event) => setDepartmentFilter(event.target.value)}
            value={departmentFilter}
          >
            <option value="all">All departments</option>
            {Object.entries(ticketDepartmentLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 text-sm text-[color:var(--text)] outline-none"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="all">All states</option>
            <option value="open">Open</option>
            <option value="staffWaiting">Waiting on staff</option>
            <option value="userWaiting">Waiting on requester</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 text-sm text-[color:var(--text)] outline-none"
            onChange={(event) => setAssignmentFilter(event.target.value)}
            value={assignmentFilter}
          >
            <option value="all">All assignments</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
        <p className="text-sm text-[color:var(--text-dim)]">
          {queueStats.total} tickets · {queueStats.users} user · {queueStats.guests} guest · {queueStats.unassigned} unassigned
        </p>
      </Card>

      {filteredItems.length ? (
        <div className="grid gap-4">
          {filteredItems.map((ticket: any) => {
            const href =
              typeof ticket.adminHref === "string"
                ? ticket.adminHref
                : typeof ticket.publicTicketNumber === "number"
                  ? `/admin/tickets/${ticket.requesterType}/${ticket.publicTicketNumber}`
                  : null;

            const content = (
              <Card className="space-y-3 transition hover:border-[#8fb0d8]/30 hover:bg-white/[0.04]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">
                        {typeof ticket.publicTicketNumber === "number"
                          ? `#${ticket.publicTicketNumber} · ${ticket.subject}`
                          : ticket.subject}
                      </h2>
                      <Badge>{ticket.requesterType === "guest" ? "Guest" : "User"}</Badge>
                      <Badge className="capitalize">{ticket.status}</Badge>
                      <Badge>{ticketDepartmentLabels[ticket.department as keyof typeof ticketDepartmentLabels]}</Badge>
                      <Badge className={ticket.priority === "high" ? "border-amber-400/20 bg-amber-400/10 text-amber-100" : undefined}>
                        {ticket.priority === "high" ? "High priority" : "Normal priority"}
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-[color:var(--text-muted)] sm:grid-cols-2">
                      <p>
                        Requester {ticket.ownerDisplayName}
                        {ticket.ownerEmail ? ` · ${ticket.ownerEmail}` : ""}
                      </p>
                      <p>Assigned {ticket.assignedDisplayName ?? "Unassigned"}</p>
                    </div>
                  </div>

                  <div className="text-sm text-[color:var(--text-dim)] md:text-right">
                    <p>Latest activity</p>
                    <p>{new Date(ticket.latestReplyAt).toLocaleString()}</p>
                    {!href ? <p className="text-[#caa36a]">Pending route migration</p> : null}
                  </div>
                </div>
              </Card>
            );

            if (!href) {
              return <div key={`${ticket.requesterType}:${ticket.subject}`}>{content}</div>;
            }

            return (
              <Link href={href} key={`${ticket.requesterType}:${ticket.publicTicketNumber}`}>
                {content}
              </Link>
            );
          })}
        </div>
      ) : (
        <StateCard
          title={items.length ? "No matching tickets" : "Queue is clear"}
          description={
            items.length
              ? "No tickets match the current search or filters."
              : "No guest or user tickets are currently visible in the queue."
          }
          secondaryAction={
            items.length ? (
              <Button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setAssignmentFilter("all");
                  setRequesterTypeFilter("all");
                  setDepartmentFilter("all");
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
