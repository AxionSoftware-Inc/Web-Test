"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/questlab/charts/chart-tooltip";
import { EmptyState } from "@/components/questlab/feedback/empty-state";

export type ChartRow = { label: string; value: number; meta?: string };

export function ScoreTrendChart({ rows }: { rows: ChartRow[] }) {
  if (!rows.length) return <EmptyState title="No score trend" />;
  return (
    <div className="quest-card h-[280px] p-4">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 1, height: 1 }}>
        <AreaChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="scoreTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.24} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(_, index) => String(index + 1)} />
          <YAxis domain={[0, 100]} stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} width={32} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} fill="url(#scoreTrendFill)" isAnimationActive animationDuration={900} animationEasing="ease-out" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
