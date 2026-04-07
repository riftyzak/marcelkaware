"use client";

import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useQuery } from "convex/react";
import Link from "next/link";

function StaticFallbackHomeBlocks() {
  return (
    <>
      <section className="grid gap-8 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="space-y-6">
          <Badge>Controlled access platform</Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Premium delivery for a Windows client that stays fast, structured, and controlled.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Product-first purchase flow, account-bound entitlement checks, gated downloads,
              and a device-aware launcher path that does not depend on insecure permanent local
              login.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center rounded-full bg-cyan-400 px-5 text-sm font-medium text-slate-950"
              href="/#pricing"
            >
              View access
            </Link>
            <Link
              className="inline-flex h-11 items-center rounded-full border border-white/10 px-5 text-sm font-medium text-slate-100"
              href="/contact"
            >
              Contact
            </Link>
          </div>
        </div>
        <Card className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Platform foundations</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Built now</h2>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>Account-aware access and subscription state management.</li>
            <li>Server-enforced downloads, launcher entitlement, and revocation.</li>
            <li>Structured updates, community access, and support workflows.</li>
            <li>Operational visibility with audit logging for sensitive actions.</li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Account-bound delivery",
            body: "Purchase, dashboard, and launcher entitlement stay tied to one account, with paid access removed automatically when status changes.",
          },
          {
            title: "Device-aware launcher flow",
            body: "The launcher exchanges a short-lived pairing secret for revocable tokens and revalidates entitlement on a recurring basis.",
          },
          {
            title: "Security-first surface",
            body: "Ban state overrides paid access, audit logs capture sensitive actions, and appeal access stays outside normal support paths.",
          },
        ].map((item) => (
          <Card className="space-y-3" key={item.title}>
            <h3 className="text-xl font-semibold text-white">{item.title}</h3>
            <p className="text-sm leading-7 text-slate-300">{item.body}</p>
          </Card>
        ))}
      </section>
    </>
  );
}

function renderBlock(block: any) {
  if (block.type === "heroSupportText") {
    const data = block.data;
    return (
      <section className="grid gap-8 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end" key={block._id}>
        <div className="space-y-6">
          {data.eyebrow ? <Badge>{data.eyebrow}</Badge> : null}
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              {data.title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">{data.body}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center rounded-full bg-cyan-400 px-5 text-sm font-medium text-slate-950"
              href={data.primaryHref}
            >
              {data.primaryLabel}
            </Link>
            {data.secondaryLabel && data.secondaryHref ? (
              <Link
                className="inline-flex h-11 items-center rounded-full border border-white/10 px-5 text-sm font-medium text-slate-100"
                href={data.secondaryHref}
              >
                {data.secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
        <Card className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Structured access</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Account-aware delivery</h2>
          </div>
          <p className="text-sm leading-7 text-slate-300">
            Access, downloads, launcher entitlement, and community visibility remain
            synchronized through one account state model.
          </p>
        </Card>
      </section>
    );
  }

  if (block.type === "trustStrip") {
    return (
      <section className="grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2 xl:grid-cols-4" key={block._id}>
        {block.data.items.map((item: string) => (
          <div className="text-sm text-slate-300" key={item}>
            {item}
          </div>
        ))}
      </section>
    );
  }

  if (block.type === "featureRow") {
    return (
      <section className="space-y-6 border-t border-white/10 pt-8" key={block._id}>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-white">{block.data.title}</h2>
          {block.data.intro ? (
            <p className="max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
              {block.data.intro}
            </p>
          ) : null}
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {block.data.features.map((feature: { title: string; body: string }) => (
            <div className="space-y-3 border-t border-white/10 pt-4" key={feature.title}>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-7 text-slate-300">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "faqRow") {
    return (
      <section className="space-y-6 border-t border-white/10 pt-8" key={block._id}>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-white">{block.data.title}</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {block.data.items.map((item: { question: string; answer: string }) => (
            <div className="space-y-3 border-t border-white/10 pt-4" key={item.question}>
              <h3 className="text-lg font-semibold text-white">{item.question}</h3>
              <p className="text-sm leading-7 text-slate-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-white/10 pt-8" key={block._id}>
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-white">{block.data.title}</h2>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{block.data.body}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex h-10 items-center rounded-[8px] bg-[color:var(--accent)] px-4 text-sm font-medium text-slate-950"
            href={block.data.primaryHref}
          >
            {block.data.primaryLabel}
          </Link>
          {block.data.secondaryLabel && block.data.secondaryHref ? (
            <Link
              className="inline-flex h-10 items-center rounded-[8px] border border-white/10 px-4 text-sm font-medium text-slate-100"
              href={block.data.secondaryHref}
            >
              {block.data.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function HomepageBlocks({
  excludeTypes,
  fallback = true,
}: {
  excludeTypes?: string[];
  fallback?: boolean;
}) {
  const blocks = useQuery(api.homepageContent.publicHomepageBlocks, {});
  const filteredBlocks = blocks?.filter((block: any) => !excludeTypes?.includes(block.type)) ?? [];

  if (blocks === undefined) {
    return fallback ? <StaticFallbackHomeBlocks /> : null;
  }

  if (!filteredBlocks.length) {
    return fallback ? <StaticFallbackHomeBlocks /> : null;
  }

  return <div className="space-y-16">{filteredBlocks.map((block: any) => renderBlock(block))}</div>;
}
