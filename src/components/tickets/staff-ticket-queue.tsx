"use client";

import { api } from "../../../convex/_generated/api";
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
  const result = useQuery(api.tickets.staffTicketQueue, {});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const items = useMemo(() => (result?.ok ? result.items : []), [result]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return items.filter((ticket: any) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false;
      }
      if (assignmentFilter === "assigned" && !ticket.assignedToUserId) {
        return false;
      }
      if (assignmentFilter === "unassigned" && ticket.assignedToUserId) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return [
        ticket.subject,
        ticket.ownerDisplayName,
        ticket.ownerEmail ?? "",
        ticket.assignedDisplayName ?? "",
        ticket.category,
      ].some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [assignmentFilter, items, search, statusFilter]);

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Admin", href: "/admin/users" },
            { label: "Ticket queue" },
          ]}
          title="Ticket queue"
          description="Loading queue."
        />
        <StateCard description="Fetching ticket state, assignment, and latest activity." title="Loading support queue" />
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
        <StateCard description={result.message ?? "Queue access is unavailable."} title="Queue unavailable" tone="error" />
      </div>
    );
  }

  const queueStats = {
    total: items.length,
    unassigned: items.filter((ticket: any) => !ticket.assignedToUserId).length,
    waitingOnStaff: items.filter((ticket: any) => ticket.status === "staffWaiting").length,
    highPriority: items.filter((ticket: any) => ticket.priority === "high").length,
  };

  return (
    <div className="space-y-4">
      <PageIntro
        breadcrumbs={[
          { label: "Admin", href: "/admin/users" },
          { label: "Ticket queue" },
        ]}
        title="Ticket queue"
        description="Open and assign tickets."
      />

      <Card className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <Input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search owner, email, subject, or category"
            value={search}
          />
          <select
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="all">All states</option>
            <option value="open">Open</option>
            <option value="staffWaiting">Waiting on staff</option>
            <option value="userWaiting">Waiting on user</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100 outline-none"
            onChange={(event) => setAssignmentFilter(event.target.value)}
            value={assignmentFilter}
          >
            <option value="all">All assignments</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
        <p className="text-sm text-slate-500">{queueStats.total} tickets · {queueStats.unassigned} unassigned · {queueStats.highPriority} high priority</p>
      </Card>

      {filteredItems.length ? (
        <div className="grid gap-4">
          {filteredItems.map((ticket: any) => (
            <Link href={`/admin/tickets/${ticket._id}`} key={ticket._id}>
              <Card className="space-y-3 transition hover:border-cyan-400/30 hover:bg-white/[0.06]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">{ticket.subject}</h2>
                      <Badge className="capitalize">{ticket.status}</Badge>
                      <Badge className="capitalize">{ticket.category}</Badge>
                      <Badge className={ticket.priority === "high" ? "border-amber-400/20 bg-amber-400/10 text-amber-100" : undefined}>
                        {ticket.priority === "high" ? "High priority" : "Normal priority"}
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                      <p>
                        Owner {ticket.ownerDisplayName}
                        {ticket.ownerEmail ? ` · ${ticket.ownerEmail}` : ""}
                      </p>
                      <p>Assigned {ticket.assignedDisplayName ?? "Unassigned"}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 md:text-right">
                    <p>Latest activity</p>
                    <p>{new Date(ticket.latestReplyAt).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <StateCard
          description={
            items.length
              ? "No queue items match the current search or filters."
              : "No tickets are currently visible in the queue."
          }
          secondaryAction={
            items.length ? (
              <Button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setAssignmentFilter("all");
                }}
                variant="secondary"
              >
                Clear filters
              </Button>
            ) : undefined
          }
          title={items.length ? "No matching tickets" : "Queue is clear"}
        />
      )}
    </div>
  );
}
