"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard route error:", error);
  }, [error]);

  return (
    <main className="min-h-[65vh] bg-[#f0f2f8] px-4 py-16 sm:px-6">
      <section
        aria-labelledby="dashboard-error-heading"
        className="mx-auto flex min-h-80 max-w-3xl flex-col items-center justify-center rounded-[1.75rem] border border-rose-200 bg-white p-8 text-center shadow-[0_24px_70px_-55px_rgba(23,33,61,0.55)]"
        role="alert"
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
          <AlertTriangle aria-hidden="true" className="size-7" />
        </span>
        <h1
          className="mt-5 text-xl font-black text-[#17213d]"
          id="dashboard-error-heading"
        >
          We couldn’t load this dashboard
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          Something went wrong while opening your workspace. Your account data
          has not been changed. Try again, or return to the dashboard overview.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#17213d] px-4 text-sm font-extrabold text-white transition hover:bg-[#263866] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526ab7]"
            onClick={reset}
            type="button"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Try again
          </button>
          <a
            className="inline-flex min-h-11 items-center rounded-xl border border-[#dde2ef] px-4 text-sm font-extrabold text-[#344675] transition hover:bg-[#f3f5fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526ab7]"
            href="/dashboard"
          >
            Dashboard overview
          </a>
        </div>
      </section>
    </main>
  );
}
