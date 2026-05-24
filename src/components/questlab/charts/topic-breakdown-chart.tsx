"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/questlab/charts/chart-tooltip";
import { EmptyState } from "@/components/questlab/feedback/empty-state";
import type { ChartRow } from "@/components/questlab/charts/score-trend-chart";

export function TopicBreakdownChart({ rows, color = "var(--chart-2)" }: { rows: ChartRow[]; color?: string }) {
  if (!rows.length) return <EmptyState title="No topic data" />;
  return (
    <div className="quest-card h-[280px] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 18, bottom: 4, left: 12 }}>
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis dataKey="label" type="category" width={120} stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-soft)" }} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} fill={color} isAnimationActive animationDuration={850} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
