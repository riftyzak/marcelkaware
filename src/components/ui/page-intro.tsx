import type { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}) {
  return (
    <div className="space-y-2">
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          {eyebrow ? (
            <p className="text-sm text-[color:var(--text-dim)]">{eyebrow}</p>
          ) : null}
          <h1 className="text-[2rem] font-semibold tracking-tight text-[color:var(--text)]">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-[color:var(--text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
