import * as React from "react";

import { cn } from "@/shared/lib/cn";

export function MetricGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("quest-metric-grid", className)}>{children}</section>;
}
