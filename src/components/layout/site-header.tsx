"use client";

import { Button } from "@/components/ui/button";
import { LogoFull, LogoIcon } from "@/components/layout/logo";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { authConfig } from "@/lib/config/auth";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavLinkItem = {
  label: string;
  href: string;
  protected?: boolean;
};

function MobileNavMenu({
  links,
  isAuthenticated,
  onProtectedNav,
  onSignOut,
  onOpenChange,
}: {
  links: NavLinkItem[];
  isAuthenticated: boolean;
  onProtectedNav: (event: React.MouseEvent<HTMLAnchorElement>, href: string, isProtected?: boolean) => void;
  onSignOut: () => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        className="inline-flex h-9 w-9 items-center justify-center text-slate-200 transition hover:text-white"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
      </button>

      <div
        aria-hidden={!open}
        className={`absolute left-1/2 top-full z-30 h-[calc(100dvh-56px)] w-screen -translate-x-1/2 origin-top overflow-hidden bg-[#0d1117] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "pointer-events-auto opacity-100 scale-y-100" : "pointer-events-none opacity-0 scale-y-[0.985]"
        }`}
      >
        <div className="flex h-full flex-col px-6 pb-6 pt-7">
          <div className="space-y-6">
            {links.map((item) => (
              <Link
                className="block py-0.5 text-[2.15rem] font-semibold tracking-[-0.05em] text-white transition hover:text-[#8fb0d8]"
                href={item.href}
                key={item.href}
                onClick={(event) => {
                  onProtectedNav(event, item.href, item.protected);
                  setOpen(false);
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-auto border-t border-white/8 pt-5">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  className="block rounded-2xl px-4 py-3 text-[0.98rem] text-slate-200 transition hover:bg-white/5 hover:text-white"
                  href="/app"
                  onClick={() => setOpen(false)}
                >
                  Account
                </Link>
                <button
                  className="block w-full rounded-2xl px-4 py-3 text-left text-[0.98rem] text-slate-200 transition hover:bg-white/5 hover:text-white"
                  onClick={() => {
                    setOpen(false);
                    onSignOut();
                  }}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/12 bg-transparent text-[0.98rem] font-medium text-white transition hover:bg-white/5"
                  href="/login"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Button
                  className="h-12 w-full rounded-2xl border border-transparent bg-[#8fb0d8] text-[#0b1015] hover:bg-[#9dbbe0]"
                  disabled
                  title={authConfig.registrationDisabledMessage}
                  variant="primary"
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function SiteHeader() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isCommunity = pathname === "/community" || pathname.startsWith("/community/");
  const [homeHeaderProgress, setHomeHeaderProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: NavLinkItem[] = [
    { label: "Forum", href: "/community" },
    { label: "Support", href: "/app/tickets", protected: true },
    { label: "Download", href: "/app/downloads", protected: true },
    { label: "Purchase", href: "/purchase", protected: true },
  ];
  const homeNavLinks: NavLinkItem[] = [
    { label: "Main", href: "/" },
    { label: "Forum", href: "/community" },
    { label: "Help", href: "/help" },
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

  useEffect(() => {
    if (!isHome) {
      setHomeHeaderProgress(0);
      return;
    }

    const onScroll = () => {
      const progress = Math.min(window.scrollY / 180, 1);
      setHomeHeaderProgress(progress);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  if (isHome) {
    const backgroundOpacity = mobileMenuOpen ? 1 : homeHeaderProgress * 0.78;
    const blurAmount = mobileMenuOpen ? 0 : homeHeaderProgress * 14;
    const borderOpacity = mobileMenuOpen ? 1 : homeHeaderProgress;

    return (
      <header
        className="fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-200"
        style={{
          backgroundColor: mobileMenuOpen ? "rgba(13, 17, 23, 1)" : `rgba(11, 16, 21, ${backgroundOpacity})`,
          backdropFilter: `blur(${blurAmount}px)`,
          WebkitBackdropFilter: `blur(${blurAmount}px)`,
          borderBottom: mobileMenuOpen ? "1px solid transparent" : `1px solid rgba(42,47,54,${borderOpacity})`,
          boxShadow: mobileMenuOpen ? "none" : homeHeaderProgress > 0.08 ? "0 8px 28px rgba(0,0,0,0.18)" : "none",
        }}
      >
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="relative flex h-14 items-center justify-between sm:hidden">
            <Link className="inline-flex items-center leading-none" href="/">
              <LogoIcon className="h-7" />
            </Link>

            <div className="flex items-center gap-2">
              {!isAuthenticated ? <AuthDialog mode="login" /> : null}
              <MobileNavMenu
                isAuthenticated={isAuthenticated}
                links={homeNavLinks}
                onProtectedNav={onProtectedNav}
                onOpenChange={setMobileMenuOpen}
                onSignOut={() => void signOut()}
              />
            </div>
          </div>

          <div className="hidden h-13 grid-cols-[auto_1fr_auto] items-center gap-8 sm:grid">
            <Link className="inline-flex items-center justify-self-start pr-4 leading-none" href="/">
              <LogoFull className="h-8" />
            </Link>

            <nav className="flex items-center gap-8 justify-self-center">
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
        </div>
      </header>
    );
  }

  return (
    <header
      className={`sticky top-0 z-40 border-b ${
        isCommunity
          ? mobileMenuOpen
            ? "border-transparent bg-[rgba(13,17,23,1)] backdrop-blur-[0px] shadow-none"
            : "border-[#2a2f36] bg-[rgba(11,16,21,0.78)] backdrop-blur-[14px] shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
          : mobileMenuOpen
            ? "border-transparent bg-[#0d1117] shadow-none"
            : "border-[#2a2f36] bg-[#15181d]"
      }`}
      style={isCommunity && !mobileMenuOpen ? { WebkitBackdropFilter: "blur(14px)" } : undefined}
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between sm:hidden">
          <Link className="inline-flex items-center leading-none" href="/">
            <LogoIcon className="h-7" />
          </Link>

          <div className="flex items-center gap-2">
            {!isAuthenticated ? <AuthDialog mode="login" /> : null}
            <MobileNavMenu
              isAuthenticated={isAuthenticated}
              links={navLinks}
              onProtectedNav={onProtectedNav}
              onOpenChange={setMobileMenuOpen}
              onSignOut={() => void signOut()}
            />
          </div>
        </div>

        <div className="hidden h-13 grid-cols-[auto_1fr_auto] items-center gap-8 sm:grid">
          <Link className="inline-flex items-center justify-self-start pr-4 leading-none" href="/">
            <LogoFull className="h-8" />
          </Link>

          <nav className="flex items-center gap-8 justify-self-center">
            {navLinks.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" &&
                  !item.href.includes("#") &&
                  pathname.startsWith(`${item.href}/`)) ||
                (item.href === "/purchase" && pathname === "/purchase");

              return (
                <Link
                  className={`text-sm transition-colors ${
                    active ? "text-white" : "text-slate-300 hover:!text-[#8fb0d8]"
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
              <Link className="text-sm text-white" href="/contact">
                Appeals
              </Link>
            ) : null}
          </nav>

          <div className="flex items-center justify-self-end gap-2">
            {isAuthenticated ? (
              <>
                <Link className="px-2 py-1 text-sm text-slate-400 transition hover:text-white" href="/app">
                  Dashboard
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
      </div>

    </header>
  );
}
