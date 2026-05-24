import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";

export const metadata: Metadata = {
  title: "Targeted Algebra Practice | QuestLab",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-10">
        <GlassCard className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">
            Targeted practice
          </p>
          <h1 className="mt-3 max-w-4xl text-5xl font-semibold leading-tight">Fix weak Algebra skills</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">
            This page will become the practice session generated from mistake analysis. For now it shows the MVP recovery path.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Quadratic factoring", "5 quick questions", "Find factor pairs and write binomials."],
              ["Function substitution", "4 quick questions", "Replace x with input values carefully."],
              ["Calculation accuracy", "6 quick questions", "Reduce arithmetic mistakes under time pressure."],
            ].map(([title, copy, detail]) => (
              <div key={title} className="rounded-xl bg-white/58 p-4">
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-black/55">{copy}</p>
                <p className="mt-3 text-sm leading-6 text-black/60">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/test-session/demo-math-quadratic-beginner/question/1" className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white">
              Retake Algebra test
            </Link>
            <Link href="/learn/algebra-foundations/quadratics/factoring-basics" className="rounded-xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold">
              Review lesson
            </Link>
          </div>
        </GlassCard>
      </Container>
    </main>
  );
}
