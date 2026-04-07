import type { ReactNode } from "react";
import { Card } from "./card";
import { Button } from "./button";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function StateCard({
  title,
  description,
  actionLabel,
  actionHref,
  secondaryAction,
  tone = "default",
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryAction?: ReactNode;
  tone?: "default" | "error" | "warning";
}) {
  return (
    <Card
      className={cn(
        "space-y-3",
        tone === "error" ? "border-[#c56a6a]/40 bg-[color:var(--panel-muted)]" : undefined,
        tone === "warning" ? "border-[#caa36a]/40 bg-[color:var(--panel-muted)]" : undefined,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[color:var(--text)]">{title}</h2>
        <p
          className={cn(
            "text-sm leading-6 text-[color:var(--text-muted)]",
            tone === "error" ? "text-[color:var(--text)]" : undefined,
            tone === "warning" ? "text-[color:var(--text)]" : undefined,
          )}
        >
          {description}
        </p>
      </div>
      {actionLabel && actionHref ? (
        <div className="flex flex-wrap gap-3">
          <Link href={actionHref}>
            <Button variant={tone === "error" ? "danger" : "primary"}>{actionLabel}</Button>
          </Link>
          {secondaryAction}
        </div>
      ) : secondaryAction ? (
        <div className="flex flex-wrap gap-3">{secondaryAction}</div>
      ) : null}
    </Card>
  );
}
