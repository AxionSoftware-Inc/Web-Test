import * as React from "react";

import { cn } from "@/shared/lib/cn";

export function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-subtle focus:border-brand disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
