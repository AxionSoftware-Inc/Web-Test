import type { Metadata } from "next";
import Link from "next/link";

import { TestShell } from "@/features/test-engine/ui/test-shell";
import { questApi } from "@/shared/api/questlab-api";
import { LatexText } from "@/shared/ui/latex-text";

type PageProps = {
  params: Promise<{ resultId: string }>;
};

export const metadata: Metadata = {
  title: "Result Questions | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { resultId } = await params;
  const session = await questApi.session(resultId);
  const test = await questApi.test(session.test_slug);
  const answerMap = new Map(session.answers.map((answer) => [answer.question, answer.value]));

  return (
    <TestShell eyebrow="Question review" title={test.title} description="Backendda saqlangan javoblar bo‘yicha savollar review.">
      <section className="grid gap-4 py-8">
        {test.test_questions.map((item) => {
          const question = item.question;
          const userAnswer = answerMap.get(question.id) ?? "";
          const isCorrect = normalize(question.answer) === normalize(userAnswer);
          return (
            <Link
              key={question.id}
              href={`/results/${resultId}/questions/${question.id}`}
              className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm hover:bg-[#fbfbf8]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">Question {item.order}</p>
                  <div className="mt-2 font-semibold"><LatexText text={question.prompt} /></div>
                </div>
                <span className={`rounded-xl px-3 py-2 text-sm font-semibold ${isCorrect ? "bg-[#edf7f3] text-[#276a5b]" : "bg-[#f8eeee] text-red-700"}`}>
                  {isCorrect ? "Correct" : "Review"}
                </span>
              </div>
              <p className="mt-3 text-sm text-black/55">Your answer: {userAnswer || "Skipped"}</p>
            </Link>
          );
        })}
      </section>
    </TestShell>
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "").replace(/\\/g, "");
}
