import type { Metadata } from "next";
import Link from "next/link";

import { TestShell } from "@/features/test-engine/ui/test-shell";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export const metadata: Metadata = {
  title: "Test Result | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await questApi.session(sessionId);
  const test = await questApi.test(session.test_slug);
  const questions = test.test_questions.map((item) => item.question);
  const answerMap = new Map(session.answers.map((answer) => [answer.question, answer]));
  const correct = questions.filter((question) => normalize(question.answer) === normalize(answerMap.get(question.id)?.value ?? "")).length;
  const answered = questions.filter((question) => answerMap.get(question.id)?.value).length;
  const percent = Math.round((correct / questions.length) * 100);

  return (
    <TestShell
      eyebrow="Result"
      title={test.title}
      description="Score is calculated from answers saved in the DRF backend."
    >
      <section className="grid gap-5 py-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-black/10 bg-white p-6">
          <p className="text-sm font-semibold text-brand">Final score</p>
          <h2 className="mt-3 text-6xl font-semibold">{percent}%</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-md bg-brand-soft p-4"><p className="text-sm text-black/55">Correct</p><p className="mt-1 text-2xl font-semibold">{correct}/{questions.length}</p></div>
            <div className="rounded-md bg-surface-soft p-4"><p className="text-sm text-black/55">Answered</p><p className="mt-1 text-2xl font-semibold">{answered}</p></div>
            <div className="rounded-md bg-danger-soft p-4"><p className="text-sm text-black/55">Skipped</p><p className="mt-1 text-2xl font-semibold">{questions.length - answered}</p></div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/tests" className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">
              Back to tests
            </Link>
            <Link href={`/test-session/${sessionId}/review`} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold">
              Review answers
            </Link>
          </div>
        </div>
      </section>
    </TestShell>
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "").replace(/\\/g, "");
}
