import { LoaderCircle, ShieldCheck } from "lucide-react";

export default function DashboardLoading() {
  return (
    <main
      aria-live="polite"
      className="min-h-[65vh] bg-[#f0f2f8] px-4 py-16 sm:px-6"
      role="status"
    >
      <div className="mx-auto flex min-h-80 max-w-3xl flex-col items-center justify-center rounded-[1.75rem] border border-[#dde2ef] bg-white p-8 text-center shadow-[0_24px_70px_-55px_rgba(23,33,61,0.55)]">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-[#edf0fb] text-[#526ab7]">
          <ShieldCheck aria-hidden="true" className="size-7" />
        </span>
        <LoaderCircle
          aria-hidden="true"
          className="mt-6 size-6 animate-spin text-[#526ab7]"
        />
        <h1 className="mt-4 text-lg font-black text-[#17213d]">
          Preparing your dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Verifying your account and loading the right workspace...
        </p>
      </div>
    </main>
  );
}
