"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const categoryHints: Record<string, string> = {
  general: "General guidance, onboarding questions, or unclear routing.",
  technical: "Launch issues, environment problems, or device-related blockers.",
  billing: "Payment confirmation, renewal questions, or failed checkout follow-up.",
  account: "Access state, identity issues, or reset requests that require staff review.",
};

export function NewTicketForm() {
  const router = useRouter();
  const createTicket = useMutation(api.tickets.createTicket);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPending(true);
      setError(null);
      const ticketId = await createTicket({
        subject,
        body,
        category: category as any,
        priority: priority as any,
      });
      router.push(`/app/tickets/${ticketId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create ticket.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageIntro
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "Support", href: "/app/tickets" },
          { label: "New ticket" },
        ]}
        eyebrow="Support"
        title="Open a private ticket"
        description="Tickets are visible only to you and staff. Clear details up front reduce delays and keep the queue moving."
        actions={
          <Link href="/app/tickets">
            <Button variant="secondary">Back to tickets</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-5">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Subject</label>
              <Input
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Short summary of the issue"
                required
                value={subject}
              />
              <p className="text-xs text-slate-500">Keep it specific. The server requires at least 6 characters.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Category</label>
                <select
                  className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100"
                  onChange={(event) => setCategory(event.target.value)}
                  value={category}
                >
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="account">Account</option>
                </select>
                <p className="text-xs text-slate-500">{categoryHints[category]}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Priority</label>
                <select
                  className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100"
                  onChange={(event) => setPriority(event.target.value)}
                  value={priority}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
                <p className="text-xs text-slate-500">
                  Use high priority only when access is blocked or account state needs urgent review.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Message</label>
              <Textarea
                onChange={(event) => setBody(event.target.value)}
                placeholder="Describe the issue, what you've already tried, and any relevant account or device context."
                required
                rows={10}
                value={body}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>The server requires at least 20 characters.</span>
                <span>{body.trim().length} characters</span>
              </div>
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <div className="flex flex-wrap justify-end gap-3">
              <Link href="/app/tickets">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button disabled={pending} type="submit">
                {pending ? "Creating..." : "Create ticket"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <StateCard
            description="Include what changed, what you already tried, and whether the issue affects access, billing, or device state. That gives staff enough context to act on the first reply."
            title="What helps support move faster"
          />
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Before you submit</h2>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>Use one issue per ticket so replies stay easy to follow.</li>
              <li>Keep payment details and access issues in separate tickets if they need different staff workflows.</li>
              <li>Support handles HWID or access review only through staff-controlled flows.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
