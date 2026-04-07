import { convexAuth } from "@convex-dev/auth/server";
import { PasswordAuth } from "./passwordAuth";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    PasswordAuth({
      profile(params) {
        const email = String(params.email ?? "").trim().toLowerCase();
        const displayName =
          typeof params.name === "string" ? params.name.trim().slice(0, 80) : undefined;
        if (!email) {
          throw new Error("Email is required.");
        }
        return {
          email,
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
