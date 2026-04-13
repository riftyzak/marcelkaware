"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/ui/page-intro";
import { StateCard } from "@/components/ui/state-card";
import { normalizeClientErrorMessage } from "@/lib/errors/normalize-client-error";

export function RouteErrorState({
  error,
  reset,
  title = "This page could not load",
  description = "Something went wrong while loading this page.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const message = normalizeClientErrorMessage(error, "Please try again in a moment.");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <PageIntro title={title} description={description} />
      <StateCard
        title="Page unavailable"
        description={message}
        tone="error"
        secondaryAction={
          <>
            <Button onClick={() => reset()} variant="primary">
              Retry
            </Button>
            <Button onClick={() => router.back()} variant="secondary">
              Go back
            </Button>
          </>
        }
      />
    </div>
  );
}
