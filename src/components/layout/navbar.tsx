"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LayoutDashboard, LogOut } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type AuthState = "checking" | "authenticated" | "unauthenticated" | "error";
type SessionResponse = {
  session: object | null;
  user: object | null;
};

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function isSessionResponse(value: unknown): value is SessionResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "session" in value &&
    "user" in value &&
    (value.session === null || typeof value.session === "object") &&
    (value.user === null || typeof value.user === "object")
  );
}

const navigationItemClassName =
  "flex h-10 items-center rounded px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const mobileNavigationItemClassName =
  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-[#fff8e7] hover:text-[#c94f1c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]";

function isNavigationActive(pathname: string, href: string): boolean {
  return href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function AuthLink({
  href,
  label,
  mobile,
  accent = false,
}: {
  href: string;
  label: string;
  mobile: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      className={`group inline-flex h-10 ${
        mobile ? "w-full" : "w-24"
      } items-center justify-center border px-3 text-sm font-semibold shadow-[0_2px_6px_#00000026] transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 focus-visible:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd277] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100 ${
        accent
          ? `rounded-tl-[5px] rounded-tr-[20px] rounded-br-[5px] rounded-bl-[5px] ${
              mobile
                  ? "border-[#c94f1c] text-[#c94f1c] hover:bg-[#ffd277] hover:text-[#08162d] hover:shadow-[0_5px_16px_#ffd27755] focus-visible:bg-[#ffd277] focus-visible:text-[#08162d]"
                  : "border-[#ffd277] text-[#ffd277] hover:bg-[#ffd277] hover:text-[#08162d] hover:shadow-[0_5px_16px_#ffd27755] focus-visible:bg-[#ffd277] focus-visible:text-[#08162d]"
            }`
          : `rounded-tl-[20px] rounded-tr-[5px] rounded-br-[5px] rounded-bl-[5px] ${
              mobile
                  ? "border-[#e96a32] text-[#c94f1c] hover:bg-[#e96a32] hover:text-white hover:shadow-[0_5px_16px_#e96a3255] focus-visible:bg-[#e96a32] focus-visible:text-white"
                  : "border-[#e96a32] text-[#ffd277] hover:bg-[#e96a32] hover:text-white hover:shadow-[0_5px_16px_#e96a3255] focus-visible:bg-[#e96a32] focus-visible:text-white"
            }`
      }`}
      href={href}
    >
      {label}
    </Link>
  );
}

function NavigationLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`${navigationItemClassName} group relative hover:text-[#ffd277]`}
      href={href}
    >
      <span className="relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
        {label}
      </span>
      <span
        aria-hidden="true"
        className={`absolute inset-x-3 bottom-[7px] h-px origin-left rounded-full bg-gradient-to-r from-[#e96a32] via-[#ffd277] to-[#e96a32] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
        }`}
      />
      <span
        aria-hidden="true"
        className="absolute bottom-[4px] left-3 size-1.5 rounded-full bg-[#ffd277] opacity-0 shadow-[0_0_8px_#ffd277] transition-[left,opacity] duration-300 ease-out motion-reduce:transition-none group-hover:left-[calc(100%-0.75rem)] group-hover:opacity-100 group-focus-visible:left-[calc(100%-0.75rem)] group-focus-visible:opacity-100"
      />
    </Link>
  );
}

function MobileNavigationLink({
  href,
  label,
  index,
  active = false,
  onNavigate,
  reduceMotion,
}: {
  href: string;
  label: string;
  index: number;
  active?: boolean;
  onNavigate: () => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: reduceMotion ? 0 : -8 }}
      initial={{ opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : -12 }}
      transition={{
        delay: reduceMotion ? 0 : index * 0.045,
        duration: reduceMotion ? 0 : 0.24,
        ease: "easeOut",
      }}
    >
      <Link
        aria-current={active ? "page" : undefined}
        className={`${mobileNavigationItemClassName} group ${
          active ? "bg-[#fff8e7] text-[#c94f1c]" : ""
        }`}
        href={href}
        onClick={onNavigate}
      >
        <span
          className={`size-1.5 rounded-full bg-[#e96a32]/60 transition-transform group-hover:scale-150 group-hover:bg-[#c94f1c] motion-reduce:transition-none ${
            active ? "scale-150 bg-[#c94f1c]" : ""
          }`}
        />
        <span>{label}</span>
        <ArrowRight
          aria-hidden="true"
          className="ml-auto size-4 -translate-x-1 text-[#c94f1c] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
        />
      </Link>
    </motion.div>
  );
}

function AccountActions({
  authState,
  authError,
  onLogout,
  isLoggingOut,
  mobile = false,
}: {
  authState: AuthState;
  authError: string | null;
  onLogout: () => void;
  isLoggingOut: boolean;
  mobile?: boolean;
}) {
  const linkClassName = mobile
    ? mobileNavigationItemClassName
    : navigationItemClassName;
  const errorClassName = mobile
    ? "px-3 py-1 text-xs text-red-700"
    : "px-2 text-xs text-red-200";
  const accountActionBaseClassName = `group inline-flex h-10 ${
    mobile ? "w-full" : "min-w-28"
  } items-center justify-center gap-2 border px-4 text-sm font-bold shadow-[0_2px_6px_#00000026] transition-all duration-200 ease-in-out hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0`;
  const dashboardClassName = mobile
    ? "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#ffd277] bg-[linear-gradient(115deg,#ffd277_0%,#ffb45c_52%,#e96a32_100%)] px-4 text-sm font-extrabold text-[#08162d] shadow-[0_5px_14px_rgba(233,106,50,0.2)] transition-all hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c94f1c] motion-reduce:transition-none"
    : "group relative inline-flex h-10 min-w-[140px] items-center justify-center overflow-hidden rounded-full border-2 border-[#ffd277] bg-[#08162d] px-9 text-[#ffd277] shadow-[0_0_0_2px_#e96a32] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-transparent hover:text-[#08162d] hover:shadow-[0_0_0_12px_transparent] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd277] motion-reduce:transition-none motion-reduce:active:scale-100";
  const logoutClassName = `${accountActionBaseClassName} rounded-tl-[5px] rounded-tr-[20px] rounded-br-[5px] rounded-bl-[5px] ${
    mobile
      ? "border-[#e96a32] text-[#c94f1c] hover:bg-[#e96a32] hover:text-white focus-visible:outline-[#c94f1c]"
      : "border-[#e96a32] text-[#ffd277] hover:bg-[#e96a32] hover:text-white focus-visible:outline-[#ffd277]"
  }`;

  if (authState === "checking") {
    return (
      <span aria-live="polite" className={linkClassName}>
        Checking session…
      </span>
    );
  }

  if (authState === "authenticated") {
    return (
      <>
        {authError && (
          <span aria-live="polite" className={errorClassName} role="alert">
            {authError}
          </span>
        )}
        <Link className={dashboardClassName} href="/dashboard">
          {mobile ? (
            <>
              <LayoutDashboard aria-hidden="true" className="size-4" />
              <span>Dashboard</span>
              <ArrowRight aria-hidden="true" className="ml-auto size-4" />
            </>
          ) : (
            <>
              <ArrowRight
                aria-hidden="true"
                className="absolute right-3 z-10 size-5 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-right-6 motion-reduce:transition-none motion-reduce:group-hover:right-3"
              />
              <span className="relative z-10 -translate-x-3 text-sm font-bold transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-3 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
                Dashboard
              </span>
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 z-0 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffd277] opacity-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:size-56 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:size-5 motion-reduce:group-hover:opacity-0"
              />
              <ArrowRight
                aria-hidden="true"
                className="absolute -left-6 z-10 size-5 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:left-3 motion-reduce:transition-none motion-reduce:group-hover:-left-6"
              />
            </>
          )}
        </Link>
        <button
          aria-busy={isLoggingOut}
          className={`${logoutClassName} disabled:cursor-wait disabled:opacity-60`}
          disabled={isLoggingOut}
          onClick={onLogout}
          type="button"
        >
          <LogOut aria-hidden="true" className="size-4" />
          {isLoggingOut ? "Logging out…" : "Logout"}
        </button>
      </>
    );
  }

  return (
    <>
      {authState === "error" && (
        <span aria-live="polite" className={errorClassName} role="alert">
          {authError ?? "Sign-in status unavailable"}
        </span>
      )}
      <AuthLink
        href="/login"
        label="Login"
        mobile={mobile}
      />
      <AuthLink
        href="/register"
        label="Register"
        mobile={mobile}
        accent
      />
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/get-session`, {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        let payload: unknown;

        try {
          payload = await response.json();
        } catch {
          throw new Error("The authentication server returned an invalid session.");
        }

        if (!response.ok) {
          throw new Error("Could not check your sign-in status.");
        }

        if (payload !== null && !isSessionResponse(payload)) {
          throw new Error("The authentication server returned an invalid session.");
        }

        setAuthState(
          payload !== null && payload.session !== null && payload.user !== null
            ? "authenticated"
            : "unauthenticated",
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setAuthState("error");
        setAuthError(
          error instanceof Error
            ? error.message
            : "Could not check your sign-in status.",
        );
      }
    }

    void checkSession();
    return () => controller.abort();
  }, []);

  async function handleLogout() {
    setAuthError(null);
    setIsLoggingOut(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Could not sign out. Please try again.");
      }

      setAuthState("unauthenticated");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Could not sign out.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  const accountActions = {
    authError,
    authState,
    isLoggingOut,
    onLogout: handleLogout,
  };

  return (
    <header className="absolute inset-x-0 top-0 z-50 border-b border-white/15 bg-gradient-to-b from-slate-950/60 via-slate-950/25 to-transparent">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 xl:grid-cols-[1fr_auto_1fr] xl:px-8">
        <Link
          aria-label="GearRent home"
          className="flex shrink-0 items-center"
          href="/"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="h-10 w-auto object-contain sm:h-12"
            height={356}
            priority
            src="/images/gearrent-logo-light.png"
            width={1418}
          />
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center justify-self-center gap-1 xl:flex"
        >
          <NavigationLink
            active={isNavigationActive(pathname, "/")}
            href="/"
            label="Home"
          />
          <NavigationLink
            active={isNavigationActive(pathname, "/equipment")}
            href="/equipment"
            label="All Equipment"
          />
          <NavigationLink
            active={isNavigationActive(pathname, "/about")}
            href="/about"
            label="About us"
          />
          <NavigationLink
            active={isNavigationActive(pathname, "/contact")}
            href="/contact"
            label="Contact Us"
          />
          <NavigationLink
            active={isNavigationActive(pathname, "/how-it-works")}
            href="/how-it-works"
            label="How it works"
          />
        </nav>

        <div className="hidden items-center justify-self-end gap-3 xl:flex">
          <AccountActions {...accountActions} />
        </div>

        <div
          className="relative justify-self-end xl:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape" && isMobileMenuOpen) {
              event.preventDefault();
              setIsMobileMenuOpen(false);
              mobileMenuButtonRef.current?.focus();
            }
          }}
        >
          <button
            aria-controls="mobile-navigation-menu"
            aria-expanded={isMobileMenuOpen}
            aria-label={
              isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            className="flex size-11 items-center justify-center rounded-xl border border-[#ffd277]/70 bg-[#08162d]/50 text-[#ffd277] shadow-[0_4px_14px_rgba(8,22,45,0.2)] transition-colors hover:bg-[#08162d]/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd277]"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            ref={mobileMenuButtonRef}
            type="button"
          >
            <span
              aria-hidden="true"
              className={`relative flex size-5 items-center justify-center transition-transform duration-500 motion-reduce:transition-none ${
                isMobileMenuOpen ? "rotate-180" : ""
              }`}
            >
              <span
                className={`absolute h-[3px] rounded-full bg-current transition-all duration-500 ease-in-out motion-reduce:transition-none ${
                  isMobileMenuOpen
                    ? "w-5 rotate-45"
                    : "w-4 -translate-y-[6px]"
                }`}
              />
              <span
                className={`absolute h-[3px] w-5 rounded-full bg-current transition-all duration-500 ease-in-out motion-reduce:transition-none ${
                  isMobileMenuOpen ? "scale-x-0 opacity-0" : ""
                }`}
              />
              <span
                className={`absolute h-[3px] rounded-full bg-current transition-all duration-500 ease-in-out motion-reduce:transition-none ${
                  isMobileMenuOpen
                    ? "w-5 -rotate-45"
                    : "w-4 translate-y-[6px]"
                }`}
              />
            </span>
          </button>
          <AnimatePresence initial={false}>
            {isMobileMenuOpen && (
              <motion.div
                animate={{ opacity: 1, height: "auto", scale: 1, y: 0 }}
                className="absolute right-0 top-full z-50 mt-3 w-72 origin-top-right overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_20px_50px_rgba(8,22,45,0.3)]"
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, height: 0, scale: 0.98, y: -8 }
                }
                id="mobile-navigation-menu"
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, height: 0, scale: 0.97, y: -12 }
                }
                key="mobile-navigation-menu"
                style={{ transformOrigin: "top right" }}
                transition={
                  reduceMotion
                    ? { duration: 0.01 }
                    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <div
                  aria-hidden="true"
                  className="h-1 bg-gradient-to-r from-[#08162d] via-[#e96a32] to-[#ffd277]"
                />
                <div className="grid gap-2 p-3">
                  <nav aria-label="Mobile navigation" className="grid gap-1">
                    <MobileNavigationLink
                      active={isNavigationActive(pathname, "/")}
                      href="/"
                      index={0}
                      label="Home"
                      onNavigate={() => setIsMobileMenuOpen(false)}
                      reduceMotion={reduceMotion}
                    />
                    <MobileNavigationLink
                      active={isNavigationActive(pathname, "/equipment")}
                      href="/equipment"
                      index={1}
                      label="All Equipment"
                      onNavigate={() => setIsMobileMenuOpen(false)}
                      reduceMotion={reduceMotion}
                    />
                    <MobileNavigationLink
                      active={isNavigationActive(pathname, "/about")}
                      href="/about"
                      index={2}
                      label="About us"
                      onNavigate={() => setIsMobileMenuOpen(false)}
                      reduceMotion={reduceMotion}
                    />
                    <MobileNavigationLink
                      active={isNavigationActive(pathname, "/contact")}
                      href="/contact"
                      index={3}
                      label="Contact Us"
                      onNavigate={() => setIsMobileMenuOpen(false)}
                      reduceMotion={reduceMotion}
                    />
                    <MobileNavigationLink
                      active={isNavigationActive(pathname, "/how-it-works")}
                      href="/how-it-works"
                      index={4}
                      label="How it works"
                      onNavigate={() => setIsMobileMenuOpen(false)}
                      reduceMotion={reduceMotion}
                    />
                  </nav>
                  <div className="grid gap-2 border-t border-slate-200 pt-3">
                    <AccountActions {...accountActions} mobile />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
