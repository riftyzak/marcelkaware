export async function verifyRecaptchaToken(
  token: string | undefined,
  remoteIp?: string,
  expectedAction?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    return { ok: false, message: "Security verification is unavailable." };
  }

  if (!token) {
    return { ok: false, message: "Complete the security check." };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false, message: "Security verification failed." };
  }

  const result = (await response.json()) as {
    success?: boolean;
    score?: number;
    action?: string;
  };

  if (!result.success) {
    return { ok: false, message: "Complete the security check." };
  }

  if (expectedAction && result.action && result.action !== expectedAction) {
    return { ok: false, message: "Security verification failed." };
  }

  if (typeof result.score === "number" && result.score < 0.4) {
    return { ok: false, message: "Security verification failed." };
  }

  return { ok: true };
}
