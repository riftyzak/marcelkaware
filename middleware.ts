import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/account(.*)",
  "/purchase(.*)",
  "/admin(.*)",
  "/community(.*)",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (!isProtectedRoute(request)) {
    return undefined;
  }

  if (await convexAuth.isAuthenticated()) {
    return undefined;
  }

  const response = nextjsMiddlewareRedirect(request, "/login");
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  response.cookies.set("auth_notice", "You must be logged-in to do that.", {
    maxAge: 60,
    path: "/",
    sameSite: "lax",
  });
  response.cookies.set("auth_next", nextPath, {
    maxAge: 300,
    path: "/",
    sameSite: "lax",
  });

  return response;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
