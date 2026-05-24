import * as React from "react";

export function EmptyState({ title = "No data", copy }: { title?: React.ReactNode; copy?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface p-4 text-sm">
      <p className="font-semibold">{title}</p>
      {copy ? <p className="mt-1 text-muted">{copy}</p> : null}
    </div>
  );
}
