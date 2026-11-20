"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { dashboardRequest } from "@/lib/dashboard-api";
import { useDashboard } from "./dashboard-context";
import { AdminError, AdminLoading } from "./admin/admin-ui";

type AdminOverview = {
  users: number;
  equipment: number;
  pendingEquipment: number;
  rentals: number;
  pendingPayments: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOverview(
  userPayload: unknown,
  equipmentPayload: unknown,
  rentalPayload: unknown,
): AdminOverview | null {
  if (
    !isRecord(userPayload) ||
    typeof userPayload.total !== "number" ||
    !isRecord(equipmentPayload) ||
    !Array.isArray(equipmentPayload.items) ||
    !equipmentPayload.items.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.approvalStatus === "string",
    ) ||
    !isRecord(rentalPayload) ||
    !Array.isArray(rentalPayload.items) ||
    !rentalPayload.items.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.paymentStatus === "string",
    )
  ) {
    return null;
  }
  return {
    users: userPayload.total,
    equipment: equipmentPayload.items.length,
    pendingEquipment: equipmentPayload.items.filter(
      (item) => isRecord(item) && item.approvalStatus === "pending",
    ).length,
    rentals: rentalPayload.items.length,
    pendingPayments: rentalPayload.items.filter(
      (item) => isRecord(item) && item.paymentStatus === "pending",
    ).length,
  };
}

export default function AdminOverviewClient() {
  const { accessToken, user } = useDashboard();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadOverview() {
      setError(null);
      setOverview(null);
      try {
        const [userPayload, equipmentPayload, rentalPayload] =
          await Promise.all([
            dashboardRequest("/api/admin/users?limit=1&offset=0", accessToken, {
              signal: controller.signal,
            }),
            dashboardRequest("/api/admin/equipment", accessToken, {
              signal: controller.signal,
            }),
            dashboardRequest("/api/admin/rentals", accessToken, {
              signal: controller.signal,
            }),
          ]);
        const result = parseOverview(
          userPayload,
          equipmentPayload,
          rentalPayload,
        );
        if (!result) {
          throw new Error("The admin services returned invalid overview data.");
        }
        if (!controller.signal.aborted) {
          setOverview(result);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load platform totals.",
          );
        }
      }
    }

    void loadOverview();
    return () => controller.abort();
  }, [accessToken, retryKey]);

  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  const cards = overview
    ? [
        {
          href: "/dashboard/users",
          icon: <UsersRound aria-hidden="true" className="size-5" />,
          label: "Registered users",
          value: String(overview.users),
          note: "Manage account roles",
        },
        {
          href: "/dashboard/all-equipment",
          icon: <Boxes aria-hidden="true" className="size-5" />,
          label: "Equipment listings",
          value: String(overview.equipment),
          note: `${overview.pendingEquipment} awaiting review`,
        },
        {
          href: "/dashboard/all-rentals",
          icon: <CalendarDays aria-hidden="true" className="size-5" />,
          label: "Rental records",
          value: String(overview.rentals),
          note: `${overview.pendingPayments} unpaid checkout${overview.pendingPayments === 1 ? "" : "s"}`,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#e8ecfa] p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-20 size-60 rounded-full border border-[#526ab7]/20"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#46599a]">
              Platform overview
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#17213d] sm:text-3xl">
              Welcome, {firstName}.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#17213d]/65">
              Review the marketplace at a glance and jump directly into the
              areas that need your attention.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#526ab7]/15 bg-white/70 px-4 py-3 text-xs font-extrabold text-[#46599a]">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Admin access verified
          </span>
        </div>
        <div className="relative mt-6 flex items-center gap-2 border-t border-[#17213d]/10 pt-4 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#17213d]/50">
          <span className="size-2 rounded-full bg-[#526ab7]" />
          GearRent control room
          <span className="ml-auto hidden sm:inline">
            Changes to access roles apply immediately
          </span>
        </div>
      </section>

      {overview === null && !error && (
        <AdminLoading message="Gathering platform activity..." />
      )}
      {error && (
        <AdminError
          message={error}
          onRetry={() => setRetryKey((current) => current + 1)}
        />
      )}
      {overview && (
        <>
          <section aria-label="Platform metrics" className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <Link
                className="group rounded-2xl border border-[#dde2ef] bg-white p-5 shadow-[0_16px_40px_-36px_rgba(23,33,61,0.65)] transition hover:-translate-y-1 hover:border-[#526ab7]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526ab7]"
                href={card.href}
                key={card.label}
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[#edf0fb] text-[#526ab7]">
                    {card.icon}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#526ab7]"
                  />
                </div>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 text-3xl font-black tracking-tight text-[#17213d]">
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {card.note}
                </p>
              </Link>
            ))}
          </section>

          <section className="rounded-[1.5rem] border border-[#dde2ef] bg-white p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#526ab7]">
              Admin tools
            </p>
            <h3 className="mt-1 text-lg font-black text-[#17213d]">
              Choose a workspace
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <QuickLink href="/dashboard/users" label="Manage user roles" />
              <QuickLink
                href="/dashboard/all-equipment"
                label="Review all equipment"
              />
              <QuickLink
                href="/dashboard/all-rentals"
                label="Monitor all rentals"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-[#e4e8f2] bg-[#f8f9fc] px-4 text-xs font-extrabold text-[#344675] transition hover:border-[#526ab7]/35 hover:bg-[#edf0fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526ab7]"
      href={href}
    >
      {label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}
