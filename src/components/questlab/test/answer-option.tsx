import * as React from "react";

import { cn } from "@/shared/lib/cn";

export function AnswerOption({ selected, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      className={cn("flex min-h-14 w-full items-start gap-3 rounded-[var(--radius-control)] border p-4 text-left text-sm leading-6 transition", selected ? "border-brand bg-brand-soft ring-4 ring-brand-ring" : "border-line bg-surface hover:border-line-strong hover:bg-surface-soft")}
      {...props}
    >
      {children}
    </button>
  );
}
