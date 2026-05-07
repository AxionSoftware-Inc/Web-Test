"use client";

import Link from "next/link";
import { useState } from "react";

import { isAnswerCorrect } from "@/features/assessment/lib/assessment-scoring";
import { getFakeSession, type FakeSessionState } from "@/features/test-engine/model/fake-test-backend";
import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";

export function ResultQuestionsClient({
  resultId,
  sessionId,
  testSlug,
  questions,
}: {
  resultId: string;
  sessionId: string;
  testSlug: string;
  questions: GeneratedQuestion[];
}) {
  const [session] = useState<FakeSessionState>(() => getFakeSession(sessionId, testSlug));

  return (
    <section className="grid gap-3 py-8">
      {questions.map((question, index) => {
        const answer = session.answers[question.id]?.answer ?? "";
        const answered = Boolean(answer);
        const correct = isAnswerCorrect(question, answer);

        return (
          <Link key={question.id} href={`/results/${resultId}/questions/${question.id}`} className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm hover:border-black/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fbfbf8] text-sm font-semibold">{index + 1}</span>
              <div>
              <p className="font-semibold">Question {index + 1}</p>
              <p className="mt-2 line-clamp-2 text-sm text-black/60">{question.prompt}</p>
              </div>
            </div>
            <div>
              <span className={correct ? "rounded-md bg-[#edf7f3] px-3 py-1 text-sm font-semibold text-[#276a5b]" : "rounded-md bg-[#f8eeee] px-3 py-1 text-sm font-semibold text-[#8d3d3d]"}>
                {answered ? (correct ? "Correct" : "Wrong") : "Skipped"}
              </span>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
