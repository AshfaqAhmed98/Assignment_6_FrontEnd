import { ShieldCheck } from "lucide-react";
import { EquipmentLoader } from "@/components/ui/equipment-loader";

export default function DashboardLoading() {
  return (
    <main
      className="min-h-[65vh] bg-background px-4 py-16 sm:px-6"
    >
      <div className="mx-auto flex min-h-80 max-w-3xl flex-col items-center justify-center rounded-[1.75rem] border border-border bg-card p-8 text-center shadow-[0_24px_70px_-55px_rgba(23,33,61,0.55)]">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <ShieldCheck aria-hidden="true" className="size-7" />
        </span>
        <EquipmentLoader
          className="mt-5"
          message="Verifying your account and loading the right workspace..."
          title="Preparing your dashboard"
        />
      </div>
    </main>
  );
}
