"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[color:var(--accent)] text-slate-950 hover:bg-[color:var(--accent-strong)] disabled:bg-[color:var(--panel-strong)] disabled:text-[color:var(--text-dim)]",
  secondary:
    "bg-[color:var(--panel-muted)] text-[color:var(--text)] ring-1 ring-[color:var(--border)] hover:bg-[color:var(--panel-strong)] disabled:bg-[color:var(--panel)] disabled:text-[color:var(--text-dim)]",
  ghost:
    "bg-transparent text-[color:var(--text)] hover:bg-white/5 disabled:text-[color:var(--text-dim)]",
  danger:
    "bg-[color:var(--danger)] text-white hover:brightness-105 disabled:bg-[color:var(--panel-strong)] disabled:text-[color:var(--text-dim)]",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-[8px] px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
