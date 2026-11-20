"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { EquipmentLoader } from "@/components/ui/equipment-loader";

export function AdminLoading({ message }: { message: string }) {
  return (
    <EquipmentLoader className="min-h-80 sm:min-h-96" message={message} />
  );
}

export function AdminError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      aria-live="assertive"
      className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-bold">Could not load this admin view.</p>
          <p className="mt-1 leading-5">{message}</p>
          <button
            className="mt-3 font-extrabold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-900"
            onClick={onRetry}
            type="button"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#526ab7]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#17213d]">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[#d8deeb] bg-[#f7f8fc] px-6 py-12 text-center">
      <h3 className="text-base font-black text-[#17213d]">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export function AdminTableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#dde2ef] bg-white">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export const adminTableClassName =
  "w-full min-w-[760px] text-left text-sm";
export const adminTableHeadClassName =
  "bg-[#f3f5fa] text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500";
