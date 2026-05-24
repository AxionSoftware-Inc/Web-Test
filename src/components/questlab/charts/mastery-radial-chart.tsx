"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export function MasteryRadialChart({ label, value }: { label: string; value: number }) {
  const data = [{ name: label, value, fill: "var(--chart-1)" }];
  return (
    <div className="quest-card flex min-h-[96px] items-center gap-4 p-4">
      <div className="relative size-20">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart data={data} innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "var(--surface-soft)" }} isAnimationActive animationDuration={900} animationEasing="ease-out" />
          </RadialBarChart>
        </ResponsiveContainer>
        <span className="absolute inset-0 grid place-items-center text-sm font-semibold">{value}%</span>
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-sm text-muted">{value >= 75 ? "Stable" : value >= 60 ? "Needs review" : "Priority focus"}</p>
      </div>
    </div>
  );
}
