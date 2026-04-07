import type { NextRequest } from "next/server";
import { proxyAuthActionToConvex } from "../../../../node_modules/@convex-dev/auth/dist/nextjs/server/proxy.js";

const authProxyOptions = { cookieConfig: { maxAge: null } };

export async function POST(request: NextRequest) {
  return proxyAuthActionToConvex(request, authProxyOptions);
}

export async function GET() {
  return new Response("Invalid method", { status: 405 });
}
