"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  MapPin,
  PackageCheck,
  UserRound,
} from "lucide-react";
import {
  BookingModal,
  type RentalType,
} from "@/components/equipment/booking-modal";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import {
  getRentalUnitRateMinor,
  isFeaturedEquipment,
  type FeaturedEquipment as FeaturedEquipmentItem,
} from "@/data/featured-equipment";
import {
  AuthAccessTokenError,
  requestAuthAccessToken,
} from "@/lib/auth-token";

type EquipmentDetailsItem = FeaturedEquipmentItem & {
  totalQuantity: number;
  availableQuantity: number;
  ownerName: string;
  condition: string;
  brand: string;
  model: string;
  rentalTerms: string;
};
type UserRole = "Customer" | "Owner" | "Admin";
type BookingDates = { startDate: string; endDate: string };

type EquipmentDetailsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; item: EquipmentDetailsItem };

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function getResponseMessage(payload: unknown, fallback: string) {
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

function isEquipmentDetails(value: unknown): value is EquipmentDetailsItem {
  return (
    isFeaturedEquipment(value) &&
    "totalQuantity" in value &&
    typeof value.totalQuantity === "number" &&
    Number.isInteger(value.totalQuantity) &&
    "availableQuantity" in value &&
    typeof value.availableQuantity === "number" &&
    Number.isInteger(value.availableQuantity) &&
    "ownerName" in value &&
    typeof value.ownerName === "string" &&
    "condition" in value &&
    typeof value.condition === "string" &&
    "brand" in value &&
    typeof value.brand === "string" &&
    "model" in value &&
    typeof value.model === "string" &&
    "rentalTerms" in value &&
    typeof value.rentalTerms === "string"
  );
}

function getUserRole(payload: unknown): UserRole | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("user" in payload) ||
    typeof payload.user !== "object" ||
    payload.user === null
  ) {
    return null;
  }

  const role =
    "role" in payload.user && typeof payload.user.role === "string"
      ? payload.user.role
      : "Customer";
  if (role === "Customer" || role === "Owner" || role === "Admin") {
    return role;
  }
  return null;
}

function dateInputValue(date: Date) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60 * 1000,
  );
  return localDate.toISOString().slice(0, 10);
}

function formatRate(amountMinor: number) {
  return (amountMinor / 100).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

export default function EquipmentDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<EquipmentDetailsState>({
    status: "loading",
  });
  const [role, setRole] = useState<UserRole | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDates, setBookingDates] = useState<BookingDates | null>(null);
  const [bookingRentalType, setBookingRentalType] =
    useState<RentalType>("daily");

  useEffect(() => {
    const controller = new AbortController();
    const detailsUrl = `/equipment/${encodeURIComponent(id)}`;

    function redirectToLogin() {
      router.replace(`/login?redirect=${encodeURIComponent(detailsUrl)}`);
    }

    async function loadEquipment() {
      try {
        const accessToken = await requestAuthAccessToken(
          apiBaseUrl,
          controller.signal,
        );
        const sessionResponse = await fetch(
          `${apiBaseUrl}/api/auth/get-session`,
          {
            credentials: "include",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );
        let sessionPayload: unknown;
        try {
          sessionPayload = await sessionResponse.json();
        } catch {
          throw new Error("The authentication server returned an invalid session.");
        }
        if (!sessionResponse.ok) {
          throw new Error("Could not verify your account.");
        }

        const sessionRole = getUserRole(sessionPayload);
        if (!sessionRole) {
          redirectToLogin();
          return;
        }
        setRole(sessionRole);
        setAccessToken(accessToken);

        const response = await fetch(
          `${apiBaseUrl}/api/equipment/${encodeURIComponent(id)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          },
        );
        let payload: unknown;

        try {
          payload = await response.json();
        } catch {
          throw new Error("The equipment API returned an invalid response.");
        }

        if (response.status === 401) {
          redirectToLogin();
          return;
        }

        if (!response.ok) {
          throw new Error(
            getResponseMessage(
              payload,
              `Could not load equipment (HTTP ${response.status}).`,
            ),
          );
        }

        if (
          typeof payload !== "object" ||
          payload === null ||
          !("item" in payload) ||
          !isEquipmentDetails(payload.item)
        ) {
          throw new Error("The equipment API returned an invalid item.");
        }

        setState({ status: "success", item: payload.item });

        if (sessionRole === "Customer") {
          try {
            const favoriteResponse = await fetch(
              `${apiBaseUrl}/api/favorites/${encodeURIComponent(id)}`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
                signal: controller.signal,
              },
            );
            let favoritePayload: unknown;
            try {
              favoritePayload = await favoriteResponse.json();
            } catch {
              throw new Error("The favorites service returned an invalid response.");
            }
            if (!favoriteResponse.ok) {
              throw new Error(
                getResponseMessage(
                  favoritePayload,
                  "Could not load favorite status.",
                ),
              );
            }
            if (
              typeof favoritePayload !== "object" ||
              favoritePayload === null ||
              !("isFavorite" in favoritePayload) ||
              typeof favoritePayload.isFavorite !== "boolean"
            ) {
              throw new Error("The favorites service returned invalid status.");
            }
            setIsFavorite(favoritePayload.isFavorite);
          } catch (error) {
            if (!controller.signal.aborted) {
              setFavoriteError(
                error instanceof Error
                  ? error.message
                  : "Could not load favorite status.",
              );
            }
          }
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        if (
          error instanceof AuthAccessTokenError &&
          error.status === 401
        ) {
          redirectToLogin();
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not load this equipment.",
        });
      }
    }

    void loadEquipment();
    return () => controller.abort();
  }, [id, router]);

  async function toggleFavorite() {
    if (role !== "Customer" || !accessToken || isFavoriteLoading) {
      return;
    }

    setFavoriteError(null);
    setIsFavoriteLoading(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/favorites/${encodeURIComponent(id)}`,
        {
          method: isFavorite ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) {
        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          throw new Error("The favorites service returned an invalid response.");
        }
        throw new Error(
          getResponseMessage(payload, "Could not update your favorites."),
        );
      }
      setIsFavorite((current) => !current);
    } catch (error) {
      setFavoriteError(
        error instanceof Error
          ? error.message
          : "Could not update your favorites.",
      );
    } finally {
      setIsFavoriteLoading(false);
    }
  }

  function openBookingModal(rentalType: RentalType = "daily") {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    setBookingRentalType(rentalType);
    setBookingDates({
      startDate: dateInputValue(startDate),
      endDate: dateInputValue(endDate),
    });
    setIsBookingModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#122035]">
      <section className="relative isolate overflow-hidden bg-[#08162d] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:56px_56px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-48 size-[34rem] rounded-full bg-[#e96a32]/20 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-56 left-1/4 size-[30rem] rounded-full bg-[#75d6c3]/10 blur-[120px]"
        />
        <Navbar />
        <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-28 sm:px-6 sm:pb-40 sm:pt-32 lg:px-8">
          <Link
            className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/85 backdrop-blur transition-colors hover:border-[#ffd277]/50 hover:text-[#ffd277] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd277]"
            href="/equipment"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform group-hover:-translate-x-1"
            />
            All equipment
          </Link>
          <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.24em] text-[#75d6c3]">
            GearRent / Equipment
          </p>
          <h2 className="mt-3 max-w-2xl break-words text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl xl:text-6xl">
            Equipment details
          </h2>
        </div>
      </section>

      <main className="relative mx-auto -mt-24 max-w-7xl px-3 pb-16 sm:-mt-28 sm:px-6 sm:pb-20 lg:px-8">
        {state.status === "loading" && (
          <div
            aria-label="Loading equipment details"
            className="grid min-h-[420px] animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:min-h-[560px] sm:rounded-[2rem] lg:grid-cols-2"
            role="status"
          >
            <div className="min-h-64 bg-slate-200 sm:min-h-[480px] lg:min-h-[560px]" />
            <div className="space-y-5 p-4 sm:p-10">
              <div className="h-5 w-28 rounded-full bg-slate-200" />
              <div className="h-12 w-4/5 rounded-xl bg-slate-200" />
              <div className="h-20 rounded-2xl bg-slate-100" />
              <div className="h-32 rounded-2xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-200" />
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div
            aria-live="assertive"
            className="rounded-2xl border border-red-200 bg-white p-5 shadow-xl sm:rounded-3xl sm:p-12"
            role="alert"
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c94f1c]">
              Equipment details
            </p>
            <h1 className="mt-3 text-2xl font-black text-[#08162d]">
              We couldn&apos;t load this equipment
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {state.message}
            </p>
            <Link
              className="gearrent-primary-action mt-6"
              href="/equipment"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to equipment
            </Link>
          </div>
        )}

        {state.status === "success" && (
          <>
            <article className="grid min-w-0 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_36px_100px_-48px_rgba(8,22,45,0.55)] sm:rounded-[2rem] lg:grid-cols-[1.02fr_0.98fr]">
              <div className="group relative min-h-[280px] overflow-hidden bg-[#102139] sm:min-h-[480px] lg:min-h-[650px]">
                <Image
                  alt={state.item.name}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  src={state.item.image}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#08162d]/80 via-[#08162d]/5 to-[#08162d]/15"
                />
                <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md ${
                      state.item.availableQuantity > 0
                        ? "border-[#75d6c3]/30 bg-[#08162d]/75 text-white"
                        : "border-[#fb9060]/40 bg-[#08162d]/80 text-white"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-2 rounded-full ${
                        state.item.availableQuantity > 0
                          ? "bg-[#75d6c3] shadow-[0_0_12px_#75d6c3]"
                          : "bg-[#fb9060]"
                      }`}
                    />
                    {state.item.availableQuantity > 0
                      ? "Available today"
                      : "Unavailable today"}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                      Inventory
                    </p>
                    <p className="mt-1 text-2xl font-black text-white">
                      {state.item.availableQuantity}
                      <span className="ml-2 text-sm font-medium text-white/70">
                        of {state.item.totalQuantity} available
                      </span>
                    </p>
                  </div>
                  <span className="hidden rounded-full border border-white/20 bg-white/10 p-3 text-white backdrop-blur sm:grid">
                    <PackageCheck aria-hidden="true" className="size-5" />
                  </span>
                </div>
              </div>

              <div className="flex min-w-0 flex-col p-4 sm:p-9 lg:p-11">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex min-h-8 items-center rounded-full bg-[#fff1e9] px-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#c94f1c]">
                    {state.item.category}
                  </span>
                  {role === "Customer" && (
                    <button
                      aria-label={
                        isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      aria-pressed={isFavorite}
                      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32] disabled:cursor-wait disabled:opacity-60 ${
                        isFavorite
                          ? "border-[#e96a32]/30 bg-[#fff1e9] text-[#c94f1c]"
                          : "border-slate-200 bg-white text-slate-500 hover:border-[#e96a32]/50 hover:bg-[#fff8e7] hover:text-[#c94f1c]"
                      }`}
                      disabled={isFavoriteLoading}
                      onClick={() => void toggleFavorite()}
                      type="button"
                    >
                      <Heart
                        aria-hidden="true"
                        className={`size-5 ${
                          isFavorite ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                <h1 className="mt-5 break-words text-2xl font-black leading-tight tracking-tight text-[#08162d] sm:text-4xl xl:text-5xl">
                  {state.item.name}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  {state.item.description}
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-4">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#e9f8f5] text-[#087e78]">
                      <MapPin aria-hidden="true" className="size-4" />
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </p>
                    <p className="mt-1 font-bold text-[#122035]">
                      {state.item.location}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-4">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#fff1e9] text-[#c94f1c]">
                      <PackageCheck aria-hidden="true" className="size-4" />
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Available today
                    </p>
                    <p className="mt-1 font-bold text-[#122035]">
                      {state.item.availableQuantity} of{" "}
                      {state.item.totalQuantity} items
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-4 sm:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-[#08162d] text-[#ffd277]">
                        <UserRound aria-hidden="true" className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Owner
                        </p>
                        <p className="mt-0.5 truncate font-bold text-[#122035]">
                          {state.item.ownerName ||
                            "Owner information unavailable"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {(state.item.condition ||
                  state.item.brand ||
                  state.item.model) && (
                  <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-4 sm:grid-cols-3">
                    {[
                      ["Condition", state.item.condition],
                      ["Brand", state.item.brand],
                      ["Model", state.item.model],
                    ]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div key={label}>
                          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#122035]">
                            {value}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
                {state.item.rentalTerms && (
                  <div className="mt-4 rounded-2xl border border-[#f2d89d] bg-[#fff9eb] p-4">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-[#9b4b1f]">
                      Rental terms and conditions
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {state.item.rentalTerms}
                    </p>
                  </div>
                )}

                <section
                  aria-label="Rental rates"
                  className="relative mt-7 overflow-hidden rounded-3xl bg-[#08162d] p-5 text-white sm:p-6"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-24 size-56 rounded-full bg-[#75d6c3]/10 blur-3xl"
                  />
                  <div className="relative">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#75d6c3]">
                          Rental rates
                        </p>
                        <p className="mt-1 text-xs text-white/55">
                          Select a rate to start booking
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-white/55">
                        BDT
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-2 min-[400px]:grid-cols-3 sm:gap-3">
                      <button
                        aria-label={`Book daily at ৳${formatRate(getRentalUnitRateMinor(state.item, "daily"))}`}
                        className="rounded-2xl bg-[#e96a32] p-3 text-left shadow-lg shadow-[#e96a32]/15 transition hover:-translate-y-0.5 hover:bg-[#f17840] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd277] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 sm:p-4"
                        disabled={role !== "Customer" || !accessToken}
                        onClick={() => openBookingModal("daily")}
                        type="button"
                      >
                        <span className="block text-xs font-bold text-white/80">
                          Daily
                        </span>
                        <span className="mt-2 block text-base font-black text-white sm:text-xl">
                          ৳{formatRate(getRentalUnitRateMinor(state.item, "daily"))}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold text-white/75 sm:text-xs">
                          Select rate
                        </span>
                      </button>
                      <button
                        aria-label={`Book weekly at ৳${formatRate(getRentalUnitRateMinor(state.item, "weekly"))}`}
                        className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#75d6c3]/40 hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d6c3] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 sm:p-4"
                        disabled={role !== "Customer" || !accessToken}
                        onClick={() => openBookingModal("weekly")}
                        type="button"
                      >
                        <span className="block text-xs font-bold text-white/60">
                          Weekly
                        </span>
                        <span className="mt-2 block text-base font-black text-white sm:text-xl">
                          ৳
                          {formatRate(getRentalUnitRateMinor(state.item, "weekly"))}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold text-white/55 sm:text-xs">
                          Select rate
                        </span>
                      </button>
                      <button
                        aria-label={`Book monthly at ৳${formatRate(getRentalUnitRateMinor(state.item, "monthly"))}`}
                        className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#75d6c3]/40 hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d6c3] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 sm:p-4"
                        disabled={role !== "Customer" || !accessToken}
                        onClick={() => openBookingModal("monthly")}
                        type="button"
                      >
                        <span className="block text-xs font-bold text-white/60">
                          Monthly
                        </span>
                        <span className="mt-2 block text-base font-black text-white sm:text-xl">
                          ৳
                          {formatRate(getRentalUnitRateMinor(state.item, "monthly"))}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold text-white/55 sm:text-xs">
                          Select rate
                        </span>
                      </button>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-white/55">
                      The listed rate matches the owner’s selected period;
                      other periods are derived proportionally. Partial
                      periods round up.
                    </p>
                  </div>
                </section>

                {favoriteError && (
                  <p
                    aria-live="polite"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="status"
                  >
                    {favoriteError}
                  </p>
                )}

                <button
                  className="gearrent-primary-action gearrent-primary-action--between group mt-6 w-full"
                  disabled={role !== "Customer" || !accessToken}
                  onClick={() => openBookingModal()}
                  type="button"
                >
                  <span>
                    {role === "Customer"
                      ? "Book Equipment"
                      : "Customer account required to book"}
                  </span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-1">
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </span>
                </button>
              </div>
            </article>

            {isBookingModalOpen && accessToken && bookingDates && (
              <BookingModal
                accessToken={accessToken}
                equipment={state.item}
                initialEndDate={bookingDates.endDate}
                initialRentalType={bookingRentalType}
                initialStartDate={bookingDates.startDate}
                onClose={() => setIsBookingModalOpen(false)}
              />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
