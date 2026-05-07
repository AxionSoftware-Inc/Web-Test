import Link from "next/link";

import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

type LessonStep = {
  title: string;
  copy: string;
};

export function AlgebraLessonPage({
  eyebrow,
  title,
  copy,
  steps,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  steps: LessonStep[];
}) {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-10">
        <GlassCard className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-tight">{title}</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">{copy}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-xl bg-white/58 p-4">
                <span className="grid size-8 place-items-center rounded-lg bg-[#151713] text-sm font-semibold text-white">{index + 1}</span>
                <h2 className="mt-4 font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-black/60">{step.copy}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/practice/algebra/targeted" className="rounded-xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white">
              Practice this skill
            </Link>
            <Link href="/subjects/mathematics/topics/algebra" className="rounded-xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold">
              Back to Algebra
            </Link>
          </div>
        </GlassCard>
      </Container>
    </main>
  );
}
