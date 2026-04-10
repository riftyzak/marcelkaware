import { convexAuth } from "@convex-dev/auth/server";
import { PasswordAuth } from "./passwordAuth";

function buildUsernameLoginPlaceholder(username: string) {
  return `${username}@username-login.local`;
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    PasswordAuth({
      profile(params) {
        const email = String(params.email ?? "").trim().toLowerCase();
        const username =
          typeof params.username === "string" ? params.username.trim().toLowerCase() : "";
        const displayName =
          typeof params.name === "string" ? params.name.trim().slice(0, 80) : undefined;
        if (!email && !username) {
          throw new Error("Email is required.");
        }
        return {
          email: email || buildUsernameLoginPlaceholder(username),
          ...(displayName ? { displayName } : {}),
        };
      },
      validatePasswordRequirements(password) {
        if (password.length < 10) {
          throw new Error("Password must be at least 10 characters.");
        }
      },
    }),
  ],
});
