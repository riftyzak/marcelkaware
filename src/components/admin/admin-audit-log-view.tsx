"use client";

import { api } from "../../../convex/_generated/api";
import { getAdminActionLabel } from "@/components/admin/admin-action-label";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { useQuery } from "convex/react";
import { useState } from "react";

const targetOptions = [
  "",
  "users",
  "tickets",
  "forumCategories",
  "forumThreads",
  "forumPosts",
  "announcements",
  "changelogs",
  "siteBanners",
  "homepageBlocks",
  "badges",
  "userBadges",
  "resellers",
  "resellerKeyBatches",
  "resellerKeys",
] as const;

export function AdminAuditLogView() {
  const [actorSearch, setActorSearch] = useState("");
  const [actionSearch, setActionSearch] = useState("");
  const [targetTable, setTargetTable] = useState("");

  const result = useQuery(api.admin.auditLogIndex, {
    actorSearch: actorSearch || undefined,
    actionSearch: actionSearch || undefined,
    targetTable: targetTable || undefined,
  });

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro title="Audit log" description="Loading audit entries." />
        <StateCard title="Loading audit log" description="Preparing recent actions and sensitive summaries." />
      </div>
    );
  }

  if (!result.ok || !result.summary) {
    return (
      <div className="space-y-4">
        <PageIntro title="Audit log" description="Admins only." />
        <StateCard title="Audit log unavailable" description={result.message ?? "Audit log unavailable."} tone="error" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageIntro
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Audit log" }]}
        title="Audit log"
        description="Recent actions."
      />

      <Card className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_220px]">
          <Input
            onChange={(event) => setActorSearch(event.target.value)}
            placeholder="Filter by actor name or handle"
            value={actorSearch}
          />
          <Input
            onChange={(event) => setActionSearch(event.target.value)}
            placeholder="Filter by action id"
            value={actionSearch}
          />
          <select
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100"
            onChange={(event) => setTargetTable(event.target.value)}
            value={targetTable}
          >
            <option value="">All targets</option>
            {targetOptions
              .filter((option) => option)
              .map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
          </select>
        </div>
      </Card>

      {result.items.length ? (
        <div className="grid gap-4">
          {result.items.map((item: any) => (
            <Card className="space-y-3" key={item._id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{getAdminActionLabel(item.action)}</h2>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {item.actorType}
                    </span>
                    {item.targetTable ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {item.targetTable}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-400">
                    Actor {item.actorName ?? "system"}{item.actorHandle ? ` (@${item.actorHandle})` : ""}
                    {item.targetId ? ` · target ${item.targetId}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">{item.action}</p>
                </div>
                <p className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              {item.metadata ? (
                <pre className="overflow-x-auto border border-white/10 bg-slate-950/50 p-3 text-xs leading-6 text-slate-300">
                  {JSON.stringify(item.metadata, null, 2)}
                </pre>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <StateCard title="No audit entries matched" description="Adjust the current filters to broaden the audit view." />
      )}
    </div>
  );
}
