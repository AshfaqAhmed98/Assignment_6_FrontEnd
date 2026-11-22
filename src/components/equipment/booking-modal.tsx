"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, X } from "lucide-react";
import {
  getRentalEndDate,
  getRentalUnitRateMinor,
  type FeaturedEquipment,
  type RentalType,
} from "@/data/featured-equipment";

export type { RentalType } from "@/data/featured-equipment";
type AvailabilityState =
  | { queryKey: string; status: "checking" }
  | {
      queryKey: string;
      status: "ready";
      availableQuantity: number;
      isAvailable: boolean;
    }
  | { queryKey: string; status: "error"; message: string };

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function rentalDays(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00.000Z`);
  const end = Date.parse(`${endDate}T00:00:00.000Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0;
  }
  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)));
}

function getMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }
  return fallback;
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error("The rental service returned an invalid response.");
  }
}

export function BookingModal({
  equipment,
  accessToken,
  initialStartDate,
  initialEndDate,
  initialRentalType,
  onClose,
}: {
  equipment: FeaturedEquipment;
  accessToken: string;
  initialStartDate: string;
  initialEndDate: string;
  initialRentalType: RentalType;
  onClose: () => void;
}) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [rentalType, setRentalType] = useState<RentalType>(initialRentalType);
  const [requiredQuantity, setRequiredQuantity] = useState(1);
  const [contactNumber, setContactNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [availability, setAvailability] = useState<AvailabilityState | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const durationDays = rentalDays(startDate, endDate);
  const periodDays = { daily: 1, weekly: 7, monthly: 30 }[rentalType];
  const billedUnits =
    durationDays > 0 ? Math.ceil(durationDays / periodDays) : 0;
  const unitRateMinor = getRentalUnitRateMinor(equipment, rentalType);
  const totalAmountMinor =
    unitRateMinor * billedUnits * requiredQuantity;
  const availabilityQuery = new URLSearchParams({
    startDate,
    endDate,
    quantity: String(requiredQuantity),
  }).toString();
  const currentAvailability: AvailabilityState = !durationDays
    ? {
        queryKey: availabilityQuery,
        status: "error",
        message: "Choose a valid date range and quantity.",
      }
    : availability?.queryKey === availabilityQuery
      ? availability
      : { queryKey: availabilityQuery, status: "checking" };

  useEffect(() => {
    const controller = new AbortController();

    if (!durationDays || requiredQuantity < 1) {
      return () => controller.abort();
    }

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/equipment/${encodeURIComponent(equipment.id)}/availability?${availabilityQuery}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          },
        );
        const payload = await readJson(response);
        if (!response.ok) {
          throw new Error(
            getMessage(payload, "Could not check equipment availability."),
          );
        }
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("availableQuantity" in payload) ||
          typeof payload.availableQuantity !== "number" ||
          !("available" in payload) ||
          typeof payload.available !== "boolean"
        ) {
          throw new Error("The equipment API returned invalid availability.");
        }
        setAvailability({
          queryKey: availabilityQuery,
          status: "ready",
          availableQuantity: payload.availableQuantity,
          isAvailable: payload.available,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setAvailability({
            queryKey: availabilityQuery,
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not check equipment availability.",
          });
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    accessToken,
    durationDays,
    equipment.id,
    availabilityQuery,
    requiredQuantity,
  ]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings/checkout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipmentId: equipment.id,
          startDate,
          endDate,
          rentalType,
          requiredQuantity,
          contactNumber,
          deliveryAddress,
          additionalNotes,
          requestId: crypto.randomUUID(),
        }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(
          getMessage(payload, "Could not create the secure checkout session."),
        );
      }

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("checkoutUrl" in payload) ||
        typeof payload.checkoutUrl !== "string"
      ) {
        throw new Error("The booking API returned an invalid checkout URL.");
      }

      const checkoutUrl = new URL(payload.checkoutUrl);
      if (
        checkoutUrl.protocol !== "https:" ||
        checkoutUrl.hostname !== "checkout.stripe.com"
      ) {
        throw new Error("The booking API returned an untrusted checkout URL.");
      }
      window.location.assign(checkoutUrl.toString());
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Could not start secure checkout.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto overscroll-contain bg-[#08162d]/70 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="booking-modal-title"
        aria-modal="true"
        className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[92vh] sm:p-8"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#087e78]">
              Secure Stripe checkout
            </p>
            <h2
              className="mt-2 break-words text-xl font-black leading-tight text-[#08162d] sm:text-2xl"
              id="booking-modal-title"
            >
              Book {equipment.name}
            </h2>
          </div>
          <button
            aria-label="Close booking dialog"
            className="grid size-10 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-[#08162d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087e78] disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="text-sm font-semibold text-slate-700">
            Rental start date
            <input
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-base font-normal outline-none focus:border-[#087e78] focus:ring-4 focus:ring-[#087e78]/10 sm:text-sm"
              min={initialStartDate}
              onChange={(event) => {
                const nextStartDate = event.target.value;
                setStartDate(nextStartDate);
                setEndDate(getRentalEndDate(nextStartDate, rentalType));
              }}
              required
              type="date"
              value={startDate}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Rental end / return date
            <input
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-base font-normal outline-none focus:border-[#087e78] focus:ring-4 focus:ring-[#087e78]/10 sm:text-sm"
              min={startDate || initialStartDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
              type="date"
              value={endDate}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Rental type
            <select
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-base font-normal outline-none focus:border-[#087e78] focus:ring-4 focus:ring-[#087e78]/10 sm:text-sm"
              onChange={(event) => {
                const value = event.target.value;
                const nextRentalType =
                  value === "weekly" || value === "monthly" ? value : "daily";
                setRentalType(nextRentalType);
                setEndDate(getRentalEndDate(startDate, nextRentalType));
              }}
              value={rentalType}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Selecting a rental type sets the return date to that period;
              you can adjust it afterward.
            </span>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Required quantity
            <input
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-base font-normal outline-none focus:border-[#087e78] focus:ring-4 focus:ring-[#087e78]/10 sm:text-sm"
              min="1"
              onChange={(event) =>
                setRequiredQuantity(Math.max(1, Number(event.target.value) || 1))
              }
              required
              type="number"
              value={requiredQuantity}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Contact number
            <input
              autoComplete="tel"
              className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-base font-normal outline-none focus:border-[#087e78] focus:ring-4 focus:ring-[#087e78]/10 sm:text-sm"
              maxLength={30}
              onChange={(event) => setContactNumber(event.target.value)}
              pattern="[+0-9()\\-\\s]{7,30}"
              placeholder="+880 1XXX-XXXXXX"
              required
              value={contactNumber}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Delivery address
            <textarea
              autoComplete="street-address"
              className="mt-2 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-base font-normal outline-none focus:border-[#087e78] focus:ring-4 focus:ring-[#087e78]/10 sm:text-sm"
              maxLength={500}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              required
              value={deliveryAddress}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Additional notes (optional)
            <textarea
              className="mt-2 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-base font-normal outline-none focus:border-[#087e78] focus:ring-4 focus:ring-[#087e78]/10 sm:text-sm"
              maxLength={2000}
              onChange={(event) => setAdditionalNotes(event.target.value)}
              value={additionalNotes}
            />
          </label>

          <div className="rounded-xl border border-slate-200 bg-[#f7f8fa] p-4 sm:col-span-2">
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="break-words text-slate-600">
                {durationDays || 0} rental day(s) · {billedUnits}{" "}
                {rentalType} period(s) · {requiredQuantity} item(s)
              </span>
              <strong className="text-lg font-black text-[#08162d]">
                ৳{(totalAmountMinor / 100).toLocaleString()}
              </strong>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Weekly and monthly rates are based on 7 and 30 daily rates.
              Partial periods round up. The server recalculates the total before
              checkout.
            </p>
          </div>

          <p
            aria-live="polite"
            className={`text-sm sm:col-span-2 ${
              currentAvailability.status === "error" ||
              (currentAvailability.status === "ready" &&
                !currentAvailability.isAvailable)
                ? "text-red-700"
                : "text-slate-600"
            }`}
            role={
              currentAvailability.status === "error" ||
              (currentAvailability.status === "ready" &&
                !currentAvailability.isAvailable)
                ? "alert"
                : "status"
            }
          >
            {currentAvailability.status === "checking"
              ? "Checking availability…"
              : currentAvailability.status === "error"
                ? currentAvailability.message
                : currentAvailability.status === "ready"
                  ? currentAvailability.isAvailable
                    ? `${currentAvailability.availableQuantity} item(s) available for these dates.`
                    : `Only ${currentAvailability.availableQuantity} item(s) are available for these dates; ${requiredQuantity} requested.`
                  : ""}
          </p>

          {checkoutError && (
            <p
              aria-live="assertive"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2"
              role="alert"
            >
              {checkoutError}
            </p>
          )}

          <button
            className="gearrent-primary-action min-h-12 w-full sm:col-span-2"
            disabled={
              isSubmitting ||
              currentAvailability.status !== "ready" ||
              !currentAvailability.isAvailable ||
              !durationDays
            }
            type="submit"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
                Opening secure checkout…
              </>
            ) : (
              "Continue to Stripe Checkout"
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
