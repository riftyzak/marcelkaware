import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";

export default function CommunityConversationsPage() {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: "Conversations" }]} />

      <div className="space-y-2 border-b border-[color:var(--border)] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Conversations</h1>
          <Button variant="secondary">Start conversation</Button>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
          Private messages will live here. This first pass only wires the forum header entrypoint and route shell.
        </p>
      </div>

      <div className="border border-[color:var(--border)] bg-[color:var(--panel)] px-5 py-6 text-sm text-[color:var(--text-muted)]">
        You have no recent conversations yet.
      </div>
    </div>
  );
}
