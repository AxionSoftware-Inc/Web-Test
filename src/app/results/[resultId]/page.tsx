import type { Metadata } from "next";

import { getSessionIdFromResultId, getSessionTestOrThrow, getTestQuestions } from "@/features/test-engine/model/test-engine-content";
import { ResultDetailClient } from "@/features/test-engine/ui/result-detail-client";
import { TestShell } from "@/features/test-engine/ui/test-shell";

type PageProps = {
  params: Promise<{ resultId: string }>;
};

export const metadata: Metadata = {
  title: "Result Detail | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { resultId } = await params;
  const sessionId = getSessionIdFromResultId(resultId);
  const test = getSessionTestOrThrow(sessionId);
  const questions = getTestQuestions(test.id);
  const topicSlug = test.category.toLowerCase().replace(/\s+/g, "-");

  return (
    <TestShell
      eyebrow="Detailed result"
      title={test.title}
      description="Result detail page with score, breakdown and recommended next actions."
    >
      <ResultDetailClient
        resultId={resultId}
        sessionId={sessionId}
        testSlug={test.id}
        questions={questions}
        topicSlug={topicSlug}
      />
    </TestShell>
  );
}
