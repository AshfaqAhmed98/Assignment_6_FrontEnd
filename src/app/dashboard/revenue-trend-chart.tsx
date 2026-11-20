"use client";

import { useState } from "react";

type RevenueRange = "1m" | "6m" | "1y";
type RevenuePoint = { date: string; amountMinor: number };
type RevenueBucket = {
  label: string;
  start: number;
  end: number;
  amountMinor: number;
};

const rangeOptions: { value: RevenueRange; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
];
const chartLeft = 64;
const chartRight = 744;
const chartTop = 22;
const chartBottom = 224;
const chartHeight = chartBottom - chartTop;
const dayInMilliseconds = 24 * 60 * 60 * 1000;

function formatCurrency(amountMinor: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

function formatCompactCurrency(amountMinor: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(amountMinor / 100);
}

function buildBuckets(range: RevenueRange, points: RevenuePoint[]) {
  const now = new Date();
  let buckets: RevenueBucket[];

  if (range === "1m") {
    const rangeEnd = now.getTime() + 1;
    const rangeStart = now.getTime() - 30 * dayInMilliseconds;
    const bucketSize = (rangeEnd - rangeStart) / 5;
    buckets = Array.from({ length: 5 }, (_, index) => ({
      label: `W${index + 1}`,
      start: rangeStart + index * bucketSize,
      end: rangeStart + (index + 1) * bucketSize,
      amountMinor: 0,
    }));
  } else {
    const count = range === "6m" ? 6 : 12;
    const monthFormatter = new Intl.DateTimeFormat("en", {
      month: "short",
      timeZone: "UTC",
    });
    buckets = Array.from({ length: count }, (_, index) => {
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
        amountMinor: 0,
      };
    });
  }

  for (const point of points) {
    const timestamp = new Date(point.date).getTime();
    if (!Number.isFinite(timestamp) || timestamp > now.getTime()) {
      continue;
    }
    const bucket = buckets.find(
      (item) => timestamp >= item.start && timestamp < item.end,
    );
    if (bucket) {
      bucket.amountMinor += point.amountMinor;
    }
  }

  return buckets;
}

function getLinePath(points: { x: number; y: number }[]) {
  return points.reduce((path, point, index) => {
    const command = index === 0 ? "M" : "L";
    return `${path} ${command} ${point.x} ${point.y}`;
  }, "");
}

export function RevenueTrendChart({ points }: { points: RevenuePoint[] }) {
  const [range, setRange] = useState<RevenueRange>("1y");
  const buckets = buildBuckets(range, points);
  const totalRevenue = buckets.reduce(
    (total, bucket) => total + bucket.amountMinor,
    0,
  );
  const maximum = Math.max(
    100,
    ...buckets.map((bucket) => bucket.amountMinor),
  );
  const slotWidth = (chartRight - chartLeft) / buckets.length;
  const chartPoints = buckets.map((bucket, index) => ({
    x: chartLeft + slotWidth * (index + 0.5),
    y:
      chartBottom -
      (bucket.amountMinor / maximum) * chartHeight,
  }));
  const linePath = getLinePath(chartPoints);
  const areaPath =
    chartPoints.length > 1
      ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${chartBottom} L ${chartPoints[0].x} ${chartBottom} Z`
      : "";
  const hasRevenue = totalRevenue > 0;

  return (
    <section
      aria-labelledby="dashboard-revenue-title"
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_45px_-38px_rgba(8,22,45,0.5)] sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#c94f1c]">
            Paid rentals
          </p>
          <h3
            className="mt-1 text-lg font-black tracking-tight text-[#08162d]"
            id="dashboard-revenue-title"
          >
            Revenue trend
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Revenue collected over time
          </p>
        </div>
        <div
          aria-label="Revenue date range"
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

      <p aria-live="polite" className="mt-4 text-sm font-black text-[#08162d]">
        {formatCurrency(totalRevenue)}
        <span className="ml-2 text-xs font-semibold text-slate-500">
          in selected period
        </span>
      </p>

      {!hasRevenue && (
        <p className="mt-3 rounded-xl border border-[#75d6c3]/25 bg-[#effbf8] px-4 py-3 text-xs font-semibold leading-5 text-[#285c54]">
          Paid rental revenue will appear here after your first payment.
        </p>
      )}

      <div className="relative mt-3 overflow-x-auto">
        <svg
          aria-label={`Paid rental revenue for the last ${range.toUpperCase()}`}
          className="h-[250px] min-w-[600px] w-full"
          role="img"
          viewBox="0 0 760 280"
        >
          <defs>
            <linearGradient
              id="dashboard-revenue-area"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#e96a32" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#ffd277" stopOpacity="0.02" />
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
                  fontSize="10"
                  textAnchor="end"
                  x={chartLeft - 12}
                  y={y + 4}
                >
                  {formatCompactCurrency(value)}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#dashboard-revenue-area)" />}
          <path
            d={linePath}
            fill="none"
            stroke="#e96a32"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {chartPoints.map((point, index) => (
            <circle
              cx={point.x}
              cy={point.y}
              fill="#e96a32"
              key={buckets[index].label}
              r="4"
              stroke="white"
              strokeWidth="2"
            >
              <title>
                {buckets[index].label}:{" "}
                {formatCurrency(buckets[index].amountMinor)}
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
              x={chartPoints[index].x}
              y="252"
            >
              {bucket.label}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}
