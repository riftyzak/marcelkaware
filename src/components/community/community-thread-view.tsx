"use client";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/ui/page-intro";
import { Separator } from "@/components/ui/separator";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { UserBadgeRow } from "./user-badge-row";

function getInitials(name: string | null | undefined) {
  if (!name) {
    return "MB";
  }
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "MB";
}

function getReplyRestrictionMessage(result: any) {
  if (result.thread.status === "locked") {
    return "This thread is locked. Moderators and admins can still intervene if needed.";
  }
  if (result.viewer.tier === "guest") {
    return "Reading is available here, but replying requires an account.";
  }
  if (result.viewer.tier === "registered" || result.viewer.tier === "expiredSubscriber") {
    return "This thread is visible to your account, but replying is limited by the category rules for your current access state.";
  }
  return "Replying is not available for this thread or this account.";
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
    if (!result?.ok || !result.thread) {
      return null;
    }
    return result.thread.status === "open"
      ? "Open discussion"
      : result.thread.status === "locked"
        ? "Locked"
        : "Hidden";
  }, [result]);

  async function submitReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReplyError(null);
    setIsReplying(true);
    try {
      await addReply({
        threadId: threadId as any,
        body,
      });
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
    if (!result?.ok || !result.thread) {
      return;
    }
    setModerationError(null);
    setModerationPending(true);
    try {
      await moderateThread({
        threadId: result.thread._id,
        ...update,
      });
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
      await moderatePost({
        postId: postId as any,
        status,
      });
    } catch (error) {
      setModerationError(error instanceof Error ? error.message : "Unable to update post.");
    } finally {
      setModerationPending(false);
    }
  }

  if (result === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Community", href: "/community" },
            { label: "Thread" },
          ]}
          title="Loading thread"
          description="Loading discussion."
        />
        <StateCard description="Loading thread content and current access state." title="Preparing thread" />
      </div>
    );
  }

  if (!result.ok || !result.thread || !result.category) {
    return (
      <div className="space-y-4">
        <PageIntro
          breadcrumbs={[
            { label: "Community", href: "/community" },
            { label: "Thread" },
          ]}
          title="Thread unavailable"
          description="This thread is not available."
        />
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
      <PageIntro
        actions={
          <Link href={`/community/c/${result.category.slug}`}>
            <Button variant="secondary">Back to category</Button>
          </Link>
        }
        breadcrumbs={[
          { label: "Community", href: "/community" },
          { label: result.category.title, href: `/community/c/${result.category.slug}` },
          { label: result.thread.title },
        ]}
        title={result.thread.title}
        description={undefined}
      />

      <section className="space-y-3 border-b border-[color:var(--border)] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{result.category.title}</Badge>
          {threadStatusLabel ? <Badge>{threadStatusLabel}</Badge> : null}
          {result.thread.isPinned ? <Badge>Pinned</Badge> : null}
        </div>
        <div className="grid gap-3 text-sm text-[color:var(--text-muted)] md:grid-cols-3">
          <p>
            Started {new Date(result.thread.createdAt).toLocaleString()}
          </p>
          <p>{result.thread.replyCount} replies</p>
          <p>{result.thread.reactionCount} likes</p>
        </div>
        {result.viewer.canModerate ? (
          <div className="flex flex-col gap-3 border-t border-[color:var(--border)] pt-4 text-sm text-[color:var(--text-muted)] sm:flex-row sm:items-center">
            <select
              className="h-10 rounded-[8px] border border-[color:var(--border)] bg-[#191c21] px-3 text-sm text-[color:var(--text)] outline-none"
              disabled={moderationPending}
              onChange={(event) =>
                void onModerateThread({
                  status: event.target.value as "open" | "locked" | "hidden",
                })
              }
              value={result.thread.status}
            >
              <option value="open">Open</option>
              <option value="locked">Locked</option>
              <option value="hidden">Hidden</option>
            </select>
            <Button
              disabled={moderationPending}
              onClick={() =>
                void onModerateThread({
                  isPinned: !result.thread.isPinned,
                })
              }
              type="button"
              variant="secondary"
            >
              {result.thread.isPinned ? "Unpin thread" : "Pin thread"}
            </Button>
            <span className="text-xs text-[color:var(--text-dim)]">{moderationPending ? "Saving..." : null}</span>
          </div>
        ) : null}
        {moderationError ? <p className="text-sm text-red-300">{moderationError}</p> : null}
        {reactionError ? <p className="text-sm text-red-300">{reactionError}</p> : null}
      </section>

      <section className="space-y-0 border-y border-[color:var(--border)]">
        {result.posts.map((post: any) => (
          <article className="grid gap-0 border-b border-[color:var(--border)] last:border-b-0 md:grid-cols-[210px_minmax(0,1fr)]" key={post._id}>
              <div className="border-b border-[color:var(--border)] bg-[#191c21] p-4 md:border-b-0 md:border-r">
                <div className="flex items-start gap-3 md:flex-col md:items-center md:text-center">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[8px] border border-[color:var(--border)] bg-[color:var(--panel-muted)] text-sm font-medium text-[color:var(--text)]">
                    {getInitials(post.author?.displayName)}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[color:var(--text)]">
                      {post.author?.handle ? (
                        <Link className="hover:text-[color:var(--accent-strong)]" href={`/members/${post.author.handle}`}>
                          {post.author.displayName}
                        </Link>
                      ) : (
                        post.author?.displayName ?? "Member"
                      )}
                    </p>
                    <p className="text-xs text-[color:var(--text-dim)]">
                      {post.author?.joinedAt ? `Joined ${new Date(post.author.joinedAt).toLocaleDateString()}` : "Member"}
                    </p>
                    {post.author?.badges?.length ? <UserBadgeRow badges={post.author.badges} compact /> : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[color:var(--text-dim)]">
                    {new Date(post.createdAt).toLocaleString()}
                    {post.status === "hidden" ? " · hidden" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.viewer.canReact ? (
                      <Button
                        disabled={reactionPendingPostId === post._id}
                        onClick={() => void onToggleReaction(post._id)}
                        type="button"
                        variant={post.viewerHasLiked ? "primary" : "secondary"}
                      >
                        {reactionPendingPostId === post._id
                          ? "Updating..."
                          : `${post.viewerHasLiked ? "Liked" : "Like"} · ${post.reactionCount}`}
                      </Button>
                    ) : (
                      <span className="text-sm text-[color:var(--text-dim)]">{post.reactionCount} likes</span>
                    )}
                    {result.viewer.canModerate ? (
                      <Button
                        disabled={moderationPending}
                        onClick={() =>
                          void onModeratePost(post._id, post.status === "hidden" ? "visible" : "hidden")
                        }
                        type="button"
                        variant="secondary"
                      >
                        {post.status === "hidden" ? "Restore post" : "Hide post"}
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--text)]">{post.body}</div>
              </div>
          </article>
        ))}
      </section>

      {result.viewer.canReply ? (
        <section className="space-y-4 border-t border-[color:var(--border)] pt-4">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">Reply</h2>
          <form className="space-y-4" onSubmit={submitReply}>
            <Textarea
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write a reply."
              rows={7}
              value={body}
            />
            {replyError ? <p className="text-sm text-red-300">{replyError}</p> : null}
            <Button disabled={isReplying} type="submit">
              {isReplying ? "Posting..." : "Post reply"}
            </Button>
          </form>
        </section>
      ) : (
        <StateCard
          actionHref={result.viewer.tier === "guest" ? "/register" : result.viewer.tier === "registered" || result.viewer.tier === "expiredSubscriber" ? "/#pricing" : `/community/c/${result.category.slug}`}
          actionLabel={result.viewer.tier === "guest" ? "Create account" : result.viewer.tier === "registered" || result.viewer.tier === "expiredSubscriber" ? "View access options" : "Back to category"}
          description={getReplyRestrictionMessage(result)}
          title="Replying unavailable"
        />
      )}
    </div>
  );
}
