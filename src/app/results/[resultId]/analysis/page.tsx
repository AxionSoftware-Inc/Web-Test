import type { Metadata } from "next";
import Link from "next/link";

import { TestShell } from "@/features/test-engine/ui/test-shell";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ resultId: string }>;
};

export const metadata: Metadata = {
  title: "Mistake Analysis | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { resultId } = await params;
  const session = await questApi.session(resultId);
  const test = await questApi.test(session.test_slug);
  const answerMap = new Map(session.answers.map((answer) => [answer.question, answer.value]));
  const skillMap = new Map<string, { correct: number; total: number }>();

  for (const item of test.test_questions) {
    const question = item.question;
    const isCorrect = normalize(question.answer) === normalize(answerMap.get(question.id) ?? "");
    const skills = question.skill_titles.length ? question.skill_titles : ["General algebra"];
    for (const skill of skills) {
      const current = skillMap.get(skill) ?? { correct: 0, total: 0 };
      skillMap.set(skill, { correct: current.correct + (isCorrect ? 1 : 0), total: current.total + 1 });
    }
  }

  const skills = [...skillMap.entries()]
    .map(([skill, value]) => ({ skill, ...value, percent: Math.round((value.correct / value.total) * 100) }))
    .sort((a, b) => a.percent - b.percent);

  return (
    <TestShell
      eyebrow="Mistake analysis"
      title="What you know and what to fix next"
      description="Skill-linked diagnosis backenddagi javoblardan hisoblanadi."
    >
      <section className="grid gap-5 py-8 lg:grid-cols-[1fr_340px]">
        <div className="rounded-3xl border border-black/10 bg-white p-6">
          <h2 className="text-xl font-semibold">Skill breakdown</h2>
          <div className="mt-5 grid gap-4">
            {skills.map((item) => (
              <div key={item.skill} className="rounded-2xl border border-black/8 bg-surface-soft p-4">
                <div className="flex justify-between gap-3 text-sm font-semibold">
                  <span>{item.skill}</span>
                  <span>{item.percent}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/8">
                  <div className="h-full rounded-full bg-gradient-to-r from-ink to-accent" style={{ width: `${item.percent}%` }} />
                </div>
                <p className="mt-2 text-xs text-black/45">{item.correct}/{item.total} correct</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-3xl border border-black/10 bg-ink p-5 text-white">
          <h2 className="text-xl font-semibold">Recovery flow</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-white/70">
            <p className="rounded-2xl bg-white/8 p-3">1. Review wrong questions.</p>
            <p className="rounded-2xl bg-white/8 p-3">2. Read recommended Algebra lesson.</p>
            <p className="rounded-2xl bg-white/8 p-3">3. Work targeted practice.</p>
            <p className="rounded-2xl bg-white/8 p-3">4. Retake the test.</p>
          </div>
          <Link href={`/results/${resultId}/questions`} className="mt-5 block rounded-2xl bg-accent px-4 py-3 text-center text-sm font-semibold text-ink">
            Review questions
          </Link>
        </aside>
      </section>
    </TestShell>
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "").replace(/\\/g, "");
}
