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
  title: "Solve Question | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { questionId } = await params;
  const question = await questApi.question(questionId);

  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-10">
        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <GlassCard className="p-6">
            <p className="text-sm font-semibold text-brand">Solve mode</p>
            <p className="mt-6 whitespace-pre-wrap text-lg leading-8"><LatexText text={question.prompt} /></p>
            {question.options.length > 0 ? (
              <div className="mt-6 grid gap-3">
                {question.options.map((option, index) => (
                  <button key={option} type="button" className="rounded-xl border border-black/10 bg-white/58 px-4 py-4 text-left text-sm">
                    {String.fromCharCode(65 + index)}. <LatexText text={option} />
                  </button>
                ))}
              </div>
            ) : (
              <input className="mt-6 w-full rounded-xl border border-black/10 bg-white/58 px-4 py-4 text-sm outline-none" placeholder="Your answer" />
            )}
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="text-xl font-semibold">Demo actions</h2>
            <div className="mt-4 grid gap-3">
              <Link href={`/questions/${question.id}/solutions`} className="rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white">Show solution</Link>
              <Link href="/practice/algebra/targeted" className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-center text-sm font-semibold">Practice similar</Link>
            </div>
          </GlassCard>
        </section>
      </Container>
    </main>
  );
}
