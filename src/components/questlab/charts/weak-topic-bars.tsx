import { TopicBreakdownChart } from "@/components/questlab/charts/topic-breakdown-chart";
import type { ChartRow } from "@/components/questlab/charts/score-trend-chart";

export function WeakTopicBars({ rows }: { rows: ChartRow[] }) {
  return <TopicBreakdownChart rows={rows} color="var(--danger)" />;
}
