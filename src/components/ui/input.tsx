import { cn } from "@/lib/utils/cn";
import * as React from "react";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[8px] border px-3 text-sm outline-none ring-0",
        "border-[color:var(--border)] bg-[color:var(--panel-muted)] text-[color:var(--text)] placeholder:text-[color:var(--text-dim)] focus:border-[color:var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
