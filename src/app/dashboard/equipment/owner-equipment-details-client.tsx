"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Pencil,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { dashboardRequest } from "@/lib/dashboard-api";
import { useDashboard } from "../dashboard-context";
import {
  parseOwnerEquipment,
  type OwnerEquipment,
} from "../owner-equipment-types";

type DetailsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; item: OwnerEquipment };

function parseItem(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("item" in payload)
  ) {
    return null;
  }
  return parseOwnerEquipment(payload.item);
}

function formatCurrency(amount: number, rentalType: string) {
  return `${new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount)} / ${rentalType}`;
}

const statusClassNames = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
};

export default function OwnerEquipmentDetailsClient({ id }: { id: string }) {
  const { accessToken, user } = useDashboard();
  const returnPath =
    user.role === "Admin"
      ? "/dashboard/all-equipment"
      : "/dashboard/equipment";
  const returnLabel =
    user.role === "Admin" ? "All Equipment" : "My Equipment";
  const [state, setState] = useState<DetailsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    async function loadEquipment() {
      try {
        const payload = await dashboardRequest(
          `/api/equipment/mine/${encodeURIComponent(id)}`,
          accessToken,
          { signal: controller.signal },
        );
        const item = parseItem(payload);
        if (!item) {
          throw new Error("The equipment service returned invalid item data.");
        }
        setState({ status: "success", item });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load this equipment.",
          });
        }
      }
    }

    void loadEquipment();
    return () => controller.abort();
  }, [accessToken, id]);

  if (state.status === "loading") {
    return (
      <div
        aria-live="polite"
        className="flex min-h-72 items-center justify-center gap-3 text-sm font-semibold text-slate-500"
        role="status"
      >
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-[#e96a32]" />
        Loading equipment details…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800"
        role="alert"
      >
        <p>Could not load this equipment: {state.message}</p>
        <Link
          className="mt-4 inline-flex font-extrabold underline underline-offset-4"
          href={returnPath}
        >
          Return to {returnLabel}
        </Link>
      </div>
    );
  }

  const item = state.item;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 transition hover:text-[#c94f1c]"
            href={returnPath}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {returnLabel}
          </Link>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#c94f1c]">
            {user.role === "Admin" ? "Admin review" : "Listing details"}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[#08162d]">
            {item.name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.approvalStatus === "approved" && (
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50"
              href={`/equipment/${encodeURIComponent(item.id)}`}
            >
              Public details
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          )}
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#08162d] px-4 text-xs font-extrabold text-white transition hover:bg-[#10294c]"
            href={`/dashboard/equipment/${encodeURIComponent(item.id)}/edit`}
          >
            <Pencil aria-hidden="true" className="size-4" />
            Update
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative min-h-72 overflow-hidden rounded-2xl bg-slate-100 sm:min-h-[420px]">
          <Image
            alt={item.name}
            className="object-cover"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            src={item.image}
            unoptimized
          />
          <span
            className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold capitalize shadow-sm ${statusClassNames[item.approvalStatus]}`}
          >
            <ShieldCheck aria-hidden="true" className="size-4" />
            {item.approvalStatus}
          </span>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-[#f7f9fc] p-4">
                <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  <Tag aria-hidden="true" className="size-4 text-[#c94f1c]" />
                  Category
                </span>
                <p className="mt-2 text-sm font-extrabold text-[#08162d]">
                  {item.category}
                </p>
              </div>
              <div className="rounded-xl bg-[#f7f9fc] p-4">
                <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  <MapPin aria-hidden="true" className="size-4 text-[#087e78]" />
                  Location
                </span>
                <p className="mt-2 text-sm font-extrabold text-[#08162d]">
                  {item.location}
                </p>
              </div>
              <div className="rounded-xl bg-[#fff8e7] p-4">
                <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-4 text-[#c94f1c]"
                  />
                  Rental rate
                </span>
                <p className="mt-2 text-sm font-black text-[#08162d]">
                  {formatCurrency(item.rentalPrice, item.rentalType)}
                </p>
              </div>
              <div className="rounded-xl bg-[#eefaf7] p-4">
                <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  <PackageCheck
                    aria-hidden="true"
                    className="size-4 text-[#087e78]"
                  />
                  Available quantity
                </span>
                <p className="mt-2 text-sm font-black text-[#08162d]">
                  {item.quantity}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                  Condition
                </p>
                <p className="mt-1 text-sm font-bold text-[#08162d]">
                  {item.condition || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                  Brand
                </p>
                <p className="mt-1 text-sm font-bold text-[#08162d]">
                  {item.brand || "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                  Model
                </p>
                <p className="mt-1 text-sm font-bold text-[#08162d]">
                  {item.model || "Not specified"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#08162d]">
              <ClipboardList
                aria-hidden="true"
                className="size-4 text-[#c94f1c]"
              />
              Description
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {item.description}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-black text-[#08162d]">
              Rental terms and conditions
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {item.rentalTerms || "No additional terms were provided."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
