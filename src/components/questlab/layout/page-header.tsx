import * as React from "react";

import { cn } from "@/shared/lib/cn";

export function PageHeader({
  eyebrow,
  title,
  copy,
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  copy?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="grid gap-2">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold text-ink md:text-3xl">{title}</h1>
        {copy ? <p className="max-w-3xl text-sm leading-6 text-muted">{copy}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
