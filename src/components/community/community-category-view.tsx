"use client";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { Separator } from "@/components/ui/separator";
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
      description: "Public reading is available here, but starting threads requires an account.",
      href: "/register",
      label: "Create account",
    };
  }
  if (result.viewer.tier === "registered" || result.viewer.tier === "expiredSubscriber") {
    return {
      title: "Posting is limited here",
      description: "This category is currently read-only for your access state. Subscriber-only posting remains enforced server-side.",
      href: "/#pricing",
      label: "View access options",
    };
  }
  return {
    title: "Posting unavailable",
    description: result.category.isArchived
      ? "This category is archived and preserved for reference."
      : "Thread creation is not enabled in this category.",
    href: "/community",
    label: "Back to community",
  };
}

function getAccessLabel(result: any) {
  if (result.category.isArchived) {
    return "Archived";
  }
  if (result.viewer.canCreateThread) {
    return "Posting enabled";
  }
  if (result.viewer.tier === "guest") {
    return "Read only";
  }
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result?.ok || !result.category) {
      return;
    }
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
        <PageIntro
          breadcrumbs={[
            { label: "Community", href: "/community" },
            { label: "Category" },
          ]}
          title="Loading category"
          description="Loading threads."
        />
        <StateCard description="Loading category details and thread list." title="Preparing category" />
      </div>
    );
  }

  if (!result.ok || !result.category) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Community", href: "/community" },
            { label: "Category" },
          ]}
          title="Category unavailable"
          description="This category is not available."
        />
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
      <PageIntro
        actions={
          <Link href="/community">
            <Button variant="secondary">Back to community</Button>
          </Link>
        }
        breadcrumbs={[
          { label: "Community", href: "/community" },
          { label: result.category.title },
        ]}
        title={result.category.title}
        description={result.category.description ?? undefined}
      />

      <div className="flex flex-col gap-2 border-b border-[color:var(--border)] pb-3 text-sm text-[color:var(--text-muted)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{result.threads.length} visible threads</Badge>
          <Badge>{getAccessLabel(result)}</Badge>
        </div>
        <span>{result.category.isArchived ? "Archive mode" : "Forum category"}</span>
      </div>

      {result.viewer.canCreateThread ? (
        <section className="space-y-4 border-b border-[color:var(--border)] pb-5">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Start a thread</h2>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input onChange={(event) => setTitle(event.target.value)} placeholder="Thread title" value={title} />
            <Textarea
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the first post."
              rows={6}
              value={body}
            />
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Publishing..." : "Create thread"}
            </Button>
          </form>
        </section>
      ) : postingMessage ? (
        <StateCard
          actionHref={postingMessage.href}
          actionLabel={postingMessage.label}
          description={postingMessage.description}
          title={postingMessage.title}
        />
      ) : null}

      <section className="space-y-2">
        <div className="grid grid-cols-1 gap-4 border-b border-[color:var(--border)] px-1 pb-2 text-[11px] uppercase tracking-[0.12em] text-[color:var(--text-dim)] md:grid-cols-[minmax(0,1fr)_110px_110px_170px]">
          <p>Thread</p>
          <p className="hidden text-right md:block">Replies</p>
          <p className="hidden text-right md:block">Likes</p>
          <p className="hidden text-right md:block">Last activity</p>
        </div>
        {result.threads.length ? (
          result.threads.map((thread: any) => (
            <Link href={`/community/t/${thread._id}`} key={thread._id}>
              <div className="grid grid-cols-1 gap-4 border-b border-[color:var(--border)] px-1 py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[minmax(0,1fr)_110px_110px_170px] md:items-center">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-[15px] font-semibold text-[color:var(--text)]">{thread.title}</h2>
                    {thread.isPinned ? <Badge>Pinned</Badge> : null}
                    {thread.status !== "open" ? <Badge>{thread.status}</Badge> : null}
                  </div>
                  <p className="text-sm text-[color:var(--text-muted)]">
                    Started by {thread.author?.displayName ?? "Member"} · {thread.visiblePostCount} visible posts
                  </p>
                  <p className="text-xs text-[color:var(--text-dim)] md:hidden">
                    {thread.replyCount} replies · {thread.reactionCount} likes · latest by {thread.lastPoster?.displayName ?? "Member"}
                  </p>
                </div>

                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-[color:var(--text)]">{thread.replyCount}</p>
                </div>

                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-[color:var(--text)]">{thread.reactionCount}</p>
                </div>

                <div className="hidden text-right md:block">
                  <p className="truncate text-sm font-medium text-[color:var(--text)]">
                    {thread.lastPoster?.displayName ?? "Member"}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--text-dim)]">
                    {new Date(thread.lastPostAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-2">
            <StateCard
              description="No visible threads are available in this category yet."
              title="Nothing here yet"
            />
          </div>
        )}
      </section>
    </div>
  );
}
