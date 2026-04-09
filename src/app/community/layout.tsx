import type { ReactNode } from "react";
import { requireAuthenticatedPage } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export default async function CommunityAreaLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuthenticatedPage();

  return children;
}
