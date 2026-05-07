import type { Metadata } from "next";

import { getSessionTestOrThrow, getTestQuestions } from "@/features/test-engine/model/test-engine-content";
import { SessionResultClient } from "@/features/test-engine/ui/session-result-client";
import { TestShell } from "@/features/test-engine/ui/test-shell";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export const metadata: Metadata = {
  title: "Test Result | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { sessionId } = await params;
  const test = getSessionTestOrThrow(sessionId);
  const questions = getTestQuestions(test.id);

  return (
    <TestShell
      eyebrow="Result"
      title={test.title}
      description="Score is calculated from answers saved in the frontend fake backend."
    >
      <SessionResultClient sessionId={sessionId} testSlug={test.id} questions={questions} />
    </TestShell>
  );
}
