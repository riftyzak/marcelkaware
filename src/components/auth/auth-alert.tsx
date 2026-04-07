"use client";

import { CircleAlert } from "lucide-react";

export function AuthAlert({
  message,
  tone = "error",
}: {
  message: string;
  tone?: "error" | "notice";
}) {
  const palette =
    tone === "error"
      ? "border-[#c56a6a]/35 bg-[#c56a6a]/10 text-white"
      : "border-[#8fb0d8]/25 bg-[#8fb0d8]/10 text-white";

  const iconColor = tone === "error" ? "text-[#d78a8a]" : "text-[#8fb0d8]";

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${palette}`}>
      <CircleAlert className={`mt-0.5 h-4 w-4 flex-none ${iconColor}`} />
      <span>{message}</span>
    </div>
  );
}
