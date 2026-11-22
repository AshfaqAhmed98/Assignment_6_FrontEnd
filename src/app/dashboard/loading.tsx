import { DashboardDataSkeleton } from "@/components/ui/dashboard-data-skeleton";

export default function DashboardLoading() {
  return (
    <main
      className="min-h-[65vh] bg-background px-4 py-16 sm:px-6"
    >
      <DashboardDataSkeleton
        label="Verifying your account and loading the right workspace..."
        variant="overview"
      />
    </main>
  );
}
