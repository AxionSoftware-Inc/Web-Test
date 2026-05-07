import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSessionTestOrThrow, getTestQuestions } from "@/features/test-engine/model/test-engine-content";
import { SessionQuestionClient } from "@/features/test-engine/ui/session-question-client";
import { SecondaryLink, TestShell } from "@/features/test-engine/ui/test-shell";

type PageProps = {
  params: Promise<{ sessionId: string; questionNumber: string }>;
};

export const metadata: Metadata = {
  title: "Question | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { sessionId, questionNumber } = await params;
  const test = getSessionTestOrThrow(sessionId);
  const questions = getTestQuestions(test.id);
  const index = Number(questionNumber) - 1;
  const question = questions[index];

  if (!question) {
    notFound();
  }

  return (
    <TestShell
      eyebrow={`Question ${index + 1} of ${questions.length}`}
      title={test.title}
      description="Answer state, flags and visited questions are saved in the frontend fake backend."
      actions={<SecondaryLink href={`/test-session/${sessionId}/review`}>Review</SecondaryLink>}
    >
      <SessionQuestionClient
        sessionId={sessionId}
        testSlug={test.id}
        questionIndex={index}
        questions={questions}
        estimatedMinutes={test.estimatedMinutes}
      />
    </TestShell>
  );
}
