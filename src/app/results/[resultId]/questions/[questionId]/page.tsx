import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { PrimaryLink, SecondaryLink, TestShell } from "@/features/test-engine/ui/test-shell";
import { questApi } from "@/shared/api/questlab-api";
import { LatexText } from "@/shared/ui/latex-text";

type PageProps = {
  params: Promise<{ resultId: string; questionId: string }>;
};

export const metadata: Metadata = {
  title: "Question Result | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { resultId, questionId } = await params;
  const session = await questApi.session(resultId);
  const test = await questApi.test(session.test_slug);
  const question = test.test_questions.map((item) => item.question).find((item) => String(item.id) === questionId);
  const answer = session.answers.find((item) => String(item.question) === questionId);

  if (!question) notFound();

  const userAnswer = answer?.value ?? "";
  const isCorrect = normalize(question.answer) === normalize(userAnswer);

  return (
    <TestShell
      eyebrow="Single question review"
      title={test.title}
      description="Question, user answer, correct answer and explanation."
      actions={
        <>
          <PrimaryLink href="/practice/algebra">Practice similar</PrimaryLink>
          <SecondaryLink href={`/results/${resultId}/questions`}>Back to questions</SecondaryLink>
        </>
      }
    >
      <section className="grid gap-5 py-8 lg:grid-cols-[1fr_320px]">
        <article className="rounded-3xl border border-black/10 bg-white p-6">
          <span className={`rounded-xl px-3 py-2 text-sm font-semibold ${isCorrect ? "bg-brand-soft text-brand" : "bg-danger-soft text-red-700"}`}>
            {isCorrect ? "Correct" : "Needs review"}
          </span>
          <div className="mt-5 text-xl font-semibold"><LatexText text={question.prompt} /></div>
          <div className="mt-5 grid gap-3">
            {question.options.map((option) => (
              <div key={option} className="rounded-2xl border border-black/8 bg-surface-soft p-4 text-sm">
                <LatexText text={option} />
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Info label="Your answer" value={userAnswer || "Skipped"} />
            <Info label="Correct answer" value={question.answer} />
          </div>
          <div className="mt-6 rounded-2xl bg-brand-soft p-4">
            <p className="text-sm font-semibold text-brand">Explanation</p>
            <p className="mt-2 text-sm leading-6 text-black/66"><LatexText text={question.explanation} /></p>
          </div>
        </article>
        <aside className="rounded-3xl border border-black/10 bg-ink p-5 text-white">
          <h2 className="font-semibold">Recovery path</h2>
          <p className="mt-3 text-sm leading-6 text-white/68">
            Shu skill bo‘yicha targeted practice ishlang va testni qayta topshiring.
          </p>
          <Link href="/subjects/mathematics/topics/algebra" className="mt-5 block rounded-2xl bg-accent px-4 py-3 text-center text-sm font-semibold text-ink">
            Open Algebra
          </Link>
        </aside>
      </section>
    </TestShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-surface-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">{label}</p>
      <p className="mt-2 font-semibold"><LatexText text={value} /></p>
    </div>
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "").replace(/\\/g, "");
}
