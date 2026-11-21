"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, XCircle } from "lucide-react";
import { dashboardRequest } from "@/lib/dashboard-api";
import { useDashboard } from "../dashboard-context";
import {
  AdminEmptyState,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminTableFrame,
  adminTableClassName,
  adminTableHeadClassName,
} from "./admin-ui";

type AdminRental = {
  id: string;
  recordType: "booking" | "reservation";
  customer: {
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
  };
  owner: { name: string; email: string };
  equipment: { name: string; category: string };
  startDate: string;
  endDate: string;
  durationDays: number;
  rentalType: "daily" | "weekly" | "monthly";
  quantity: number;
  amountMinor: number;
  paymentStatus: "paid" | "pending";
  bookingStatus: "upcoming" | "ongoing" | "completed" | "pending-payment";
  bookingDate: string;
};
type RentalState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: AdminRental[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAdminRental(value: unknown): value is AdminRental {
  return (
    isRecord(value) &&
    isRecord(value.customer) &&
    isRecord(value.owner) &&
    isRecord(value.equipment) &&
    typeof value.id === "string" &&
    (value.recordType === "booking" || value.recordType === "reservation") &&
    typeof value.customer.name === "string" &&
    typeof value.customer.email === "string" &&
    typeof value.customer.phoneNumber === "string" &&
    typeof value.customer.address === "string" &&
    typeof value.owner.name === "string" &&
    typeof value.owner.email === "string" &&
    typeof value.equipment.name === "string" &&
    typeof value.equipment.category === "string" &&
    typeof value.startDate === "string" &&
    typeof value.endDate === "string" &&
    typeof value.durationDays === "number" &&
    Number.isInteger(value.durationDays) &&
    (value.rentalType === "daily" ||
      value.rentalType === "weekly" ||
      value.rentalType === "monthly") &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    typeof value.amountMinor === "number" &&
    Number.isFinite(value.amountMinor) &&
    (value.paymentStatus === "paid" || value.paymentStatus === "pending") &&
    (value.bookingStatus === "upcoming" ||
      value.bookingStatus === "ongoing" ||
      value.bookingStatus === "completed" ||
      value.bookingStatus === "pending-payment") &&
    typeof value.bookingDate === "string"
  );
}

function parseRentals(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    return null;
  }
  return payload.items.every(isAdminRental) ? payload.items : null;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

function formatAmount(amountMinor: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

const paymentClassNames = {
  paid: "bg-emerald-50 text-emerald-800",
  pending: "bg-amber-50 text-amber-900",
};
const bookingLabels = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  "pending-payment": "Payment pending",
};
const bookingClassNames = {
  upcoming: "bg-sky-50 text-sky-800",
  ongoing: "bg-emerald-50 text-emerald-800",
  completed: "bg-slate-100 text-slate-700",
  "pending-payment": "bg-amber-50 text-amber-900",
};

export default function AdminRentalsClient() {
  const { accessToken } = useDashboard();
  const [state, setState] = useState<RentalState>({ status: "loading" });
  const [search, setSearch] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadRentals() {
      try {
        const payload = await dashboardRequest(
          "/api/admin/rentals",
          accessToken,
          { signal: controller.signal },
        );
        const items = parseRentals(payload);
        if (!items) {
          throw new Error("The rental service returned invalid platform data.");
        }
        if (!controller.signal.aborted) {
          setState({ status: "success", items });
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              loadError instanceof Error
                ? loadError.message
                : "Could not load rental records.",
          });
        }
      }
    }

    void loadRentals();
    return () => controller.abort();
  }, [accessToken, retryKey]);

  const items = useMemo(() => {
    if (state.status !== "success") {
      return [];
    }
    const normalized = search.trim().toLowerCase();
    return state.items.filter((rental) =>
      [
        rental.customer.name,
        rental.customer.email,
        rental.owner.name,
        rental.owner.email,
        rental.equipment.name,
        rental.equipment.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [search, state]);

  async function cancelReservation(rental: AdminRental) {
    if (
      !window.confirm(
        `Cancel the pending checkout for ${rental.equipment.name} rented by ${rental.customer.name}?`,
      )
    ) {
      return;
    }
    setBusyId(rental.id);
    setError(null);
    setNotice(null);
    try {
      await dashboardRequest(
        `/api/admin/rentals/reservations/${encodeURIComponent(rental.id)}/cancel`,
        accessToken,
        { method: "PATCH", body: JSON.stringify({}) },
      );
      setState((current) =>
        current.status === "success"
          ? {
              ...current,
              items: current.items.filter((item) => item.id !== rental.id),
            }
          : current,
      );
      setNotice("Pending checkout cancelled.");
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Could not cancel this pending checkout.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <AdminPageHeader
        description="Monitor paid bookings and active checkout holds across every owner and customer account."
        eyebrow="Marketplace activity"
        title="All Rentals"
      />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="relative min-w-56 flex-1 sm:max-w-sm">
          <span className="sr-only">
            Search rentals by customer, owner, or equipment
          </span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            className="h-11 w-full rounded-xl border border-[#dde2ef] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#526ab7] focus:ring-4 focus:ring-[#526ab7]/10"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, owner, equipment"
            type="search"
            value={search}
          />
        </label>
        {state.status === "success" && (
          <p className="ml-auto text-xs font-bold text-slate-500">
            {items.length} rental record{items.length === 1 ? "" : "s"}
          </p>
        )}
      </div>
      {error && (
        <p
          aria-live="assertive"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900"
          role="alert"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          aria-live="polite"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
          role="status"
        >
          {notice}
        </p>
      )}
      {state.status === "loading" && (
        <AdminLoading message="Loading all rental activity..." />
      )}
      {state.status === "error" && (
        <AdminError
          message={state.message}
          onRetry={() => setRetryKey((current) => current + 1)}
        />
      )}
      {state.status === "success" && items.length === 0 && (
        <AdminEmptyState
          description={
            state.items.length
              ? "Try a different search term."
              : "Paid bookings and active checkout reservations will appear here."
          }
          title={state.items.length ? "No matching rentals" : "No rental activity"}
        />
      )}
      {state.status === "success" && items.length > 0 && (
        <AdminTableFrame>
          <table className={`dashboard-data-table ${adminTableClassName} min-w-[1380px]`}>
            <thead className={adminTableHeadClassName}>
              <tr>
                <th className="px-4 py-4">Customer information</th>
                <th className="px-4 py-4">Owner information</th>
                <th className="px-4 py-4">Equipment</th>
                <th className="px-4 py-4">Rental duration</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Payment</th>
                <th className="px-4 py-4">Booking status</th>
                <th className="px-4 py-4">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((rental) => (
                <tr className="align-top" key={`${rental.recordType}-${rental.id}`}>
                  <td className="max-w-52 px-4 py-4">
                    <p className="truncate text-sm font-extrabold text-[#17213d]">
                      {rental.customer.name}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {rental.customer.email || "Email unavailable"}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">
                      {rental.customer.phoneNumber}
                    </p>
                  </td>
                  <td className="max-w-48 px-4 py-4">
                    <p className="truncate text-sm font-extrabold text-[#17213d]">
                      {rental.owner.name}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {rental.owner.email || "Email unavailable"}
                    </p>
                  </td>
                  <td className="max-w-48 px-4 py-4">
                    <p className="text-sm font-extrabold text-[#17213d]">
                      {rental.equipment.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {rental.equipment.category || "Category unavailable"} · Qty{" "}
                      {rental.quantity}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold leading-5 text-slate-600">
                    <p>{formatDate(rental.startDate)}</p>
                    <p className="text-slate-400">to {formatDate(rental.endDate)}</p>
                    <p className="mt-1 text-[11px] font-bold text-[#526ab7]">
                      {rental.durationDays} days · {rental.rentalType}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs font-extrabold text-[#17213d]">
                    {formatAmount(rental.amountMinor)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-extrabold capitalize ${paymentClassNames[rental.paymentStatus]}`}
                    >
                      {rental.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-extrabold ${bookingClassNames[rental.bookingStatus]}`}
                    >
                      {bookingLabels[rental.bookingStatus]}
                    </span>
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      Booked {formatDate(rental.bookingDate)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {rental.recordType === "reservation" ? (
                      <button
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 text-[10px] font-extrabold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
                        disabled={busyId === rental.id}
                        onClick={() => void cancelReservation(rental)}
                        type="button"
                      >
                        {busyId === rental.id ? (
                          <LoaderCircle
                            aria-hidden="true"
                            className="size-3.5 animate-spin"
                          />
                        ) : (
                          <XCircle aria-hidden="true" className="size-3.5" />
                        )}
                        Cancel hold
                      </button>
                    ) : (
                      <span className="text-[10px] font-semibold leading-4 text-slate-500">
                        Paid by Stripe
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableFrame>
      )}
      <p className="mt-4 text-[11px] leading-5 text-slate-500">
        Admins can cancel active unpaid checkout holds. Paid bookings are
        monitored here; changing their payment status requires a Stripe refund
        workflow.
      </p>
    </div>
  );
}
