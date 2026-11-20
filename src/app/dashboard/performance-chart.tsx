"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type PerformanceRange = "all" | "1m" | "6m" | "1y";

type PerformanceBucket = {
  label: string;
  start: number;
  end: number;
  rentals: number;
  favorites: number;
};

const rangeOptions: { value: PerformanceRange; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "1m", label: "1M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
];

const dayInMilliseconds = 24 * 60 * 60 * 1000;
const chartLeft = 52;
const chartRight = 744;
const chartTop = 22;
const chartBottom = 224;
const chartHeight = chartBottom - chartTop;

function monthBuckets(count: number, now: Date): PerformanceBucket[] {
  const monthFormatter = new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  });

  return Array.from({ length: count }, (_, index) => {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count + index + 1, 1),
    );
    const nextMonth = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
    );

    return {
      label: monthFormatter.format(start),
      start: start.getTime(),
      end: Math.min(nextMonth.getTime(), now.getTime() + 1),
      rentals: 0,
      favorites: 0,
    };
  });
}

function allTimeBuckets(
  rentalDates: string[],
  favoriteDates: string[],
  now: Date,
): PerformanceBucket[] {
  const latestTime = now.getTime();
  const dates = [...rentalDates, ...favoriteDates]
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value) && value <= latestTime);
  const recentStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() - 11,
    1,
  );
  const earliestDate = Math.min(...dates);

  if (dates.length === 0 || earliestDate >= recentStart) {
    return monthBuckets(12, now);
  }

  const firstYear = new Date(earliestDate).getUTCFullYear();
  const currentYear = now.getUTCFullYear();
  const yearsPerBucket = Math.ceil((currentYear - firstYear + 1) / 12);

  return Array.from(
    { length: Math.ceil((currentYear - firstYear + 1) / yearsPerBucket) },
    (_, index) => {
      const startYear = firstYear + index * yearsPerBucket;
      const endYear = Math.min(startYear + yearsPerBucket, currentYear + 1);
      return {
        label:
          endYear - startYear === 1
            ? String(startYear)
            : `${startYear}–${endYear - 1}`,
        start: Date.UTC(startYear, 0, 1),
        end: Math.min(Date.UTC(endYear, 0, 1), latestTime + 1),
        rentals: 0,
        favorites: 0,
      };
    },
  );
}

function buildBuckets(
  range: PerformanceRange,
  rentalDates: string[],
  favoriteDates: string[],
): PerformanceBucket[] {
  const now = new Date();
  let buckets: PerformanceBucket[];

  if (range === "1m") {
    const rangeEnd = now.getTime() + 1;
    const rangeStart = now.getTime() - 30 * dayInMilliseconds;
    const bucketSize = (rangeEnd - rangeStart) / 5;
    buckets = Array.from({ length: 5 }, (_, index) => ({
      label: `W${index + 1}`,
      start: rangeStart + index * bucketSize,
      end: rangeStart + (index + 1) * bucketSize,
      rentals: 0,
      favorites: 0,
    }));
  } else if (range === "6m") {
    buckets = monthBuckets(6, now);
  } else if (range === "1y") {
    buckets = monthBuckets(12, now);
  } else {
    buckets = allTimeBuckets(rentalDates, favoriteDates, now);
  }

  const addActivity = (dateValues: string[], key: "rentals" | "favorites") => {
    for (const value of dateValues) {
      const timestamp = new Date(value).getTime();
      if (!Number.isFinite(timestamp) || timestamp > now.getTime()) {
        continue;
      }

      const bucket = buckets.find(
        (item) => timestamp >= item.start && timestamp < item.end,
      );
      if (bucket) {
        bucket[key] += 1;
      }
    }
  };

  addActivity(rentalDates, "rentals");
  addActivity(favoriteDates, "favorites");
  return buckets;
}

function getCurvePath(points: { x: number; y: number }[]) {
  if (points.length === 0) {
    return "";
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

export function PerformanceChart({
  rentalDates,
  comparisonDates,
  title = "Performance",
  description = "Your rental bookings and saved gear over time.",
  rentalLabel = "Rental bookings",
  comparisonLabel = "Favorites added",
  activityNote = "Activity is calculated from your confirmed bookings and saved equipment.",
  emptyMessage = "Your real activity will appear here when you book equipment or save a favorite.",
}: {
  rentalDates: string[];
  comparisonDates: string[];
  title?: string;
  description?: string;
  rentalLabel?: string;
  comparisonLabel?: string;
  activityNote?: string;
  emptyMessage?: string;
}) {
  const [range, setRange] = useState<PerformanceRange>("1y");
  const reduceMotion = useReducedMotion() ?? false;
  const buckets = buildBuckets(range, rentalDates, comparisonDates);
  const rentalTotal = buckets.reduce((total, bucket) => total + bucket.rentals, 0);
  const favoriteTotal = buckets.reduce(
    (total, bucket) => total + bucket.favorites,
    0,
  );
  const hasActivity = rentalTotal > 0 || favoriteTotal > 0;
  const maximum = Math.max(
    4,
    Math.ceil(
      Math.max(...buckets.map((bucket) => Math.max(bucket.rentals, bucket.favorites))) /
        4,
    ) * 4,
  );
  const slotWidth = (chartRight - chartLeft) / buckets.length;
  const barWidth = Math.min(24, slotWidth * 0.42);
  const points = buckets.map((bucket, index) => ({
    x: chartLeft + slotWidth * (index + 0.5),
    y: chartBottom - (bucket.favorites / maximum) * chartHeight,
  }));
  const curvePath = getCurvePath(points);
  const areaPath =
    points.length > 1
      ? `${curvePath} L ${points[points.length - 1].x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`
      : "";

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      aria-labelledby="dashboard-performance-title"
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-38px_rgba(8,22,45,0.5)] sm:p-6"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.4 }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-28 size-64 rounded-full border border-[#ffd277]/25"
      />
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff4d8] text-[#c94f1c]">
              <Activity aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h3
                className="text-lg font-black tracking-tight text-[#08162d]"
                id="dashboard-performance-title"
              >
                {title}
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {description}
              </p>
            </div>
          </div>
          <div
            aria-label="Performance date range"
            className="flex w-fit rounded-xl border border-slate-200 bg-slate-50 p-1"
            role="group"
          >
            {rangeOptions.map((option) => (
              <button
                aria-pressed={range === option.value}
                className={`min-w-11 rounded-lg px-2.5 py-2 text-[11px] font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e96a32] ${
                  range === option.value
                    ? "bg-[#08162d] text-[#ffd277] shadow-sm"
                    : "text-slate-500 hover:bg-white hover:text-[#08162d]"
                }`}
                key={option.value}
                onClick={() => setRange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div
          aria-live="polite"
          className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-sm bg-[#e96a32]"
            />
            {rentalLabel}
            <strong className="text-sm font-black text-[#08162d]">
              {rentalTotal}
            </strong>
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-[#1c9a7a]"
            />
            {comparisonLabel}
            <strong className="text-sm font-black text-[#08162d]">
              {favoriteTotal}
            </strong>
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-[#75d6c3]/25 bg-[#effbf8] px-4 py-3 text-xs font-semibold leading-5 text-[#285c54]">
          {hasActivity ? activityNote : emptyMessage}
        </div>

        <div className="relative mt-3 overflow-x-auto">
          <svg
            aria-label={`${rentalLabel} and ${comparisonLabel} for ${
              range === "all" ? "all time" : `the last ${range.toUpperCase()}`
            }`}
            className="h-[250px] min-w-[600px] w-full"
            role="img"
            viewBox="0 0 760 280"
          >
            <defs>
              <linearGradient
                id="dashboard-rental-bars"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#e96a32" />
                <stop offset="100%" stopColor="#ffd277" />
              </linearGradient>
              <linearGradient
                id="dashboard-favorite-area"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#75d6c3" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#75d6c3" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {Array.from({ length: 5 }, (_, index) => {
              const value = (maximum / 4) * index;
              const y = chartBottom - (value / maximum) * chartHeight;
              return (
                <g key={index}>
                  <line
                    stroke="#e8edf4"
                    strokeDasharray={index === 0 ? undefined : "3 5"}
                    strokeWidth="1"
                    x1={chartLeft}
                    x2={chartRight}
                    y1={y}
                    y2={y}
                  />
                  <text
                    fill="#8491a5"
                    fontSize="11"
                    textAnchor="end"
                    x={chartLeft - 12}
                    y={y + 4}
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {areaPath && (
              <path d={areaPath} fill="url(#dashboard-favorite-area)" />
            )}

            {buckets.map((bucket, index) => {
              const x = chartLeft + slotWidth * (index + 0.5) - barWidth / 2;
              const height = (bucket.rentals / maximum) * chartHeight;
              const y = chartBottom - height;

              return (
                <motion.rect
                  animate={{ opacity: 1, y, height }}
                  initial={
                    reduceMotion ? false : { opacity: 0, y: chartBottom, height: 0 }
                  }
                  key={`${range}-${bucket.label}-${index}`}
                  rx="4"
                  transition={{
                    delay: reduceMotion ? 0 : index * 0.025,
                    duration: reduceMotion ? 0 : 0.42,
                    ease: "easeOut",
                  }}
                  width={barWidth}
                  x={x}
                  y={y}
                  height={height}
                  fill="url(#dashboard-rental-bars)"
                >
                  <title>
                    {bucket.label}: {bucket.rentals} {rentalLabel.toLowerCase()}
                  </title>
                </motion.rect>
              );
            })}

            <path
              d={curvePath}
              fill="none"
              stroke="#1c9a7a"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            {points.map((point, index) => (
              <circle
                cx={point.x}
                cy={point.y}
                fill="#1c9a7a"
                key={buckets[index].label}
                r="3.5"
                stroke="white"
                strokeWidth="2"
              >
                <title>
                  {buckets[index].label}: {buckets[index].favorites}{" "}
                  {comparisonLabel.toLowerCase()}
                </title>
              </circle>
            ))}

            {buckets.map((bucket, index) => (
              <text
                fill="#64748b"
                fontSize="11"
                fontWeight="600"
                key={`${bucket.label}-${index}`}
                textAnchor="middle"
                x={chartLeft + slotWidth * (index + 0.5)}
                y="252"
              >
                {bucket.label}
              </text>
            ))}
          </svg>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-sm bg-[#e96a32]"
            />
            {rentalLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-4 rounded-full bg-[#1c9a7a]"
            />
            {comparisonLabel}
          </span>
        </div>
      </div>
    </motion.section>
  );
}
