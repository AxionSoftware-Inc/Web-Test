import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function PremiumPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn("min-h-screen bg-background px-5 py-8 text-ink sm:px-8 lg:px-10", className)}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}

export function PremiumPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[28px] border border-black/8 bg-white p-5 shadow-[0_18px_55px_rgba(21,23,19,0.07)]", className)}>
      {children}
    </section>
  );
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
