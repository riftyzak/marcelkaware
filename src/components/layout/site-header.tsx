"use client";

import { Button } from "@/components/ui/button";
import { LogoFull, LogoIcon } from "@/components/layout/logo";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { authConfig } from "@/lib/config/auth";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function SiteHeader() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  const navLinks = [
    { label: "Forum", href: "/community" },
    { label: "Support", href: "/app/tickets", protected: true },
    { label: "Download", href: "/app/downloads", protected: true },
    { label: "Purchase", href: "/pricing", protected: true },
  ];
  const homeNavLinks = [
    { label: "Main", href: "/" },
    { label: "Forum", href: "/community" },
    { label: "Support", href: "/app/tickets", protected: true },
  ];

  function onProtectedNav(event: React.MouseEvent<HTMLAnchorElement>, href: string, isProtected?: boolean) {
    if (!isProtected || isAuthenticated) {
      return;
    }

    event.preventDefault();
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("auth:notice", "You must be logged-in to do that.");
      window.sessionStorage.setItem("auth:next", href);
    }
    router.push("/login");
  }

  if (isHome) {
    return (
      <header className="relative z-40 border-b border-white/8 bg-[#0b1015]/80 backdrop-blur-md">
        <div className="mx-auto grid h-13 max-w-[1240px] grid-cols-[auto_1fr_auto] items-center gap-8 px-4 sm:px-6">
          <Link className="inline-flex items-center justify-self-start pr-4 leading-none" href="/">
            <span className="sm:hidden">
              <LogoIcon className="h-8" />
            </span>
            <span className="hidden sm:block">
              <LogoFull className="h-8" />
            </span>
          </Link>

          <nav className="hidden items-center gap-8 justify-self-center sm:flex">
            {homeNavLinks.map((item) => (
              <Link
                className="text-sm text-slate-300 transition-colors hover:!text-[#8fb0d8]"
                href={item.href}
                key={item.href}
                onClick={(event) => onProtectedNav(event, item.href, item.protected)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-self-end gap-2">
            {isAuthenticated ? (
              <>
                <Link className="px-2 py-1 text-sm text-slate-400 transition hover:text-white" href="/app">
                  Account
                </Link>
                <button
                  className="px-2 py-1 text-sm text-slate-400 transition hover:text-white"
                  onClick={() => void signOut()}
                  type="button"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <AuthDialog mode="login" />
                <Button
                  className="h-8 border-0 bg-[#8fb0d8]/45 px-3 text-sm text-[#dbe7f5] hover:bg-[#8fb0d8]/45"
                  disabled
                  title={authConfig.registrationDisabledMessage}
                  variant="primary"
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[#15181d]">
      <div className="mx-auto flex h-12 max-w-[1240px] items-center gap-6 px-4 sm:px-6">
        <Link className="inline-flex shrink-0 items-center pr-4 leading-none" href="/">
          <span className="sm:hidden">
            <LogoIcon className="h-8" />
          </span>
          <span className="hidden sm:block">
            <LogoFull className="h-8" />
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" &&
                !item.href.includes("#") &&
                pathname.startsWith(`${item.href}/`)) ||
              (item.href === "/#pricing" && pathname === "/pricing");

            return (
              <Link
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-white/[0.06] text-[color:var(--text)]"
                    : "text-[color:var(--text-muted)] hover:!text-[#8fb0d8]"
                }`}
                href={item.href}
                key={item.href}
                onClick={(event) => onProtectedNav(event, item.href, item.protected)}
              >
                {item.label}
              </Link>
            );
          })}
          {pathname === "/contact" ? (
            <Link className="rounded-md bg-white/[0.06] px-3 py-1.5 text-sm text-[color:var(--text)]" href="/contact">
              Appeals
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2 text-sm">
          {isAuthenticated ? (
            <>
              <Link className="text-[color:var(--text-muted)] hover:text-[color:var(--text)]" href="/app">
                Dashboard
              </Link>
              <button
                className="text-[color:var(--text-muted)] transition hover:text-[color:var(--text)]"
                onClick={() => void signOut()}
                type="button"
              >
                Sign out
              </button>
            </>
            ) : (
              <>
                <AuthDialog mode="login" />
                <Button
                  className="h-8 border-0 bg-[#8fb0d8]/45 px-3 text-sm text-[#dbe7f5] hover:bg-[#8fb0d8]/45"
                  disabled
                  title={authConfig.registrationDisabledMessage}
                  variant="primary"
                >
                  Register
                </Button>
              </>
            )}
          </div>
      </div>
    </header>
  );
}
