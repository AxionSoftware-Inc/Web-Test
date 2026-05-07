"use client";

import { useState } from "react";

import { isAnswerCorrect } from "@/features/assessment/lib/assessment-scoring";
import { getFakeSession, type FakeSessionState } from "@/features/test-engine/model/fake-test-backend";
import { getQuestionSkills } from "@/features/test-engine/model/skill-diagnosis";
import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";

export function ResultQuestionDetailClient({
  sessionId,
  testSlug,
  question,
}: {
  sessionId: string;
  testSlug: string;
  question: GeneratedQuestion;
}) {
  const [session] = useState<FakeSessionState>(() => getFakeSession(sessionId, testSlug));
  const userAnswer = session.answers[question.id]?.answer ?? "";
  const correct = isAnswerCorrect(question, userAnswer);
  const skills = getQuestionSkills(question);

  return (
    <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
        <p className="text-sm font-semibold text-[#276a5b]">{question.type}</p>
        <span className={correct ? "rounded-md bg-[#edf7f3] px-3 py-1 text-sm font-semibold text-[#276a5b]" : "rounded-md bg-[#f8eeee] px-3 py-1 text-sm font-semibold text-[#8d3d3d]"}>
          {userAnswer ? (correct ? "Correct" : "Wrong") : "Skipped"}
        </span>
      </div>
      <p className="mt-6 whitespace-pre-wrap text-lg leading-8">{question.prompt}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="rounded-xl bg-[#edf7f3] px-3 py-2 text-sm font-semibold text-[#276a5b]">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-[#fbfbf8] p-4 text-sm">
          <p className="font-semibold">Your answer</p>
          <p className="mt-2 text-black/65">{userAnswer || "No answer"}</p>
        </div>
        <div className="rounded-xl bg-[#edf7f3] p-4 text-sm">
          <p className="font-semibold text-[#276a5b]">Correct answer</p>
          <p className="mt-2">{question.answer || "Answer unavailable"}</p>
        </div>
      </div>
      {question.explanation ? (
        <div className="mt-4 rounded-xl border border-black/10 p-4 text-sm leading-6 text-black/65">
          <p className="font-semibold text-black">Explanation</p>
          <p className="mt-2">{question.explanation}</p>
        </div>
      ) : null}
    </article>
  );
}
