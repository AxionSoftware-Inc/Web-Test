import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackendSessionQuestionClient } from "@/features/test-engine/ui/backend-session-question-client";
import { SecondaryLink, TestShell } from "@/features/test-engine/ui/test-shell";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ sessionId: string; questionNumber: string }>;
};

export const metadata: Metadata = {
  title: "Question | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { sessionId, questionNumber } = await params;
  const session = await questApi.session(sessionId);
  const test = await questApi.test(session.test_slug);
  const questions = test.test_questions.map((item) => item.question);
  const index = Number(questionNumber) - 1;
  const question = questions[index];

  if (!question) {
    notFound();
  }

  return (
    <TestShell
      eyebrow={`Question ${index + 1} of ${questions.length}`}
      title={test.title}
      description="Answer state, flags and progress are saved through the DRF backend."
      actions={<SecondaryLink href={`/test-session/${sessionId}/review`}>Review</SecondaryLink>}
    >
      <BackendSessionQuestionClient
        initialSession={session}
        questionIndex={index}
        questions={questions}
        estimatedMinutes={test.estimated_minutes}
      />
    </TestShell>
  );
}
