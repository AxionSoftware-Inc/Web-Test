"use client";

import Link from "next/link";

import { MasteryRadialChart } from "@/components/questlab/charts/mastery-radial-chart";
import { ScoreTrendChart } from "@/components/questlab/charts/score-trend-chart";
import { TopicBreakdownChart } from "@/components/questlab/charts/topic-breakdown-chart";
import { WeakTopicBars } from "@/components/questlab/charts/weak-topic-bars";
import { EmptyState } from "@/components/questlab/feedback/empty-state";
import { StatusBadge as QuestStatusBadge } from "@/components/questlab/feedback/status-badge";
import { PageHeader as QuestPageHeader } from "@/components/questlab/layout/page-header";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { MetricGrid } from "@/components/questlab/layout/metric-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ApiMistakesSummary, ApiProfileSummary } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { LatexText } from "@/shared/ui/latex-text";

export function StudentShell({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "reading" | "default" | "wide" | "table" | "test";
}) {
  const pageVariant = variant === "default" ? "dashboard" : variant;
  return <QuestPage variant={pageVariant}>{children}</QuestPage>;
}

export function PageHeader({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return <QuestPageHeader eyebrow={eyebrow} title={title} copy={copy} />;
}

export function SummaryGrid({ stats }: { stats: Array<[string, string | number]> }) {
  return (
    <MetricGrid>
      {stats.map(([label, value]) => (
        <Card key={label} className="quest-stat-card">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
          <p className="mt-2 line-clamp-2 text-2xl font-semibold">{value}</p>
        </Card>
      ))}
    </MetricGrid>
  );
}

export function MetricTile({ label, value, sub, tone }: { label: string; value: string | number; sub: string; tone: "green" | "red" | "neutral" }) {
  const toneClass = tone === "green" ? "bg-success-soft text-success" : tone === "red" ? "bg-danger-soft text-danger" : "bg-neutral-soft text-neutral";
  return (
    <div className={cn("rounded-[var(--radius-card)] p-4", toneClass)}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm opacity-70">{sub}</p>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export function CompactCard({ title, meta, href, action, status, stats = [] }: { title: string; meta?: string; href: string; action: string; status?: string; stats?: string[] }) {
  return (
    <Link href={href} className="quest-card flex min-h-[150px] flex-col p-4 transition hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 sm:text-base"><LatexText text={title} /></h3>
          {meta ? <p className="mt-1 line-clamp-1 text-sm text-muted"><LatexText text={meta} /></p> : null}
        </div>
        {status ? <StatusBadge status={status}>{status.replace("_", " ")}</StatusBadge> : null}
      </div>
      {stats.length ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-subtle">
          {stats.map((item) => <span key={item} className="rounded-lg bg-neutral-soft px-2 py-1">{item}</span>)}
        </div>
      ) : null}
      <Button asChild size="sm" className="mt-auto w-fit">
        <span>{action}</span>
      </Button>
    </Link>
  );
}

export function MistakeCard({ mistake }: { mistake: ApiMistakesSummary["mistakes"][number] }) {
  return (
    <Link href={`/student/mistakes/${mistake.session_id}-${mistake.question_id}`} className="quest-card flex min-h-[170px] flex-col p-4 transition hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-student">{mistake.topic}</p>
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 sm:text-base"><LatexText text={mistake.prompt} /></h3>
        </div>
        <StatusBadge status="failed">review</StatusBadge>
      </div>
      <div className="mt-3 grid gap-1 text-sm text-muted">
        <p className="line-clamp-1">{mistake.test_title}</p>
        <p className="line-clamp-1">{mistake.skills.join(", ") || "No skill tag"}</p>
      </div>
      <Button asChild size="sm" className="mt-auto w-fit">
        <span>Review mistakes</span>
      </Button>
    </Link>
  );
}

export function AnalyticsBars({ rows, tone = "default", empty }: { rows: Array<{ label: string; value: number; meta?: string }>; tone?: "default" | "critical" | "mastery"; empty: string }) {
  if (!rows.length) return <Empty text={empty} />;
  if (tone === "critical") return <WeakTopicBars rows={rows} />;
  return <TopicBreakdownChart rows={rows} color={tone === "mastery" ? "var(--success)" : "var(--chart-2)"} />;
}

export function TrendChart({ rows }: { rows: Array<{ label: string; value: number; meta?: string }> }) {
  if (!rows.length) return <Empty text="Score trend uchun hali natija yo'q." />;
  return <ScoreTrendChart rows={rows} />;
}

export function ProgressRing({ label, value }: { label: string; value: number }) {
  return <MasteryRadialChart label={label} value={value} />;
}

export function TopicActionList({ items }: { items: ApiProfileSummary["topic_progress"] }) {
  if (!items.length) return <Empty text="Zaif mavzular hozircha yo'q." />;
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <Link key={item.slug} href="/student/tests" className="quest-card grid gap-3 p-4 transition hover:bg-surface-soft md:grid-cols-[32px_1fr_auto] md:items-center">
          <span className="grid size-8 place-items-center rounded-lg bg-danger-soft text-sm font-semibold text-danger">{index + 1}</span>
          <div>
            <p className="text-sm font-semibold sm:text-base">{item.topic}</p>
            <p className="mt-1 text-sm text-muted">{item.value}% mastery / {item.attempts} attempts</p>
          </div>
          <span className="rounded-[var(--radius-control)] bg-brand px-4 py-2 text-sm font-semibold text-white">Practice</span>
        </Link>
      ))}
    </div>
  );
}

export function StatusBadge({ children, status = "neutral" }: { children: React.ReactNode; status?: string }) {
  return <QuestStatusBadge status={status}>{children}</QuestStatusBadge>;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <StatusBadge status={String(children)}>{children}</StatusBadge>;
}

export function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-[var(--radius-control)] border border-line bg-surface-soft px-3 py-3 text-sm font-semibold outline-none focus:border-brand">
        <option value="all">All</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full" />
        <input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value))))} className="w-20 rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm font-semibold outline-none" />
      </div>
    </label>
  );
}

export function Empty({ text }: { text: string }) {
  return <EmptyState title={text} />;
}
