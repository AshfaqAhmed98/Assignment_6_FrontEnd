"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  LoaderCircle,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { dashboardRequest } from "@/lib/dashboard-api";
import { useDashboard } from "../dashboard-context";
import {
  parseOwnerEquipment,
  type OwnerEquipment,
} from "../owner-equipment-types";
import {
  AdminEmptyState,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminTableFrame,
  adminTableClassName,
  adminTableHeadClassName,
} from "./admin-ui";

type EquipmentState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: OwnerEquipment[] };

function parseEquipment(payload: unknown): OwnerEquipment[] | null {
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

function formatPrice(item: OwnerEquipment) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(item.rentalPrice);
}

const statusClassNames = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-rose-100 text-rose-900",
};
const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function AdminEquipmentClient() {
  const { accessToken } = useDashboard();
  const [state, setState] = useState<EquipmentState>({ status: "loading" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [retryKey, setRetryKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadEquipment() {
      try {
        const payload = await dashboardRequest(
          "/api/admin/equipment",
          accessToken,
          { signal: controller.signal },
        );
        const items = parseEquipment(payload);
        if (!items) {
          throw new Error("The equipment service returned invalid listing data.");
        }
        if (!controller.signal.aborted) {
          setState({ status: "success", items });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load equipment listings.",
          });
        }
      }
    }

    void loadEquipment();
    return () => controller.abort();
  }, [accessToken, retryKey]);

  const items = useMemo(() => {
    if (state.status !== "success") {
      return [];
    }
    const normalized = search.trim().toLowerCase();
    return state.items.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.approvalStatus === statusFilter;
      const matchesSearch =
        !normalized ||
        `${item.name} ${item.category} ${item.location} ${item.ownerName}`
          .toLowerCase()
          .includes(normalized);
      return matchesStatus && matchesSearch;
    });
  }, [search, state, statusFilter]);
  const pendingCount =
    state.status === "success"
      ? state.items.filter((item) => item.approvalStatus === "pending").length
      : 0;

  async function updateApproval(
    item: OwnerEquipment,
    approvalStatus: "approved" | "rejected",
  ) {
    setBusyId(item.id);
    setActionError(null);
    setActionNotice(null);
    try {
      const payload = await dashboardRequest(
        `/api/equipment/admin/${encodeURIComponent(item.id)}/approval`,
        accessToken,
        {
          method: "PATCH",
          body: JSON.stringify({ approvalStatus }),
        },
      );
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("item" in payload)
      ) {
        throw new Error("The equipment service returned invalid listing data.");
      }
      const updated = parseOwnerEquipment(payload.item);
      if (!updated) {
        throw new Error("The equipment service returned invalid listing data.");
      }
      setState((current) =>
        current.status === "success"
          ? {
              ...current,
              items: current.items.map((row) =>
                row.id === updated.id ? updated : row,
              ),
            }
          : current,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not update this listing's approval status.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function approveAllPending() {
    if (
      state.status !== "success" ||
      pendingCount === 0 ||
      !window.confirm(
        `Approve all ${pendingCount} pending listings across the entire catalog? They will become publicly visible.`,
      )
    ) {
      return;
    }

    setIsApprovingAll(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const payload = await dashboardRequest(
        "/api/equipment/admin/approval/approve-all",
        accessToken,
        { method: "PATCH" },
      );
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("approvedCount" in payload) ||
        typeof payload.approvedCount !== "number" ||
        !Number.isSafeInteger(payload.approvedCount) ||
        payload.approvedCount < 0
      ) {
        throw new Error("The equipment service returned an invalid approval count.");
      }

      setActionNotice(
        `Approved ${payload.approvedCount} pending listing${payload.approvedCount === 1 ? "" : "s"}.`,
      );
      setRetryKey((current) => current + 1);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not approve pending equipment listings.",
      );
    } finally {
      setIsApprovingAll(false);
    }
  }

  async function deleteEquipment(item: OwnerEquipment) {
    if (
      !window.confirm(
        `Delete "${item.name}"? Listings with active checkout or paid rentals cannot be deleted.`,
      )
    ) {
      return;
    }
    setBusyId(item.id);
    setActionError(null);
    setActionNotice(null);
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
              items: current.items.filter((row) => row.id !== item.id),
            }
          : current,
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not delete this listing.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <AdminPageHeader
        description="Review every owner listing, update details, moderate approval status, or remove equipment that has no active rentals."
        eyebrow="Catalog moderation"
        title="All Equipment"
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="relative min-w-56 flex-1 sm:max-w-sm">
          <span className="sr-only">Search equipment and owners</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            className="h-11 w-full rounded-xl border border-[#dde2ef] bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#526ab7] focus:ring-4 focus:ring-[#526ab7]/10"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search equipment, category, owner"
            type="search"
            value={search}
          />
        </label>
        <label className="text-xs font-bold text-slate-600">
          <span className="sr-only">Filter by approval status</span>
          <select
            className="h-11 rounded-xl border border-[#dde2ef] bg-white px-3 text-sm outline-none focus:border-[#526ab7] focus:ring-4 focus:ring-[#526ab7]/10"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        {state.status === "success" && (
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {pendingCount > 0 && (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isApprovingAll || busyId !== null}
                onClick={() => void approveAllPending()}
                type="button"
              >
                {isApprovingAll ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <Check aria-hidden="true" className="size-4" />
                )}
                Approve all pending ({pendingCount})
              </button>
            )}
            <p className="text-xs font-bold text-slate-500">
              {items.length} of {state.items.length} listings
            </p>
          </div>
        )}
      </div>

      {actionError && (
        <p
          aria-live="assertive"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900"
          role="alert"
        >
          {actionError}
        </p>
      )}
      {actionNotice && (
        <p
          aria-live="polite"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
          role="status"
        >
          {actionNotice}
        </p>
      )}
      {state.status === "loading" && (
        <AdminLoading message="Loading equipment listings..." />
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
              ? "Try a different search or approval filter."
              : "Equipment listings submitted by owners will appear here."
          }
          title={state.items.length ? "No matching equipment" : "No listings yet"}
        />
      )}
      {state.status === "success" && items.length > 0 && (
        <AdminTableFrame>
          <table className={adminTableClassName}>
            <thead className={adminTableHeadClassName}>
              <tr>
                <th className="px-4 py-4">Equipment</th>
                <th className="px-4 py-4">Owner</th>
                <th className="px-4 py-4">Price</th>
                <th className="px-4 py-4">Quantity</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr className="align-middle" key={item.id}>
                  <td className="max-w-72 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <Image
                          alt=""
                          className="object-cover"
                          fill
                          sizes="48px"
                          src={item.image}
                          unoptimized
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-extrabold text-[#17213d]">
                          {item.name}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {item.category} · {item.location}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-600">
                    {item.ownerName || "Owner"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs font-bold text-[#17213d]">
                    {formatPrice(item)} / {item.rentalType}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#17213d]">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-extrabold ${statusClassNames[item.approvalStatus]}`}
                    >
                      {statusLabels[item.approvalStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {item.approvalStatus !== "approved" && (
                        <button
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-[11px] font-extrabold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                          disabled={isApprovingAll || busyId === item.id}
                          onClick={() => void updateApproval(item, "approved")}
                          type="button"
                        >
                          {busyId === item.id ? (
                            <LoaderCircle
                              aria-hidden="true"
                              className="size-3.5 animate-spin"
                            />
                          ) : (
                            <Check aria-hidden="true" className="size-3.5" />
                          )}
                          Approve
                        </button>
                      )}
                      {item.approvalStatus !== "rejected" && (
                        <button
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 text-[11px] font-extrabold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
                          disabled={isApprovingAll || busyId === item.id}
                          onClick={() => void updateApproval(item, "rejected")}
                          type="button"
                        >
                          <X aria-hidden="true" className="size-3.5" />
                          Reject
                        </button>
                      )}
                      <Link
                        aria-label={`Update ${item.name}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-[#dde2ef] text-slate-600 transition hover:bg-[#f3f5fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526ab7]"
                        href={`/dashboard/equipment/${encodeURIComponent(item.id)}/edit`}
                      >
                        <Pencil aria-hidden="true" className="size-3.5" />
                      </Link>
                      <button
                        aria-label={`Delete ${item.name}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-rose-100 text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-50"
                        disabled={isApprovingAll || busyId === item.id}
                        onClick={() => void deleteEquipment(item)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminTableFrame>
      )}
      <p className="mt-4 flex items-center gap-2 text-[11px] leading-5 text-slate-500">
        <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0" />
        Editing equipment returns the listing to Pending review. Deletion is
        blocked while a checkout hold or paid rental is active.
      </p>
    </div>
  );
}
