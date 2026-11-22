"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  isFeaturedEquipment,
  type FeaturedEquipment as FeaturedEquipmentItem,
} from "@/data/featured-equipment";
import { fetchWithRetry } from "@/lib/public-api";

type FeaturedEquipmentState =
  | { status: "loading"; items: FeaturedEquipmentItem[] }
  | { status: "error"; items: FeaturedEquipmentItem[]; message: string }
  | { status: "success"; items: FeaturedEquipmentItem[] };

type SessionResponse = {
  session: object | null;
  user: object | null;
};

function isSessionResponse(value: unknown): value is SessionResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "session" in value &&
    "user" in value &&
    (value.session === null || typeof value.session === "object") &&
    (value.user === null || typeof value.user === "object")
  );
}

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export function FeaturedEquipment() {
  const router = useRouter();
  const reduceMotion = useReducedMotion() ?? false;
  const [state, setState] = useState<FeaturedEquipmentState>({
    status: "loading",
    items: [],
  });
  const [openingEquipmentId, setOpeningEquipmentId] = useState<string | null>(
    null,
  );
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [activeEquipmentId, setActiveEquipmentId] = useState<string | null>(
    null,
  );
  const displayedItems = state.status === "success" ? state.items : [];
  const equipmentRows: FeaturedEquipmentItem[][] = [];
  for (let index = 0; index < displayedItems.length; index += 3) {
    equipmentRows.push(displayedItems.slice(index, index + 3));
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeaturedEquipment() {
      try {
        const response = await fetchWithRetry(
          `${apiBaseUrl}/api/equipment/featured`,
          {
            signal: controller.signal,
          },
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

  async function viewDetails(id: string) {
    setNavigationError(null);
    setOpeningEquipmentId(id);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/get-session`, {
        credentials: "include",
      });
      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        throw new Error("The authentication server returned an invalid session.");
      }

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : "Could not check your sign-in status. Please try again.";
        throw new Error(message);
      }

      if (payload !== null && !isSessionResponse(payload)) {
        throw new Error("The authentication server returned an invalid session.");
      }

      const isLoggedIn =
        payload !== null &&
        payload.session !== null &&
        payload.user !== null;
      const detailsUrl = `/equipment/${encodeURIComponent(id)}`;

      router.push(
        isLoggedIn
          ? detailsUrl
          : `/login?redirect=${encodeURIComponent(detailsUrl)}`,
      );
    } catch (error) {
      setNavigationError(
        error instanceof Error
          ? error.message
          : "Could not check your sign-in status. Please try again.",
      );
    } finally {
      setOpeningEquipmentId(null);
    }
  }

  return (
    <section className="bg-[#f7f8fa] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-10 flex items-end justify-between gap-6"
          initial={{ opacity: 0, y: reduceMotion ? 0 : -18 }}
          transition={{
            duration: reduceMotion ? 0 : 0.45,
            ease: "easeOut",
          }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#e96a32]">
              Approved and ready
            </p>
            <h2 className="gearrent-section-heading mt-3 text-slate-950">
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
        </motion.div>

        {navigationError && (
          <p
            aria-live="assertive"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800"
            role="alert"
          >
            {navigationError}
          </p>
        )}

        {state.status === "loading" && (
          <motion.p
            aria-live="polite"
            animate={{ opacity: 1, y: 0 }}
            className="py-12 text-center text-slate-600"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
          >
            Loading featured equipment...
          </motion.p>
        )}
        {state.status === "error" && (
          <motion.p
            aria-live="assertive"
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
          >
            {state.message}
          </motion.p>
        )}
        {displayedItems.length > 0 && (
          <div className="grid grid-cols-1 gap-x-3 gap-y-7 sm:flex sm:flex-wrap sm:gap-5 xl:flex-nowrap xl:items-stretch">
            {equipmentRows.map((row, rowIndex) => (
              <div
                className="contents sm:flex sm:basis-full sm:gap-5 xl:contents"
                key={rowIndex}
              >
                {row.map((item, itemIndex) => {
                  const index = rowIndex * 3 + itemIndex;

                  return (
                    <motion.article
                      className={`group relative h-auto min-h-[390px] min-w-0 flex-[1_1_0%] rounded-2xl bg-[linear-gradient(115deg,#ffd277_0%,#e96a32_55%,#08162d_100%)] p-[2px] shadow-[0_4px_14px_rgba(8,22,45,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(233,106,50,0.16)] sm:h-[360px] sm:min-h-0 xl:h-[380px] ${
                        row.length === 1
                          ? "sm:max-w-[calc(33.333%_-_0.833rem)]"
                          : ""
                      } ${
                        activeEquipmentId === item.id
                          ? "sm:col-span-2"
                          : ""
                      }`}
                      initial={{ opacity: 0, y: reduceMotion ? 0 : -24 }}
                      key={item.id}
                      layout
                      onBlurCapture={(event) => {
                        const nextTarget = event.relatedTarget;
                        if (
                          !(nextTarget instanceof Node) ||
                          !event.currentTarget.contains(nextTarget)
                        ) {
                          setActiveEquipmentId(null);
                        }
                      }}
                      onFocusCapture={() => setActiveEquipmentId(item.id)}
                      onMouseEnter={() => setActiveEquipmentId(item.id)}
                      onPointerDown={(event) => {
                        if (event.pointerType === "touch") {
                          setActiveEquipmentId(item.id);
                        }
                      }}
                      onPointerLeave={(event) => {
                        if (event.pointerType !== "touch") {
                          setActiveEquipmentId(null);
                        }
                      }}
                      style={{
                        flexGrow: activeEquipmentId === item.id ? 2.2 : 1,
                      }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                              layout: {
                                type: "spring",
                                stiffness: 140,
                                damping: 24,
                                mass: 0.9,
                              },
                              opacity: {
                                duration: 0.45,
                                delay: index * 0.07,
                              },
                              y: {
                                type: "spring",
                                stiffness: 180,
                                damping: 22,
                                delay: index * 0.07,
                              },
                            }
                      }
                      viewport={{ once: true, amount: 0.15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex h-full flex-col overflow-hidden rounded-[14px] bg-white">
                        <div className="relative h-48 shrink-0 overflow-hidden sm:h-44 xl:h-52">
                          <Image
                            alt={item.name}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            fill
                            sizes="(max-width: 640px) 85vw, 360px"
                            src={item.image}
                          />
                          <span className="absolute left-2 top-2 max-w-[80%] truncate rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-3 xl:p-2">
                          <h3 className="line-clamp-2 min-h-10 break-words text-base font-bold leading-tight text-slate-950 transition-colors duration-500 group-hover:text-[#c94f1c] xl:text-sm">
                            {item.name}
                          </h3>
                          <p className="mt-2 flex min-h-4 items-center gap-1.5 text-xs text-slate-500">
                            <MapPin
                              aria-hidden="true"
                              className="size-3 shrink-0 text-[#e96a32]"
                            />
                            <span className="truncate">{item.location}</span>
                          </p>
                          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                            <p className="text-sm text-slate-500">
                              <span className="text-base font-extrabold text-slate-950">
                                ৳{item.dailyRate.toLocaleString()}
                              </span>
                              <span className="ml-1 text-xs">/ day</span>
                            </p>
                            <button
                              aria-busy={openingEquipmentId === item.id}
                              className="inline-flex h-9 items-center gap-1 rounded-md border border-[#e96a32] px-2 text-xs font-bold text-[#c94f1c] transition-colors hover:bg-[#e96a32] hover:text-white disabled:cursor-wait disabled:opacity-60"
                              disabled={openingEquipmentId !== null}
                              onClick={() => void viewDetails(item.id)}
                              type="button"
                            >
                              {openingEquipmentId === item.id
                                ? "Checking..."
                                : "View Details"}
                              <ArrowRight
                                aria-hidden="true"
                                className="size-3.5"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
