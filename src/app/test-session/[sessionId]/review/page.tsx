import type { Metadata } from "next";
import Link from "next/link";

import { TestShell } from "@/features/test-engine/ui/test-shell";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export const metadata: Metadata = {
  title: "Review Test Session | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await questApi.session(sessionId);
  const test = await questApi.test(session.test_slug);
  const questions = test.test_questions.map((item) => item.question);
  const answerMap = new Map(session.answers.map((answer) => [answer.question, answer]));
  const answered = questions.filter((question) => answerMap.get(question.id)?.value).length;
  const flagged = questions.filter((question) => answerMap.get(question.id)?.is_flagged).length;

  return (
    <TestShell
      eyebrow="Pre-submit review"
      title="Check your answers before submit"
      description="Review answered, unanswered and flagged questions before the final submit."
    >
      <section className="grid gap-5 py-8 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3">
          {questions.map((question, index) => {
            const answer = answerMap.get(question.id);
            return (
              <Link key={question.id} href={`/test-session/${sessionId}/question/${index + 1}`} className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Question {index + 1}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-black/55">{question.prompt}</p>
                </div>
                <div className="flex gap-2 text-sm font-semibold">
                  {answer?.is_flagged ? <span className="rounded-md bg-amber-50 px-3 py-1 text-amber-700">Flagged</span> : null}
                  <span className={answer?.value ? "rounded-md bg-brand-soft px-3 py-1 text-brand" : "rounded-md bg-danger-soft px-3 py-1 text-[#8d3d3d]"}>
                    {answer?.value ? "Answered" : "Unanswered"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <aside className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">Submit summary</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between border-b border-black/10 pb-2"><span>Answered</span><strong>{answered}</strong></div>
            <div className="flex justify-between border-b border-black/10 pb-2"><span>Unanswered</span><strong>{questions.length - answered}</strong></div>
            <div className="flex justify-between border-b border-black/10 pb-2"><span>Flagged</span><strong>{flagged}</strong></div>
          </div>
          <Link href={`/test-session/${sessionId}/submit`} className="mt-5 block rounded-md bg-ink px-4 py-3 text-center text-sm font-semibold text-white">Submit test</Link>
        </aside>
      </section>
    </TestShell>
  );
}
