import * as React from "react";

import { cn } from "@/shared/lib/cn";

type QuestPageVariant = "reading" | "dashboard" | "wide" | "table" | "test";

const containerByVariant: Record<QuestPageVariant, string> = {
  reading: "quest-container-reading",
  dashboard: "quest-container",
  wide: "quest-container-wide",
  table: "quest-container-table",
  test: "quest-container-test",
};

export function QuestPage({
  children,
  variant = "dashboard",
  className,
}: {
  children: React.ReactNode;
  variant?: QuestPageVariant;
  className?: string;
}) {
  return (
    <main className="quest-page">
      <div className={cn(containerByVariant[variant], className)}>
        <div className="quest-dashboard-grid">{children}</div>
      </div>
    </main>
  );
}
