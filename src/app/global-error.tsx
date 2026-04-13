"use client";

import { RouteErrorState } from "@/components/errors/route-error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
          <RouteErrorState
            description="The application hit an unexpected error."
            error={error}
            reset={reset}
            title="Application error"
          />
        </main>
      </body>
    </html>
  );
}
