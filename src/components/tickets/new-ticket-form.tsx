"use client";

import { api } from "../../../convex/_generated/api";
import { ticketDepartmentDescriptions, ticketDepartmentLabels } from "../../../shared/support";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { normalizeClientErrorMessage } from "@/lib/errors/normalize-client-error";
import { useAction } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TicketRichTextEditor } from "./ticket-rich-text-editor";

const departmentOptions = [
  "technicalQuestions",
  "accountRecovery",
  "emailChange",
  "unbanRequest",
  "other",
] as const;

export function NewTicketForm() {
  const router = useRouter();
  const createTicket = useAction(api.communitySupportNode.submitViewerTicket);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [department, setDepartment] = useState<typeof departmentOptions[number]>("technicalQuestions");
  const [priority, setPriority] = useState<"normal" | "high">("normal");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setPending(true);
      setError(null);
      const created = await createTicket({
        subject,
        bodyHtml,
        department,
        priority,
      });
      if (!created.ok) {
        setError(created.message ?? "Unable to create ticket.");
        return;
      }
      router.push(created.href);
    } catch (cause) {
      setError(normalizeClientErrorMessage(cause, "Unable to create ticket."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageIntro
        breadcrumbs={[
          { label: "Community", href: "/community" },
          { label: "Support", href: "/community/support" },
          { label: "New ticket" },
        ]}
        eyebrow="Support"
        title="Open a private ticket"
        description="Tickets here stay bound to your account and are visible only to you and staff."
        actions={
          <Link href="/community/support">
            <Button variant="secondary">Back to support</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-[color:var(--text)]">Title</label>
              <Input
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Short summary of the issue"
                required
                value={subject}
              />
              <p className="text-xs text-[color:var(--text-dim)]">Keep it specific. Minimum 6 characters.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-[color:var(--text)]">Department</label>
                <select
                  className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 text-sm text-[color:var(--text)] outline-none"
                  onChange={(event) => setDepartment(event.target.value as typeof departmentOptions[number])}
                  value={department}
                >
                  {departmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {ticketDepartmentLabels[option]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[color:var(--text-dim)]">
                  {ticketDepartmentDescriptions[department]}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[color:var(--text)]">Priority</label>
                <select
                  className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-3 text-sm text-[color:var(--text)] outline-none"
                  onChange={(event) => setPriority(event.target.value as "normal" | "high")}
                  value={priority}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
                <p className="text-xs text-[color:var(--text-dim)]">
                  Use high priority only when access is blocked or account state needs direct review.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[color:var(--text)]">Message</label>
              <TicketRichTextEditor
                onChange={setBodyHtml}
                placeholder="Describe the issue, what already changed, and what you already tried."
                value={bodyHtml}
              />
              <p className="text-xs text-[color:var(--text-dim)]">
                Formatting, alignment, links, text size, and color are supported.
              </p>
            </div>

            {error ? <p className="text-sm text-[#e39a9a]">{error}</p> : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Link href="/community/support">
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
            title="What helps support move faster"
            description="One issue per ticket, clear reproduction steps, and current account context are enough for the first staff reply to be useful."
          />
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Before you submit</h2>
            <ul className="space-y-3 text-sm leading-6 text-[color:var(--text-muted)]">
              <li>Use support for account, payment, launcher, or restricted access issues.</li>
              <li>Forum moderation, PMs, and alerts will stay under the wider community system.</li>
              <li>If you cannot sign in at all, use the guest flow on the main support page instead.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
