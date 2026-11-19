"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CircleUserRound,
  Heart,
  LayoutDashboard,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { apiBaseUrl } from "@/lib/dashboard-api";
import { requestAuthAccessToken } from "@/lib/auth-token";
import { DashboardRouteTransition } from "./dashboard-route-transition";

export type DashboardRole = "Customer" | "Owner" | "Admin";

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: DashboardRole;
  phoneNumber: string;
  address: string;
};

type ReadyState = {
  status: "ready";
  user: DashboardUser;
  accessToken: string;
};

type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ReadyState;

type DashboardContextValue = ReadyState & {
  refreshUser: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

function parseDashboardUser(value: unknown): DashboardUser | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    typeof value.id !== "string" ||
    !("name" in value) ||
    typeof value.name !== "string" ||
    !("email" in value) ||
    typeof value.email !== "string"
  ) {
    return null;
  }

  const role =
    "role" in value && typeof value.role === "string"
      ? value.role
      : "Customer";
  if (role !== "Customer" && role !== "Owner" && role !== "Admin") {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    image:
      "image" in value && typeof value.image === "string" ? value.image : null,
    role,
    phoneNumber:
      "phoneNumber" in value && typeof value.phoneNumber === "string"
        ? value.phoneNumber
        : "",
    address:
      "address" in value && typeof value.address === "string"
        ? value.address
        : "",
  };
}

async function loadSession(signal?: AbortSignal) {
  const response = await fetch(`${apiBaseUrl}/api/auth/get-session`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The authentication server returned an invalid session.");
  }

  if (!response.ok) {
    throw new Error("Could not verify your account.");
  }
  if (payload === null) {
    return null;
  }
  if (
    typeof payload !== "object" ||
    !("session" in payload) ||
    !("user" in payload) ||
    payload.session === null ||
    payload.user === null
  ) {
    throw new Error("The authentication server returned an invalid session.");
  }

  return parseDashboardUser(payload.user);
}

function loginUrl() {
  const destination = `${window.location.pathname}${window.location.search}`;
  return `/login?redirect=${encodeURIComponent(destination)}`;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "G";
}

function LoadingPanel({ message }: { message: string }) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_-45px_rgba(8,22,45,0.5)]"
      role="status"
    >
      <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-[#e96a32]" />
      <p className="text-sm font-semibold text-slate-600">{message}</p>
    </div>
  );
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion() ?? false;
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  const refreshUser = useCallback(async () => {
    const user = await loadSession();
    if (!user) {
      throw new Error("Your session has ended. Please sign in again.");
    }
    const accessToken = await requestAuthAccessToken(apiBaseUrl);
    setState({ status: "ready", user, accessToken });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function initializeDashboard() {
      try {
        const user = await loadSession(controller.signal);
        if (!user) {
          router.replace(loginUrl());
          return;
        }
        const accessToken = await requestAuthAccessToken(
          apiBaseUrl,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setState({ status: "ready", user, accessToken });
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (
          error instanceof Error &&
          "status" in error &&
          error.status === 401
        ) {
          router.replace(loginUrl());
          return;
        }
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not load your account.",
        });
      }
    }

    void initializeDashboard();
    return () => controller.abort();
  }, [router]);

  const customerOnlyPath =
    pathname.startsWith("/dashboard/rentals") ||
    pathname.startsWith("/dashboard/favorites");

  useEffect(() => {
    if (
      state.status === "ready" &&
      state.user.role !== "Customer" &&
      customerOnlyPath
    ) {
      router.replace("/dashboard/profile");
    }
  }, [customerOnlyPath, router, state]);

  const showProtectedPage =
    state.status === "ready" &&
    (state.user.role === "Customer" || !customerOnlyPath);

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <Navbar />
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_78%_14%,rgba(233,106,50,0.2),transparent_26%),linear-gradient(135deg,#08162d_0%,#10294c_58%,#08162d_100%)] pb-20 pt-32 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 top-6 size-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 top-20 size-44 rounded-full border border-[#ffd277]/15"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-[#ffd277]/70 to-transparent"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#75d6c3]">
            Your GearRent account
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                Account dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                Keep track of your rentals, saved equipment, and profile in one
                place.
              </p>
            </div>
            {state.status === "ready" && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-[#ffd277] text-sm font-black text-[#08162d]">
                  {state.user.image ? (
                    <Image
                      alt=""
                      className="size-full object-cover"
                      height={40}
                      src={state.user.image}
                      unoptimized
                      width={40}
                    />
                  ) : (
                    getInitials(state.user.name)
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-white">
                    {state.user.name}
                  </span>
                  <span className="block truncate text-xs font-semibold text-[#ffd277]">
                    {state.user.role}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="relative mx-auto -mt-10 max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {state.status === "loading" && (
          <LoadingPanel message="Verifying your account…" />
        )}
        {state.status === "error" && (
          <div
            className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm"
            role="alert"
          >
            <h2 className="text-lg font-extrabold text-[#08162d]">
              Could not load your dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-600">{state.message}</p>
            <button
              className="mt-5 rounded-xl bg-[#08162d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10294c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
              onClick={() => window.location.reload()}
              type="button"
            >
              Try again
            </button>
          </div>
        )}
        {state.status === "ready" && !showProtectedPage && (
          <LoadingPanel message="Opening your profile…" />
        )}
        {state.status === "ready" && showProtectedPage && (
          <DashboardContext.Provider
            value={{ ...state, refreshUser }}
          >
            <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
              <aside
                aria-label="Dashboard navigation"
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-45px_rgba(8,22,45,0.5)] sm:p-5"
              >
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 px-2 pb-4">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#fff4d8] text-[#c94f1c]">
                    <LayoutDashboard aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-[#08162d]">
                      Account center
                    </p>
                    <p
                      className="truncate text-xs font-medium text-slate-500"
                      title={state.user.email}
                    >
                      {state.user.email}
                    </p>
                  </div>
                </div>
                <nav className="grid gap-1">
                  <DashboardNavLink
                    active={pathname === "/dashboard"}
                    href="/dashboard"
                    icon={<BarChart3 aria-hidden="true" className="size-4" />}
                    label="Overview"
                    reduceMotion={reduceMotion}
                  />
                  {state.user.role === "Customer" && (
                    <>
                      <DashboardNavLink
                        active={pathname === "/dashboard/rentals"}
                        href="/dashboard/rentals"
                        icon={<CalendarDays aria-hidden="true" className="size-4" />}
                        label="My Rentals"
                        reduceMotion={reduceMotion}
                      />
                      <DashboardNavLink
                        active={pathname === "/dashboard/favorites"}
                        href="/dashboard/favorites"
                        icon={<Heart aria-hidden="true" className="size-4" />}
                        label="Favorites"
                        reduceMotion={reduceMotion}
                      />
                    </>
                  )}
                  <DashboardNavLink
                    active={pathname === "/dashboard/profile"}
                    href="/dashboard/profile"
                    icon={
                      state.user.role === "Admin" ? (
                        <ShieldCheck aria-hidden="true" className="size-4" />
                      ) : (
                        <CircleUserRound aria-hidden="true" className="size-4" />
                      )
                    }
                    label="Profile"
                    reduceMotion={reduceMotion}
                  />
                </nav>
                {state.user.role !== "Customer" && (
                  <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                    Your account role is {state.user.role}. Customer rentals
                    and favorites are available to customer accounts.
                  </p>
                )}
              </aside>
              <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-45px_rgba(8,22,45,0.5)] sm:p-8">
                <DashboardRouteTransition>{children}</DashboardRouteTransition>
              </section>
            </div>
          </DashboardContext.Provider>
        )}
      </main>
      <Footer />
    </div>
  );
}

function DashboardNavLink({
  href,
  label,
  active,
  icon,
  reduceMotion,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      animate={{ x: 0 }}
      whileHover={reduceMotion ? undefined : { x: 3 }}
      transition={{ duration: reduceMotion ? 0 : 0.18 }}
    >
      <Link
        aria-current={active ? "page" : undefined}
        className={`group relative flex h-12 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32] ${
          active ? "text-[#ffd277]" : "text-slate-600 hover:text-[#c94f1c]"
        }`}
        href={href}
      >
        {active && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-[#08162d]"
            layoutId="dashboard-active-navigation"
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 34 }
            }
          />
        )}
        {!active && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-[#fff8e7] opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
        <span className="relative z-10 flex items-center gap-3">
          {icon}
          {label}
        </span>
      </Link>
    </motion.div>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("Dashboard pages must be rendered inside DashboardProvider.");
  }
  return context;
}
