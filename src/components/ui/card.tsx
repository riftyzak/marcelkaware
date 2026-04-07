import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border p-5",
        "border-[color:var(--border)] bg-[color:var(--panel)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
