import type { Metadata } from "next";
import Link from "next/link";

import { questApi } from "@/shared/api/questlab-api";
import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";
import { LatexText } from "@/shared/ui/latex-text";

export const metadata: Metadata = {
  title: "Questions | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const questions = await questApi.questions();

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-10">
        <GlassCard className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">Question bank</p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight">Savollar banki</h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">
            MVP bank existing testlardan savollarni ajratib ko&apos;rsatadi. Har savol solve, solution va discussion flowga ega.
          </p>
        </GlassCard>

        <section className="grid gap-4 py-8 md:grid-cols-2 xl:grid-cols-3">
          {questions.map((question) => (
            <Link key={question.id} href={`/questions/${question.id}`}>
              <GlassCard className="h-full p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-xl bg-[#edf7f3] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#276a5b]">
                    {question.difficulty}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-black/45">{question.type}</span>
                </div>
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-black/70"><LatexText text={question.prompt} /></p>
                <p className="mt-5 text-sm font-semibold text-[#276a5b]">Open question</p>
              </GlassCard>
            </Link>
          ))}
        </section>
      </Container>
    </main>
  );
}
