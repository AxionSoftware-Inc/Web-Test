import { ArrowRight, Binary, BookOpen, Calculator, ChartNoAxesColumn, CircleDot, FunctionSquare, Grid3X3, Infinity, PieChart, Sigma, Triangle } from "lucide-react";
import Link from "next/link";

import type { ApiTopic } from "@/shared/api/questlab-api";
import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

export function MathematicsPage({ topics }: { topics: ApiTopic[] }) {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-8">
        <header className="border-b border-black/10 pb-8">
          <Link href="/" className="text-sm font-semibold text-[#276a5b]">
            QuestLab
          </Link>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#276a5b]">
                Mathematics module
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight">
                Matematikani bo&apos;limlar orqali o&apos;rganish va test qilish.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">
                Avval bo&apos;limni tanlang: algebra, geometry, calculus yoki linear algebra.
                Daraja va testlar har bir bo&apos;lim ichida chiqadi, shunda user o&apos;zi
                izlayotgan mavzuga tez kiradi.
              </p>
            </div>
            <div className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 sm:grid-cols-3">
              <Metric label="Topics" value={topics.length} />
              <Metric label="Tests" value={topics.reduce((sum, topic) => sum + topic.test_count, 0)} />
              <Metric label="Source" value="API" />
            </div>
          </div>
        </header>

        <section className="py-8">
          <div className="mb-5 flex items-center gap-2">
            <BookOpen className="size-5 text-[#276a5b]" />
            <h2 className="text-2xl font-semibold">Bo&apos;limni tanlang</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {topics.map((topic) => {
              const Icon = topicIcons[topic.slug] ?? BookOpen;

              return (
                <GlassCard key={topic.slug} className="flex min-h-[210px] flex-col justify-between p-5">
                  <div>
                    <div className="grid size-14 place-items-center rounded-2xl bg-[#edf7f3] text-[#276a5b]">
                      <Icon className="size-7" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">{topic.title}</h3>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/subjects/mathematics/topics/${topic.slug}`}
                      className="inline-flex items-center gap-2 rounded-md bg-[#151713] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Open topic
                      <ArrowRight className="size-4" />
                    </Link>
                    <span className="text-sm text-black/45">{topic.test_count} test</span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>
      </Container>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-[#f7f7f2] p-4 text-center">
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-black/45">{label}</p>
    </div>
  );
}

const topicIcons: Record<string, typeof BookOpen> = {
  arithmetic: Calculator,
  algebra: FunctionSquare,
  geometry: Triangle,
  trigonometry: CircleDot,
  calculus: Infinity,
  "linear-algebra": Grid3X3,
  probability: PieChart,
  statistics: ChartNoAxesColumn,
  "differential-equations": Sigma,
  "discrete-math": Binary,
};
