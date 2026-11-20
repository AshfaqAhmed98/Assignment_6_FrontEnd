"use client";

import { Quote, Star } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const reviews = [
  {
    name: "Nadia Rahman",
    initials: "NR",
    project: "Home renovation",
    rating: 5,
    comment:
      "Finding the right equipment for a short renovation project felt simple, and comparing prices helped me plan ahead.",
    glow: "from-[#ffc45b]/20 to-transparent",
    accent: "text-[#75d6c3]",
  },
  {
    name: "Imran Hossain",
    initials: "IH",
    project: "Construction work",
    rating: 5,
    comment:
      "I could look through equipment details in one place and choose what matched the job I needed to finish.",
    glow: "from-[#75d6c3]/20 to-transparent",
    accent: "text-[#ffc45b]",
  },
  {
    name: "Farah Ahmed",
    initials: "FA",
    project: "Photography project",
    rating: 4,
    comment:
      "Flexible rental options made it easier to plan around my shoot instead of buying gear I only needed once.",
    glow: "from-[#e96a32]/20 to-transparent",
    accent: "text-[#75d6c3]",
  },
  {
    name: "Tanvir Islam",
    initials: "TI",
    project: "Weekend project",
    rating: 5,
    comment:
      "A practical way to explore local equipment choices and get a project moving without a long-term purchase.",
    glow: "from-[#75d6c3]/20 to-transparent",
    accent: "text-[#ffc45b]",
  },
];

function ReviewRating({ rating }: { rating: number }) {
  return (
    <div
      aria-label={`${rating} out of 5 stars`}
      className="flex items-center gap-1"
      role="img"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          aria-hidden="true"
          className={
            index < rating
              ? "size-4 fill-[#ffc45b] text-[#ffc45b]"
              : "size-4 text-slate-600"
          }
          key={index}
        />
      ))}
    </div>
  );
}

type Review = (typeof reviews)[number];

function ReviewCard({
  review,
  index,
  isMobile,
  reduceMotion,
}: {
  review: Review;
  index: number;
  isMobile: boolean;
  reduceMotion: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: false, amount: 0.2 });
  const enterOffset = isMobile ? 48 : "110%";

  return (
    <div className="min-w-0" ref={cardRef}>
      <motion.article
        animate={
          reduceMotion
            ? { opacity: 1, x: 0 }
            : isInView
              ? { opacity: 1, x: 0 }
              : { opacity: 0, x: enterOffset }
        }
        aria-label={`Demo review by ${review.name}`}
        className="group relative flex min-h-[350px] flex-col overflow-hidden rounded-2xl border border-[#233550] bg-[#0b172a] p-6 text-white shadow-[0_16px_38px_rgba(8,22,45,0.16)] transition-[border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#75d6c3]/45 hover:shadow-[0_24px_50px_rgba(8,22,45,0.22)]"
        initial={reduceMotion ? false : { opacity: 0, x: enterOffset }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                x: {
                  type: "spring",
                  stiffness: isMobile ? 120 : 90,
                  damping: isMobile ? 18 : 12,
                  mass: 0.8,
                },
                opacity: { duration: 0.3, ease: "easeOut" },
                delay: isInView ? index * 0.1 : 0,
              }
        }
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -left-16 -top-16 size-32 rounded-full bg-gradient-to-br ${review.glow} blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-80`}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-16 size-32 rounded-full bg-gradient-to-br from-[#75d6c3]/15 to-transparent blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-80"
        />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <ReviewRating rating={review.rating} />
          <Quote
            aria-hidden="true"
            className="-mt-1 size-10 shrink-0 text-[#75d6c3]/20 transition-colors group-hover:text-[#75d6c3]/35"
            fill="currentColor"
          />
        </div>

        <div className="relative z-10 mt-4 flex-1">
          <p
            className={`text-xs font-bold uppercase tracking-[0.16em] ${review.accent}`}
          >
            {review.project}
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
              {review.initials}
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-white">
              {review.name}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">Demo reviewer</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Sample
          </span>
        </div>
      </motion.article>
    </div>
  );
}

export function CustomerReviews() {
  const reduceMotion = useReducedMotion() ?? false;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobileViewport = window.matchMedia("(max-width: 639px)");
    const updateViewport = () => setIsMobile(mobileViewport.matches);

    updateViewport();
    mobileViewport.addEventListener("change", updateViewport);
    return () => mobileViewport.removeEventListener("change", updateViewport);
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
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d8c99e] bg-white/70 px-4 py-2 text-xs font-bold text-[#604a1d]">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-[#e6ad35]"
            />
            Illustrative demo reviews
          </span>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {reviews.map((review, index) => (
            <ReviewCard
              index={index}
              isMobile={isMobile}
              key={review.name}
              reduceMotion={reduceMotion}
              review={review}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
