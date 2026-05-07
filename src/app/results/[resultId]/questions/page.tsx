import type { Metadata } from "next";

import { getSessionIdFromResultId, getSessionTestOrThrow, getTestQuestions } from "@/features/test-engine/model/test-engine-content";
import { ResultQuestionsClient } from "@/features/test-engine/ui/result-questions-client";
import { TestShell } from "@/features/test-engine/ui/test-shell";

type PageProps = {
  params: Promise<{ resultId: string }>;
};

export const metadata: Metadata = {
  title: "Result Questions | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { resultId } = await params;
  const sessionId = getSessionIdFromResultId(resultId);
  const test = getSessionTestOrThrow(sessionId);
  const questions = getTestQuestions(test.id);

  return (
    <TestShell eyebrow="Question review" title={test.title} description="Review every question from this attempt.">
      <ResultQuestionsClient resultId={resultId} sessionId={sessionId} testSlug={test.id} questions={questions} />
    </TestShell>
  );
}
