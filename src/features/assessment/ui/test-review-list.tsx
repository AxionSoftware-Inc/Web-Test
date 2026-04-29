import { CheckCircle2 } from "lucide-react";

import { isAnswerCorrect } from "@/features/assessment/lib/assessment-scoring";
import type {
  GeneratedQuestion,
  TestAnswerMap,
} from "@/features/test-generator/model/test-generator-types";
import { cn } from "@/shared/lib/cn";

export function TestReviewList({
  answers,
  questions,
}: {
  answers: TestAnswerMap;
  questions: GeneratedQuestion[];
}) {
  return (
    <div className="grid gap-3">
      {questions.map((question, index) => {
        const userAnswer = answers[question.id] ?? "";
        const correct = isAnswerCorrect(question, userAnswer);

        return (
          <article key={question.id} className="rounded-md border border-black/10 bg-[#fbfbf8] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Question {index + 1}</p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold",
                  correct ? "bg-[#dff5eb] text-[#276a5b]" : "bg-[#fde8e8] text-[#9b2c2c]",
                )}
              >
                <CheckCircle2 className="size-3.5" />
                {correct ? "Correct" : "Incorrect"}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{question.prompt}</p>
            <p className="mt-3 text-sm">
              <span className="font-semibold">Your answer:</span> {userAnswer || "No answer"}
            </p>
            <p className="mt-1 text-sm">
              <span className="font-semibold">Correct answer:</span> {question.answer ?? "-"}
            </p>
            {question.explanation ? (
              <p className="mt-2 text-sm leading-6 text-black/62">
                <span className="font-semibold text-black/80">Explanation:</span>{" "}
                {question.explanation}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
