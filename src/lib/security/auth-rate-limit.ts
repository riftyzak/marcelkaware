type AuthAttemptState = {
  count: number;
  windowStartedAt: number;
  lastAttemptAt: number;
  blockedUntil: number;
};

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 6;
const MIN_INTERVAL_MS = 1_200;
const BLOCK_DURATION_MS = 60_000;

const attemptStore = new Map<string, AuthAttemptState>();

function getOrCreateState(key: string, now: number) {
  const existing = attemptStore.get(key);

  if (!existing || now - existing.windowStartedAt > WINDOW_MS) {
    const fresh: AuthAttemptState = {
      count: 0,
      windowStartedAt: now,
      lastAttemptAt: 0,
      blockedUntil: 0,
    };
    attemptStore.set(key, fresh);
    return fresh;
  }

  return existing;
}

export function checkAuthRateLimit(key: string, now = Date.now()) {
  const state = getOrCreateState(key, now);

  if (state.blockedUntil > now) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((state.blockedUntil - now) / 1000)),
      message: "Too many login attempts. Please wait a minute and try again.",
    } as const;
  }

  if (state.lastAttemptAt && now - state.lastAttemptAt < MIN_INTERVAL_MS) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((MIN_INTERVAL_MS - (now - state.lastAttemptAt)) / 1000)),
      message: "Please wait a moment before trying again.",
    } as const;
  }

  state.count += 1;
  state.lastAttemptAt = now;

  if (state.count > MAX_ATTEMPTS_PER_WINDOW) {
    state.blockedUntil = now + BLOCK_DURATION_MS;

    return {
      ok: false,
      retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
      message: "Too many login attempts. Please wait a minute and try again.",
    } as const;
  }

  return { ok: true } as const;
}

