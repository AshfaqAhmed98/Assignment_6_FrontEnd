"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Search,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { DashboardDataSkeleton } from "@/components/ui/dashboard-data-skeleton";
import {
  AuthAccessTokenError,
  requestAuthAccessToken,
} from "@/lib/auth-token";
import { apiBaseUrl, dashboardRequest } from "@/lib/dashboard-api";
import { fetchWithRetry } from "@/lib/public-api";
import {
  isFeaturedEquipment,
  type FeaturedEquipment,
} from "@/data/featured-equipment";

type RentalType = "daily" | "weekly" | "monthly";
type SortOption =
  | "recently-added"
  | "price-low-to-high"
  | "price-high-to-low";
type EquipmentListingItem = FeaturedEquipment & {
  rentalRate: number;
  rentalType: RentalType;
  totalQuantity: number;
  availableQuantity: number;
  availabilityStatus: "available" | "unavailable";
};
type ListingState = {
  status: "loading" | "success" | "error";
  items: EquipmentListingItem[];
  categories: string[];
  total: number;
  page: number;
  pageSize: number;
  message: string | null;
};
type DropdownOption = {
  label: string;
  value: string;
};

function isRentalType(value: string): value is RentalType {
  return value === "daily" || value === "weekly" || value === "monthly";
}

function adjustPriceByHundred(value: string, adjustment: -1 | 1): string {
  if (value === "") {
    return adjustment > 0 ? "100" : value;
  }

  const price = Number(value);
  return Number.isFinite(price)
    ? String(Math.max(0, price + adjustment * 100))
    : value;
}

function isSortOption(value: string): value is SortOption {
  return (
    value === "recently-added" ||
    value === "price-low-to-high" ||
    value === "price-high-to-low"
  );
}

function isEquipmentListingItem(value: unknown): value is EquipmentListingItem {
  return (
    isFeaturedEquipment(value) &&
    "rentalRate" in value &&
    typeof value.rentalRate === "number" &&
    "rentalType" in value &&
    typeof value.rentalType === "string" &&
    ["daily", "weekly", "monthly"].includes(value.rentalType) &&
    "totalQuantity" in value &&
    typeof value.totalQuantity === "number" &&
    Number.isInteger(value.totalQuantity) &&
    "availableQuantity" in value &&
    typeof value.availableQuantity === "number" &&
    Number.isInteger(value.availableQuantity) &&
    "availabilityStatus" in value &&
    (value.availabilityStatus === "available" ||
      value.availabilityStatus === "unavailable")
  );
}

function isListingResponse(
  value: unknown,
): value is {
  items: EquipmentListingItem[];
  categories: string[];
  total: number;
  page: number;
  pageSize: number;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "items" in value &&
    Array.isArray(value.items) &&
    value.items.every(isEquipmentListingItem) &&
    "categories" in value &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => typeof category === "string") &&
    "total" in value &&
    typeof value.total === "number" &&
    Number.isInteger(value.total) &&
    "page" in value &&
    typeof value.page === "number" &&
    Number.isInteger(value.page) &&
    "pageSize" in value &&
    typeof value.pageSize === "number" &&
    Number.isInteger(value.pageSize)
  );
}

function isFavoriteEquipment(value: unknown): value is { id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  );
}

function isFavoriteEquipmentResponse(
  value: unknown,
): value is { items: { id: string }[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "items" in value &&
    Array.isArray(value.items) &&
    value.items.every(isFavoriteEquipment)
  );
}

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

function getUserRole(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("user" in payload) ||
    typeof payload.user !== "object" ||
    payload.user === null ||
    !("role" in payload.user) ||
    typeof payload.user.role !== "string"
  ) {
    return null;
  }

  return payload.user.role;
}

function AnimatedDropdown({
  id,
  label,
  value,
  options,
  open,
  onChange,
  onOpenChange,
}: {
  id: string;
  label: string;
  value: string;
  options: DropdownOption[];
  open: boolean;
  onChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = options[selectedIndex] ?? options[0];
  const [activeIndex, setActiveIndex] = useState(Math.max(0, selectedIndex));

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        onOpenChange(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onOpenChange, open]);

  const selectOption = (option: DropdownOption) => {
    onChange(option.value);
    onOpenChange(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (options.length === 0) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setActiveIndex(Math.max(0, selectedIndex));
        onOpenChange(true);
        return;
      }

      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (index) => (index + direction + options.length) % options.length,
      );
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : options.length - 1);
      onOpenChange(true);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        const activeOption = options[activeIndex];
        if (activeOption) {
          selectOption(activeOption);
        }
      } else {
        setActiveIndex(Math.max(0, selectedIndex));
        onOpenChange(true);
      }
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      onOpenChange(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "Tab" && open) {
      onOpenChange(false);
    }
  };

  return (
    <div
      className={`relative min-w-0 ${open ? "z-40" : "z-0"}`}
      ref={containerRef}
    >
      <label
        className="text-xs font-bold uppercase tracking-wide text-slate-500"
        htmlFor={`${id}-trigger`}
        id={`${id}-label`}
      >
        {label}
      </label>
      <button
        aria-activedescendant={
          open ? `${id}-option-${activeIndex}` : undefined
        }
        aria-controls={open ? `${id}-listbox` : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label ${id}-value`}
        className="mt-2 flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm font-semibold normal-case tracking-normal text-[#122035] transition-[border-color,box-shadow] focus-visible:border-[#087e78] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#087e78]/10"
        id={`${id}-trigger`}
        onClick={() => {
          if (!open) {
            setActiveIndex(Math.max(0, selectedIndex));
          }
          onOpenChange(!open);
        }}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span className="truncate" id={`${id}-value`}>
          {selectedOption?.label ?? value}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-slate-500 transition-transform duration-300 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            aria-labelledby={`${id}-label`}
            className="equipment-filter-dropdown-list absolute left-0 right-0 top-full z-50 mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-[0_16px_40px_-18px_rgba(8,22,45,0.45)]"
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scaleY: 0.97, y: -6 }
            }
            id={`${id}-listbox`}
            initial={
              reduceMotion
                ? false
                : { opacity: 0, scaleY: 0.96, y: -8 }
            }
            role="listbox"
            style={{ transformOrigin: "top" }}
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {options.map((option, index) => (
              <motion.li
                animate={{ opacity: 1, x: 0 }}
                aria-selected={value === option.value}
                className={`flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeIndex === index
                    ? "bg-[#fff4d6] text-[#08162d]"
                    : "text-slate-700 hover:bg-[#fff8e7] hover:text-[#c94f1c]"
                }`}
                exit={
                  reduceMotion ? { opacity: 0 } : { opacity: 0, x: -4 }
                }
                id={`${id}-option-${index}`}
                key={option.value}
                onClick={() => selectOption(option)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                transition={{
                  delay: reduceMotion ? 0 : index * 0.025,
                  duration: reduceMotion ? 0 : 0.18,
                }}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check
                    aria-hidden="true"
                    className="size-4 shrink-0 text-[#087e78]"
                  />
                )}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EquipmentListClient() {
  const reduceMotion = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll();
  const heroArtY = useTransform(scrollYProgress, [0, 0.35], [0, 96]);
  const heroArtRotate = useTransform(scrollYProgress, [0, 0.35], [0, 18]);
  const equipmentGridRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [rentalType, setRentalType] = useState<RentalType>("daily");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOption>("recently-added");
  const [page, setPage] = useState(1);
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(
    null,
  );
  const [state, setState] = useState<ListingState>({
    status: "loading",
    items: [],
    categories: [],
    total: 0,
    page: 1,
    pageSize: 12,
    message: null,
  });
  const [favoriteAccessToken, setFavoriteAccessToken] = useState<string | null>(
    null,
  );
  const [favoriteIds, setFavoriteIds] = useState<Set<string> | null>(null);
  const [favoriteActionId, setFavoriteActionId] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const params = new URLSearchParams({
        rentalType,
        availability: "available",
        sort,
        page: String(page),
        pageSize: "12",
      });
      if (search.trim()) params.set("search", search.trim());
      if (category) params.set("category", category);
      if (minPrice !== "") params.set("minPrice", minPrice);
      if (maxPrice !== "") params.set("maxPrice", maxPrice);

      setState((current) => ({
        ...current,
        status: "loading",
        message: null,
      }));

      try {
        const response = await fetchWithRetry(
          `${apiBaseUrl}/api/equipment?${params.toString()}`,
          { signal: controller.signal },
        );
        const payload: unknown = await response.json();

        if (!response.ok) {
          throw new Error(
            getResponseMessage(
              payload,
              `Could not load equipment (HTTP ${response.status}).`,
            ),
          );
        }
        if (!isListingResponse(payload)) {
          throw new Error("The equipment API returned an invalid response.");
        }

        setState({
          status: "success",
          items: payload.items,
          categories: payload.categories,
          total: payload.total,
          page: payload.page,
          pageSize: payload.pageSize,
          message: null,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState((current) => ({
            ...current,
            status: "error",
            items: [],
            total: 0,
            message:
              error instanceof Error
                ? error.message
                : "Could not load equipment.",
          }));
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    search,
    category,
    rentalType,
    minPrice,
    maxPrice,
    sort,
    page,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFavoriteState() {
      try {
        const sessionResponse = await fetch(
          `${apiBaseUrl}/api/auth/get-session`,
          {
            credentials: "include",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );
        if (sessionResponse.status === 401) {
          return;
        }
        if (!sessionResponse.ok) {
          throw new Error("Could not verify your account.");
        }

        let sessionPayload: unknown;
        try {
          sessionPayload = await sessionResponse.json();
        } catch {
          throw new Error("The authentication server returned an invalid session.");
        }
        if (getUserRole(sessionPayload) !== "Customer") {
          return;
        }

        const accessToken = await requestAuthAccessToken(
          apiBaseUrl,
          controller.signal,
        );
        const payload = await dashboardRequest("/api/favorites", accessToken, {
          signal: controller.signal,
        });
        if (!isFavoriteEquipmentResponse(payload)) {
          throw new Error("The favorites service returned invalid equipment data.");
        }

        if (!controller.signal.aborted) {
          setFavoriteAccessToken(accessToken);
          setFavoriteIds(new Set(payload.items.map((item) => item.id)));
        }
      } catch (error) {
        if (
          !controller.signal.aborted &&
          !(error instanceof AuthAccessTokenError && error.status === 401)
        ) {
          setFavoriteError(
            error instanceof Error
              ? error.message
              : "Could not load your favorites.",
          );
        }
      }
    }

    void loadFavoriteState();
    const clearFavoriteState = () => {
      controller.abort();
      setFavoriteAccessToken(null);
      setFavoriteIds(null);
      setFavoriteActionId(null);
      setFavoriteError(null);
    };
    window.addEventListener("gearrent:auth-changed", clearFavoriteState);

    return () => {
      controller.abort();
      window.removeEventListener("gearrent:auth-changed", clearFavoriteState);
    };
  }, []);

  async function toggleFavorite(itemId: string) {
    if (!favoriteAccessToken || !favoriteIds || favoriteActionId) {
      return;
    }

    const wasFavorite = favoriteIds.has(itemId);
    setFavoriteActionId(itemId);
    setFavoriteError(null);
    try {
      await dashboardRequest(
        `/api/favorites/${encodeURIComponent(itemId)}`,
        favoriteAccessToken,
        { method: wasFavorite ? "DELETE" : "POST" },
      );
      setFavoriteIds((current) => {
        if (!current) {
          return current;
        }
        const next = new Set(current);
        if (wasFavorite) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }
        return next;
      });
    } catch (error) {
      setFavoriteError(
        error instanceof Error
          ? error.message
          : "Could not update your favorites.",
      );
    } finally {
      setFavoriteActionId(null);
    }
  }

  const pageCount = Math.max(1, Math.ceil(state.total / state.pageSize));

  function changePage(nextPage: number) {
    setPage(nextPage);
    equipmentGridRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#122035]">
      <motion.div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-[#75d6c3] via-[#ffc45b] to-[#e96a32]"
        style={{ scaleX: reduceMotion ? 0 : scrollYProgress }}
      />
      <Navbar />
      <section className="relative isolate overflow-hidden bg-[#08162d] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:56px_56px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-48 size-[34rem] rounded-full bg-[#e96a32]/20 blur-[120px]"
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-24 hidden size-80 rounded-full border border-white/10 lg:block"
          style={{
            y: reduceMotion ? 0 : heroArtY,
            rotate: reduceMotion ? 0 : heroArtRotate,
          }}
        >
          <div className="absolute inset-5 rounded-full border border-dashed border-[#75d6c3]/25" />
          <div className="absolute inset-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,196,91,0.34),rgba(233,106,50,0.04)_62%,transparent_70%)]" />
          <span className="absolute left-7 top-16 size-3 rounded-full bg-[#75d6c3] shadow-[0_0_22px_#75d6c3]" />
          <span className="absolute bottom-14 right-9 size-2 rounded-full bg-[#ffc45b] shadow-[0_0_18px_#ffc45b]" />
        </motion.div>
        <div className="relative mx-auto max-w-7xl px-4 pb-36 pt-32 sm:px-6 sm:pb-40 lg:px-8">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            transition={{ duration: reduceMotion ? 0 : 0.65, ease: "easeOut" }}
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#75d6c3]">
              Find the right gear
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
              All Equipment
            </h1>
            <motion.div
              aria-hidden="true"
              animate={{ scaleX: 1 }}
              className="mt-4 h-1 w-20 origin-left rounded-full bg-gradient-to-r from-[#75d6c3] to-[#ffc45b]"
              initial={reduceMotion ? false : { scaleX: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.55,
                delay: reduceMotion ? 0 : 0.25,
              }}
            />
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
              Search approved equipment and compare rental rates, location, and
              availability.
            </p>
          </motion.div>
        </div>
      </section>

      <main className="relative mx-auto -mt-28 max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <motion.section
          aria-label="Equipment search and filters"
          className="rounded-3xl border border-white/80 bg-white p-5 shadow-[0_30px_90px_-45px_rgba(8,22,45,0.4)] sm:p-8"
          initial={reduceMotion ? false : { opacity: 0, y: 32 }}
          transition={{ duration: reduceMotion ? 0 : 0.65, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.08 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(240px,1.4fr)_repeat(3,minmax(130px,1fr))]">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 lg:col-span-2">
              Search equipment
              <span className="equipment-search-input-shell relative z-0 mt-2 block transition-transform duration-300 ease-in-out">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  className="equipment-search-input h-12 w-full rounded-[15px] border-0 bg-[#ccc] p-4 pl-11 text-sm font-medium normal-case tracking-normal text-[#122035] shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)] outline-none transition duration-300 ease-in-out placeholder:text-slate-500"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Title, category, or location"
                  type="search"
                  value={search}
                />
              </span>
            </label>

            <AnimatedDropdown
              id="category-filter"
              label="Category"
              onChange={(value) => {
                setCategory(value);
                setPage(1);
              }}
              onOpenChange={(open) =>
                setOpenFilterDropdown(open ? "category-filter" : null)
              }
              open={openFilterDropdown === "category-filter"}
              options={[
                { label: "All categories", value: "" },
                ...state.categories.map((itemCategory) => ({
                  label: itemCategory,
                  value: itemCategory,
                })),
              ]}
              value={category}
            />

            <AnimatedDropdown
              id="rental-type-filter"
              label="Rental type"
              onChange={(value) => {
                if (isRentalType(value)) {
                  setRentalType(value);
                  setPage(1);
                }
              }}
              onOpenChange={(open) =>
                setOpenFilterDropdown(open ? "rental-type-filter" : null)
              }
              open={openFilterDropdown === "rental-type-filter"}
              options={[
                { label: "Daily", value: "daily" },
                { label: "Weekly", value: "weekly" },
                { label: "Monthly", value: "monthly" },
              ]}
              value={rentalType}
            />

            <fieldset className="lg:col-span-2">
              <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Price range (BDT)
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="sr-only" htmlFor="equipment-min-price">
                  Minimum price
                </label>
                <span className="equipment-search-input-shell relative z-0 block min-w-0 transition-transform duration-300 ease-in-out">
                  <input
                    className="equipment-search-input h-12 w-full min-w-0 rounded-[15px] border-0 bg-[#ccc] p-4 pr-10 text-sm font-semibold text-[#122035] shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)] outline-none transition duration-300 ease-in-out"
                    id="equipment-min-price"
                    min="0"
                    onChange={(event) => {
                      setMinPrice(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Min"
                    step="100"
                    type="number"
                    value={minPrice}
                  />
                  <span className="equipment-price-stepper absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col overflow-hidden">
                    <button
                      aria-label="Increase minimum price"
                      className="equipment-price-stepper-button"
                      onClick={() => {
                        setMinPrice((value) => adjustPriceByHundred(value, 1));
                        setPage(1);
                      }}
                      type="button"
                    >
                      <ArrowUp aria-hidden="true" className="size-3" />
                    </button>
                    <button
                      aria-label="Decrease minimum price"
                      className="equipment-price-stepper-button"
                      onClick={() => {
                        setMinPrice((value) => adjustPriceByHundred(value, -1));
                        setPage(1);
                      }}
                      type="button"
                    >
                      <ArrowDown aria-hidden="true" className="size-3" />
                    </button>
                  </span>
                </span>
                <label className="sr-only" htmlFor="equipment-max-price">
                  Maximum price
                </label>
                <span className="equipment-search-input-shell relative z-0 block min-w-0 transition-transform duration-300 ease-in-out">
                  <input
                    className="equipment-search-input h-12 w-full min-w-0 rounded-[15px] border-0 bg-[#ccc] p-4 pr-10 text-sm font-semibold text-[#122035] shadow-[inset_2px_5px_10px_rgba(0,0,0,0.3)] outline-none transition duration-300 ease-in-out"
                    id="equipment-max-price"
                    min="0"
                    onChange={(event) => {
                      setMaxPrice(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Max"
                    step="100"
                    type="number"
                    value={maxPrice}
                  />
                  <span className="equipment-price-stepper absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col overflow-hidden">
                    <button
                      aria-label="Increase maximum price"
                      className="equipment-price-stepper-button"
                      onClick={() => {
                        setMaxPrice((value) => adjustPriceByHundred(value, 1));
                        setPage(1);
                      }}
                      type="button"
                    >
                      <ArrowUp aria-hidden="true" className="size-3" />
                    </button>
                    <button
                      aria-label="Decrease maximum price"
                      className="equipment-price-stepper-button"
                      onClick={() => {
                        setMaxPrice((value) => adjustPriceByHundred(value, -1));
                        setPage(1);
                      }}
                      type="button"
                    >
                      <ArrowDown aria-hidden="true" className="size-3" />
                    </button>
                  </span>
                </span>
              </div>
            </fieldset>

            <AnimatedDropdown
              id="sort-filter"
              label="Sort by"
              onChange={(value) => {
                if (isSortOption(value)) {
                  setSort(value);
                  setPage(1);
                }
              }}
              onOpenChange={(open) =>
                setOpenFilterDropdown(open ? "sort-filter" : null)
              }
              open={openFilterDropdown === "sort-filter"}
              options={[
                { label: "Recently added", value: "recently-added" },
                { label: "Price: low to high", value: "price-low-to-high" },
                { label: "Price: high to low", value: "price-high-to-low" },
              ]}
              value={sort}
            />
          </div>

          <motion.div
            className="mt-7 flex min-h-8 flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"
            initial={reduceMotion ? false : { opacity: 0, x: -18 }}
            transition={{ duration: reduceMotion ? 0 : 0.4 }}
            viewport={{ once: false, amount: 0.5 }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <p aria-live="polite" className="text-sm font-bold text-[#08162d]">
              {state.status === "loading"
                ? "Updating equipment..."
                : `${state.total} ${state.total === 1 ? "equipment item" : "equipment items"}`}
            </p>
            <p className="text-xs text-slate-500">
              Only equipment available today is shown · Rental prices per{" "}
              {rentalType === "daily"
                ? "day"
                : rentalType === "weekly"
                  ? "week"
                  : "month"}
            </p>
          </motion.div>

          {state.status === "error" && (
            <p
              aria-live="assertive"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {state.message}
            </p>
          )}

          {favoriteError && (
            <p
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {favoriteError}
            </p>
          )}

          {state.status === "loading" && state.items.length === 0 && (
            <DashboardDataSkeleton
              label="Loading approved equipment..."
              variant="equipment"
            />
          )}

          {state.status === "success" && state.items.length === 0 && (
            <motion.div
              className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-[#f8fafc] px-5 py-14 text-center"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
              viewport={{ once: false, amount: 0.25 }}
              whileInView={{ opacity: 1, scale: 1 }}
            >
              <PackageCheck
                aria-hidden="true"
                className="mx-auto size-9 text-slate-400"
              />
              <h2 className="mt-4 text-lg font-bold text-[#08162d]">
                No equipment matches those filters
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or widening the price range.
              </p>
            </motion.div>
          )}

          {state.items.length > 0 && (
            <div
              aria-busy={state.status === "loading"}
              className="mt-5 grid auto-rows-fr scroll-mt-24 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              ref={equipmentGridRef}
            >
              <AnimatePresence mode="popLayout">
                {state.items.map((item, index) => (
                  <motion.article
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_35px_-24px_rgba(8,22,45,0.4)] transition-shadow duration-300 hover:shadow-[0_20px_45px_-24px_rgba(8,22,45,0.42)]"
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 18, scale: 0.97 }
                    }
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, y: 32, scale: 0.97 }
                    }
                    key={item.id}
                    layout
                    transition={{
                      duration: reduceMotion ? 0 : 0.48,
                      delay: reduceMotion ? 0 : (index % 3) * 0.09,
                      ease: "easeOut",
                    }}
                    viewport={{ once: false, amount: 0.18 }}
                    whileHover={
                      reduceMotion ? undefined : { y: -7, scale: 1.015 }
                    }
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  >
                    <div className="relative h-56 overflow-hidden bg-slate-100">
                      <Image
                        alt={item.name}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        src={item.image}
                      />
                      <span className="absolute left-4 top-4 max-w-[65%] truncate rounded-full bg-[#08162d]/85 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                        {item.category}
                      </span>
                      <span className="absolute right-4 top-4 rounded-full bg-[#e6f8f2]/95 px-3 py-1.5 text-xs font-bold text-[#087e61] shadow-sm backdrop-blur">
                        Available today
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="min-h-14 line-clamp-2 text-xl font-black leading-snug text-[#08162d]">
                        {item.name}
                      </h2>
                      <p className="mt-3 flex min-h-5 items-center gap-2 text-sm text-slate-500">
                        <MapPin
                          aria-hidden="true"
                          className="size-4 shrink-0 text-[#e96a32]"
                        />
                        <span className="truncate">{item.location}</span>
                      </p>
                      <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {item.rentalType} rate
                          <span className="mt-1 block text-2xl font-black normal-case tracking-normal text-[#08162d]">
                            ৳{item.rentalRate.toLocaleString()}
                            <span className="ml-1 text-xs font-semibold text-slate-500">
                              /{" "}
                              {item.rentalType === "daily"
                                ? "day"
                                : item.rentalType === "weekly"
                                  ? "week"
                                  : "month"}
                            </span>
                          </span>
                        </p>
                        <p className="shrink-0 text-right text-xs text-slate-500">
                          {item.availableQuantity} of {item.totalQuantity}
                          <span className="mt-1 block">available today</span>
                        </p>
                      </div>
                      <div className="mt-auto flex items-center gap-2 pt-5">
                        <Link
                          className="gearrent-primary-action group min-w-0 flex-1 whitespace-nowrap"
                          href={`/equipment/${encodeURIComponent(item.id)}`}
                        >
                          View Details
                          <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform group-hover:translate-x-1"
                          />
                        </Link>
                        {favoriteIds !== null && (
                          <button
                            aria-label={
                              favoriteIds.has(item.id)
                                ? `Remove ${item.name} from favorites`
                                : `Add ${item.name} to favorites`
                            }
                            aria-pressed={favoriteIds.has(item.id)}
                            className={`inline-flex size-12 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32] disabled:cursor-wait disabled:opacity-60 ${
                              favoriteIds.has(item.id)
                                ? "border-[#e96a32]/30 bg-[#fff1e9] text-[#c94f1c]"
                                : "border-slate-200 bg-white text-slate-500 hover:border-[#e96a32]/50 hover:bg-[#fff8e7] hover:text-[#c94f1c]"
                            }`}
                            disabled={favoriteActionId !== null}
                            onClick={() => void toggleFavorite(item.id)}
                            type="button"
                          >
                            {favoriteActionId === item.id ? (
                              <LoaderCircle
                                aria-hidden="true"
                                className="size-5 animate-spin"
                              />
                            ) : (
                              <Heart
                                aria-hidden="true"
                                className={`size-5 ${
                                  favoriteIds.has(item.id) ? "fill-current" : ""
                                }`}
                              />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}

          {state.status === "success" && pageCount > 1 && (
            <nav
              aria-label="Equipment pages"
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#122035] transition hover:border-[#e96a32] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => changePage(Math.max(1, page - 1))}
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Previous
              </button>
              <span aria-live="polite" className="text-sm font-semibold text-slate-600">
                Page {page} of {pageCount}
              </span>
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#122035] transition hover:border-[#e96a32] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page >= pageCount}
                onClick={() => changePage(Math.min(pageCount, page + 1))}
                type="button"
              >
                Next
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </nav>
          )}
        </motion.section>
      </main>
      <Footer />
    </div>
  );
}
