import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function PremiumPage({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("quest-page", className)}><div className="quest-container">{children}</div></main>;
}

export function PremiumPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("quest-panel p-5", className)}>{children}</section>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">{children}</p>;
}

export function FieldShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-black/65">
      {label}
      {children}
    </label>
  );
}

export const premiumInputClass = "rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-accent/20";
