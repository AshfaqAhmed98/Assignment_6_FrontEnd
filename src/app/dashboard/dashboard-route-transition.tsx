"use client";

import type { ReactNode } from "react";

export function DashboardRouteTransition({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="relative min-w-0">{children}</div>;
}
