"use client";

import { Badge } from "@/components/ui/badge";

const variantClasses: Record<string, string> = {
  neutral: "border-white/10 bg-white/5 text-slate-200",
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
  emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  rose: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  violet: "border-violet-400/20 bg-violet-400/10 text-violet-100",
};

const iconLabels: Record<string, string> = {
  shield: "SH",
  star: "ST",
  check: "OK",
  spark: "SP",
  bolt: "BT",
};

export function UserBadgeRow({
  badges,
  compact = false,
}: {
  badges: Array<{
    _id?: string;
    slug?: string;
    name: string;
    description?: string;
    styleVariant: string;
    iconKey?: string | null;
  }>;
  compact?: boolean;
}) {
  if (!badges.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Badge
          className={`${variantClasses[badge.styleVariant] ?? variantClasses.neutral} ${compact ? "px-2.5 py-0.5 text-[11px]" : ""}`}
          key={badge._id ?? badge.slug ?? badge.name}
          title={badge.description ?? badge.name}
        >
          {badge.iconKey && iconLabels[badge.iconKey] ? (
            <span className="mr-1 text-[10px] uppercase tracking-[0.14em]">
              {iconLabels[badge.iconKey]}
            </span>
          ) : null}
          {badge.name}
        </Badge>
      ))}
    </div>
  );
}
