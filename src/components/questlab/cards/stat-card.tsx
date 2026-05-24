import * as React from "react";

import { Card } from "@/components/ui/card";

export function StatCard({ label, value, sub }: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Card className="quest-stat-card">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
      <p className="mt-2 line-clamp-2 text-2xl font-semibold">{value}</p>
      {sub ? <p className="mt-1 text-sm text-muted">{sub}</p> : null}
    </Card>
  );
}
