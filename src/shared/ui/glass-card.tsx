import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function GlassCard({
  children,
  className,
  elevated = false,
}: {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-black/8 bg-white/82 shadow-[0_14px_40px_rgba(21,23,19,0.07)]",
        elevated && "bg-white/74 shadow-[0_24px_70px_rgba(21,23,19,0.11)] supports-[backdrop-filter]:backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}
