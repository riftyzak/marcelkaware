"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import Link from "next/link";

const severityClasses: Record<string, string> = {
  info: "border-cyan-400/20 bg-cyan-400/10 text-cyan-50",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-50",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-50",
  critical: "border-red-400/20 bg-red-400/10 text-red-50",
};

export function SiteBanner() {
  const banner = useQuery(api.banners.activeBanner, {});

  if (banner === undefined || !banner) {
    return null;
  }

  return (
    <div className="relative z-20 border-b border-white/5 px-4 pt-3 sm:px-6">
      <div
        className={`mx-auto flex max-w-6xl flex-col gap-3 rounded-3xl border px-4 py-3 text-sm shadow-[0_18px_70px_-36px_rgba(15,23,42,0.8)] sm:flex-row sm:items-center sm:justify-between ${severityClasses[banner.severity] ?? severityClasses.info}`}
      >
        <div className="flex items-start gap-3">
          <span className="rounded-full border border-current/15 bg-black/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]">
            {banner.severity}
          </span>
          <p className="leading-6">{banner.message}</p>
        </div>
        {banner.ctaLabel && banner.ctaUrl ? (
          <Link href={banner.ctaUrl}>
            <Button className="w-full sm:w-auto" variant="secondary">
              {banner.ctaLabel}
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
