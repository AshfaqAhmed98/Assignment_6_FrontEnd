type DashboardDataSkeletonProps = {
  label: string;
  variant?: "detail" | "overview" | "table" | "equipment";
};

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-slate-200 ${className}`}
    />
  );
}

export function DashboardDataSkeleton({
  label,
  variant = "table",
}: DashboardDataSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="mt-5 space-y-4"
      role="status"
    >
      <span className="sr-only">{label}</span>
      {variant === "overview" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                aria-hidden="true"
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
                key={index}
              >
                <SkeletonBlock className="size-11 rounded-xl" />
                <SkeletonBlock className="h-3 w-2/3" />
                <SkeletonBlock className="h-7 w-1/3" />
                <SkeletonBlock className="h-3 w-4/5" />
              </div>
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                aria-hidden="true"
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
                key={index}
              >
                <SkeletonBlock className="h-5 w-1/3" />
                <SkeletonBlock className="h-48 w-full" />
              </div>
            ))}
          </div>
        </>
      ) : variant === "equipment" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              aria-hidden="true"
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4"
              key={index}
            >
              <SkeletonBlock className="h-48 w-full rounded-2xl" />
              <SkeletonBlock className="mt-4 h-5 w-4/5" />
              <SkeletonBlock className="mt-3 h-4 w-2/3" />
              <SkeletonBlock className="mt-5 h-10 w-full" />
            </div>
          ))}
        </div>
      ) : variant === "detail" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <SkeletonBlock className="min-h-[420px] rounded-2xl" />
          <div
            aria-hidden="true"
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8"
          >
            <SkeletonBlock className="h-4 w-1/4" />
            <SkeletonBlock className="h-8 w-3/4" />
            <SkeletonBlock className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <SkeletonBlock className="h-20" />
              <SkeletonBlock className="h-20" />
            </div>
            <SkeletonBlock className="h-32 w-full" />
          </div>
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-4 sm:grid-cols-6">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonBlock
                className="h-3 w-full"
                key={index}
              />
            ))}
          </div>
          <div className="space-y-4 pt-4">
            {Array.from({ length: 4 }, (_, row) => (
              <div
                className="grid grid-cols-3 gap-3 sm:grid-cols-6"
                key={row}
              >
                {Array.from({ length: 6 }, (_, column) => (
                  <SkeletonBlock
                    className={`h-4 w-full ${column > 2 ? "hidden sm:block" : ""}`}
                    key={column}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
