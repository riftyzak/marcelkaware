"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";

type CategoryFormState = {
  categoryId?: string;
  title: string;
  slug: string;
  description: string;
  sortOrder: string;
  visibleToGuests: boolean;
  visibleToRegisteredUsers: boolean;
  visibleToActiveSubscribers: boolean;
  allowThreads: boolean;
  allowReplies: boolean;
  isArchived: boolean;
};

const initialFormState: CategoryFormState = {
  title: "",
  slug: "",
  description: "",
  sortOrder: "10",
  visibleToGuests: true,
  visibleToRegisteredUsers: true,
  visibleToActiveSubscribers: true,
  allowThreads: false,
  allowReplies: false,
  isArchived: false,
};

function permissionSummary(item: any) {
  const visibleTo = [
    item.visibleToGuests ? "guest" : null,
    item.visibleToRegisteredUsers ? "member" : null,
    item.visibleToActiveSubscribers ? "subscriber" : null,
  ].filter(Boolean);

  const posting = [
    item.allowThreads ? "threads" : null,
    item.allowReplies ? "replies" : null,
  ].filter(Boolean);

  return {
    visibleTo: visibleTo.length ? visibleTo.join(" / ") : "no one",
    posting: posting.length ? posting.join(" + ") : "read only",
  };
}

export function ForumCategoryManager() {
  const categories = useQuery(api.forum.adminCategoryIndex, {});
  const saveCategory = useMutation(api.forum.upsertCategory);
  const reorderCategories = useMutation(api.forum.reorderCategories);
  const [form, setForm] = useState<CategoryFormState>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(() => (categories?.ok ? categories.items : []), [categories]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await saveCategory({
        categoryId: form.categoryId as any,
        title: form.title,
        slug: form.slug,
        description: form.description || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        visibleToGuests: form.visibleToGuests,
        visibleToRegisteredUsers: form.visibleToRegisteredUsers,
        visibleToActiveSubscribers: form.visibleToActiveSubscribers,
        allowThreads: form.allowThreads,
        allowReplies: form.allowReplies,
        isArchived: form.isArchived,
      });
      setForm(initialFormState);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save category.");
    } finally {
      setIsSaving(false);
    }
  }

  async function moveCategory(categoryId: string, direction: -1 | 1) {
    const currentIndex = items.findIndex((item: any) => item._id === categoryId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) {
      return;
    }
    const orderedIds = [...items.map((item: any) => item._id)];
    [orderedIds[currentIndex], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[currentIndex]];

    try {
      setIsReordering(true);
      setError(null);
      await reorderCategories({ orderedIds: orderedIds as any });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reorder categories.");
    } finally {
      setIsReordering(false);
    }
  }

  if (categories === undefined) {
    return (
      <div className="space-y-4">
        <PageIntro title="Forum categories" description="Loading categories." />
        <StateCard title="Loading categories" description="Preparing forum category administration." />
      </div>
    );
  }

  if (!categories.ok) {
    return (
      <div className="space-y-4">
        <PageIntro title="Forum categories" description="Admins only." />
        <StateCard title="Forum admin unavailable" description={categories.message ?? "Forum admin unavailable."} tone="error" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageIntro
        breadcrumbs={[{ label: "Admin", href: "/admin/users" }, { label: "Forum categories" }]}
        title="Forum categories"
        description="Category structure and permissions."
      />

      <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {form.categoryId ? "Edit category" : "Create category"}
          </h2>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Category title"
              value={form.title}
            />
            <Input
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="category-slug"
              value={form.slug}
            />
            <Textarea
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Short category description"
              rows={4}
              value={form.description}
            />
            <Input
              min={0}
              onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
              placeholder="Sort order"
              type="number"
              value={form.sortOrder}
            />
            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              {[
                ["visibleToGuests", "Visible to guests"],
                ["visibleToRegisteredUsers", "Visible to registered users"],
                ["visibleToActiveSubscribers", "Visible to active subscribers"],
                ["allowThreads", "Allow new threads"],
                ["allowReplies", "Allow replies"],
                ["isArchived", "Archive category"],
              ].map(([field, label]) => (
                <label className="flex items-center gap-3 border border-white/10 bg-slate-950/40 px-4 py-3" key={field}>
                  <input
                    checked={Boolean(form[field as keyof CategoryFormState])}
                    className="h-4 w-4 accent-cyan-400"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field]: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Saving..." : form.categoryId ? "Update category" : "Create category"}
              </Button>
              {form.categoryId ? (
                <Button onClick={() => setForm(initialFormState)} type="button" variant="secondary">
                  Clear editor
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          {items.length ? (
            items.map((item: any, index: number) => {
              const summary = permissionSummary(item);
              return (
                <Card className="space-y-4" key={item._id}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          order {item.sortOrder}
                        </span>
                        {item.isArchived ? (
                          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
                            archived
                          </span>
                        ) : null}
                      </div>
                      {item.description ? <p className="text-sm text-slate-400">{item.description}</p> : null}
                      <p className="text-xs text-slate-500">{item.slug}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        disabled={isReordering || index === 0}
                        onClick={() => void moveCategory(item._id, -1)}
                        variant="secondary"
                      >
                        Up
                      </Button>
                      <Button
                        disabled={isReordering || index === items.length - 1}
                        onClick={() => void moveCategory(item._id, 1)}
                        variant="secondary"
                      >
                        Down
                      </Button>
                      <Button
                        onClick={() =>
                          setForm({
                            categoryId: item._id,
                            title: item.title,
                            slug: item.slug,
                            description: item.description ?? "",
                            sortOrder: String(item.sortOrder),
                            visibleToGuests: item.visibleToGuests,
                            visibleToRegisteredUsers: item.visibleToRegisteredUsers,
                            visibleToActiveSubscribers: item.visibleToActiveSubscribers,
                            allowThreads: item.allowThreads,
                            allowReplies: item.allowReplies,
                            isArchived: item.isArchived,
                          })
                        }
                        variant="secondary"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                    <p>Visibility {summary.visibleTo}</p>
                    <p>Posting {summary.posting}</p>
                  </div>
                </Card>
              );
            })
          ) : (
            <StateCard title="No categories yet" description="Create the first category to define the forum hierarchy." />
          )}
        </div>
      </div>
    </div>
  );
}
