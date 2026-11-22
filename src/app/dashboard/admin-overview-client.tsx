"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { dashboardRequest } from "@/lib/dashboard-api";
import { useDashboard } from "./dashboard-context";
import { ApprovalGauge } from "./approval-gauge";
import { AdminError, AdminLoading } from "./admin/admin-ui";
import { PerformanceChart } from "./performance-chart";
import { RevenueTrendChart } from "./revenue-trend-chart";

type AdminOverview = {
  users: number;
  equipment: number;
  approvedEquipment: number;
  pendingEquipment: number;
  rejectedEquipment: number;
  bookings: number;
  completedRentals: number;
  totalRevenueMinor: number;
  currentMonthBookings: number;
  rentalDates: string[];
  paidRentalDates: string[];
  paidRevenuePoints: { date: string; amountMinor: number }[];
};

type AdminAnalytics = {
  totalUsers: number;
  totalEquipment: number;
  totalBookings: number;
  pendingApprovals: number;
  completedRentals: number;
  totalRevenueMinor: number;
  monthlyBookings: { month: string; count: number }[];
};

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMonthlyBooking(value: unknown): value is { month: string; count: number } {
  return (
    isRecord(value) &&
    typeof value.month === "string" &&
    isNonNegativeInteger(value.count)
  );
}

function isAdminAnalytics(value: unknown): value is AdminAnalytics {
  if (
    !isRecord(value) ||
    !isNonNegativeInteger(value.totalUsers) ||
    !isNonNegativeInteger(value.totalEquipment) ||
    !isNonNegativeInteger(value.totalBookings) ||
    !isNonNegativeInteger(value.pendingApprovals) ||
    !isNonNegativeInteger(value.completedRentals) ||
    typeof value.totalRevenueMinor !== "number" ||
    !Number.isSafeInteger(value.totalRevenueMinor) ||
    value.totalRevenueMinor < 0 ||
    !Array.isArray(value.monthlyBookings) ||
    !value.monthlyBookings.every(isMonthlyBooking)
  ) {
    return false;
  }

  return true;
}

function formatCurrency(amountMinor: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function isAdminEquipmentSummary(
  value: unknown,
): value is { id: string; approvalStatus: "approved" | "pending" | "rejected" } {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.approvalStatus === "approved" ||
      value.approvalStatus === "pending" ||
      value.approvalStatus === "rejected")
  );
}

function isAdminRentalSummary(
  value: unknown,
): value is {
  id: string;
  recordType: "booking" | "reservation";
  paymentStatus: "paid" | "pending";
  bookingStatus: "upcoming" | "ongoing" | "completed" | "pending-payment";
  bookingDate: string;
  amountMinor: number;
} {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.recordType === "booking" || value.recordType === "reservation") &&
    (value.paymentStatus === "paid" || value.paymentStatus === "pending") &&
    (value.bookingStatus === "upcoming" ||
      value.bookingStatus === "ongoing" ||
      value.bookingStatus === "completed" ||
      value.bookingStatus === "pending-payment") &&
    typeof value.bookingDate === "string" &&
    typeof value.amountMinor === "number" &&
    Number.isFinite(value.amountMinor)
  );
}

function parseOverview(
  equipmentPayload: unknown,
  rentalPayload: unknown,
  analyticsPayload: unknown,
): AdminOverview | null {
  if (
    !isRecord(equipmentPayload) ||
    !Array.isArray(equipmentPayload.items) ||
    !isRecord(rentalPayload) ||
    !Array.isArray(rentalPayload.items)
  ) {
    return null;
  }

  if (!isAdminAnalytics(analyticsPayload)) {
    return null;
  }
  const analytics = analyticsPayload;
  const equipmentItems = equipmentPayload.items.filter(
    isAdminEquipmentSummary,
  );
  const rentalItems = rentalPayload.items.filter(isAdminRentalSummary);
  if (
    equipmentItems.length !== equipmentPayload.items.length ||
    rentalItems.length !== rentalPayload.items.length
  ) {
    return null;
  }

  const bookings = rentalItems.filter((item) => item.recordType === "booking");
  return {
    users: analytics.totalUsers,
    equipment: analytics.totalEquipment,
    approvedEquipment: equipmentItems.filter(
      (item) => item.approvalStatus === "approved",
    ).length,
    pendingEquipment: analytics.pendingApprovals,
    rejectedEquipment: equipmentItems.filter(
      (item) => item.approvalStatus === "rejected",
    ).length,
    bookings: analytics.totalBookings,
    completedRentals: analytics.completedRentals,
    totalRevenueMinor: analytics.totalRevenueMinor,
    currentMonthBookings: analytics.monthlyBookings.at(-1)?.count ?? 0,
    rentalDates: bookings.map((item) => item.bookingDate),
    paidRentalDates: bookings
      .filter((item) => item.paymentStatus === "paid")
      .map((item) => item.bookingDate),
    paidRevenuePoints: bookings
      .filter((item) => item.paymentStatus === "paid")
      .map((item) => ({
        date: item.bookingDate,
        amountMinor: item.amountMinor,
      })),
  };
}

export default function AdminOverviewClient() {
  const { accessToken, user } = useDashboard();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadOverview() {
      setError(null);
      setOverview(null);
      try {
        const [equipmentPayload, rentalPayload, analyticsPayload] =
          await Promise.all([
            dashboardRequest("/api/admin/equipment", accessToken, {
              signal: controller.signal,
            }),
            dashboardRequest("/api/admin/rentals", accessToken, {
              signal: controller.signal,
            }),
            dashboardRequest("/api/admin/analytics", accessToken, {
              signal: controller.signal,
            }),
          ]);
        const result = parseOverview(
          equipmentPayload,
          rentalPayload,
          analyticsPayload,
        );
        if (!result) {
          throw new Error("The admin services returned invalid overview data.");
        }
        if (!controller.signal.aborted) {
          setOverview(result);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load platform totals.",
          );
        }
      }
    }

    void loadOverview();
    return () => controller.abort();
  }, [accessToken, retryKey]);

  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  const cards = overview
    ? [
        {
          href: "/dashboard/users",
          icon: <UsersRound aria-hidden="true" className="size-5" />,
          label: "Registered users",
          value: String(overview.users),
          note: "Manage account roles",
        },
        {
          href: "/dashboard/all-equipment",
          icon: <Boxes aria-hidden="true" className="size-5" />,
          label: "Equipment listings",
          value: String(overview.equipment),
          note: `${overview.pendingEquipment} pending approval`,
        },
        {
          href: "/dashboard/all-rentals",
          icon: <CalendarDays aria-hidden="true" className="size-5" />,
          label: "Total bookings",
          value: String(overview.bookings),
          note: `${overview.currentMonthBookings} this month`,
        },
        {
          href: "/dashboard/all-rentals",
          icon: <CalendarDays aria-hidden="true" className="size-5" />,
          label: "Completed rentals",
          value: String(overview.completedRentals),
          note: "Bookings returned",
        },
        {
          href: "/dashboard/all-rentals",
          icon: <ShieldCheck aria-hidden="true" className="size-5" />,
          label: "Total revenue",
          value: formatCurrency(overview.totalRevenueMinor),
          note: "Confirmed payments",
        },
      ]
    : [];
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#e8ecfa] p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-20 size-60 rounded-full border border-[#526ab7]/20"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#46599a]">
              Platform overview
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#17213d] sm:text-3xl">
              Welcome, {firstName}.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#17213d]/65">
              Review the marketplace at a glance and jump directly into the
              areas that need your attention.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#526ab7]/15 bg-white/70 px-4 py-3 text-xs font-extrabold text-[#46599a]">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Admin access verified
          </span>
        </div>
        <div className="relative mt-6 flex items-center gap-2 border-t border-[#17213d]/10 pt-4 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#17213d]/50">
          <span className="size-2 rounded-full bg-[#526ab7]" />
          GearRent control room
          <span className="ml-auto hidden sm:inline">
            Changes to access roles apply immediately
          </span>
        </div>
      </section>

      {overview === null && !error && (
        <AdminLoading
          message="Gathering platform activity..."
          variant="overview"
        />
      )}
      {error && (
        <AdminError
          message={error}
          onRetry={() => setRetryKey((current) => current + 1)}
        />
      )}
      {overview && (
        <>
          <section aria-label="Platform metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => (
              <Link
                className="group rounded-2xl border border-[#dde2ef] bg-white p-5 shadow-[0_16px_40px_-36px_rgba(23,33,61,0.65)] transition hover:-translate-y-1 hover:border-[#526ab7]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526ab7]"
                href={card.href}
                key={card.label}
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[#edf0fb] text-[#526ab7]">
                    {card.icon}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#526ab7]"
                  />
                </div>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-[#17213d]">
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {card.note}
                </p>
              </Link>
            ))}
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.8fr)]">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#526ab7]">
                  Inventory health
                </p>
                <h3 className="mt-1 text-lg font-black text-[#17213d]">
                  Equipment approval rate
                </h3>
              </div>
              <div className="mt-5 grid items-center gap-5 sm:grid-cols-[minmax(128px,0.7fr)_minmax(0,1fr)]">
                <ApprovalGauge
                  approvedCount={overview.approvedEquipment}
                  itemLabel="equipment listings"
                  totalCount={overview.equipment}
                />
                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                  {[
                    {
                      label: "Approved",
                      value: overview.approvedEquipment,
                      color: "text-emerald-700",
                    },
                    {
                      label: "In review",
                      value: overview.pendingEquipment,
                      color: "text-amber-700",
                    },
                    {
                      label: "Needs changes",
                      value: overview.rejectedEquipment,
                      color: "text-rose-700",
                    },
                  ].map((item) => (
                    <div
                      className="rounded-xl bg-[#f7f8fc] p-3"
                      key={item.label}
                    >
                      <p className={`text-xs font-bold ${item.color}`}>
                        {item.label}
                      </p>
                      <p className="mt-1 text-xl font-black text-[#17213d]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <div className="min-w-0 space-y-4">
              <PerformanceChart
                activityNote="Bookings are grouped by booking date; the line shows paid rentals."
                comparisonDates={overview.paidRentalDates}
                comparisonLabel="Paid rentals"
                description="Monthly platform bookings and paid rentals over time."
                emptyMessage="Monthly rental trends will appear here as bookings come in."
                rentalDates={overview.rentalDates}
                rentalLabel="Bookings"
                title="Rental performance"
              />
              <RevenueTrendChart points={overview.paidRevenuePoints} />
            </div>
          </div>

          <section className="rounded-[1.5rem] border border-[#dde2ef] bg-white p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#526ab7]">
              Admin tools
            </p>
            <h3 className="mt-1 text-lg font-black text-[#17213d]">
              Choose a workspace
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <QuickLink href="/dashboard/users" label="Manage user roles" />
              <QuickLink
                href="/dashboard/all-equipment"
                label="Review all equipment"
              />
              <QuickLink
                href="/dashboard/all-rentals"
                label="Monitor all rentals"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-[#e4e8f2] bg-[#f8f9fc] px-4 text-xs font-extrabold text-[#344675] transition hover:border-[#526ab7]/35 hover:bg-[#edf0fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526ab7]"
      href={href}
    >
      {label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}
