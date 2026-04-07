import { cn } from "@/lib/utils/cn";
import * as React from "react";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-[8px] border px-3 py-3 text-sm outline-none",
        "border-[color:var(--border)] bg-[color:var(--panel-muted)] text-[color:var(--text)] placeholder:text-[color:var(--text-dim)] focus:border-[color:var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
