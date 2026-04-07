"use client";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useAction } from "convex/react";
import { useState } from "react";

export function LauncherPairingCard() {
  const issuePairingChallenge = useAction(api.launcherNode.issuePairingChallenge);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function generateCode() {
    try {
      setPending(true);
      setError(null);
      const result = await issuePairingChallenge({});
      setPairingCode(result.code);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to generate a pairing code.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-4 border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">Launcher pairing</h2>
        <p className="text-sm text-[color:var(--text-muted)]">
          Generate a one-time code for the launcher.
        </p>
      </div>
      <Button disabled={pending} onClick={() => void generateCode()} variant="secondary">
        {pending ? "Generating..." : "Generate code"}
      </Button>
      {pairingCode ? (
        <div className="border border-[color:var(--border)] bg-[color:var(--panel-muted)] px-4 py-3">
          <p className="text-sm text-[color:var(--text-dim)]">Pairing code</p>
          <p className="mt-1 font-mono text-2xl text-white">{pairingCode}</p>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">Expires in about 10 minutes.</p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
