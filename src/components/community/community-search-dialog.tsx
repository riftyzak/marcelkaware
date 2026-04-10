"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function CommunitySearchDialog({
  iconClassName,
}: {
  iconClassName?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            aria-label="Open forum search"
            className={
              iconClassName ?? "inline-flex h-8 w-8 items-center justify-center text-slate-300 transition hover:text-white"
            }
            type="button"
          >
            <Search className="h-4.5 w-4.5" />
          </button>
        }
      />
      <DialogContent className="max-w-[520px] rounded-lg border-[color:var(--border)] bg-[#11151b] p-0">
        <div className="border-b border-[color:var(--border)] px-5 py-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg">Forum search</DialogTitle>
            <p className="text-sm text-[color:var(--text-dim)]">
              Search by keyword or narrow the next iteration by author handle.
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--text)]" htmlFor="forum-search-keyword">
              Keyword
            </label>
            <Input id="forum-search-keyword" placeholder="Search thread titles or post text" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--text)]" htmlFor="forum-search-author">
              Author
            </label>
            <Input id="forum-search-author" placeholder="Filter by handle or display name" />
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-4 py-4 text-sm text-[color:var(--text-dim)]">
            Search results will appear here once forum search is wired to backend query logic.
          </div>

          <Button className="w-full" variant="secondary">
            Search forum
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
