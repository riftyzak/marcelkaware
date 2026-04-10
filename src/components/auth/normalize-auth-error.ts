"use client";

export function normalizeAuthErrorMessage(cause: unknown, fallback: string) {
  const raw = cause instanceof Error ? cause.message : fallback;

  if (!raw) {
    return fallback;
  }

  if (raw.includes("Invalid credentials")) {
    return "Invalid credentials.";
  }

  if (raw.includes("Too many attempts")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return raw
    .replace(/\[Request ID:[^\]]+\]\s*/g, "")
    .replace(/Server Error\s*Uncaught Error:\s*/g, "")
    .trim() || fallback;
}
