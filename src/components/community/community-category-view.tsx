"use client";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function getPostingStateMessage(result: any) {
  if (result.viewer.canCreateThread) {
    return null;
  }
  if (result.viewer.tier === "guest") {
    return {
      title: "Read-only for guests",
      description: "Starting threads requires an account.",
      href: "/register",
      label: "Create account",
    };
  }
  if (result.viewer.tier === "registered" || result.viewer.tier === "expiredSubscriber") {
    return {
      title: "Posting is limited",
      description: "This category is read-only for your current access state.",
      href: "/purchase",
      label: "View access options",
    };
  }
  return {
    title: "Posting unavailable",
    description: result.category.isArchived
      ? "This category is archived."
      : "Thread creation is not enabled here.",
    href: "/community",
    label: "Back to community",
  };
}

function getAccessLabel(result: any) {
  if (result.category.isArchived) return "Archived";
  if (result.viewer.canCreateThread) return "Posting enabled";
  if (result.viewer.tier === "guest") return "Read only";
  return "Restricted";
}

export function CommunityCategoryView({ slug }: { slug: string }) {
  const router = useRouter();
  const result = useQuery(api.forum.categoryDetail, { slug });
  const createThread = useMutation(api.forum.createThread);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result?.ok || !result.category) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const threadId = await createThread({
        categoryId: result.category._id,
        title,
        body,
      });
      setTitle("");
      setBody("");
      router.push(`/community/t/${threadId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create thread.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: "Category" }]} />
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Loading category</h1>
        <p className="text-sm text-[color:var(--text-muted)]">Loading threads.</p>
      </div>
    );
  }

  if (!result.ok || !result.category) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: "Category" }]} />
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Category unavailable</h1>
        <StateCard
          actionHref="/community"
          actionLabel="Back to community"
          description={result.message ?? "This category is not available."}
          title="Category not available"
          tone="warning"
        />
      </div>
    );
  }

  const postingMessage = getPostingStateMessage(result);

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: result.category.title }]} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">
          {result.category.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {result.viewer.canCreateThread && !showForm ? (
            <Button variant="secondary" onClick={() => setShowForm(true)}>
              + New thread
            </Button>
          ) : null}
          <Link href="/community">
            <Button variant="ghost">Back</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-[color:var(--border)] pb-3 text-sm text-[color:var(--text-dim)]">
        <Badge>{result.threads.length} threads</Badge>
        <Badge>{getAccessLabel(result)}</Badge>
      </div>

      {/* Collapsible thread creation */}
      {result.viewer.canCreateThread && showForm ? (
        <section className="space-y-3 border-b border-[color:var(--border)] pb-4">
          <form className="space-y-3" onSubmit={onSubmit}>
            <Input onChange={(event) => setTitle(event.target.value)} placeholder="Thread title" value={title} />
            <Textarea
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the first post."
              rows={5}
              value={body}
            />
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <div className="flex gap-2">
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Publishing..." : "Create thread"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} type="button">
                Cancel
              </Button>
            </div>
          </form>
        </section>
      ) : !result.viewer.canCreateThread && postingMessage ? (
        <StateCard
          actionHref={postingMessage.href}
          actionLabel={postingMessage.label}
          description={postingMessage.description}
          title={postingMessage.title}
        />
      ) : null}

      {/* Thread list — flush rows */}
      <div className="border-b border-[color:var(--border)] pb-1 text-[11px] uppercase tracking-[0.12em] text-[color:var(--text-dim)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_110px_110px_170px]">
          <p>Thread</p>
          <p className="hidden text-right md:block">Replies</p>
          <p className="hidden text-right md:block">Likes</p>
          <p className="hidden text-right md:block">Last activity</p>
        </div>
      </div>

      {result.threads.length ? (
        result.threads.map((thread: any) => (
          <Link href={`/community/t/${thread._id}`} key={thread._id}>
            <div className="grid grid-cols-1 gap-4 border-b border-[color:var(--border)] py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[minmax(0,1fr)_110px_110px_170px] md:items-center">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-[15px] font-semibold text-[color:var(--text)]">{thread.title}</h2>
                  {thread.isPinned ? <Badge>Pinned</Badge> : null}
                  {thread.status !== "open" ? <Badge>{thread.status}</Badge> : null}
                </div>
                <p className="text-sm text-[color:var(--text-dim)]">
                  by {thread.author?.displayName ?? "Member"} &middot; {thread.visiblePostCount} posts
                </p>
              </div>

              <div className="hidden text-right md:block">
                <p className="text-sm text-[color:var(--text)]">{thread.replyCount}</p>
              </div>

              <div className="hidden text-right md:block">
                <p className="text-sm text-[color:var(--text)]">{thread.reactionCount}</p>
              </div>

              <div className="hidden text-right md:block">
                <p className="truncate text-sm text-[color:var(--text)]">
                  {thread.lastPoster?.displayName ?? "Member"}
                </p>
                <p className="text-xs text-[color:var(--text-dim)]">
                  {new Date(thread.lastPostAt).toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        ))
      ) : (
        <p className="py-4 text-sm text-[color:var(--text-muted)]">No visible threads yet.</p>
      )}
    </div>
  );
}
