import type { Metadata } from "next";
import Link from "next/link";

import { questApi } from "@/shared/api/questlab-api";
import { Container } from "@/shared/ui/container";
import { GlassCard } from "@/shared/ui/glass-card";
import { LatexText } from "@/shared/ui/latex-text";

type PageProps = {
  params: Promise<{ questionId: string }>;
};

export const metadata: Metadata = {
  title: "Question | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { questionId } = await params;
  const question = await questApi.question(questionId);

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-10">
        <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <GlassCard className="p-6">
            <p className="text-sm font-semibold text-[#276a5b]">{question.topic} / {question.difficulty}</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight">Question #{question.id}</h1>
            <p className="mt-6 whitespace-pre-wrap text-lg leading-8"><LatexText text={question.prompt} /></p>
            <div className="mt-5 flex flex-wrap gap-2">
              {question.skill_titles.map((skill) => (
                <span key={skill} className="rounded-xl bg-[#edf7f3] px-3 py-2 text-sm font-semibold text-[#276a5b]">{skill}</span>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="text-xl font-semibold">Actions</h2>
            <div className="mt-4 grid gap-3">
              <Link href={`/questions/${question.id}/solve`} className="rounded-xl bg-[#151713] px-4 py-3 text-center text-sm font-semibold text-white">Solve</Link>
              <Link href={`/questions/${question.id}/solutions`} className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-center text-sm font-semibold">Solutions</Link>
              <Link href={`/questions/${question.id}/discussion`} className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-center text-sm font-semibold">Discussion</Link>
            </div>
          </GlassCard>
        </section>
      </Container>
    </main>
  );
}
