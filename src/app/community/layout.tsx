import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function CommunityAreaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
