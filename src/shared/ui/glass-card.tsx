import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/55 bg-white/68 shadow-[0_24px_80px_rgba(21,23,19,0.10)] backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-px before:rounded-[15px] before:border before:border-white/55",
        "relative overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
