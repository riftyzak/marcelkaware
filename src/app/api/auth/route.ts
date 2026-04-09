import type { NextRequest } from "next/server";
import { proxyAuthActionToConvex } from "../../../../node_modules/@convex-dev/auth/dist/nextjs/server/proxy.js";
import { authConfig } from "@/lib/config/auth";
import { checkAuthRateLimit } from "@/lib/security/auth-rate-limit";
import { verifyRecaptchaToken } from "@/lib/security/recaptcha";

const authProxyOptions = { cookieConfig: { maxAge: null } };

export async function POST(request: NextRequest) {
  const payload = await request.clone().json().catch(() => null);

  if (payload?.action === "auth:signIn") {
    const params = payload.args?.params ?? {};
    const flow = params.flow;

    if (flow === "signUp" && !authConfig.registrationEnabled) {
      return Response.json({ error: authConfig.registrationDisabledMessage }, { status: 403 });
    }

    if (flow === "signIn") {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const remoteIp =
        forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? undefined;
      const username =
        typeof params.username === "string" && params.username.trim().length > 0
          ? params.username.trim().toLowerCase()
          : "anonymous";
      const ipKey = remoteIp?.trim().length ? remoteIp.trim() : "unknown";
      const ipRateLimit = checkAuthRateLimit(`ip:${ipKey}`);

      if (!ipRateLimit.ok) {
        return Response.json(
          { error: ipRateLimit.message },
          {
            status: 429,
            headers: { "Retry-After": String(ipRateLimit.retryAfterSeconds) },
          },
        );
      }

      const rateLimit = checkAuthRateLimit(`login:${ipKey}:${username}`);

      if (!rateLimit.ok) {
        return Response.json(
          { error: rateLimit.message },
          {
            status: 429,
            headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
          },
        );
      }

      const captcha = await verifyRecaptchaToken(
        params.recaptchaToken,
        remoteIp,
        typeof params.recaptchaAction === "string" ? params.recaptchaAction : undefined,
      );

      if (!captcha.ok) {
        return Response.json({ error: captcha.message }, { status: 400 });
      }
    }

  }

  return proxyAuthActionToConvex(request, authProxyOptions);
}

export async function GET() {
  return new Response("Invalid method", { status: 405 });
}
