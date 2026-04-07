import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export function Badge({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium",
        "border-[color:var(--border)] bg-[color:var(--panel-muted)] text-[color:var(--text-muted)]",
        className,
      )}
      title={title}
    >
      {children}
    </span>
  );
}
