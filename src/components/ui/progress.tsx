import * as React from "react";

import { cn } from "@/shared/lib/cn";

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-neutral-soft", className)}>
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
