import {
  Binary,
  BookOpen,
  Calculator,
  ChartNoAxesColumn,
  ChevronRight,
  CircleDot,
  FunctionSquare,
  Grid3X3,
  Infinity,
  PieChart,
  Sigma,
  Triangle,
} from "lucide-react";
import Link from "next/link";

import type { ApiTopic } from "@/shared/api/questlab-api";
import { Container } from "@/shared/ui/container";

export function MathematicsPage({ topics }: { topics: ApiTopic[] }) {
  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-8 sm:py-12">
        <div className="pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Matematika
          </h1>
          <p className="mt-2 text-sm text-ink/60 sm:text-base">
            O&apos;rganmoqchi bo&apos;lgan bo&apos;limni tanlang va testlarni boshlang.
          </p>
        </div>

        <section className="py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => {
              const Icon = topicIcons[topic.slug] ?? BookOpen;

              return (
                <Link
                  key={topic.slug}
                  href={`/subjects/mathematics/topics/${topic.slug}`}
                  className="group flex items-center justify-between rounded-2xl border border-black/8 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-soft text-brand transition-colors duration-200 group-hover:bg-brand group-hover:text-white">
                      <Icon className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-ink transition-colors group-hover:text-brand">
                        {topic.title}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-ink/45">
                        {topic.test_count} ta test
                      </p>
                    </div>
                  </div>
                  <div className="grid size-8 shrink-0 place-items-center text-black/25 transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand">
                    <ChevronRight className="size-5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </Container>
    </main>
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
