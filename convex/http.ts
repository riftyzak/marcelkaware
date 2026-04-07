import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({
  path: "/launcher/auth",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const result = await ctx.runAction(internal.launcherNode.exchangePairingChallenge, {
      code: body.code,
      deviceId: body.deviceId,
      deviceName: body.deviceName,
      hardwareFingerprint: body.hardwareFingerprint,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return Response.json(result);
  }),
});

http.route({
  path: "/launcher/refresh",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const result = await ctx.runAction(internal.launcherNode.refreshSession, {
      refreshToken: body.refreshToken,
      hardwareFingerprint: body.hardwareFingerprint,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });
    return Response.json(result);
  }),
});

http.route({
  path: "/launcher/entitlement",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const body = await request.json();
    const result = await ctx.runAction(internal.launcherNode.validateEntitlement, {
      accessToken: token,
      hardwareFingerprint: body.hardwareFingerprint,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });
    return Response.json(result, { status: result.ok ? 200 : 403 });
  }),
});

http.route({
  path: "/payments/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing Stripe signature.", { status: 400 });
    }
    try {
      const result = await ctx.runAction(internal.paymentsNode.processStripeWebhook, {
        rawBody,
        signature,
      });
      return Response.json(result);
    } catch (error) {
      return new Response(error instanceof Error ? error.message : "Invalid Stripe webhook.", {
        status: 400,
      });
    }
  }),
});

http.route({
  path: "/payments/crypto/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");
    if (!signature) {
      return new Response("Missing crypto signature.", { status: 400 });
    }
    try {
      const result = await ctx.runAction(internal.paymentsNode.processCryptoWebhook, {
        rawBody,
        signature,
      });
      return Response.json(result);
    } catch (error) {
      return new Response(error instanceof Error ? error.message : "Invalid crypto webhook.", {
        status: 400,
      });
    }
  }),
});

export default http;
