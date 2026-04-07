import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-dim)]", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span className="flex items-center gap-2" key={`${item.label}-${index}`}>
            {item.href && !isLast ? (
              <Link className="transition hover:text-[color:var(--text)]" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? "text-[color:var(--text-muted)]" : undefined)}>{item.label}</span>
            )}
            {!isLast ? <span className="text-[color:var(--text-dim)]">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
