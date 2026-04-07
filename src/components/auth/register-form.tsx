"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPending(true);
      setError(null);
      const result = await signIn("password", {
        email,
        password,
        name,
        flow: "signUp",
      });
      if (result.signingIn) {
        router.push("/app");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create the account.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Create your account</h1>
          <p className="text-sm text-slate-400">Accounts are required for payment, gated delivery, and entitlement enforcement.</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="name">
            Display name
          </label>
          <Input id="name" onChange={(event) => setName(event.target.value)} required value={name} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="email">
            Email
          </label>
          <Input
            autoComplete="email"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300" htmlFor="password">
            Password
          </label>
          <Input
            autoComplete="new-password"
            id="password"
            minLength={10}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Creating..." : "Create account"}
        </Button>
        <p className="text-sm text-slate-400">
          Already registered?{" "}
          <Link className="text-cyan-300 hover:text-cyan-200" href="/login">
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
