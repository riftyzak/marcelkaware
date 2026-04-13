"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAlert } from "@/components/auth/auth-alert";
import { normalizeAuthErrorMessage } from "@/components/auth/normalize-auth-error";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RecaptchaDisclosure } from "@/components/auth/recaptcha-disclosure";
import { useRecaptchaV3 } from "@/components/auth/recaptcha-v3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterPageView() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { available, execute, script } = useRecaptchaV3();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState("/app");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedNext = window.sessionStorage.getItem("auth:next");
    if (storedNext) {
      setNextPath(storedNext);
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const recaptchaToken = await execute("register");
      const result = await signIn("password", {
        email,
        password,
        name: username,
        acceptedTerms,
        recaptchaToken,
        recaptchaAction: "register",
        flow: "signUp",
      });

      if (result.signingIn) {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("auth:notice");
          window.sessionStorage.removeItem("auth:next");
        }
        router.push(nextPath);
      }
    } catch (cause) {
      setError(normalizeAuthErrorMessage(cause, "Unable to create account."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPageShell title="Create account">
      {script}
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="page-register-username">
              Username
            </label>
            <Input
              autoComplete="username"
              id="page-register-username"
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="page-register-email">
              Email
            </label>
            <Input
              autoComplete="email"
              id="page-register-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="page-register-password">
              Password
            </label>
            <Input
              autoComplete="new-password"
              id="page-register-password"
              minLength={10}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-end">
            <Link className="text-[color:var(--text-muted)] transition-colors hover:text-[#8fb0d8]" href="/login">
              Already have an account?
            </Link>
          </div>
          <label className="inline-flex cursor-pointer items-start gap-2 text-[color:var(--text-muted)]">
            <input
              checked={acceptedTerms}
              className="mt-0.5 h-4 w-4 rounded border-white/15 bg-[#191d23] accent-[#8fb0d8]"
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              type="checkbox"
            />
            <span>
              I agree to the{" "}
              <Link
                className="font-medium transition-colors hover:text-white"
                href="/tos"
                style={{ color: "#8fb0d8" }}
              >
                terms of use
              </Link>{" "}
              and{" "}
              <Link
                className="font-medium transition-colors hover:text-white"
                href="/privacy"
                style={{ color: "#8fb0d8" }}
              >
                privacy policy
              </Link>
              .
            </span>
          </label>
        </div>

        {error ? <AuthAlert message={error} /> : null}

        <Button
          className="h-12 w-full border-0 bg-[#8fb0d8] text-base text-[#0b1015] hover:bg-[#a3bee0]"
          disabled={pending || !acceptedTerms || !available}
          type="submit"
        >
          {pending ? "Creating account..." : "Create account"}
        </Button>

        <RecaptchaDisclosure />
      </form>
    </AuthPageShell>
  );
}
