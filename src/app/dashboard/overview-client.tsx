"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  Heart,
  LoaderCircle,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { dashboardRequest } from "@/lib/dashboard-api";
import { useDashboard } from "./dashboard-context";
import AdminOverviewClient from "./admin-overview-client";
import OwnerOverviewClient from "./owner-overview-client";
import { PerformanceChart } from "./performance-chart";

type OverviewBooking = {
  id: string;
  equipmentName: string;
  startDate: string;
  bookingDate: string;
  amountMinor: number;
  bookingStatus: "upcoming" | "ongoing" | "completed";
};

type OverviewFavorite = {
  id: string;
  name: string;
  favoritedAt: string;
};

type OverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      bookings: OverviewBooking[];
      favorites: OverviewFavorite[];
    };

function isOverviewBooking(value: unknown): value is OverviewBooking {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "equipmentName" in value &&
    typeof value.equipmentName === "string" &&
    "startDate" in value &&
    typeof value.startDate === "string" &&
    "bookingDate" in value &&
    typeof value.bookingDate === "string" &&
    "amountMinor" in value &&
    typeof value.amountMinor === "number" &&
    "bookingStatus" in value &&
    (value.bookingStatus === "upcoming" ||
      value.bookingStatus === "ongoing" ||
      value.bookingStatus === "completed")
  );
}

function isOverviewFavorite(value: unknown): value is OverviewFavorite {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "favoritedAt" in value &&
    typeof value.favoritedAt === "string"
  );
}

function formatCurrency(amountMinor: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Could not load your account overview.";
}

function OverviewStat({
  href,
  icon,
  index,
  label,
  reduceMotion,
  note,
  value,
}: {
  href: string;
  icon: ReactNode;
  index: number;
  label: string;
  reduceMotion: boolean;
  note: string;
  value: string;
}) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-38px_rgba(8,22,45,0.5)]"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.06, duration: 0.4 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
    >
      <Link
        aria-label={`Open ${label}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
        href={href}
      />
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#fff4d8] text-[#c94f1c]">
          {icon}
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#c94f1c]"
        />
      </div>
      <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight text-[#08162d]">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-500">{note}</p>
    </motion.article>
  );
}

export default function DashboardPage() {
  const { accessToken, user } = useDashboard();
  const reduceMotion = useReducedMotion() ?? false;
  const [state, setState] = useState<OverviewState>(
    user.role === "Customer"
      ? { status: "loading" }
      : { status: "success", bookings: [], favorites: [] },
  );

  useEffect(() => {
    if (user.role !== "Customer") {
      return;
    }

    const controller = new AbortController();
    async function loadOverview() {
      try {
        const [bookingPayload, favoritePayload] = await Promise.all([
          dashboardRequest("/api/bookings", accessToken, {
            signal: controller.signal,
          }),
          dashboardRequest("/api/favorites", accessToken, {
            signal: controller.signal,
          }),
        ]);
        if (
          typeof bookingPayload !== "object" ||
          bookingPayload === null ||
          !("items" in bookingPayload) ||
          !Array.isArray(bookingPayload.items) ||
          !bookingPayload.items.every(isOverviewBooking) ||
          typeof favoritePayload !== "object" ||
          favoritePayload === null ||
          !("items" in favoritePayload) ||
          !Array.isArray(favoritePayload.items) ||
          !favoritePayload.items.every(isOverviewFavorite)
        ) {
          throw new Error("The dashboard services returned invalid account data.");
        }
        if (!controller.signal.aborted) {
          setState({
            status: "success",
            bookings: bookingPayload.items,
            favorites: favoritePayload.items,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ status: "error", message: getErrorMessage(error) });
        }
      }
    }

    void loadOverview();
    return () => controller.abort();
  }, [accessToken, user.role]);

  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  const bookings = state.status === "success" ? state.bookings : [];
  const favorites = state.status === "success" ? state.favorites : [];
  const upcomingBookings = bookings
    .filter((booking) => booking.bookingStatus === "upcoming")
    .sort(
      (first, second) =>
        new Date(first.startDate).getTime() -
        new Date(second.startDate).getTime(),
    );
  const totalSpentMinor = bookings.reduce(
    (total, booking) => total + booking.amountMinor,
    0,
  );
  const activities = [
    ...bookings.map((booking) => ({
      id: `booking-${booking.id}`,
      label: "Rental confirmed",
      detail: booking.equipmentName,
      date: booking.bookingDate,
      icon: <CalendarDays aria-hidden="true" className="size-4" />,
      href: "/dashboard/rentals",
    })),
    ...favorites.map((favorite) => ({
      id: `favorite-${favorite.id}`,
      label: "Added to favorites",
      detail: favorite.name,
      date: favorite.favoritedAt,
      icon: <Heart aria-hidden="true" className="size-4" />,
      href: "/dashboard/favorites",
    })),
  ]
    .filter((activity) => Number.isFinite(new Date(activity.date).getTime()))
    .sort(
      (first, second) =>
        new Date(second.date).getTime() - new Date(first.date).getTime(),
    )
    .slice(0, 4);

  if (user.role === "Owner") {
    return <OwnerOverviewClient />;
  }

  if (user.role === "Admin") {
    return <AdminOverviewClient />;
  }

  return (
    <div className="space-y-6">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="relative isolate overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_90%_15%,rgba(255,210,119,0.3),transparent_25%),linear-gradient(130deg,#08162d_0%,#10294c_62%,#143858_100%)] p-6 text-white sm:p-8"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        transition={{ duration: reduceMotion ? 0 : 0.45 }}
      >
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-20 -z-10 size-64 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-1 top-10 -z-10 size-36 rounded-full border border-[#ffd277]/20"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#75d6c3]/25 bg-[#75d6c3]/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#a6f1e2]">
              <span className="size-1.5 rounded-full bg-[#75d6c3] shadow-[0_0_10px_#75d6c3]" />
              Customer command center
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Welcome back, {firstName}.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              A clear view of your saved gear, confirmed rentals, and what is
              coming up next.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-[#ffd277] px-4 py-3 text-sm font-extrabold text-[#08162d] transition hover:-translate-y-0.5 hover:bg-[#ffbd5c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href="/equipment"
            >
              <Compass aria-hidden="true" className="size-4" />
              Explore equipment
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd277]"
              href="/dashboard/favorites"
            >
              <Heart aria-hidden="true" className="size-4" />
              Saved gear
            </Link>
          </div>
        </div>
        <div className="relative mt-8 flex items-center gap-3 text-xs font-semibold text-white/55">
          <span className="h-px flex-1 bg-gradient-to-r from-[#75d6c3]/50 to-transparent" />
          YOUR NEXT PROJECT STARTS HERE
          <span className="h-px flex-1 bg-gradient-to-l from-[#ffd277]/50 to-transparent" />
        </div>
      </motion.section>

      {state.status === "loading" && (
        <div
          aria-live="polite"
          className="flex min-h-52 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-500"
          role="status"
        >
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-[#e96a32]" />
          Gathering your account overview…
        </div>
      )}
      {state.status === "error" && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800"
          role="alert"
        >
          <p>We couldn’t load your overview: {state.message}</p>
          <button
            className="mt-3 font-extrabold underline underline-offset-4"
            onClick={() => window.location.reload()}
            type="button"
          >
            Try again
          </button>
        </div>
      )}
      {state.status === "success" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewStat
              href="/dashboard/rentals"
              icon={<CalendarDays aria-hidden="true" className="size-5" />}
              index={0}
              label="Paid rentals"
              reduceMotion={reduceMotion}
              note="All confirmed bookings"
              value={String(bookings.length)}
            />
            <OverviewStat
              href="/dashboard/rentals"
              icon={<Clock3 aria-hidden="true" className="size-5" />}
              index={1}
              label="Coming up"
              reduceMotion={reduceMotion}
              note="Upcoming rental starts"
              value={String(upcomingBookings.length)}
            />
            <OverviewStat
              href="/dashboard/favorites"
              icon={<Heart aria-hidden="true" className="size-5" />}
              index={2}
              label="Saved equipment"
              reduceMotion={reduceMotion}
              note="In your favorites"
              value={String(favorites.length)}
            />
            <OverviewStat
              href="/dashboard/rentals"
              icon={<WalletCards aria-hidden="true" className="size-5" />}
              index={3}
              label="Total paid"
              reduceMotion={reduceMotion}
              note="Across confirmed rentals"
              value={formatCurrency(totalSpentMinor)}
            />
          </div>

          <PerformanceChart
            favoriteDates={favorites.map((favorite) => favorite.favoritedAt)}
            rentalDates={bookings.map((booking) => booking.bookingDate)}
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              transition={{ delay: reduceMotion ? 0 : 0.18, duration: 0.4 }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c94f1c]">
                    Next on your calendar
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[#08162d]">
                    Upcoming rental
                  </h3>
                </div>
                <Link
                  aria-label="View all rentals"
                  className="flex size-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-[#fff4d8] hover:text-[#c94f1c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                  href="/dashboard/rentals"
                >
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
              {upcomingBookings[0] ? (
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-2xl font-black tracking-tight text-[#08162d]">
                        {upcomingBookings[0].equipmentName}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Confirmed rental
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
                      <Check aria-hidden="true" className="size-3.5" />
                      Paid
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                        Starts
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[#08162d]">
                        {formatDate(upcomingBookings[0].startDate)}
                      </p>
                    </div>
                    <ArrowDownRight
                      aria-hidden="true"
                      className="size-5 text-[#e96a32]"
                    />
                    <p className="max-w-40 text-right text-xs font-medium leading-5 text-slate-500">
                      Your equipment is reserved for the selected dates.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <div className="rounded-xl bg-[linear-gradient(120deg,#fff8e7,#f8fbff)] p-5">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#c94f1c] shadow-sm">
                      <Compass aria-hidden="true" className="size-5" />
                    </span>
                    <h4 className="mt-4 font-extrabold text-[#08162d]">
                      Your calendar is open
                    </h4>
                    <p className="mt-1 max-w-lg text-sm leading-6 text-slate-500">
                      Find the right equipment and reserve it when your project
                      dates are ready.
                    </p>
                    <Link
                      className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#c94f1c] transition hover:gap-3"
                      href="/equipment"
                    >
                      Browse available gear
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </div>
              )}
            </motion.section>

            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-200 bg-white p-5"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              transition={{ delay: reduceMotion ? 0 : 0.24, duration: 0.4 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c94f1c]">
                    Your account pulse
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[#08162d]">
                    Recent activity
                  </h3>
                </div>
                <Sparkles aria-hidden="true" className="size-5 text-[#e96a32]" />
              </div>
              {activities.length > 0 ? (
                <ol className="mt-5 space-y-4">
                  {activities.map((activity, index) => (
                    <motion.li
                      animate={{ opacity: 1, x: 0 }}
                      className="relative flex gap-3"
                      initial={reduceMotion ? false : { opacity: 0, x: 10 }}
                      key={activity.id}
                      transition={{
                        delay: reduceMotion ? 0 : 0.12 + index * 0.07,
                        duration: 0.3,
                      }}
                    >
                      {index < activities.length - 1 && (
                        <span
                          aria-hidden="true"
                          className="absolute left-[17px] top-9 h-6 w-px bg-slate-200"
                        />
                      )}
                      <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fff4d8] text-[#c94f1c]">
                        {activity.icon}
                      </span>
                      <Link
                        className="min-w-0 flex-1 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                        href={activity.href}
                      >
                        <span className="block text-xs font-bold text-slate-500">
                          {activity.label}
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-extrabold text-[#08162d]">
                          {activity.detail}
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-slate-400">
                          {formatDate(activity.date)}
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </ol>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-[#08162d]">
                    Your activity starts here
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Saved equipment and paid bookings will appear in this
                    timeline.
                  </p>
                </div>
              )}
            </motion.section>
          </div>

          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#f2d89d] bg-[linear-gradient(110deg,#fff9eb,#fff4d8_52%,#fff)] p-5 sm:p-6"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            transition={{ delay: reduceMotion ? 0 : 0.3, duration: 0.4 }}
          >
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ffd277] text-[#08162d]">
                <Heart aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h3 className="font-black text-[#08162d]">
                  Build your project shortlist
                </h3>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                  Save useful equipment as you browse, then compare your picks
                  from one place.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-[#08162d] px-4 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#10294c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
              href="/dashboard/favorites"
            >
              Open favorites
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </motion.section>
        </>
      )}
    </div>
  );
}
