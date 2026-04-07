"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ConfirmActionButton({
  idleLabel,
  confirmLabel,
  pendingLabel,
  onConfirm,
  disabled,
  variant = "danger",
}: {
  idleLabel: string;
  confirmLabel?: string;
  pendingLabel?: string;
  onConfirm: () => Promise<void> | void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!confirming) {
      return;
    }
    const timer = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  async function handleClick() {
    if (disabled || pending) {
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    try {
      setPending(true);
      await onConfirm();
      setConfirming(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button disabled={disabled || pending} onClick={() => void handleClick()} variant={variant}>
      {pending ? pendingLabel ?? "Working..." : confirming ? confirmLabel ?? "Confirm" : idleLabel}
    </Button>
  );
}
