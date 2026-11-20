"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Hourglass,
  PackagePlus,
  TriangleAlert,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { dashboardRequest } from "@/lib/dashboard-api";
import { useDashboard } from "./dashboard-context";
import { ApprovalGauge } from "./approval-gauge";
import { PerformanceChart } from "./performance-chart";
import { RevenueTrendChart } from "./revenue-trend-chart";
import {
  parseOwnerEquipment,
  type OwnerEquipment,
} from "./owner-equipment-types";

type OwnerRentalSummary = {
  id: string;
  equipment: { name: string };
  bookingDate: string;
  startDate: string;
  amountMinor: number;
  paymentStatus: "paid" | "pending";
  bookingStatus: "upcoming" | "ongoing" | "completed" | "pending-payment";
};

type OwnerOverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      equipment: OwnerEquipment[];
      rentals: OwnerRentalSummary[];
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEquipmentList(payload: unknown): OwnerEquipment[] | null {
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    return null;
  }
  const items = payload.items.map(parseOwnerEquipment);
  return items.every(
    (item): item is OwnerEquipment => item !== null,
  )
    ? items
    : null;
}

function isOwnerRentalSummary(value: unknown): value is OwnerRentalSummary {
  return (
    isRecord(value) &&
    isRecord(value.equipment) &&
    typeof value.id === "string" &&
    typeof value.equipment.name === "string" &&
    typeof value.bookingDate === "string" &&
    typeof value.startDate === "string" &&
    typeof value.amountMinor === "number" &&
    Number.isFinite(value.amountMinor) &&
    (value.paymentStatus === "paid" || value.paymentStatus === "pending") &&
    (value.bookingStatus === "upcoming" ||
      value.bookingStatus === "ongoing" ||
      value.bookingStatus === "completed" ||
      value.bookingStatus === "pending-payment")
  );
}

function parseRentalList(payload: unknown): OwnerRentalSummary[] | null {
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    return null;
  }
  return payload.items.every(isOwnerRentalSummary) ? payload.items : null;
}

function formatCurrency(amountMinor: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function OwnerMetric({
  href,
  icon,
  index,
  label,
  note,
  reduceMotion,
  value,
}: {
  href: string;
  icon: ReactNode;
  index: number;
  label: string;
  note: string;
  reduceMotion: boolean;
  value: string;
}) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-[#e8dfce] bg-white p-5 shadow-[0_16px_40px_-36px_rgba(23,42,33,0.65)]"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.06, duration: 0.35 }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
    >
      <Link
        aria-label={`Open ${label}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97038]"
        href={href}
      />
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#f8eee0] text-[#b9582e]">
          {icon}
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#b9582e]"
        />
      </div>
      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight text-[#172a21]">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-500">{note}</p>
    </motion.article>
  );
}

const approvalStyles = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-rose-100 text-rose-900",
};

const approvalLabels = {
  pending: "In review",
  approved: "Approved",
  rejected: "Needs changes",
};

export default function OwnerOverviewClient() {
  const { accessToken, user } = useDashboard();
  const reduceMotion = useReducedMotion() ?? false;
  const [state, setState] = useState<OwnerOverviewState>({
    status: "loading",
  });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOwnerOverview() {
      try {
        const [equipmentPayload, rentalPayload] = await Promise.all([
          dashboardRequest("/api/equipment/mine", accessToken, {
            signal: controller.signal,
          }),
          dashboardRequest("/api/bookings/owner", accessToken, {
            signal: controller.signal,
          }),
        ]);
        const equipment = parseEquipmentList(equipmentPayload);
        const rentals = parseRentalList(rentalPayload);
        if (!equipment || !rentals) {
          throw new Error("The owner services returned invalid dashboard data.");
        }
        if (!controller.signal.aborted) {
          setState({ status: "success", equipment, rentals });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load your owner overview.",
          });
        }
      }
    }

    void loadOwnerOverview();
    return () => controller.abort();
  }, [accessToken, retryKey]);

  const metrics = useMemo(() => {
    if (state.status !== "success") {
      return null;
    }
    const activeRentals = state.rentals.filter(
      (rental) => rental.bookingStatus === "ongoing",
    ).length;
    const paidRentals = state.rentals.filter(
      (rental) => rental.paymentStatus === "paid",
    );
    return {
      pendingListings: state.equipment.filter(
        (item) => item.approvalStatus === "pending",
      ).length,
      approvedListings: state.equipment.filter(
        (item) => item.approvalStatus === "approved",
      ).length,
      rejectedListings: state.equipment.filter(
        (item) => item.approvalStatus === "rejected",
      ).length,
      activeRentals,
      upcomingRentals: state.rentals.filter(
        (rental) => rental.bookingStatus === "upcoming",
      ).length,
      pendingPayments: state.rentals.filter(
        (rental) => rental.bookingStatus === "pending-payment",
      ).length,
      completedRentals: state.rentals.filter(
        (rental) => rental.bookingStatus === "completed",
      ).length,
      paidRentalCount: paidRentals.length,
      revenueMinor: paidRentals.reduce(
        (total, rental) => total + rental.amountMinor,
        0,
      ),
    };
  }, [state]);

  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  const equipment =
    state.status === "success" ? state.equipment.slice(0, 3) : [];
  const listingTotal = metrics
    ? metrics.pendingListings +
      metrics.approvedListings +
      metrics.rejectedListings
    : 0;
  const statCards = metrics
    ? [
        {
          href: "/dashboard/equipment",
          icon: <Boxes aria-hidden="true" className="size-5" />,
          label: "Equipment listed",
          note: `${metrics.approvedListings} approved and rentable`,
          value: String(listingTotal),
        },
        {
          href: "/dashboard/equipment",
          icon: <Hourglass aria-hidden="true" className="size-5" />,
          label: "Awaiting review",
          note: "Listings in the approval queue",
          value: String(metrics.pendingListings),
        },
        {
          href: "/dashboard/equipment-rentals",
          icon: <CalendarDays aria-hidden="true" className="size-5" />,
          label: "Active rentals",
          note: `${metrics.upcomingRentals} starting soon`,
          value: String(metrics.activeRentals),
        },
        {
          href: "/dashboard/equipment-rentals",
          icon: <CircleDollarSign aria-hidden="true" className="size-5" />,
          label: "Paid revenue",
          note: `${metrics.paidRentalCount} paid rental${metrics.paidRentalCount === 1 ? "" : "s"}`,
          value: formatCurrency(metrics.revenueMinor),
        },
      ]
    : [];
  const rentalActivity = metrics
    ? [
        { label: "Upcoming", value: metrics.upcomingRentals },
        { label: "Ongoing", value: metrics.activeRentals },
        { label: "Payment pending", value: metrics.pendingPayments },
        { label: "Completed", value: metrics.completedRentals },
      ]
    : [];
  const rentalDates =
    state.status === "success"
      ? state.rentals.map((rental) => rental.bookingDate)
      : [];
  const paidRentalDates =
    state.status === "success"
      ? state.rentals
          .filter((rental) => rental.paymentStatus === "paid")
          .map((rental) => rental.bookingDate)
      : [];
  const paidRevenuePoints =
    state.status === "success"
      ? state.rentals
          .filter((rental) => rental.paymentStatus === "paid")
          .map((rental) => ({
            date: rental.bookingDate,
            amountMinor: rental.amountMinor,
          }))
      : [];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#f7ead4] p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-20 size-60 rounded-full border border-[#d97038]/15"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a54c2b]">
              Operations overview
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#172a21] sm:text-3xl">
              Welcome back, {firstName}.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#172a21]/65">
              Here is the current pulse of your inventory and rental activity.
              Keep your listings up to date to make every booking count.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#172a21] px-4 text-sm font-extrabold text-white transition hover:bg-[#284536] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97038]"
            href="/dashboard/equipment/new"
          >
            <PackagePlus aria-hidden="true" className="size-4" />
            Add equipment
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div className="relative mt-6 flex items-center gap-2 border-t border-[#172a21]/10 pt-4 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#172a21]/50">
          <span className="size-2 rounded-full bg-[#619b5f]" />
          Owner account active
          <span className="ml-auto hidden sm:inline">
            Your next booking starts with a great listing
          </span>
        </div>
      </section>

      {state.status === "loading" && (
        <div
          aria-live="polite"
          className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-[#e8dfce] bg-white text-sm font-semibold text-slate-500"
          role="status"
        >
          <span className="size-4 animate-spin rounded-full border-2 border-[#d97038] border-t-transparent" />
          Loading your inventory and rentals...
        </div>
      )}
      {state.status === "error" && (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-900"
          role="alert"
        >
          <p>Could not load your owner overview: {state.message}</p>
          <button
            className="mt-3 font-extrabold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-800"
            onClick={() => setRetryKey((current) => current + 1)}
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      {state.status === "success" && metrics && (
        <>
          <section aria-label="Owner business metrics" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {statCards.map((card, index) => (
              <OwnerMetric
                key={card.label}
                {...card}
                index={index}
                reduceMotion={reduceMotion}
              />
            ))}
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.8fr)]">
            <section className="rounded-[1.5rem] border border-[#e8dfce] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#a54c2b]">
                    Inventory health
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[#172a21]">
                    Listing approval status
                  </h3>
                </div>
                <Link
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-[#a54c2b] hover:text-[#78361f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97038]"
                  href="/dashboard/equipment"
                >
                  Manage equipment
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
              <div className="mt-5 grid items-center gap-5 sm:grid-cols-[minmax(128px,0.7fr)_minmax(0,1fr)]">
                <ApprovalGauge
                  approvedCount={metrics.approvedListings}
                  itemLabel="listings"
                  totalCount={listingTotal}
                />
                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                  <ApprovalCount
                    icon={<CheckCircle2 aria-hidden="true" className="size-4" />}
                    label="Approved"
                    value={metrics.approvedListings}
                    color="text-emerald-700"
                  />
                  <ApprovalCount
                    icon={<Clock3 aria-hidden="true" className="size-4" />}
                    label="In review"
                    value={metrics.pendingListings}
                    color="text-amber-700"
                  />
                  <ApprovalCount
                    icon={<TriangleAlert aria-hidden="true" className="size-4" />}
                    label="Needs changes"
                    value={metrics.rejectedListings}
                    color="text-rose-700"
                  />
                </div>
              </div>
              {listingTotal === 0 && (
                <div className="mt-5 rounded-xl bg-[#fbf8f2] px-4 py-3 text-xs leading-5 text-slate-600">
                  Your inventory is empty. Add your first piece of equipment to
                  start building your rental business.
                </div>
              )}
            </section>

            <div className="min-w-0 space-y-4">
              <PerformanceChart
                activityNote="Bookings are grouped by booking date; the line shows paid rentals."
                comparisonDates={paidRentalDates}
                comparisonLabel="Paid rentals"
                description="Monthly bookings and paid rentals over time."
                emptyMessage="Monthly rental trends will appear here as bookings come in."
                rentalDates={rentalDates}
                rentalLabel="Bookings"
                title="Rental performance"
              />
              <section
                aria-label="Rental totals by status"
                className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              >
                {rentalActivity.map((item) => (
                  <div
                    className="rounded-xl border border-[#e8dfce] bg-white p-3"
                    key={item.label}
                  >
                    <p className="text-[10px] font-bold text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xl font-black text-[#172a21]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </section>
              <RevenueTrendChart points={paidRevenuePoints} />
            </div>
          </div>

          <section className="rounded-[1.5rem] border border-[#e8dfce] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#a54c2b]">
                  Your inventory
                </p>
                <h3 className="mt-1 text-lg font-black text-[#172a21]">
                  Recently added equipment
                </h3>
              </div>
              <Link
                className="inline-flex items-center gap-1 text-xs font-extrabold text-[#a54c2b] hover:text-[#78361f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97038]"
                href="/dashboard/equipment"
              >
                Open inventory
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
            {equipment.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {equipment.map((item) => (
                  <Link
                    className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#eee8dc] p-3 transition hover:border-[#d97038]/40 hover:bg-[#fbf8f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97038]"
                    href={`/dashboard/equipment/${encodeURIComponent(item.id)}`}
                    key={item.id}
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[#f2eee5]">
                      <Image
                        alt=""
                        className="object-cover"
                        fill
                        sizes="56px"
                        src={item.image}
                        unoptimized
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold text-[#172a21]">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {item.category}
                      </span>
                      <span
                        className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold ${approvalStyles[item.approvalStatus]}`}
                      >
                        {approvalLabels[item.approvalStatus]}
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-slate-300 transition group-hover:text-[#a54c2b]"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-[#d8cfbf] bg-[#fbf8f2] p-4">
                <p className="text-sm font-semibold text-slate-600">
                  No equipment yet. Your first listing will appear here.
                </p>
                <Link
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#172a21] px-3 text-xs font-extrabold text-white transition hover:bg-[#284536] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97038]"
                  href="/dashboard/equipment/new"
                >
                  <PackagePlus aria-hidden="true" className="size-4" />
                  Add your first item
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ApprovalCount({
  color,
  icon,
  label,
  value,
}: {
  color: string;
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-[#fbf8f2] p-3">
      <div className={`flex items-center gap-1.5 text-xs font-bold ${color}`}>
        {icon}
        {label}
      </div>
      <p className="mt-2 text-xl font-black text-[#172a21]">{value}</p>
    </div>
  );
}
