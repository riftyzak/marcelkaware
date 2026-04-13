"use client";

import { normalizeClientErrorMessage } from "@/lib/errors/normalize-client-error";

export function normalizeAuthErrorMessage(cause: unknown, fallback: string) {
  const raw = normalizeClientErrorMessage(cause, fallback);

  if (!raw) {
    return fallback;
  }

  if (raw.includes("Invalid credentials")) {
    return "Invalid credentials.";
  }

  if (raw.includes("Too many attempts")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return raw.trim() || fallback;
}
