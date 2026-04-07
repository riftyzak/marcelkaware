"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type HomepageBlockType =
  | "heroSupportText"
  | "trustStrip"
  | "featureRow"
  | "faqRow"
  | "ctaBlock";

function defaultDataForType(type: HomepageBlockType) {
  if (type === "heroSupportText") {
    return {
      type,
      eyebrow: "Controlled access platform",
      title: "Premium delivery for a structured Windows client experience.",
      body: "Access, updates, and community visibility stay tied to one account state model with predictable entitlement handling.",
      primaryLabel: "View access",
      primaryHref: "/#pricing",
      secondaryLabel: "Contact",
      secondaryHref: "/contact",
    };
  }
  if (type === "trustStrip") {
    return { type, items: ["Account-aware delivery", "Structured entitlement checks", "Controlled support and community access"] };
  }
  if (type === "featureRow") {
    return {
      type,
      title: "Platform focus",
      intro: "Show the clearest product capabilities without drifting into a generic marketing builder.",
      features: [
        { title: "Account-bound access", body: "Purchase, downloads, and launcher access remain synchronized." },
        { title: "Operational clarity", body: "Support, community, and release communication stay structured." },
      ],
    };
  }
  if (type === "faqRow") {
    return {
      type,
      title: "Common questions",
      items: [
        { question: "How is access handled?", answer: "Access is tied to account state and entitlement, not permanent local login." },
        { question: "Where do updates appear?", answer: "Announcements and structured changelogs publish separately." },
      ],
    };
  }
  return {
    type,
    title: "Need access?",
    body: "Review the current access path, account requirements, and support coverage before continuing.",
    primaryLabel: "View access",
    primaryHref: "/#pricing",
    secondaryLabel: "Contact",
    secondaryHref: "/contact",
  };
}

function linesToPairs(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [left, ...rest] = line.split("|");
      return {
        left: left?.trim() ?? "",
        right: rest.join("|").trim(),
      };
    })
    .filter((item) => item.left && item.right);
}

function toItemsText(block: any) {
  if (!block) {
    return "";
  }
  if (block.type === "trustStrip") {
    return block.items.join("\n");
  }
  if (block.type === "featureRow") {
    return block.features.map((item: any) => `${item.title} | ${item.body}`).join("\n");
  }
  if (block.type === "faqRow") {
    return block.items.map((item: any) => `${item.question} | ${item.answer}`).join("\n");
  }
  return "";
}

export function AdminHomepageBlockEditor({
  slug,
  initialType,
}: {
  slug: string;
  initialType?: HomepageBlockType;
}) {
  const router = useRouter();
  const result = useQuery(api.homepageContent.adminHomepageBlockDetail, slug === "new" ? "skip" : { slug });
  const upsertHomepageBlock = useMutation(api.homepageContent.upsertHomepageBlock);
  const setPublished = useMutation(api.homepageContent.setHomepageBlockPublished);

  const [customSlug, setCustomSlug] = useState("");
  const [type, setType] = useState<HomepageBlockType>(initialType ?? "heroSupportText");
  const [label, setLabel] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [published, setPublishedState] = useState(false);
  const [eyebrow, setEyebrow] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [intro, setIntro] = useState("");
  const [primaryLabel, setPrimaryLabel] = useState("");
  const [primaryHref, setPrimaryHref] = useState("");
  const [secondaryLabel, setSecondaryLabel] = useState("");
  const [secondaryHref, setSecondaryHref] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (slug === "new") {
      const defaults = defaultDataForType(initialType ?? "heroSupportText");
      setType(defaults.type);
      setLabel("");
      setCustomSlug("");
      setSortOrder("0");
      setPublishedState(false);
      setEyebrow("eyebrow" in defaults ? defaults.eyebrow ?? "" : "");
      setTitle("title" in defaults ? defaults.title ?? "" : "");
      setBody("body" in defaults ? defaults.body ?? "" : "");
      setIntro("intro" in defaults ? defaults.intro ?? "" : "");
      setPrimaryLabel("primaryLabel" in defaults ? defaults.primaryLabel ?? "" : "");
      setPrimaryHref("primaryHref" in defaults ? defaults.primaryHref ?? "" : "");
      setSecondaryLabel("secondaryLabel" in defaults ? defaults.secondaryLabel ?? "" : "");
      setSecondaryHref("secondaryHref" in defaults ? defaults.secondaryHref ?? "" : "");
      setItemsText(toItemsText(defaults));
    }
  }, [initialType, slug]);

  useEffect(() => {
    if (result?.block) {
      setCustomSlug(result.block.slug);
      setType(result.block.type);
      setLabel(result.block.label);
      setSortOrder(String(result.block.sortOrder));
      setPublishedState(result.block.published);
      setEyebrow(result.block.data.type === "heroSupportText" ? result.block.data.eyebrow ?? "" : "");
      setTitle("title" in result.block.data ? result.block.data.title ?? "" : "");
      setBody("body" in result.block.data ? result.block.data.body ?? "" : "");
      setIntro(result.block.data.type === "featureRow" ? result.block.data.intro ?? "" : "");
      setPrimaryLabel("primaryLabel" in result.block.data ? result.block.data.primaryLabel ?? "" : "");
      setPrimaryHref("primaryHref" in result.block.data ? result.block.data.primaryHref ?? "" : "");
      setSecondaryLabel("secondaryLabel" in result.block.data ? result.block.data.secondaryLabel ?? "" : "");
      setSecondaryHref("secondaryHref" in result.block.data ? result.block.data.secondaryHref ?? "" : "");
      setItemsText(toItemsText(result.block.data));
    }
  }, [result]);

  const helperText = useMemo(() => {
    if (type === "trustStrip") {
      return "One trust item per line.";
    }
    if (type === "featureRow") {
      return "One feature per line using: Title | Description";
    }
    if (type === "faqRow") {
      return "One FAQ per line using: Question | Answer";
    }
    return null;
  }, [type]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPending(true);
      setError(null);

      let data: any;
      if (type === "heroSupportText") {
        data = {
          type,
          eyebrow: eyebrow.trim() || undefined,
          title,
          body,
          primaryLabel,
          primaryHref,
          secondaryLabel: secondaryLabel.trim() || undefined,
          secondaryHref: secondaryHref.trim() || undefined,
        };
      } else if (type === "trustStrip") {
        data = {
          type,
          items: itemsText
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        };
      } else if (type === "featureRow") {
        data = {
          type,
          title,
          intro: intro.trim() || undefined,
          features: linesToPairs(itemsText).map((item) => ({ title: item.left, body: item.right })),
        };
      } else if (type === "faqRow") {
        data = {
          type,
          title,
          items: linesToPairs(itemsText).map((item) => ({ question: item.left, answer: item.right })),
        };
      } else {
        data = {
          type,
          title,
          body,
          primaryLabel,
          primaryHref,
          secondaryLabel: secondaryLabel.trim() || undefined,
          secondaryHref: secondaryHref.trim() || undefined,
        };
      }

      const blockId = await upsertHomepageBlock({
        blockId: result?.block?._id,
        slug: customSlug,
        type,
        label,
        sortOrder: Number.parseInt(sortOrder, 10) || 0,
        data,
      });

      if (blockId && published !== Boolean(result?.block?.published)) {
        await setPublished({ blockId, published });
      }

      router.push("/admin/homepage");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save homepage block.");
    } finally {
      setPending(false);
    }
  }

  if (slug !== "new" && result === undefined) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Homepage block editor" description="Loading homepage block data." />
        <StateCard title="Loading homepage block" description="Preparing the typed homepage block editor." />
      </div>
    );
  }

  if (slug !== "new" && result && !result.ok) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Admin" title="Homepage block editor" description="Homepage content editing is restricted to admins." />
        <StateCard
          title="Homepage block unavailable"
          description={result.message ?? "Homepage block unavailable."}
          tone="error"
          actionHref="/admin/homepage"
          actionLabel="Back to homepage content"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        actions={
          <Link href="/admin/homepage">
            <Button variant="secondary">Back to homepage content</Button>
          </Link>
        }
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Homepage content", href: "/admin/homepage" }, { label: slug === "new" ? "New" : "Edit" }]}
        eyebrow="Admin"
        title={slug === "new" ? "Create homepage block" : "Edit homepage block"}
        description="Typed homepage modules only. No freeform page builder, no arbitrary layouts."
      />
      <Card className="space-y-5">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Type</label>
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-slate-100"
                disabled={slug !== "new"}
                onChange={(event) => setType(event.target.value as HomepageBlockType)}
                value={type}
              >
                <option value="heroSupportText">Hero support text</option>
                <option value="trustStrip">Trust strip</option>
                <option value="featureRow">Feature row</option>
                <option value="faqRow">FAQ row</option>
                <option value="ctaBlock">CTA block</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Label</label>
              <Input onChange={(event) => setLabel(event.target.value)} value={label} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Slug</label>
              <Input onChange={(event) => setCustomSlug(event.target.value)} value={customSlug} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Sort order</label>
              <Input onChange={(event) => setSortOrder(event.target.value)} type="number" value={sortOrder} />
            </div>
          </div>

          {type === "heroSupportText" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Eyebrow</label>
                <Input onChange={(event) => setEyebrow(event.target.value)} value={eyebrow} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Title</label>
                <Input onChange={(event) => setTitle(event.target.value)} value={title} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Body</label>
                <Textarea onChange={(event) => setBody(event.target.value)} rows={5} value={body} />
              </div>
            </>
          ) : null}

          {type === "featureRow" || type === "faqRow" || type === "ctaBlock" ? (
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Title</label>
              <Input onChange={(event) => setTitle(event.target.value)} value={title} />
            </div>
          ) : null}

          {type === "featureRow" ? (
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Intro</label>
              <Textarea onChange={(event) => setIntro(event.target.value)} rows={4} value={intro} />
            </div>
          ) : null}

          {type === "heroSupportText" || type === "ctaBlock" ? (
            <>
              {type === "ctaBlock" ? (
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Body</label>
                  <Textarea onChange={(event) => setBody(event.target.value)} rows={5} value={body} />
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Primary CTA label</label>
                  <Input onChange={(event) => setPrimaryLabel(event.target.value)} value={primaryLabel} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Primary CTA URL</label>
                  <Input onChange={(event) => setPrimaryHref(event.target.value)} value={primaryHref} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Secondary CTA label</label>
                  <Input onChange={(event) => setSecondaryLabel(event.target.value)} value={secondaryLabel} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Secondary CTA URL</label>
                  <Input onChange={(event) => setSecondaryHref(event.target.value)} value={secondaryHref} />
                </div>
              </div>
            </>
          ) : null}

          {type === "trustStrip" || type === "featureRow" || type === "faqRow" ? (
            <div className="space-y-2">
              <label className="text-sm text-slate-300">
                {type === "trustStrip" ? "Items" : type === "featureRow" ? "Features" : "Questions"}
              </label>
              <Textarea onChange={(event) => setItemsText(event.target.value)} rows={8} value={itemsText} />
              {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
            </div>
          ) : null}

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
            <input
              checked={published}
              className="h-4 w-4 accent-cyan-400"
              onChange={(event) => setPublishedState(event.target.checked)}
              type="checkbox"
            />
            Published
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="flex justify-end">
            <Button disabled={pending} type="submit">
              {pending ? "Saving..." : "Save homepage block"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
