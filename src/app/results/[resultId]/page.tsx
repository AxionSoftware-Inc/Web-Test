import type { Metadata } from "next";
import Link from "next/link";

import { TestShell } from "@/features/test-engine/ui/test-shell";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ resultId: string }>;
};

export const metadata: Metadata = {
  title: "Result Detail | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { resultId } = await params;
  const session = await questApi.session(resultId);
  const test = await questApi.test(session.test_slug);
  const questions = test.test_questions.map((item) => item.question);
  const answerMap = new Map(session.answers.map((answer) => [answer.question, answer.value]));
  const correct = questions.filter((question) => normalize(question.answer) === normalize(answerMap.get(question.id) ?? "")).length;
  const answered = questions.filter((question) => answerMap.get(question.id)).length;
  const percent = questions.length ? Math.round((correct / questions.length) * 100) : 0;

  return (
    <TestShell eyebrow="Detailed result" title={test.title} description="Backend session asosidagi score, breakdown va keyingi qadamlar.">
      <section className="grid gap-5 py-8 lg:grid-cols-[1fr_340px]">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-brand">Final score</p>
          <h2 className="mt-3 text-6xl font-semibold">{percent}%</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Metric label="Correct" value={`${correct}/${questions.length}`} tone="green" />
            <Metric label="Answered" value={answered} tone="neutral" />
            <Metric label="Skipped" value={questions.length - answered} tone="red" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/results/${resultId}/analysis`} className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">
              Mistake analysis
            </Link>
            <Link href={`/results/${resultId}/questions`} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold">
              Review questions
            </Link>
            <Link href={`/tests/${test.slug}`} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold">
              Retake
            </Link>
          </div>
        </div>
        <aside className="rounded-3xl border border-black/10 bg-ink p-5 text-white">
          <h2 className="text-xl font-semibold">Next step</h2>
          <p className="mt-3 text-sm leading-6 text-white/68">
            Xato savollarni review qiling, keyin analysis sahifasidagi weak skill bo‘yicha targeted practicega o‘ting.
          </p>
          <Link href="/subjects/mathematics/topics/algebra" className="mt-5 block rounded-2xl bg-accent px-4 py-3 text-center text-sm font-semibold text-ink">
            Continue Algebra
          </Link>
        </aside>
      </section>
    </TestShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: "green" | "neutral" | "red" }) {
  const bg = tone === "green" ? "bg-brand-soft" : tone === "red" ? "bg-danger-soft" : "bg-surface-soft";
  return (
    <div className={`${bg} rounded-2xl p-4`}>
      <p className="text-sm text-black/55">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "").replace(/\\/g, "");
}
