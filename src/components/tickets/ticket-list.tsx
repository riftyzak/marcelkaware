"use client";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";

const ticketStatusLabels: Record<string, string> = {
  open: "Open",
  staffWaiting: "Waiting on staff",
  userWaiting: "Waiting on you",
  resolved: "Resolved",
  closed: "Closed",
};

export function TicketList() {
  const result = useQuery(api.tickets.viewerTickets, {});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const items = useMemo(() => (result?.ok ? result.items : []), [result]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return items.filter((ticket: any) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      if (!normalizedSearch) return true;
      return [ticket.subject, ticket.category, ticket.status, ticket.priority].some((value) =>
        String(value).toLowerCase().includes(normalizedSearch),
      );
    });
  }, [items, search, statusFilter]);

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro title="Support tickets" description="Loading your tickets." />
        <StateCard title="Loading support" description="Fetching your ticket list." />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-4">
        <PageIntro title="Support tickets" description="Private tickets are available after sign in." />
        <StateCard
          title="Support unavailable"
          description={result.message ?? "Support access is currently unavailable."}
          actionHref="/contact"
          actionLabel="Open appeals"
          tone="warning"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageIntro
        title="Support tickets"
        actions={
          <Link href="/community/support/new">
            <Button>New ticket</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Community", href: "/community" }, { label: "Support" }]}
      />

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Input
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tickets"
          value={search}
        />
        <select
          className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 text-sm text-[color:var(--text)] outline-none"
          onChange={(event) => setStatusFilter(event.target.value)}
          value={statusFilter}
        >
          <option value="all">All states</option>
          <option value="open">Open</option>
          <option value="staffWaiting">Waiting on staff</option>
          <option value="userWaiting">Waiting on you</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {filteredItems.length ? (
        <div>
          {filteredItems.map((ticket: any) => (
            <Link href={`/community/support/${ticket._id}`} key={ticket._id}>
              <div className="border-b border-[color:var(--border)] py-4 transition-colors hover:bg-white/[0.02]">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-white">{ticket.subject}</h2>
                      <Badge>{ticketStatusLabels[ticket.status] ?? ticket.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-[color:var(--text-dim)]">
                      <span className="capitalize">{ticket.category}</span>
                      <span>{ticket.priority === "high" ? "High priority" : "Normal priority"}</span>
                      <span>{new Date(ticket.latestReplyAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[color:var(--text-dim)] md:text-right">Open</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <StateCard
          title={items.length ? "No matching tickets" : "No tickets yet"}
          description={
            items.length
              ? "Try a different filter."
              : "Open a ticket when you need support."
          }
          actionHref={items.length ? undefined : "/community/support/new"}
          actionLabel={items.length ? undefined : "Open ticket"}
          secondaryAction={
            items.length ? (
              <Button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
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
