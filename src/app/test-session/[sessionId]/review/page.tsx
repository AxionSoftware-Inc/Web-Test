import type { Metadata } from "next";

import { getSessionTestOrThrow, getTestQuestions } from "@/features/test-engine/model/test-engine-content";
import { SessionReviewClient } from "@/features/test-engine/ui/session-review-client";
import { TestShell } from "@/features/test-engine/ui/test-shell";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export const metadata: Metadata = {
  title: "Review Test Session | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { sessionId } = await params;
  const test = getSessionTestOrThrow(sessionId);
  const questions = getTestQuestions(test.id);

  return (
    <TestShell
      eyebrow="Pre-submit review"
      title="Check your answers before submit"
      description="Review answered, unanswered and flagged questions before the final submit."
    >
      <SessionReviewClient sessionId={sessionId} testSlug={test.id} questions={questions} />
    </TestShell>
  );
}
