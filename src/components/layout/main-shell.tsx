"use client";

import { usePathname } from "next/navigation";

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAuth = pathname === "/login" || pathname === "/register";

  if (isHome || isAuth) {
    return <main className="w-full flex-1">{children}</main>;
  }

  return <main className="mx-auto flex-1 max-w-[1240px] w-full px-4 py-6 sm:px-6">{children}</main>;
}
