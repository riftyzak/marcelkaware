"use client";

import { useConvexAuth } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function CommunityAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return;
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("auth:notice", "You must be logged-in to do that.");
      window.sessionStorage.setItem("auth:next", pathname);
    }
    router.replace("/login");
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-[color:var(--text-muted)]">
        Loading community...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
