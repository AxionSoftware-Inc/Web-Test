import type { Metadata } from "next";

import { getSessionIdFromResultId, getSessionTestOrThrow, getTestQuestions } from "@/features/test-engine/model/test-engine-content";
import { MistakeAnalysisClient } from "@/features/test-engine/ui/mistake-analysis-client";
import { TestShell } from "@/features/test-engine/ui/test-shell";

type PageProps = {
  params: Promise<{ resultId: string }>;
};

export const metadata: Metadata = {
  title: "Mistake Analysis | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { resultId } = await params;
  const sessionId = getSessionIdFromResultId(resultId);
  const test = getSessionTestOrThrow(sessionId);
  const questions = getTestQuestions(test.id);

  return (
    <TestShell
      eyebrow="Mistake analysis"
      title="What you know and what to fix next"
      description="Skill-linked diagnosis based on your answers. This is the bridge from test result to lesson and targeted practice."
    >
      <MistakeAnalysisClient sessionId={sessionId} testSlug={test.id} questions={questions} />
    </TestShell>
  );
}
