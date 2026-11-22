"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  LoaderCircle,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { dashboardRequest } from "@/lib/dashboard-api";
import { DashboardDataSkeleton } from "@/components/ui/dashboard-data-skeleton";
import { useDashboard } from "../dashboard-context";
import {
  parseOwnerEquipment,
  type OwnerEquipment,
} from "../owner-equipment-types";

type EquipmentState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: OwnerEquipment[] };

function parseEquipmentList(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("items" in payload) ||
    !Array.isArray(payload.items)
  ) {
    return null;
  }
  const items = payload.items.map(parseOwnerEquipment);
  return items.every(
    (item): item is OwnerEquipment => item !== null,
  )
    ? items
    : null;
}

function formatCurrency(amount: number, rentalType: string) {
  const formatted = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} / ${rentalType}`;
}

const statusClassNames = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
};

export default function MyEquipmentClient() {
  const { accessToken } = useDashboard();
  const [state, setState] = useState<EquipmentState>({ status: "loading" });
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadEquipment() {
      try {
        const payload = await dashboardRequest("/api/equipment/mine", accessToken, {
          signal: controller.signal,
        });
        const items = parseEquipmentList(payload);
        if (!items) {
          throw new Error("The equipment service returned invalid listing data.");
        }
        setState({ status: "success", items });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load your equipment.",
          });
        }
      }
    }

    void loadEquipment();
    return () => controller.abort();
  }, [accessToken, refreshKey]);

  const filteredItems = useMemo(() => {
    if (state.status !== "success") {
      return [];
    }
    const normalizedSearch = search.trim().toLowerCase();
    return state.items.filter(
      (item) =>
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        item.location.toLowerCase().includes(normalizedSearch),
    );
  }, [search, state]);

  async function deleteEquipment(item: OwnerEquipment) {
    if (
      !window.confirm(
        `Delete "${item.name}"? This cannot be undone. Equipment with an active rental cannot be deleted.`,
      )
    ) {
      return;
    }

    setActionError(null);
    setDeletingId(item.id);
    try {
      await dashboardRequest(
        `/api/equipment/${encodeURIComponent(item.id)}`,
        accessToken,
        { method: "DELETE" },
      );
      setState((current) =>
        current.status === "success"
          ? {
              ...current,
              items: current.items.filter(
                (equipment) => equipment.id !== item.id,
              ),
            }
          : current,
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not delete this listing.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c94f1c]">
            Owner workspace
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[#08162d]">
            My Equipment
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage your listings, availability, and approval status.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#08162d] px-4 text-sm font-extrabold text-white transition hover:bg-[#10294c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
          href="/dashboard/equipment/new"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add equipment
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Search my equipment</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#e96a32] focus:ring-4 focus:ring-[#e96a32]/10"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, category, or location"
            type="search"
            value={search}
          />
        </label>
        {state.status === "success" && (
          <p className="text-xs font-bold text-slate-500">
            {filteredItems.length} of {state.items.length} listings
          </p>
        )}
      </div>

      {actionError && (
        <p
          aria-live="polite"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
          role="alert"
        >
          {actionError}
        </p>
      )}

      {state.status === "loading" && (
        <DashboardDataSkeleton label="Loading your listings..." />
      )}
      {state.status === "error" && (
        <div
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800"
          role="alert"
        >
          <p>Could not load your equipment: {state.message}</p>
          <button
            className="mt-3 font-extrabold underline underline-offset-4"
            onClick={() => setRefreshKey((current) => current + 1)}
            type="button"
          >
            Try again
          </button>
        </div>
      )}
      {state.status === "success" && filteredItems.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#fff4d8] text-[#c94f1c]">
            <PackageOpen aria-hidden="true" className="size-6" />
          </span>
          <h3 className="mt-4 text-lg font-black text-[#08162d]">
            {search ? "No matching equipment" : "Your inventory starts here"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {search
              ? "Try another name, category, or location."
              : "Add your first listing to make your equipment available for review."}
          </p>
          {!search && (
            <Link
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#e96a32] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#d85b26] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08162d]"
              href="/dashboard/equipment/new"
            >
              <Plus aria-hidden="true" className="size-4" />
              Add your first listing
            </Link>
          )}
        </div>
      )}
      {state.status === "success" && filteredItems.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="dashboard-data-table w-full min-w-[850px] text-left">
              <thead className="bg-[#f7f9fc] text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Equipment name</th>
                  <th className="px-5 py-4">Rental price</th>
                  <th className="px-5 py-4">Available quantity</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr className="align-middle" key={item.id}>
                    <td className="px-5 py-4">
                      <div className="flex min-w-56 items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          <Image
                            alt=""
                            className="object-cover"
                            fill
                            sizes="48px"
                            src={item.image}
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[#08162d]">
                            {item.name}
                          </p>
                          <p className="mt-1 truncate text-xs font-medium text-slate-500">
                            {item.category} · {item.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-[#08162d]">
                      {formatCurrency(item.rentalPrice, item.rentalType)}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-extrabold capitalize ${statusClassNames[item.approvalStatus]}`}
                      >
                        {item.approvalStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          aria-label={`View ${item.name} details`}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#eefaf7] hover:text-[#087e78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                          href={`/dashboard/equipment/${encodeURIComponent(item.id)}`}
                          title="View details"
                        >
                          <ArrowUpRight aria-hidden="true" className="size-4" />
                        </Link>
                        <Link
                          aria-label={`Update ${item.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#fff4d8] hover:text-[#c94f1c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32]"
                          href={`/dashboard/equipment/${encodeURIComponent(item.id)}/edit`}
                          title="Update"
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                        </Link>
                        <button
                          aria-label={`Delete ${item.name}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32] disabled:cursor-wait disabled:opacity-50"
                          disabled={deletingId === item.id}
                          onClick={() => void deleteEquipment(item)}
                          title="Delete"
                          type="button"
                        >
                          {deletingId === item.id ? (
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
