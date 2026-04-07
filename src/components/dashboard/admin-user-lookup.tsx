"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

export function AdminUserLookup() {
  const [search, setSearch] = useState("");
  const results = useQuery(api.admin.findUsers, { search });

  if (results === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro
          actions={
            <Link href="/admin/audit">
              <Button variant="secondary">Audit log</Button>
            </Link>
          }
          breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "User lookup" }]}
          title="User lookup"
          description="Loading users."
        />
        <StateCard title="Loading users" description="Preparing the internal user lookup index." />
      </div>
    );
  }

  if (!results.ok) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "User lookup" }]}
          title="User lookup"
          description="Staff only."
        />
        <StateCard title="Lookup unavailable" description={results.message ?? "Lookup unavailable."} tone="error" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageIntro
        actions={
          results.actorTier === "admin" ? (
            <Link href="/admin/audit">
              <Button variant="secondary">Audit log</Button>
            </Link>
          ) : undefined
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "User lookup" }]}
        title="User lookup"
        description="Account and access lookup."
      />
      <Input
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by email, display name, or handle"
        value={search}
      />
      {results.items.length ? (
        <div className="grid gap-3">
          {results.items.map((item: any) => (
            <Card className="space-y-2" key={item._id}>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-white">{item.displayName}</h2>
                <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300">{item.email ?? "no email"}</span>
                <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300">{item.accessTier}</span>
              </div>
              <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                <p>role {item.role} · account {item.accountState}</p>
                <p>subscription {item.subscriptionStatus}</p>
                <p>{item.handle ? `@${item.handle}` : "no public handle"}</p>
                <p>last IP signal {item.lastIpSeenAt ? new Date(item.lastIpSeenAt).toLocaleString() : "none"}</p>
              </div>
              {results.actorTier === "admin" ? (
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href={`/admin/users/${item._id}/badges`}>
                    <Button variant="secondary">Manage badges</Button>
                  </Link>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <StateCard title="No users matched" description="Try a different email, display name, or handle." />
      )}
    </div>
  );
}
