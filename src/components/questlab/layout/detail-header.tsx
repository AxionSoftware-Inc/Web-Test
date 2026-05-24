import * as React from "react";

import { StatusBadge } from "@/components/questlab/feedback/status-badge";

export function DetailHeader({ title, meta, status }: { title: React.ReactNode; meta?: React.ReactNode; status?: string }) {
  return (
    <div className="quest-card quest-detail-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {meta ? <p className="mt-1 text-sm text-muted">{meta}</p> : null}
      </div>
      {status ? <StatusBadge status={status}>{status}</StatusBadge> : null}
    </div>
  );
}
