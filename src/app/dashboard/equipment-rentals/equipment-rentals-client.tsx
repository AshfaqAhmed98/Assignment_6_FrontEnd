"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  LoaderCircle,
  Search,
} from "lucide-react";
import { dashboardRequest } from "@/lib/dashboard-api";
import { useDashboard } from "../dashboard-context";

type OwnerRental = {
  id: string;
  customer: {
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
  };
  equipment: { id: string; name: string; category: string };
  startDate: string;
  endDate: string;
  durationDays: number;
  rentalType: "daily" | "weekly" | "monthly";
  quantity: number;
  amountMinor: number;
  currency: "bdt";
  paymentStatus: "paid" | "pending";
  bookingStatus: "upcoming" | "ongoing" | "completed" | "pending-payment";
  bookingDate: string;
};

type RentalsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: OwnerRental[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOwnerRental(value: unknown): value is OwnerRental {
  if (!isRecord(value) || !isRecord(value.customer) || !isRecord(value.equipment)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.customer.name === "string" &&
    typeof value.customer.email === "string" &&
    typeof value.customer.phoneNumber === "string" &&
    typeof value.customer.address === "string" &&
    typeof value.equipment.id === "string" &&
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
    value.currency === "bdt" &&
    (value.paymentStatus === "paid" || value.paymentStatus === "pending") &&
    (value.bookingStatus === "upcoming" ||
      value.bookingStatus === "ongoing" ||
      value.bookingStatus === "completed" ||
      value.bookingStatus === "pending-payment") &&
    typeof value.bookingDate === "string"
  );
}

function parseOwnerRentals(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    return null;
  }
  const items = payload.items;
  return items.every(isOwnerRental) ? items : null;
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

function formatAmount(amountMinor: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

const paymentClassNames = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-800",
};
const bookingLabels = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  "pending-payment": "Payment pending",
};
const bookingClassNames = {
  upcoming: "bg-sky-50 text-sky-700",
  ongoing: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
  "pending-payment": "bg-amber-50 text-amber-800",
};

export default function EquipmentRentalsClient() {
  const { accessToken } = useDashboard();
  const [state, setState] = useState<RentalsState>({ status: "loading" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadRentals() {
      try {
        const payload = await dashboardRequest("/api/bookings/owner", accessToken, {
          signal: controller.signal,
        });
        const items = parseOwnerRentals(payload);
        if (!items) {
          throw new Error("The rental service returned invalid owner rental data.");
        }
        setState({ status: "success", items });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load your equipment rentals.",
          });
        }
      }
    }

    void loadRentals();
    return () => controller.abort();
  }, [accessToken]);

  const filteredItems = useMemo(() => {
    if (state.status !== "success") {
      return [];
    }
    const normalizedSearch = search.trim().toLowerCase();
    return state.items.filter((rental) => {
      const customerText = [
        rental.customer.name,
        rental.customer.email,
        rental.customer.phoneNumber,
      ]
        .join(" ")
        .toLowerCase();
      const equipmentText =
        `${rental.equipment.name} ${rental.equipment.category}`.toLowerCase();
      return (
        !normalizedSearch ||
        customerText.includes(normalizedSearch) ||
        equipmentText.includes(normalizedSearch)
      );
    });
  }, [search, state]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c94f1c]">
            Owner workspace
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[#08162d]">
            My Equipment Rental
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Track renter details, dates, quantities, payment, and booking status
            for your equipment.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
          href="/dashboard/equipment"
        >
          <ClipboardList aria-hidden="true" className="size-4" />
          My equipment
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Search equipment rentals</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#e96a32] focus:ring-4 focus:ring-[#e96a32]/10"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search equipment or customer"
            type="search"
            value={search}
          />
        </label>
        {state.status === "success" && (
          <p className="text-xs font-bold text-slate-500">
            {filteredItems.length} rental{filteredItems.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {state.status === "loading" && (
        <div
          aria-live="polite"
          className="flex min-h-56 items-center justify-center gap-3 text-sm font-semibold text-slate-500"
          role="status"
        >
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-[#e96a32]" />
          Loading equipment rentals…
        </div>
      )}
      {state.status === "error" && (
        <div
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800"
          role="alert"
        >
          Could not load your equipment rentals: {state.message}
        </div>
      )}
      {state.status === "success" && filteredItems.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#eefaf7] text-[#087e78]">
            <CalendarDays aria-hidden="true" className="size-6" />
          </span>
          <h3 className="mt-4 text-lg font-black text-[#08162d]">
            {search ? "No matching rentals" : "No rentals yet"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {search
              ? "Try a different equipment name or customer search."
              : "Paid bookings and active checkout reservations for your equipment will appear here."}
          </p>
        </div>
      )}
      {state.status === "success" && filteredItems.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left">
              <thead className="bg-[#f7f9fc] text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-4 py-4">Customer information</th>
                  <th className="px-4 py-4">Equipment information</th>
                  <th className="px-4 py-4">Rental duration</th>
                  <th className="px-4 py-4">Required quantity</th>
                  <th className="px-4 py-4">Booking amount</th>
                  <th className="px-4 py-4">Payment status</th>
                  <th className="px-4 py-4">Booking status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((rental) => (
                  <tr className="align-top" key={rental.id}>
                    <td className="max-w-56 px-4 py-4">
                      <p className="truncate text-sm font-extrabold text-[#08162d]">
                        {rental.customer.name}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {rental.customer.email || "Email unavailable"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        {rental.customer.phoneNumber}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">
                        {rental.customer.address}
                      </p>
                    </td>
                    <td className="max-w-48 px-4 py-4">
                      <p className="text-sm font-extrabold text-[#08162d]">
                        {rental.equipment.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {rental.equipment.category}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold leading-5 text-slate-600">
                      <p>{formatDate(rental.startDate)}</p>
                      <p className="text-slate-400">to {formatDate(rental.endDate)}</p>
                      <p className="mt-1 text-[11px] font-bold text-[#c94f1c]">
                        {rental.durationDays} days · {rental.rentalType}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm font-extrabold text-[#08162d]">
                      {rental.quantity}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-extrabold text-[#08162d]">
                      {formatAmount(rental.amountMinor)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-extrabold capitalize ${paymentClassNames[rental.paymentStatus]}`}
                      >
                        {rental.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-extrabold ${bookingClassNames[rental.bookingStatus]}`}
                      >
                        {bookingLabels[rental.bookingStatus]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
