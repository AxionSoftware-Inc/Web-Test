"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ApiMistakesSummary, ApiProfileSummary } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { LatexText } from "@/shared/ui/latex-text";

export function StudentShell({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "table" | "test";
}) {
  const container =
    variant === "test"
      ? "quest-container-test"
      : variant === "table"
        ? "quest-container-table"
        : "quest-container";

  return (
    <main className="quest-page">
      <div className={container}>
        <div className="quest-dashboard-grid">{children}</div>
      </div>
    </main>
  );
}

export function PageHeader({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return (
    <header className="grid gap-2">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.12em] text-student">{eyebrow}</p> : null}
      <h1 className="text-2xl font-semibold text-ink md:text-3xl">{title}</h1>
      {copy ? <p className="max-w-3xl text-sm leading-6 text-muted">{copy}</p> : null}
    </header>
  );
}

export function SummaryGrid({ stats }: { stats: Array<[string, string | number]> }) {
  return (
    <section className="quest-metric-grid">
      {stats.map(([label, value]) => (
        <div key={label} className="quest-card min-h-[96px] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
          <p className="mt-2 line-clamp-2 text-2xl font-semibold">{value}</p>
        </div>
      ))}
    </section>
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
    <section className="quest-card p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
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
      <span className="mt-auto w-fit rounded-[var(--radius-control)] bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover">{action}</span>
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
      <span className="mt-auto w-fit rounded-[var(--radius-control)] bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover">Review mistakes</span>
    </Link>
  );
}

export function AnalyticsBars({ rows, tone = "default", empty }: { rows: Array<{ label: string; value: number; meta?: string }>; tone?: "default" | "critical" | "mastery"; empty: string }) {
  if (!rows.length) return <Empty text={empty} />;
  const color = tone === "critical" ? "var(--danger)" : tone === "mastery" ? "var(--success)" : "var(--chart-2)";
  const data = rows.map((row) => ({ ...row, displayValue: tone === "mastery" ? row.value : row.value }));
  return (
    <div className="quest-card h-[280px] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 18, bottom: 4, left: 12 }}>
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis dataKey="label" type="category" width={110} stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-soft)" }} />
          <Bar dataKey="displayValue" radius={[0, 8, 8, 0]} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({ rows }: { rows: Array<{ label: string; value: number; meta?: string }> }) {
  if (!rows.length) return <Empty text="Score trend uchun hali natija yo'q." />;
  return (
    <div className="quest-card h-[280px] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="studentScoreTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.24} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(_, index) => String(index + 1)} />
          <YAxis domain={[0, 100]} stroke="var(--chart-axis)" tickLine={false} axisLine={false} fontSize={12} width={32} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} fill="url(#studentScoreTrend)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProgressRing({ label, value }: { label: string; value: number }) {
  const data = [{ name: label, value, fill: "var(--chart-1)" }];
  return (
    <div className="quest-card flex min-h-[96px] items-center gap-4 p-4">
      <div className="relative size-20">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart data={data} innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "var(--surface-soft)" }} />
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
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const tone =
    ["assigned", "info", "available", "review"].includes(normalized) ? "bg-info-soft text-info" :
    ["in_progress", "pending", "active"].includes(normalized) ? "bg-warning-soft text-warning" :
    ["completed", "mastery", "done", "correct", "published"].includes(normalized) ? "bg-success-soft text-success" :
    ["failed", "expired", "weak", "wrong"].includes(normalized) ? "bg-danger-soft text-danger" :
    ["student"].includes(normalized) ? "bg-student-soft text-student" :
    "bg-neutral-soft text-neutral";
  return <span className={cn("shrink-0 rounded-lg px-2 py-1 text-xs font-semibold", tone)}>{children}</span>;
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
  return <p className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface p-4 text-sm text-muted">{text}</p>;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number; payload?: { meta?: string } }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-1 text-muted">{item.value}</p>
      {item.payload?.meta ? <p className="mt-1 text-subtle">{item.payload.meta}</p> : null}
    </div>
  );
}
