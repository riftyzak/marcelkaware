"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthAlert } from "@/components/auth/auth-alert";
import { normalizeAuthErrorMessage } from "@/components/auth/normalize-auth-error";
import { RecaptchaDisclosure } from "@/components/auth/recaptcha-disclosure";
import { useRecaptchaV3 } from "@/components/auth/recaptcha-v3";
import { LogoFull } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthPanelProps = {
  onSuccess?: () => void;
  compact?: boolean;
  notice?: string | null;
  redirectTo?: string;
};

export function AuthPanel({
  onSuccess,
  compact = false,
  notice = null,
  redirectTo = "/app",
}: AuthPanelProps) {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { available, execute, script } = useRecaptchaV3();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setPending(true);
      setError(null);
      const action = "login";
      const recaptchaToken = await execute(action);

      const result = await signIn("password", {
        username,
        password,
        recaptchaToken,
        recaptchaAction: action,
        flow: "signIn",
      });

      if (result.signingIn) {
        onSuccess?.();
        router.push(redirectTo);
      }
    } catch (cause) {
      setError(normalizeAuthErrorMessage(cause, "Unable to sign in."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={compact ? "space-y-5" : "mx-auto max-w-md space-y-5"}>
      {script}
      <div className="border-b border-white/8 pb-3">
        <p className="text-sm font-medium text-[#8fb0d8]">Login</p>
      </div>

      {compact ? (
        <div className="flex justify-center pt-1">
          <LogoFull className="h-7" />
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        {notice ? <AuthAlert message={notice} tone="notice" /> : null}

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="auth-username">
            Username
          </label>
          <Input
            autoComplete="username"
            id="auth-username"
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="auth-password">
            Password
          </label>
          <Input
            autoComplete="current-password"
            id="auth-password"
            minLength={10}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[color:var(--text-muted)]">
          <input
            checked={remember}
            className="h-4 w-4 rounded border-white/15 bg-[#191d23] accent-[#8fb0d8]"
            onChange={(event) => setRemember(event.target.checked)}
            type="checkbox"
          />
          Stay logged in
        </label>

        {error ? <AuthAlert message={error} /> : null}

        <Button
          className="w-full border-0 bg-[#8fb0d8] text-[#0b1015] hover:bg-[#a3bee0]"
          disabled={pending || !available}
          type="submit"
          variant="primary"
        >
          {pending ? "Signing in..." : "Sign in"}
        </Button>

        <RecaptchaDisclosure />
      </form>
    </div>
  );
}
