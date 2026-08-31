import type { Metadata } from "next";

import { PrimaryLink, SecondaryLink, StatCard, TestShell } from "@/features/test-engine/ui/test-shell";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export const metadata: Metadata = {
  title: "Test Session | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await questApi.session(sessionId);
  const test = await questApi.test(session.test_slug);
  const questions = test.test_questions.map((item) => item.question);
  const answered = session.answers.filter((answer) => Boolean(answer.value)).length;
  const flagged = session.answers.filter((answer) => answer.is_flagged).length;

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
        <StatCard label="Time limit" value={`${test.estimated_minutes} min`} />
        <StatCard label="Progress" value={`${answered}/${questions.length}`} />
        <StatCard label="Flags" value={String(flagged)} />
      </section>
      <section className="rounded-lg border border-black/10 bg-white p-5">
        <h2 className="text-xl font-semibold">Session workspace</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
          Javoblar, flaglar va progress DRF backend orqali saqlanadi. Istalgan savolga qaytib, yakuniy yuborishdan oldin javoblarni tekshirishingiz mumkin.
        </p>
      </section>
    </TestShell>
  );
}
