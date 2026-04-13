"use client";

import { RouteErrorState } from "@/components/errors/route-error-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorState description="The page hit an unexpected error while rendering." error={error} reset={reset} />;
}
