import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";
import { cn } from "@/shared/lib/cn";

export function TestSessionView({
  answer,
  currentIndex,
  question,
  questionCount,
  resetLabel = "Restart",
  onAnswer,
  onBack,
  onFinish,
  onNext,
  onReset,
}: {
  answer: string;
  currentIndex: number;
  question: GeneratedQuestion;
  questionCount: number;
  resetLabel?: string;
  onAnswer: (questionId: string, answer: string) => void;
  onBack: () => void;
  onFinish: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  const isLast = currentIndex === questionCount - 1;

  return (
    <section className="py-8">
      <div className="rounded-lg border border-black/10 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
          <div>
            <p className="text-sm font-semibold text-[#276a5b]">
              Question {currentIndex + 1} of {questionCount}
            </p>
            <p className="mt-1 text-sm text-black/55">{question.type}</p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm font-semibold"
          >
            <RotateCcw className="size-4" />
            {resetLabel}
          </button>
        </div>

        <p className="mt-6 whitespace-pre-wrap text-lg leading-8">{question.prompt}</p>

        {question.type === "multiple-choice" ? (
          <div className="mt-6 grid gap-3">
            {question.options.map((option, index) => (
              <button
                key={option}
                type="button"
                onClick={() => onAnswer(question.id, option)}
                className={cn(
                  "rounded-md border px-4 py-3 text-left text-sm",
                  answer === option ? "border-[#276a5b] bg-[#edf7f3]" : "border-black/10 bg-[#fbfbf8]",
                )}
              >
                {String.fromCharCode(65 + index)}. {option}
              </button>
            ))}
          </div>
        ) : (
          <input
            value={answer}
            onChange={(event) => onAnswer(question.id, event.target.value)}
            placeholder="Javobni kiriting"
            className="mt-6 w-full rounded-md border border-black/10 bg-[#fbfbf8] px-4 py-3 text-sm outline-none focus:border-[#276a5b]"
          />
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-2 rounded-md border border-black/10 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <button
            type="button"
            onClick={isLast ? onFinish : onNext}
            className="inline-flex items-center gap-2 rounded-md bg-[#151713] px-4 py-2 text-sm font-semibold text-white"
          >
            {isLast ? "Finish" : "Next"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
