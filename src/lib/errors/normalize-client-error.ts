"use client";

function toRawMessage(cause: unknown, fallback: string) {
  if (cause instanceof Error) {
    return cause.message || fallback;
  }

  if (typeof cause === "string") {
    return cause;
  }

  return fallback;
}

export function normalizeClientErrorMessage(cause: unknown, fallback: string) {
  const raw = toRawMessage(cause, fallback);

  if (!raw) {
    return fallback;
  }

  let normalized = raw
    .replace(/\[CONVEX [^\]]+\]\s*/g, "")
    .replace(/\[Request ID:[^\]]+\]\s*/g, "")
    .replace(/Server Error\s*Uncaught Error:\s*/gi, "")
    .replace(/Uncaught Error:\s*/gi, "")
    .replace(/Called by client[\s\S]*/gi, "")
    .replace(/\n\s*at\s+[\s\S]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized) {
    return fallback;
  }

  if (/failed to fetch|networkerror|load failed/i.test(normalized)) {
    return "Connection failed. Please try again.";
  }

  if (/not authenticated|authentication required|unauthorized/i.test(normalized)) {
    return "Please sign in to continue.";
  }

  if (/forbidden|not allowed|permission denied/i.test(normalized)) {
    return "You do not have access to this action.";
  }

  if (/\bserver error\b|\brequest id\b|\[CONVEX/i.test(normalized)) {
    return fallback;
  }

  return normalized;
}
