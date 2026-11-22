"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Heart,
  LoaderCircle,
  MapPin,
  Search,
  Trash2,
} from "lucide-react";
import { dashboardRequest } from "@/lib/dashboard-api";
import { DashboardDataSkeleton } from "@/components/ui/dashboard-data-skeleton";
import { useDashboard } from "../dashboard-context";

type FavoriteEquipment = {
  id: string;
  name: string;
  category: string;
  location: string;
  dailyRate: number;
  image: string;
  favoritedAt?: string;
};

type FavoritesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: FavoriteEquipment[] };

function isFavoriteEquipment(value: unknown): value is FavoriteEquipment {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "category" in value &&
    typeof value.category === "string" &&
    "location" in value &&
    typeof value.location === "string" &&
    "dailyRate" in value &&
    typeof value.dailyRate === "number" &&
    "image" in value &&
    typeof value.image === "string" &&
    (!("favoritedAt" in value) ||
      typeof value.favoritedAt === "string" ||
      value.favoritedAt === undefined)
  );
}

function formatRate(rate: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(rate);
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

export default function FavoritesPage() {
  const { accessToken } = useDashboard();
  const [state, setState] = useState<FavoritesState>({ status: "loading" });
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadFavorites() {
      try {
        const payload = await dashboardRequest(
          "/api/favorites",
          accessToken,
          { signal: controller.signal },
        );
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("items" in payload) ||
          !Array.isArray(payload.items) ||
          !payload.items.every(isFavoriteEquipment)
        ) {
          throw new Error("The favorites service returned invalid equipment data.");
        }
        setState({ status: "success", items: payload.items });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load your favorites.",
          });
        }
      }
    }

    void loadFavorites();
    return () => controller.abort();
  }, [accessToken]);

  const filteredItems =
    state.status === "success"
      ? state.items.filter((item) =>
          `${item.name} ${item.category} ${item.location}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
        )
      : [];

  async function removeFavorite(equipmentId: string) {
    setRemovingId(equipmentId);
    setActionError(null);
    try {
      await dashboardRequest(
        `/api/favorites/${encodeURIComponent(equipmentId)}`,
        accessToken,
        { method: "DELETE" },
      );
      setState((current) =>
        current.status === "success"
          ? {
              status: "success",
              items: current.items.filter((item) => item.id !== equipmentId),
            }
          : current,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not remove this favorite.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#c94f1c]">
            Keep your shortlist close
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#08162d] sm:text-3xl">
            Favorites
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Equipment you have saved for a future project.
          </p>
        </div>
        {state.status === "success" && (
          <span className="rounded-full bg-[#fff4d8] px-3 py-1.5 text-xs font-extrabold text-[#8b4816]">
            {filteredItems.length === state.items.length
              ? `${state.items.length} saved`
              : `${filteredItems.length} of ${state.items.length} saved`}
          </span>
        )}
      </div>

      {actionError && (
        <p
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
          role="alert"
        >
          {actionError}
        </p>
      )}
      {state.status === "loading" && (
        <DashboardDataSkeleton label="Loading your favorites..." />
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
        <label className="relative mt-6 block sm:max-w-sm">
          <span className="sr-only">Search favorites</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-[#08162d] outline-none transition focus:border-[#e96a32] focus:bg-white focus:ring-4 focus:ring-[#e96a32]/10"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, category, or location"
            type="search"
            value={search}
          />
        </label>
      )}
      {state.status === "success" && state.items.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#fff4d8] text-[#c94f1c]">
            <Heart aria-hidden="true" className="size-6" />
          </span>
          <h3 className="mt-4 text-lg font-extrabold text-[#08162d]">
            Your shortlist is waiting
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Save equipment from its details page and it will be ready for you
            here.
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
              No saved equipment matches that search
            </p>
            <button
              className="mt-2 text-sm font-bold text-[#c94f1c] underline underline-offset-4"
              onClick={() => setSearch("")}
              type="button"
            >
              Clear search
            </button>
          </div>
        )}
      {state.status === "success" && filteredItems.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="dashboard-data-table w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-[#08162d] text-xs uppercase tracking-wide text-white/80">
                <tr>
                  <th className="px-4 py-4 font-extrabold">Equipment</th>
                  <th className="px-4 py-4 font-extrabold">Location</th>
                  <th className="px-4 py-4 font-extrabold">Rental Price</th>
                  <th className="px-4 py-4 font-extrabold">Saved On</th>
                  <th className="px-4 py-4 font-extrabold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredItems.map((item) => (
                  <tr className="transition-colors hover:bg-slate-50" key={item.id}>
                    <td className="px-4 py-4">
                      <div className="flex min-w-56 items-center gap-3">
                        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-[#c94f1c]">
                          {item.image ? (
                            <Image
                              alt=""
                              className="size-full object-cover"
                              height={48}
                              src={item.image}
                              unoptimized
                              width={48}
                            />
                          ) : (
                            <Heart aria-hidden="true" className="size-5" />
                          )}
                        </span>
                        <span>
                          <span className="block font-extrabold text-[#08162d]">
                            {item.name}
                          </span>
                          <span className="mt-1 block text-xs font-semibold text-slate-500">
                            {item.category}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin aria-hidden="true" className="size-4 text-[#c94f1c]" />
                        {item.location}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-extrabold text-[#08162d]">
                      {formatRate(item.dailyRate)}
                      <span className="ml-1 text-xs font-semibold text-slate-500">
                        / day
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {formatDate(item.favoritedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#08162d] px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#10294c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                          href={`/equipment/${encodeURIComponent(item.id)}`}
                        >
                          View Details
                          <ArrowUpRight aria-hidden="true" className="size-3.5" />
                        </Link>
                        <button
                          aria-label={`Remove ${item.name} from favorites`}
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-wait disabled:opacity-50"
                          disabled={removingId === item.id}
                          onClick={() => void removeFavorite(item.id)}
                          type="button"
                        >
                          {removingId === item.id ? (
                            <LoaderCircle
                              aria-hidden="true"
                              className="size-4 animate-spin"
                            />
                          ) : (
                            <Trash2 aria-hidden="true" className="size-4" />
                          )}
                        </button>
                      </div>
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
