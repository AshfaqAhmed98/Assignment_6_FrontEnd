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
  ArrowUpRight,
  BarChart3,
  ClipboardCheck,
  Boxes,
  Building2,
  CalendarDays,
  ClipboardList,
  CircleUserRound,
  Heart,
  LayoutDashboard,
  LoaderCircle,
  PackagePlus,
  ShieldCheck,
  UsersRound,
  Wrench,
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

function OwnerDashboardHero({ user }: { user: DashboardUser }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#172a21] pb-10 pt-28 text-[#fff9ed] sm:pb-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-32 size-[26rem] rounded-full border border-[#f3a65c]/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 -top-16 size-[18rem] rounded-full border border-[#f3a65c]/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#101f19]/70 to-transparent"
      />
      <div className="relative mx-auto flex w-full flex-wrap items-end justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#f3a65c]">
            <Wrench aria-hidden="true" className="size-4" />
            GearRent / Owner studio
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            Your rental operation,
            <span className="block text-[#f3a65c]">all in one place.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#fff9ed]/65 sm:text-base">
            Keep your inventory ready, follow each booking, and grow your
            equipment business from one focused workspace.
          </p>
        </div>
        <div className="flex min-w-64 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f3a65c] text-sm font-black text-[#172a21]">
            {getInitials(user.name)}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#f3a65c]">
              Owner account
            </span>
            <span className="mt-0.5 block truncate text-sm font-extrabold text-white">
              {user.name}
            </span>
          </span>
          <Building2 aria-hidden="true" className="ml-auto size-5 shrink-0 text-white/40" />
        </div>
      </div>
    </section>
  );
}

function AdminDashboardHero({ user }: { user: DashboardUser }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#17213d] pb-10 pt-28 text-white sm:pb-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-32 size-[26rem] rounded-full border border-[#8da9ff]/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 -top-16 size-[18rem] rounded-full border border-[#8da9ff]/20"
      />
      <div className="relative mx-auto flex w-full flex-wrap items-end justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#a9bbff]">
            <ShieldCheck aria-hidden="true" className="size-4" />
            GearRent / Platform administration
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            The platform,
            <span className="block text-[#a9bbff]">at a glance.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
            Review accounts, keep the equipment catalog healthy, and monitor
            rentals from your private control room.
          </p>
        </div>
        <div className="flex min-w-64 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#a9bbff] text-sm font-black text-[#17213d]">
            {user.image ? (
              <Image
                alt=""
                className="size-full object-cover"
                height={44}
                src={user.image}
                unoptimized
                width={44}
              />
            ) : (
              getInitials(user.name)
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a9bbff]">
              Administrator
            </span>
            <span className="mt-0.5 block truncate text-sm font-extrabold text-white">
              {user.name}
            </span>
          </span>
          <ClipboardCheck
            aria-hidden="true"
            className="ml-auto size-5 shrink-0 text-white/40"
          />
        </div>
      </div>
    </section>
  );
}

function AdminDashboardNavigation({
  pathname,
  reduceMotion,
  user,
}: {
  pathname: string;
  reduceMotion: boolean;
  user: DashboardUser;
}) {
  return (
    <aside
      aria-label="Admin control room navigation"
      className="rounded-[1.75rem] bg-[#17213d] p-4 text-white shadow-[0_24px_70px_-45px_rgba(23,33,61,0.8)] sm:p-5 lg:sticky lg:top-24"
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#a9bbff] text-[#17213d]">
          <ShieldCheck aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black">Control room</span>
          <span className="mt-0.5 block truncate text-xs font-medium text-white/50">
            {user.email}
          </span>
        </span>
      </div>

      <nav aria-label="Admin dashboard" className="mt-5 grid gap-1.5">
        <AdminDashboardNavLink
          active={pathname === "/dashboard"}
          href="/dashboard"
          icon={<LayoutDashboard aria-hidden="true" className="size-[18px]" />}
          label="Overview"
          reduceMotion={reduceMotion}
        />
        <AdminDashboardNavLink
          active={pathname.startsWith("/dashboard/users")}
          href="/dashboard/users"
          icon={<UsersRound aria-hidden="true" className="size-[18px]" />}
          label="All users"
          reduceMotion={reduceMotion}
        />
        <AdminDashboardNavLink
          active={
            pathname.startsWith("/dashboard/all-equipment") ||
            pathname.startsWith("/dashboard/equipment/")
          }
          href="/dashboard/all-equipment"
          icon={<Boxes aria-hidden="true" className="size-[18px]" />}
          label="All equipment"
          reduceMotion={reduceMotion}
        />
        <AdminDashboardNavLink
          active={pathname.startsWith("/dashboard/all-rentals")}
          href="/dashboard/all-rentals"
          icon={<ClipboardList aria-hidden="true" className="size-[18px]" />}
          label="All rentals"
          reduceMotion={reduceMotion}
        />
        <AdminDashboardNavLink
          active={pathname === "/dashboard/profile"}
          href="/dashboard/profile"
          icon={<CircleUserRound aria-hidden="true" className="size-[18px]" />}
          label="My profile"
          reduceMotion={reduceMotion}
        />
      </nav>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a9bbff]">
          Platform health
        </p>
        <p className="mt-2 text-xs leading-5 text-white/60">
          Manage accounts carefully. Payment records remain tied to Stripe.
        </p>
      </div>
    </aside>
  );
}

function AdminDashboardNavLink({
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
        className={`group relative flex h-12 items-center justify-between overflow-hidden rounded-xl px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9bbff] ${
          active ? "text-[#17213d]" : "text-white/65 hover:text-white"
        }`}
        href={href}
      >
        {active ? (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-[#a9bbff]"
            layoutId="admin-dashboard-active-navigation"
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 34 }
            }
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-white/[0.07] opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
        <span className="relative z-10 flex items-center gap-3">
          {icon}
          {label}
        </span>
        {active && (
          <ArrowUpRight
            aria-hidden="true"
            className="relative z-10 size-4"
          />
        )}
      </Link>
    </motion.div>
  );
}

function OwnerDashboardNavigation({
  pathname,
  reduceMotion,
  user,
}: {
  pathname: string;
  reduceMotion: boolean;
  user: DashboardUser;
}) {
  const equipmentActive =
    pathname === "/dashboard/equipment" ||
    (pathname.startsWith("/dashboard/equipment/") &&
      !pathname.startsWith("/dashboard/equipment/new"));

  return (
    <aside
      aria-label="Owner workspace navigation"
      className="rounded-[1.75rem] bg-[#172a21] p-4 text-white shadow-[0_24px_70px_-45px_rgba(23,42,33,0.8)] sm:p-5 lg:sticky lg:top-24"
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#f3a65c] text-[#172a21]">
          <Building2 aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black">Owner studio</span>
          <span className="mt-0.5 block truncate text-xs font-medium text-white/50">
            {user.email}
          </span>
        </span>
      </div>

      <nav aria-label="Owner dashboard" className="mt-5 grid gap-1.5">
        <OwnerDashboardNavLink
          active={pathname === "/dashboard"}
          href="/dashboard"
          icon={<LayoutDashboard aria-hidden="true" className="size-[18px]" />}
          label="Overview"
          reduceMotion={reduceMotion}
        />
        <OwnerDashboardNavLink
          active={pathname === "/dashboard/equipment/new"}
          href="/dashboard/equipment/new"
          icon={<PackagePlus aria-hidden="true" className="size-[18px]" />}
          label="Add equipment"
          reduceMotion={reduceMotion}
        />
        <OwnerDashboardNavLink
          active={equipmentActive}
          href="/dashboard/equipment"
          icon={<Boxes aria-hidden="true" className="size-[18px]" />}
          label="My equipment"
          reduceMotion={reduceMotion}
        />
        <OwnerDashboardNavLink
          active={pathname === "/dashboard/equipment-rentals"}
          href="/dashboard/equipment-rentals"
          icon={<ClipboardList aria-hidden="true" className="size-[18px]" />}
          label="Rental activity"
          reduceMotion={reduceMotion}
        />
        <OwnerDashboardNavLink
          active={pathname === "/dashboard/profile"}
          href="/dashboard/profile"
          icon={<CircleUserRound aria-hidden="true" className="size-[18px]" />}
          label="My profile"
          reduceMotion={reduceMotion}
        />
      </nav>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f3a65c]">
          Ready for another project?
        </p>
        <p className="mt-2 text-xs leading-5 text-white/60">
          Add equipment to your inventory and send it for review.
        </p>
        <Link
          className="mt-4 flex min-h-11 items-center justify-between gap-2 rounded-xl bg-[#f3a65c] px-3 text-xs font-black text-[#172a21] transition hover:bg-[#ffc17f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          href="/dashboard/equipment/new"
        >
          Create a listing
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <p className="mt-5 px-2 text-[11px] font-semibold leading-5 text-white/35">
        Your equipment, your business, your GearRent workspace.
      </p>
    </aside>
  );
}

function OwnerDashboardNavLink({
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
        className={`group relative flex h-12 items-center justify-between overflow-hidden rounded-xl px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f3a65c] ${
          active ? "text-[#172a21]" : "text-white/65 hover:text-white"
        }`}
        href={href}
      >
        {active ? (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-[#f3a65c]"
            layoutId="owner-dashboard-active-navigation"
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 34 }
            }
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-white/[0.07] opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
        <span className="relative z-10 flex items-center gap-3">
          {icon}
          {label}
        </span>
        {active && (
          <ArrowUpRight
            aria-hidden="true"
            className="relative z-10 size-4"
          />
        )}
      </Link>
    </motion.div>
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
  const ownerOnlyPath =
    pathname.startsWith("/dashboard/equipment") ||
    pathname.startsWith("/dashboard/equipment-rentals");
  const adminOnlyPath =
    pathname.startsWith("/dashboard/users") ||
    pathname.startsWith("/dashboard/all-equipment") ||
    pathname.startsWith("/dashboard/all-rentals");
  const adminEquipmentDetailPath =
    pathname.startsWith("/dashboard/equipment/") &&
    !pathname.startsWith("/dashboard/equipment/new");
  const isOwnerDashboard =
    state.status === "ready" && state.user.role === "Owner";
  const isAdminDashboard =
    state.status === "ready" && state.user.role === "Admin";

  useEffect(() => {
    if (
      state.status === "ready" &&
      ((customerOnlyPath && state.user.role !== "Customer") ||
        (ownerOnlyPath &&
          state.user.role !== "Owner" &&
          !(state.user.role === "Admin" && adminEquipmentDetailPath)) ||
        (adminOnlyPath && state.user.role !== "Admin"))
    ) {
      router.replace("/dashboard/profile");
    }
  }, [
    adminEquipmentDetailPath,
    adminOnlyPath,
    customerOnlyPath,
    ownerOnlyPath,
    router,
    state,
  ]);

  const roleCanViewPage =
    state.status === "ready" &&
    (!customerOnlyPath || state.user.role === "Customer") &&
    (!ownerOnlyPath ||
      state.user.role === "Owner" ||
      (state.user.role === "Admin" && adminEquipmentDetailPath)) &&
    (!adminOnlyPath || state.user.role === "Admin");
  const showProtectedPage = state.status === "ready" && roleCanViewPage;

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <Navbar />
      {isAdminDashboard ? (
        <AdminDashboardHero user={state.user} />
      ) : isOwnerDashboard ? (
        <OwnerDashboardHero user={state.user} />
      ) : (
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
          <div className="relative w-full px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#75d6c3]">
              Your GearRent account
            </p>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                  Account dashboard
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                  Keep track of your rentals, saved equipment, and profile in
                  one place.
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
      )}

      <main
        className={
          isAdminDashboard || isOwnerDashboard
            ? "relative w-full px-4 pb-16 pt-8 sm:px-6 lg:px-8"
            : "relative -mt-10 w-full px-4 pb-20 sm:px-6 lg:px-8"
        }
      >
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
            {isAdminDashboard ? (
              <div className="grid items-start gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
                <AdminDashboardNavigation
                  pathname={pathname}
                  reduceMotion={reduceMotion}
                  user={state.user}
                />
                <section className="min-h-[560px] min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-55px_rgba(8,22,45,0.3)] sm:p-8">
                  <DashboardRouteTransition>{children}</DashboardRouteTransition>
                </section>
              </div>
            ) : isOwnerDashboard ? (
              <div className="grid items-start gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
                <OwnerDashboardNavigation
                  pathname={pathname}
                  reduceMotion={reduceMotion}
                  user={state.user}
                />
                <section className="min-h-[560px] min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-55px_rgba(8,22,45,0.3)] sm:p-8">
                  <DashboardRouteTransition>{children}</DashboardRouteTransition>
                </section>
              </div>
            ) : (
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
                  {state.user.role === "Owner" && (
                    <>
                      <DashboardNavLink
                        active={pathname === "/dashboard/equipment/new"}
                        href="/dashboard/equipment/new"
                        icon={<PackagePlus aria-hidden="true" className="size-4" />}
                        label="Add Equipment"
                        reduceMotion={reduceMotion}
                      />
                      <DashboardNavLink
                        active={
                          pathname === "/dashboard/equipment" ||
                          (pathname.startsWith("/dashboard/equipment/") &&
                            !pathname.startsWith("/dashboard/equipment/new"))
                        }
                        href="/dashboard/equipment"
                        icon={<Boxes aria-hidden="true" className="size-4" />}
                        label="My Equipment"
                        reduceMotion={reduceMotion}
                      />
                      <DashboardNavLink
                        active={pathname === "/dashboard/equipment-rentals"}
                        href="/dashboard/equipment-rentals"
                        icon={
                          <ClipboardList
                            aria-hidden="true"
                            className="size-4"
                          />
                        }
                        label="My Equipment Rental"
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
                    label={state.user.role === "Owner" ? "My Profile" : "Profile"}
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
            )}
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
