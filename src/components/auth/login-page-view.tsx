"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RecaptchaDisclosure } from "@/components/auth/recaptcha-disclosure";
import { useRecaptchaV3 } from "@/components/auth/recaptcha-v3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginPageView({
  initialNotice = null,
  initialNextPath = null,
}: {
  initialNotice?: string | null;
  initialNextPath?: string | null;
}) {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { available, execute, script } = useRecaptchaV3();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState("/app");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (initialNotice) {
      setNotice(initialNotice);
      document.cookie = "auth_notice=; Max-Age=0; path=/";
    }
    if (initialNextPath) {
      setNextPath(initialNextPath);
      document.cookie = "auth_next=; Max-Age=0; path=/";
    }

    const storedNotice = window.sessionStorage.getItem("auth:notice");
    const storedNext = window.sessionStorage.getItem("auth:next");
    if (storedNotice) {
      setNotice(storedNotice);
    }
    if (storedNext) {
      setNextPath(storedNext);
    }
  }, [initialNextPath, initialNotice]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const recaptchaToken = await execute("login");
      const result = await signIn("password", {
        username,
        password,
        recaptchaToken,
        recaptchaAction: "login",
        flow: "signIn",
      });

      if (result.signingIn) {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("auth:notice");
          window.sessionStorage.removeItem("auth:next");
        }
        router.push(nextPath);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPageShell title="Sign in">
      {script}
      <form className="space-y-6" onSubmit={onSubmit}>
        {notice ? <AuthAlert message={notice} tone="notice" /> : null}

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="page-login-username">
              Username
            </label>
            <Input
              autoComplete="username"
              id="page-login-username"
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="page-login-password">
              Password
            </label>
            <Input
              autoComplete="current-password"
              id="page-login-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[color:var(--text-muted)]">
            <input
              checked={remember}
              className="h-4 w-4 rounded border-white/15 bg-[#191d23] accent-[#8fb0d8]"
              onChange={(event) => setRemember(event.target.checked)}
              type="checkbox"
            />
            Stay logged in
          </label>
        </div>

        {error ? <AuthAlert message={error} /> : null}

        <Button
          className="h-12 w-full border-0 bg-[#8fb0d8] text-base text-[#0b1015] hover:bg-[#a3bee0]"
          disabled={pending || !available}
          type="submit"
        >
          {pending ? "Signing in..." : "Sign in"}
        </Button>

        <RecaptchaDisclosure />
      </form>
    </AuthPageShell>
  );
}
