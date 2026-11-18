"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import {
  isFeaturedEquipment,
  type FeaturedEquipment as FeaturedEquipmentItem,
} from "@/data/featured-equipment";

type FeaturedEquipmentState =
  | { status: "loading"; items: FeaturedEquipmentItem[] }
  | { status: "error"; items: FeaturedEquipmentItem[]; message: string }
  | { status: "success"; items: FeaturedEquipmentItem[] };

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export function FeaturedEquipment() {
  const [state, setState] = useState<FeaturedEquipmentState>({
    status: "loading",
    items: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeaturedEquipment() {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/equipment/featured`,
          { signal: controller.signal },
        );
        const payload: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : `Could not load equipment (HTTP ${response.status}).`;

          throw new Error(message);
        }

        if (
          typeof payload !== "object" ||
          payload === null ||
          !("items" in payload) ||
          !Array.isArray(payload.items) ||
          !payload.items.every(isFeaturedEquipment)
        ) {
          throw new Error("The equipment API returned an invalid response.");
        }

        setState({ status: "success", items: payload.items });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          items: [],
          message:
            error instanceof Error
              ? error.message
              : "Could not load featured equipment.",
        });
      }
    }

    void loadFeaturedEquipment();
    return () => controller.abort();
  }, []);

  function viewDetails(id: string) {
    return `/login?redirect=${encodeURIComponent(`/equipment/${id}`)}`;
  }

  return (
    <section className="bg-[#f7f8fa] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#e96a32]">
              Approved and ready
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Featured Equipment
            </h2>
          </div>
          <Link
            className="hidden items-center gap-2 text-sm font-bold text-slate-800 transition-colors hover:text-[#e96a32] sm:flex"
            href="/equipment"
          >
            View all equipment
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        {state.status === "loading" && (
          <p aria-live="polite" className="py-12 text-center text-slate-600">
            Loading featured equipment...
          </p>
        )}
        {state.status === "error" && (
          <p
            aria-live="assertive"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800"
          >
            {state.message}
          </p>
        )}
        {state.status === "success" && state.items.length === 0 && (
          <p className="py-12 text-center text-slate-600">
            No approved equipment is available right now.
          </p>
        )}
        {state.status === "success" && state.items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {state.items.map((item) => (
              <article
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#e96a32]/40 hover:shadow-xl"
                key={item.id}
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    alt={item.name}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    src={item.image}
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                    {item.category}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-slate-950">
                    {item.name}
                  </h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin
                      aria-hidden="true"
                      className="size-4 text-[#e96a32]"
                    />
                    {item.location}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">
                      <span className="text-lg font-extrabold text-slate-950">
                        ৳{item.dailyRate.toLocaleString()}
                      </span>
                      <span className="ml-1">/ day</span>
                    </p>
                    <Link
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-[#e96a32] px-4 text-sm font-bold text-[#c94f1c] transition-colors hover:bg-[#e96a32] hover:text-white"
                      href={viewDetails(item.id)}
                    >
                      View Details
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
