import { cn } from "@/lib/utils/cn";

export function Separator({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0 bg-[color:var(--border)]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  );
}
