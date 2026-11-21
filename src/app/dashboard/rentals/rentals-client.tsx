"use client";

import { Fragment, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MessageSquare,
  Search,
  Send,
  Star,
  SlidersHorizontal,
} from "lucide-react";
import { dashboardRequest } from "@/lib/dashboard-api";
import { useDashboard } from "../dashboard-context";

type CustomerBooking = {
  id: string;
  equipmentName: string;
  startDate: string;
  endDate: string;
  bookingDate: string;
  amountMinor: number;
  currency: "bdt";
  paymentStatus: string;
  bookingStatus: "upcoming" | "ongoing" | "completed";
  reviewSubmitted: boolean;
};

type RentalsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: CustomerBooking[] };

function isCustomerBooking(value: unknown): value is CustomerBooking {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "equipmentName" in value &&
    typeof value.equipmentName === "string" &&
    "startDate" in value &&
    typeof value.startDate === "string" &&
    "endDate" in value &&
    typeof value.endDate === "string" &&
    "bookingDate" in value &&
    typeof value.bookingDate === "string" &&
    "amountMinor" in value &&
    typeof value.amountMinor === "number" &&
    "currency" in value &&
    value.currency === "bdt" &&
    "paymentStatus" in value &&
    typeof value.paymentStatus === "string" &&
    "bookingStatus" in value &&
    (value.bookingStatus === "upcoming" ||
      value.bookingStatus === "ongoing" ||
      value.bookingStatus === "completed") &&
    "reviewSubmitted" in value &&
    typeof value.reviewSubmitted === "boolean"
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
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

const bookingStatusClasses = {
  upcoming: "bg-sky-50 text-sky-700",
  ongoing: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
};

export default function MyRentalsPage() {
  const { accessToken } = useDashboard();
  const [state, setState] = useState<RentalsState>({ status: "loading" });
  const [statusFilter, setStatusFilter] = useState<
    "all" | CustomerBooking["bookingStatus"]
  >("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRentals() {
      try {
        const payload = await dashboardRequest(
          "/api/bookings",
          accessToken,
          { signal: controller.signal },
        );
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("items" in payload) ||
          !Array.isArray(payload.items) ||
          !payload.items.every(isCustomerBooking)
        ) {
          throw new Error("The rentals service returned invalid booking data.");
        }
        setState({ status: "success", items: payload.items });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load your rentals.",
          });
        }
      }
    }

    void loadRentals();
    return () => controller.abort();
  }, [accessToken]);

  const filteredItems =
    state.status === "success"
      ? state.items.filter((booking) => {
          const matchesStatus =
            statusFilter === "all" || booking.bookingStatus === statusFilter;
          const matchesSearch = booking.equipmentName
            .toLowerCase()
            .includes(search.trim().toLowerCase());
          return matchesStatus && matchesSearch;
        })
      : [];
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pageItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const statusFilters = [
    { value: "all", label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
  ] as const;

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewBookingId) {
      return;
    }

    setReviewError(null);
    setReviewNotice(null);
    setIsSubmittingReview(true);
    try {
      await dashboardRequest("/api/reviews", accessToken, {
        method: "POST",
        body: JSON.stringify({
          bookingId: reviewBookingId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      setState((current) =>
        current.status === "success"
          ? {
              ...current,
              items: current.items.map((booking) =>
                booking.id === reviewBookingId
                  ? { ...booking, reviewSubmitted: true }
                  : booking,
              ),
            }
          : current,
      );
      setReviewBookingId(null);
      setReviewComment("");
      setReviewRating(5);
      setReviewNotice("Thank you—your review has been published.");
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "Could not submit your review.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c94f1c]">
            Customer dashboard
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#08162d] sm:text-3xl">
            My Rentals
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your confirmed equipment bookings and payment details.
          </p>
        </div>
        {state.status === "success" && (
          <span className="rounded-full bg-[#fff4d8] px-3 py-1.5 text-xs font-extrabold text-[#8b4816]">
            {state.items.length} {state.items.length === 1 ? "booking" : "bookings"}
          </span>
        )}
      </div>

      {state.status === "loading" && (
        <div
          aria-live="polite"
          className="flex min-h-56 items-center justify-center gap-3 text-sm font-semibold text-slate-500"
          role="status"
        >
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-[#e96a32]" />
          Loading your bookings…
        </div>
      )}
      {state.status === "error" && (
        <p
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
          role="alert"
        >
          {state.message}
        </p>
      )}
      {state.status === "success" && state.items.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block sm:max-w-sm sm:flex-1">
              <span className="sr-only">Search bookings by equipment</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-[#08162d] outline-none transition focus:border-[#e96a32] focus:bg-white focus:ring-4 focus:ring-[#e96a32]/10"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search equipment"
                type="search"
                value={search}
              />
            </label>
            <div
              aria-label="Filter bookings by status"
              className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1"
              role="group"
            >
              <SlidersHorizontal
                aria-hidden="true"
                className="mx-2 size-4 shrink-0 text-slate-400"
              />
              {statusFilters.map((filter) => (
                <button
                  aria-pressed={statusFilter === filter.value}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32] ${
                    statusFilter === filter.value
                      ? "bg-white text-[#08162d] shadow-sm"
                      : "text-slate-500 hover:text-[#08162d]"
                  }`}
                  key={filter.value}
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setPage(1);
                  }}
                  type="button"
                >
                  {filter.label}
                  <span className="ml-1.5 text-[10px] opacity-60">
                    {filter.value === "all"
                      ? state.items.length
                      : state.items.filter(
                          (booking) => booking.bookingStatus === filter.value,
                        ).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {state.status === "success" && state.items.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#fff4d8] text-[#c94f1c]">
            <CalendarDays aria-hidden="true" className="size-6" />
          </span>
          <h3 className="mt-4 text-lg font-extrabold text-[#08162d]">
            No rentals yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            When you complete a booking, its dates, amount, and payment status
            will appear here.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#08162d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10294c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
            href="/equipment"
          >
            Browse equipment
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      )}
      {state.status === "success" &&
        state.items.length > 0 &&
        filteredItems.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-extrabold text-[#08162d]">
              No bookings match those filters
            </p>
            <button
              className="mt-2 text-sm font-bold text-[#c94f1c] underline underline-offset-4"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              type="button"
            >
              Clear filters
            </button>
          </div>
        )}
      {reviewNotice && (
        <p
          aria-live="polite"
          className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          {reviewNotice}
        </p>
      )}
      {state.status === "success" && filteredItems.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-[#08162d] text-xs uppercase tracking-wide text-white/80">
                <tr>
                  <th className="px-4 py-4 font-extrabold">Equipment Name</th>
                  <th className="px-4 py-4 font-extrabold">Rental Start Date</th>
                  <th className="px-4 py-4 font-extrabold">Rental End Date</th>
                  <th className="px-4 py-4 font-extrabold">Booking Date</th>
                  <th className="px-4 py-4 font-extrabold">Total Amount</th>
                  <th className="px-4 py-4 font-extrabold">Payment Status</th>
                  <th className="px-4 py-4 font-extrabold">Booking Status</th>
                  <th className="px-4 py-4 font-extrabold">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pageItems.map((booking) => (
                  <Fragment key={booking.id}>
                    <tr
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-bold text-[#08162d]">
                        {booking.equipmentName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDate(booking.startDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDate(booking.endDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDate(booking.bookingDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-extrabold text-[#08162d]">
                        {formatAmount(booking.amountMinor)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold capitalize text-emerald-700">
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold capitalize ${bookingStatusClasses[booking.bookingStatus]}`}
                        >
                          {booking.bookingStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {booking.bookingStatus === "completed" &&
                          (booking.reviewSubmitted ? (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-emerald-700">
                              <Star
                                aria-hidden="true"
                                className="size-3.5 fill-current"
                              />
                              Reviewed
                            </span>
                          ) : (
                            <button
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#e96a32] px-3 py-2 text-xs font-bold text-[#c94f1c] transition hover:bg-[#e96a32] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                              onClick={() => {
                                setReviewBookingId((current) =>
                                  current === booking.id ? null : booking.id,
                                );
                                setReviewError(null);
                                setReviewNotice(null);
                              }}
                              type="button"
                            >
                              <MessageSquare
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              Write review
                            </button>
                          ))}
                      </td>
                    </tr>
                    {reviewBookingId === booking.id && (
                      <tr key={`${booking.id}-review-form`}>
                        <td className="border-t border-slate-100 px-4 py-5" colSpan={8}>
                          <form
                            className="mx-auto max-w-2xl space-y-4"
                            onSubmit={(event) => void submitReview(event)}
                          >
                            <div>
                              <h3 className="font-extrabold text-[#08162d]">
                                Review {booking.equipmentName}
                              </h3>
                              <p className="mt-1 text-sm text-slate-500">
                                Your review will be published with your account
                                name.
                              </p>
                            </div>
                            <fieldset>
                              <legend className="mb-2 text-sm font-bold text-[#08162d]">
                                Your rating
                              </legend>
                              <div
                                aria-label="Rating from 1 to 5 stars"
                                className="flex items-center gap-1"
                                role="group"
                              >
                                {Array.from({ length: 5 }, (_, index) => {
                                  const rating = index + 1;
                                  return (
                                    <button
                                      aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                                      aria-pressed={reviewRating === rating}
                                      className="rounded p-1 text-amber-400 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                                      key={rating}
                                      onClick={() => setReviewRating(rating)}
                                      type="button"
                                    >
                                      <Star
                                        aria-hidden="true"
                                        className={`size-7 ${
                                          rating <= reviewRating
                                            ? "fill-current"
                                            : "fill-transparent text-slate-300"
                                        }`}
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            </fieldset>
                            <label className="block">
                              <span className="mb-2 block text-sm font-bold text-[#08162d]">
                                Your review
                              </span>
                              <textarea
                                className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#08162d] outline-none transition focus:border-[#e96a32] focus:bg-white focus:ring-4 focus:ring-[#e96a32]/10"
                                maxLength={1200}
                                minLength={2}
                                onChange={(event) =>
                                  setReviewComment(event.target.value)
                                }
                                placeholder="Share your experience with this equipment rental."
                                required
                                value={reviewComment}
                              />
                              <span className="mt-1 block text-right text-xs text-slate-400">
                                {reviewComment.length}/1200
                              </span>
                            </label>
                            {reviewError && (
                              <p className="text-sm font-semibold text-red-700" role="alert">
                                {reviewError}
                              </p>
                            )}
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                className="rounded-lg px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
                                onClick={() => {
                                  setReviewBookingId(null);
                                  setReviewError(null);
                                }}
                                type="button"
                              >
                                Cancel
                              </button>
                              <button
                                className="inline-flex items-center gap-2 rounded-lg bg-[#08162d] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#10294c] disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={
                                  isSubmittingReview ||
                                  reviewComment.trim().length < 2
                                }
                                type="submit"
                              >
                                <Send aria-hidden="true" className="size-3.5" />
                                {isSubmittingReview
                                  ? "Publishing..."
                                  : "Publish review"}
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <nav
              aria-label="Booking history pages"
              className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3"
            >
              <p aria-live="polite" className="text-xs font-semibold text-slate-500">
                Showing {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filteredItems.length)} of{" "}
                {filteredItems.length} bookings
              </p>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Previous bookings page"
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#08162d] transition hover:border-[#e96a32] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </button>
                <span className="min-w-20 text-center text-xs font-bold text-slate-600">
                  Page {page} of {pageCount}
                </span>
                <button
                  aria-label="Next bookings page"
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#08162d] transition hover:border-[#e96a32] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={page >= pageCount}
                  onClick={() =>
                    setPage((current) => Math.min(pageCount, current + 1))
                  }
                  type="button"
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
