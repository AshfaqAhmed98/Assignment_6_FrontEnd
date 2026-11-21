"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  isFeaturedEquipment,
  type FeaturedEquipment,
} from "@/data/featured-equipment";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

type RecentlyAddedState =
  | { status: "loading"; items: FeaturedEquipment[] }
  | { status: "error"; items: FeaturedEquipment[]; message: string }
  | { status: "success"; items: FeaturedEquipment[] };

export function RecentlyAdded() {
  const reduceMotion = useReducedMotion() ?? false;
  const [state, setState] = useState<RecentlyAddedState>({
    status: "loading",
    items: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadItems() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/equipment/featured`, {
          signal: controller.signal,
        });
        const payload: unknown = await response.json();

        if (!response.ok) {
          throw new Error(
            typeof payload === "object" &&
              payload !== null &&
              "message" in payload &&
              typeof payload.message === "string"
              ? payload.message
              : "Could not load recently added equipment.",
          );
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

        setState({ status: "success", items: payload.items.slice(0, 3) });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            items: [],
            message:
              error instanceof Error
                ? error.message
                : "Could not load recently added equipment.",
          });
        }
      }
    }

    void loadItems();
    return () => controller.abort();
  }, []);

  const items = state.status === "success" ? state.items : [];
  const leadItem = items[0];
  const compactItems = items.slice(1);

  return (
    <section
      aria-labelledby="recently-added-title"
      className="relative isolate overflow-hidden bg-[#eef2f1] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#087e78_0.7px,transparent_0.7px)] [background-size:18px_18px]"
      />
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          className="mb-9 grid gap-5 border-b border-[#0b172a]/15 pb-7 lg:grid-cols-[1fr_auto]"
          initial={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.35 }}
        >
          <div>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#087e78]">
              <span className="h-px w-8 bg-[#087e78]" />
              New arrivals
            </p>
            <h2
              className="gearrent-section-heading mt-3 text-[#08162d]"
              id="recently-added-title"
            >
              Just landed.
            </h2>
          </div>
          <div className="flex items-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#08162d]/15 bg-white/60 px-4 py-2 text-xs font-bold text-[#08162d] backdrop-blur">
              <Clock3 aria-hidden="true" className="size-4 text-[#087e78]" />
              Latest availability
            </span>
          </div>
        </motion.div>

        {state.status === "loading" && (
          <motion.p
            aria-live="polite"
            animate={{ opacity: 1, y: 0 }}
            className="py-12 text-center text-slate-600"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
          >
            Loading recently added equipment...
          </motion.p>
        )}
        {state.status === "error" && (
          <motion.p
            aria-live="assertive"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
          >
            {state.message}
          </motion.p>
        )}
        {leadItem && (
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <motion.article
              className="group relative min-h-[390px] overflow-hidden rounded-[2rem] bg-[#08162d] shadow-[0_24px_60px_rgba(8,22,45,0.16)] sm:min-h-[460px]"
              initial={{ opacity: 0, x: reduceMotion ? 0 : -36 }}
              transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.22 }}
            >
              <Image
                alt={leadItem.name}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                src={leadItem.image}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,22,45,0.94)_0%,rgba(8,22,45,0.68)_46%,rgba(8,22,45,0.08)_100%),linear-gradient(0deg,rgba(8,22,45,0.55),transparent_55%)]" />
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/20 bg-[#08162d]/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur sm:left-8 sm:top-8">
                <span className="size-2 rounded-full bg-[#75d6c3] shadow-[0_0_14px_#75d6c3]" />
                New spotlight
              </div>

              <div className="absolute inset-x-5 bottom-6 max-w-lg sm:inset-x-8 sm:bottom-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#75d6c3]">
                  {leadItem.category}
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {leadItem.name}
                </h3>
                <p className="mt-3 flex items-center gap-2 text-sm text-white/75">
                  <MapPin aria-hidden="true" className="size-4 text-[#ffc45b]" />
                  {leadItem.location}
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <p className="text-white">
                    <span className="text-2xl font-black">
                      ৳{leadItem.dailyRate.toLocaleString()}
                    </span>
                    <span className="ml-2 text-sm text-white/60">/ day</span>
                  </p>
                  <Link
                    aria-label={`View ${leadItem.name} details`}
                    className="gearrent-primary-action gearrent-primary-action--compact group"
                    href={`/equipment/${encodeURIComponent(leadItem.id)}`}
                  >
                    View listing
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </div>
            </motion.article>

            <div className="grid gap-3">
              {compactItems.map((item, index) => (
                <motion.article
                  className="group relative grid h-[178px] grid-cols-[112px_1fr] overflow-hidden rounded-[1.25rem] border border-[#08162d]/10 bg-white/75 shadow-[0_10px_28px_rgba(8,22,45,0.08)] backdrop-blur sm:grid-cols-[150px_1fr]"
                  initial={{ opacity: 0, x: reduceMotion ? 0 : 30 }}
                  key={item.id}
                  transition={{
                    duration: reduceMotion ? 0 : 0.45,
                    delay: reduceMotion ? 0 : index * 0.09,
                    ease: "easeOut",
                  }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.25 }}
                >
                  <div className="relative overflow-hidden">
                    <Image
                      alt=""
                      aria-hidden="true"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      fill
                      sizes="(max-width: 639px) 112px, 150px"
                      src={item.image}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col justify-center p-4 sm:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#087e78]">
                      {item.category}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-base font-black text-[#08162d] sm:text-lg">
                      {item.name}
                    </h3>
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin aria-hidden="true" className="size-3 text-[#c94f1c]" />
                      {item.location}
                    </p>
                    <p className="mt-3 text-sm font-black text-[#08162d]">
                      ৳{item.dailyRate.toLocaleString()}
                      <span className="ml-1 text-xs font-normal text-slate-500">
                        / day
                      </span>
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
