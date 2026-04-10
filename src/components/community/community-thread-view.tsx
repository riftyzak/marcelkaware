"use client";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { UserBadgeRow } from "./user-badge-row";

function getInitials(name: string | null | undefined) {
  if (!name) return "MB";
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "MB"
  );
}

function getReplyRestrictionMessage(result: any) {
  if (result.thread.status === "locked") {
    return "This thread is locked.";
  }
  if (result.viewer.tier === "guest") {
    return "Replying requires an account.";
  }
  if (result.viewer.tier === "registered" || result.viewer.tier === "expiredSubscriber") {
    return "Replying is limited by category rules for your access state.";
  }
  return "Replying is not available for this thread.";
}

export function CommunityThreadView({ threadId }: { threadId: string }) {
  const result = useQuery(api.forum.threadDetail, { threadId: threadId as any });
  const addReply = useMutation(api.forum.addReply);
  const toggleReaction = useMutation(api.forum.toggleReaction);
  const moderateThread = useMutation(api.forum.moderateThread);
  const moderatePost = useMutation(api.forum.moderatePost);
  const [body, setBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [reactionPendingPostId, setReactionPendingPostId] = useState<string | null>(null);
  const [moderationPending, setModerationPending] = useState(false);

  const threadStatusLabel = useMemo(() => {
    if (!result?.ok || !result.thread) return null;
    return result.thread.status === "open"
      ? "Open"
      : result.thread.status === "locked"
        ? "Locked"
        : "Hidden";
  }, [result]);

  async function submitReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReplyError(null);
    setIsReplying(true);
    try {
      await addReply({ threadId: threadId as any, body });
      setBody("");
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "Unable to add reply.");
    } finally {
      setIsReplying(false);
    }
  }

  async function onToggleReaction(postId: string) {
    setReactionError(null);
    setReactionPendingPostId(postId);
    try {
      await toggleReaction({ postId: postId as any });
    } catch (error) {
      setReactionError(error instanceof Error ? error.message : "Unable to update reaction.");
    } finally {
      setReactionPendingPostId(null);
    }
  }

  async function onModerateThread(update: { status?: "open" | "locked" | "hidden"; isPinned?: boolean }) {
    if (!result?.ok || !result.thread) return;
    setModerationError(null);
    setModerationPending(true);
    try {
      await moderateThread({ threadId: result.thread._id, ...update });
    } catch (error) {
      setModerationError(error instanceof Error ? error.message : "Unable to update thread.");
    } finally {
      setModerationPending(false);
    }
  }

  async function onModeratePost(postId: string, status: "visible" | "hidden") {
    setModerationError(null);
    setModerationPending(true);
    try {
      await moderatePost({ postId: postId as any, status });
    } catch (error) {
      setModerationError(error instanceof Error ? error.message : "Unable to update post.");
    } finally {
      setModerationPending(false);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: "Thread" }]} />
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Loading thread</h1>
        <p className="text-sm text-[color:var(--text-muted)]">Loading discussion.</p>
      </div>
    );
  }

  if (!result.ok || !result.thread || !result.category) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Community", href: "/community" }, { label: "Thread" }]} />
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">Thread unavailable</h1>
        <StateCard
          actionHref="/community"
          actionLabel="Back to community"
          description={result.message ?? "This thread is not available."}
          title="Thread not available"
          tone="warning"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: "Community", href: "/community" },
          { label: result.category.title, href: `/community/c/${result.category.slug}` },
          { label: result.thread.title },
        ]}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">
          {result.thread.title}
        </h1>
        <Link href={`/community/c/${result.category.slug}`}>
          <Button variant="ghost">Back to category</Button>
        </Link>
      </div>

      {/* Thread meta */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--border)] pb-3 text-sm text-[color:var(--text-dim)]">
        <Badge>{result.category.title}</Badge>
        {threadStatusLabel ? <Badge>{threadStatusLabel}</Badge> : null}
        {result.thread.isPinned ? <Badge>Pinned</Badge> : null}
        <span>&middot;</span>
        <span>{result.thread.replyCount} replies</span>
        <span>&middot;</span>
        <span>{result.thread.reactionCount} likes</span>
      </div>

      {/* Moderation controls */}
      {result.viewer.canModerate ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            className="h-8 rounded-md border border-[color:var(--border)] bg-[#191c21] px-2 text-sm text-[color:var(--text)] outline-none"
            disabled={moderationPending}
            onChange={(event) =>
              void onModerateThread({ status: event.target.value as "open" | "locked" | "hidden" })
            }
            value={result.thread.status}
          >
            <option value="open">Open</option>
            <option value="locked">Locked</option>
            <option value="hidden">Hidden</option>
          </select>
          <Button
            className="h-8 px-3 text-sm"
            disabled={moderationPending}
            onClick={() => void onModerateThread({ isPinned: !result.thread.isPinned })}
            type="button"
            variant="secondary"
          >
            {result.thread.isPinned ? "Unpin" : "Pin"}
          </Button>
          {moderationPending ? <span className="text-xs text-[color:var(--text-dim)]">Saving...</span> : null}
        </div>
      ) : null}
      {moderationError ? <p className="text-sm text-red-300">{moderationError}</p> : null}
      {reactionError ? <p className="text-sm text-red-300">{reactionError}</p> : null}

      {/* Posts — inline author, full width */}
      <section>
        {result.posts.map((post: any) => (
          <article className="border-b border-[color:var(--border)] py-5" key={post._id}>
            {/* Inline author header */}
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-[color:var(--panel-muted)] text-xs font-medium text-[color:var(--text)]">
                {getInitials(post.author?.displayName)}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-[color:var(--text)]">
                  {post.author?.profilePath ? (
                    <Link className="hover:text-[color:var(--accent-strong)]" href={post.author.profilePath}>
                      {post.author.displayName}
                    </Link>
                  ) : (
                    post.author?.displayName ?? "Member"
                  )}
                </span>
                {post.author?.badges?.length ? <UserBadgeRow badges={post.author.badges} compact /> : null}
                <span className="text-[color:var(--text-dim)]">
                  {new Date(post.createdAt).toLocaleString()}
                  {post.status === "hidden" ? " · hidden" : ""}
                </span>
              </div>
            </div>

            {/* Post body */}
            <div className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--text)]">{post.body}</div>

            {/* Actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {result.viewer.canReact ? (
                <Button
                  className="h-7 px-2 text-xs"
                  disabled={reactionPendingPostId === post._id}
                  onClick={() => void onToggleReaction(post._id)}
                  type="button"
                  variant={post.viewerHasLiked ? "primary" : "ghost"}
                >
                  {reactionPendingPostId === post._id
                    ? "..."
                    : `${post.viewerHasLiked ? "Liked" : "Like"} · ${post.reactionCount}`}
                </Button>
              ) : (
                <span className="text-xs text-[color:var(--text-dim)]">{post.reactionCount} likes</span>
              )}
              {result.viewer.canModerate ? (
                <Button
                  className="h-7 px-2 text-xs"
                  disabled={moderationPending}
                  onClick={() => void onModeratePost(post._id, post.status === "hidden" ? "visible" : "hidden")}
                  type="button"
                  variant="ghost"
                >
                  {post.status === "hidden" ? "Restore" : "Hide"}
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      {/* Reply form */}
      {result.viewer.canReply ? (
        <form className="space-y-3 pt-2" onSubmit={submitReply}>
          <Textarea
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a reply."
            rows={5}
            value={body}
          />
          {replyError ? <p className="text-sm text-red-300">{replyError}</p> : null}
          <Button disabled={isReplying} type="submit">
            {isReplying ? "Posting..." : "Post reply"}
          </Button>
        </form>
      ) : (
        <StateCard
          actionHref={result.viewer.tier === "guest" ? "/login" : result.viewer.tier === "registered" || result.viewer.tier === "expiredSubscriber" ? "/purchase" : `/community/c/${result.category.slug}`}
          actionLabel={result.viewer.tier === "guest" ? "Open login" : result.viewer.tier === "registered" || result.viewer.tier === "expiredSubscriber" ? "View access options" : "Back to category"}
          description={getReplyRestrictionMessage(result)}
          title="Replying unavailable"
        />
      )}
    </div>
  );
}
