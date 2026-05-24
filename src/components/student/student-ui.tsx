"use client";

import Link from "next/link";

import type { ApiMistakesSummary, ApiProfileSummary } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { LatexText } from "@/shared/ui/latex-text";

export function StudentShell({ children }: { eyebrow?: string; title?: string; copy?: string; children: React.ReactNode; hideHeader?: boolean }) {
  return (
    <main className="min-h-screen bg-[#f7f7ef] px-3 py-3 text-[#151713] sm:px-4">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4">{children}</div>
      </div>
    </main>
  );
}

export function SummaryGrid({ stats }: { stats: Array<[string, string | number]> }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([label, value]) => (
        <div key={label} className="min-h-[94px] rounded-xl border border-black/8 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{label}</p>
          <p className="mt-2 line-clamp-2 text-2xl font-semibold">{value}</p>
        </div>
      ))}
    </section>
  );
}

export function MetricTile({ label, value, sub, tone }: { label: string; value: string | number; sub: string; tone: "green" | "red" | "neutral" }) {
  const toneClass = tone === "green" ? "bg-[#edf7f3] text-[#276a5b]" : tone === "red" ? "bg-[#f8eeee] text-[#a85050]" : "bg-[#fbfbf6] text-black/62";
  return (
    <div className={cn("rounded-xl p-4", toneClass)}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm opacity-70">{sub}</p>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-black/8 bg-white/70 p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CompactCard({ title, meta, href, action, status, stats = [] }: { title: string; meta?: string; href: string; action: string; status?: string; stats?: string[] }) {
  return (
    <Link href={href} className="flex min-h-[150px] flex-col rounded-xl border border-black/8 bg-white p-4 hover:bg-[#fbfbf6]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold leading-5"><LatexText text={title} /></h3>
          {meta ? <p className="mt-1 line-clamp-1 text-sm text-black/50"><LatexText text={meta} /></p> : null}
        </div>
        {status ? <Badge>{status.replace("_", " ")}</Badge> : null}
      </div>
      {stats.length ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-black/45">
          {stats.map((item) => <span key={item} className="rounded-lg bg-[#fbfbf6] px-2 py-1">{item}</span>)}
        </div>
      ) : null}
      <span className="mt-auto w-fit rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">{action}</span>
    </Link>
  );
}

export function MistakeCard({ mistake }: { mistake: ApiMistakesSummary["mistakes"][number] }) {
  return (
    <Link href={`/student/mistakes/${mistake.session_id}-${mistake.question_id}`} className="flex min-h-[170px] flex-col rounded-xl border border-black/8 bg-white p-4 hover:bg-[#fbfbf6]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#276a5b]">{mistake.topic}</p>
          <h3 className="mt-2 line-clamp-2 font-semibold leading-5"><LatexText text={mistake.prompt} /></h3>
        </div>
        <Badge>review</Badge>
      </div>
      <div className="mt-3 grid gap-1 text-sm text-black/55">
        <p className="line-clamp-1">{mistake.test_title}</p>
        <p className="line-clamp-1">{mistake.skills.join(", ") || "No skill tag"}</p>
      </div>
      <span className="mt-auto w-fit rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">Review</span>
    </Link>
  );
}

export function AnalyticsBars({ rows, tone = "default", empty }: { rows: Array<{ label: string; value: number; meta?: string }>; tone?: "default" | "critical" | "mastery"; empty: string }) {
  if (!rows.length) return <Empty text={empty} />;
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="grid gap-3">
      {rows.map((row) => {
        const width = tone === "mastery" ? row.value : Math.round((row.value / max) * 100);
        const bar = tone === "critical" ? "bg-[#a85050]" : tone === "mastery" ? "bg-[#276a5b]" : "bg-[#415f79]";
        return (
          <div key={row.label} className="rounded-xl border border-black/8 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{row.label}</p>
                {row.meta ? <p className="mt-1 truncate text-xs text-black/45">{row.meta}</p> : null}
              </div>
              <p className="shrink-0 text-sm font-semibold text-black/58">{row.value}{tone === "mastery" ? "%" : ""}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ecece3]">
              <div className={cn("h-full rounded-full", bar)} style={{ width: `${Math.max(3, Math.min(100, width))}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TrendChart({ rows }: { rows: Array<{ label: string; value: number; meta?: string }> }) {
  if (!rows.length) return <Empty text="Score trend uchun hali natija yo'q." />;
  return (
    <div className="rounded-xl border border-black/8 bg-white p-4">
      <div className="flex h-56 items-end gap-2 border-b border-l border-black/10 px-2 pb-2">
        {rows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end">
              <div className="w-full rounded-t-lg bg-[#276a5b]" style={{ height: `${Math.max(5, row.value)}%` }} />
            </div>
            <span className="max-w-full truncate text-[10px] font-semibold text-black/38">{index + 1}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2">
        {rows.slice(-3).map((row) => (
          <div key={row.label} className="flex justify-between gap-3 text-sm">
            <span className="truncate text-black/58">{row.label}</span>
            <strong>{row.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressRing({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-black/8 bg-white p-4">
      <div className="grid size-20 place-items-center rounded-full" style={{ background: `conic-gradient(#276a5b ${value * 3.6}deg, #ecece3 0deg)` }}>
        <div className="grid size-14 place-items-center rounded-full bg-white text-sm font-semibold">{value}%</div>
      </div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-sm text-black/50">{value >= 75 ? "Stable" : value >= 60 ? "Needs review" : "Priority focus"}</p>
      </div>
    </div>
  );
}

export function TopicActionList({ items }: { items: ApiProfileSummary["topic_progress"] }) {
  if (!items.length) return <Empty text="Zaif mavzular hozircha yo'q." />;
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <Link key={item.slug} href="/student/tests" className="grid gap-3 rounded-xl border border-black/8 bg-white p-4 hover:bg-[#fbfbf6] md:grid-cols-[32px_1fr_auto] md:items-center">
          <span className="grid size-8 place-items-center rounded-lg bg-[#f8eeee] text-sm font-semibold text-[#a85050]">{index + 1}</span>
          <div>
            <p className="font-semibold">{item.topic}</p>
            <p className="mt-1 text-sm text-black/50">{item.value}% mastery / {item.attempts} attempts</p>
          </div>
          <span className="rounded-xl bg-[#151713] px-4 py-2 text-sm font-semibold text-white">Practice</span>
        </Link>
      ))}
    </div>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 rounded-lg bg-[#edf7f3] px-2 py-1 text-xs font-semibold text-[#276a5b]">{children}</span>;
}

export function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-black/10 bg-[#fbfbf6] px-3 py-3 text-sm font-semibold outline-none focus:border-[#276a5b]">
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
        <input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value))))} className="w-20 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold outline-none" />
      </div>
    </label>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-black/12 bg-white p-4 text-sm text-black/55">{text}</p>;
}
