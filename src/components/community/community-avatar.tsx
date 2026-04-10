"use client";

import { cn } from "@/lib/utils";

function getInitials(name: string | null | undefined) {
  if (!name) {
    return "MB";
  }

  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "MB"
  );
}

export function CommunityAvatar({
  avatarUrl,
  displayName,
  className,
  fallbackClassName,
}: {
  avatarUrl?: string | null;
  displayName?: string | null;
  className?: string;
  fallbackClassName?: string;
}) {
  if (avatarUrl) {
    return (
      <img
        alt={displayName ?? "Member avatar"}
        className={cn("h-10 w-10 rounded-full object-cover", className)}
        height={40}
        src={avatarUrl}
        width={40}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--panel-muted)] text-sm font-semibold text-[color:var(--text)]",
        fallbackClassName,
        className,
      )}
    >
      {getInitials(displayName)}
    </div>
  );
}
