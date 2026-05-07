import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionIdFromResultId, getSessionTestOrThrow, getTestQuestions } from "@/features/test-engine/model/test-engine-content";
import { ResultQuestionDetailClient } from "@/features/test-engine/ui/result-question-detail-client";
import { PrimaryLink, SecondaryLink, TestShell } from "@/features/test-engine/ui/test-shell";

type PageProps = {
  params: Promise<{ resultId: string; questionId: string }>;
};

export const metadata: Metadata = {
  title: "Question Result | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { resultId, questionId } = await params;
  const sessionId = getSessionIdFromResultId(resultId);
  const test = getSessionTestOrThrow(sessionId);
  const questions = getTestQuestions(test.id);
  const question = questions.find((item) => item.id === questionId);

  if (!question) {
    notFound();
  }

  return (
    <TestShell
      eyebrow="Single question review"
      title={test.title}
      description="Question, correct answer, explanation and recovery links."
      actions={
        <>
          <PrimaryLink href={`/practice/${test.category.toLowerCase().replace(/\s+/g, "-")}`}>Practice similar</PrimaryLink>
          <SecondaryLink href={`/results/${resultId}/questions`}>Back to questions</SecondaryLink>
        </>
      }
    >
      <section className="grid gap-5 py-8 lg:grid-cols-[1fr_320px]">
        <ResultQuestionDetailClient sessionId={sessionId} testSlug={test.id} question={question} />
        <aside className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="font-semibold">Recovery path</h2>
          <p className="mt-3 text-sm leading-6 text-black/60">
            Connect this panel to a lesson, topic practice set and similar questions once the learning routes are added.
          </p>
        </aside>
      </section>
    </TestShell>
  );
}
