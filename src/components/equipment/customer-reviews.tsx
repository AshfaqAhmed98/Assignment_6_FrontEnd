"use client";

import { Quote, Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { apiBaseUrl } from "@/lib/dashboard-api";

type Review = {
  id: string;
  customerName: string;
  equipmentName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ReviewsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; items: Review[] };

function isReview(value: unknown): value is Review {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "customerName" in value &&
    typeof value.customerName === "string" &&
    "equipmentName" in value &&
    typeof value.equipmentName === "string" &&
    "rating" in value &&
    typeof value.rating === "number" &&
    Number.isInteger(value.rating) &&
    value.rating >= 1 &&
    value.rating <= 5 &&
    "comment" in value &&
    typeof value.comment === "string" &&
    "createdAt" in value &&
    typeof value.createdAt === "string"
  );
}

const reviewAccents = [
  {
    glow: "from-[#ffc45b]/20 to-transparent",
    accent: "text-[#75d6c3]",
  },
  {
    glow: "from-[#75d6c3]/20 to-transparent",
    accent: "text-[#ffc45b]",
  },
  {
    glow: "from-[#e96a32]/20 to-transparent",
    accent: "text-[#75d6c3]",
  },
  {
    glow: "from-[#75d6c3]/20 to-transparent",
    accent: "text-[#ffc45b]",
  },
];

function ReviewCard({
  review,
  index,
  reduceMotion,
}: {
  review: Review;
  index: number;
  reduceMotion: boolean;
}) {
  const accent = reviewAccents[index % reviewAccents.length];

  return (
    <motion.article
      className="group relative flex min-h-[350px] flex-col overflow-hidden rounded-2xl border border-[#233550] bg-[#0b172a] p-6 text-white shadow-[0_16px_38px_rgba(8,22,45,0.16)] transition-[border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#75d6c3]/45 hover:shadow-[0_24px_50px_rgba(8,22,45,0.22)]"
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.35,
        delay: reduceMotion ? 0 : index * 0.08,
      }}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -left-16 -top-16 size-32 rounded-full bg-gradient-to-br ${accent.glow} blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-80`}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -right-16 size-32 rounded-full bg-gradient-to-br from-[#75d6c3]/15 to-transparent blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-80"
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div
          aria-label={`${review.rating} out of 5 stars`}
          className="flex items-center gap-1"
          role="img"
        >
          {Array.from({ length: 5 }, (_, starIndex) => (
            <Star
              aria-hidden="true"
              className={
                starIndex < review.rating
                  ? "size-4 fill-[#ffc45b] text-[#ffc45b]"
                  : "size-4 text-slate-600"
              }
              key={starIndex}
            />
          ))}
        </div>
        <Quote
          aria-hidden="true"
          className="-mt-1 size-10 shrink-0 text-[#75d6c3]/20 transition-colors group-hover:text-[#75d6c3]/35"
          fill="currentColor"
        />
      </div>

      <div className="relative z-10 mt-4 flex-1">
        <p
          className={`text-xs font-bold uppercase tracking-[0.16em] ${accent.accent}`}
        >
          {review.equipmentName}
        </p>
        <p className="mt-3 text-[15px] leading-7 text-slate-300">
          “{review.comment}”
        </p>
      </div>

      <div className="relative z-10 mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
        <div className="group/avatar relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#75d6c3] to-[#ffc45b] opacity-60 blur transition-opacity duration-300 group-hover/avatar:opacity-100" />
          <div
            aria-hidden="true"
            className="relative flex size-11 items-center justify-center rounded-full bg-[#10243b] text-xs font-extrabold text-white ring-2 ring-[#0b172a]"
          >
            {review.customerName
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("")}
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-white">
            {review.customerName}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">Verified renter</p>
        </div>
      </div>
    </motion.article>
  );
}

export function CustomerReviews() {
  const reduceMotion = useReducedMotion() ?? false;
  const [state, setState] = useState<ReviewsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/reviews`, {
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (
          !response.ok ||
          typeof payload !== "object" ||
          payload === null ||
          !("items" in payload) ||
          !Array.isArray(payload.items) ||
          !payload.items.every(isReview)
        ) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : "Could not load customer reviews.";
          throw new Error(message);
        }
        setState({ status: "success", items: payload.items });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load customer reviews.",
          });
        }
      }
    }

    void loadReviews();
    return () => controller.abort();
  }, []);

  return (
    <section
      aria-labelledby="customer-reviews-title"
      className="relative isolate overflow-hidden bg-[#f7f5f0] px-4 py-16 text-[#122035] sm:px-6 sm:py-20 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 size-80 rounded-full bg-[#75d6c3]/15 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.35 }}
        >
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087e78]">
              Voices from the field
            </p>
            <h2
              className="gearrent-section-heading mt-3 text-[#122035]"
              id="customer-reviews-title"
            >
              Good gear gets the story moving.
            </h2>
            <p className="gearrent-section-description max-w-xl text-slate-600">
              A few ways renting can help make room for the work that matters.
            </p>
          </div>
        </motion.div>

        {state.status === "loading" && (
          <p aria-live="polite" className="py-12 text-center text-slate-600">
            Loading customer reviews...
          </p>
        )}
        {state.status === "error" && (
          <p
            aria-live="assertive"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800"
            role="alert"
          >
            {state.message}
          </p>
        )}
        {state.status === "success" && state.items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {state.items.map((review, index) => (
              <ReviewCard
                index={index}
                key={review.id}
                reduceMotion={reduceMotion}
                review={review}
              />
            ))}
          </div>
        )}
        {state.status === "success" && state.items.length === 0 && (
          <p
            aria-live="polite"
            className="rounded-2xl border border-[#233550] bg-[#0b172a] px-6 py-10 text-center text-slate-300"
          >
            No customer reviews yet. Complete a rental and share your feedback.
          </p>
        )}
      </div>
    </section>
  );
}
