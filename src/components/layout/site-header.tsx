"use client";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const primaryLinks = [
    { label: "Forum", href: "/community" },
    { label: "Help", href: "/help" },
    { label: "Downloads", href: "/app/downloads" },
    { label: "Buy", href: "/#pricing" },
  ];

  if (isHome) {
    return (
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1015]/78 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link className="text-base font-semibold tracking-[0.02em] text-white" href="/">
            {siteConfig.name}
          </Link>

          <nav className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
            <Link className="hover:text-white" href="/">
              Main
            </Link>
            <Link className="hover:text-white" href="/community">
              Forum
            </Link>
            <Link className="hover:text-white" href="/help">
              Help
            </Link>
            <Link className="hover:text-white" href="/#pricing">
              Buy
            </Link>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link className="px-2 py-1 text-sm text-slate-300 transition hover:text-white" href="/app">
                  Account
                </Link>
                <button
                  className="px-2 py-1 text-sm text-slate-300 transition hover:text-white"
                  onClick={() => void signOut()}
                  type="button"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link className="px-2 py-1 text-sm text-slate-300 transition hover:text-white" href="/login">
                  Login
                </Link>
                <Link href="/register">
                  <Button className="h-9">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[#181b20]">
      <div className="border-b border-[color:var(--border)] bg-[#13161a]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link className="text-base font-semibold text-[color:var(--text)]" href="/">
              {siteConfig.name}
            </Link>
            <span className="text-sm text-[color:var(--text-dim)]">{siteConfig.accentLabel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--text-muted)]">
            {isAuthenticated ? (
              <>
                <Link className="px-2 py-1 hover:text-[color:var(--text)]" href="/app">
                  Dashboard
                </Link>
                <button
                  className="px-2 py-1 text-[color:var(--text-muted)] transition hover:text-[color:var(--text)]"
                  onClick={() => void signOut()}
                  type="button"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link className="px-2 py-1 hover:text-[color:var(--text)]" href="/login">
                  Login
                </Link>
                <Link href="/register">
                  <Button className="h-9" variant="secondary">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-1 px-4 py-2 sm:px-6">
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {primaryLinks.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" &&
                !item.href.includes("#") &&
                pathname.startsWith(`${item.href}/`)) ||
              (item.href === "/#pricing" && pathname === "/pricing");

            return (
              <Link
                className={`rounded-[8px] px-3 py-2 transition-colors ${
                  active
                    ? "bg-[#23272d] text-[color:var(--text)]"
                    : "text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
          {pathname === "/contact" ? (
            <Link className="rounded-[8px] bg-[#23272d] px-3 py-2 text-[color:var(--text)]" href="/contact">
              Appeals
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
