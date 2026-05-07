import type { Metadata } from "next";

import { getSessionTestOrThrow, getTestQuestions } from "@/features/test-engine/model/test-engine-content";
import { PrimaryLink, SecondaryLink, StatCard, TestShell } from "@/features/test-engine/ui/test-shell";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export const metadata: Metadata = {
  title: "Test Session | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { sessionId } = await params;
  const test = getSessionTestOrThrow(sessionId);
  const questions = getTestQuestions(test.id);

  return (
    <TestShell
      eyebrow="Active test session"
      title={test.title}
      description="Session workspace entry. The direct question URL keeps refresh, deep link and future proctoring state clean."
      actions={
        <>
          <PrimaryLink href={`/test-session/${sessionId}/question/1`}>Open question 1</PrimaryLink>
          <SecondaryLink href={`/test-session/${sessionId}/review`}>Review answers</SecondaryLink>
        </>
      }
    >
      <section className="grid gap-4 py-8 md:grid-cols-3">
        <StatCard label="Timer" value={`${test.estimatedMinutes}:00`} />
        <StatCard label="Progress" value={`0/${questions.length}`} />
        <StatCard label="Flags" value="0" />
      </section>
      <section className="rounded-lg border border-black/10 bg-white p-5">
        <h2 className="text-xl font-semibold">Session workspace</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
          Answers, flags and visited questions are saved in a fake frontend backend using localStorage. This keeps the MVP usable before adding a real database.
        </p>
      </section>
    </TestShell>
  );
}
