import type { ReactNode } from "react";
import { DashboardProvider } from "./dashboard-context";

export const instant = false;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardProvider>{children}</DashboardProvider>;
}
