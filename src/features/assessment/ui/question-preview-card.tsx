import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";

export function QuestionPreviewCard({
  index,
  question,
  compact = false,
}: {
  index: number;
  question: GeneratedQuestion;
  compact?: boolean;
}) {
  return (
    <article className="rounded-md border border-black/10 bg-surface-soft p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">Question {index + 1}</span>
        <span className="rounded-md bg-ink px-2.5 py-1 text-xs font-semibold text-white">
          {question.type}
        </span>
      </div>
      <p className={`${compact ? "line-clamp-2" : "whitespace-pre-wrap"} text-sm leading-6 text-black/75`}>
        {question.prompt}
      </p>
      {!compact && question.options.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {question.options.map((option, optionIndex) => (
            <div key={`${question.id}-${option}`} className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm">
              {String.fromCharCode(65 + optionIndex)}. {option}
            </div>
          ))}
        </div>
      ) : null}
      {!compact && question.answer ? (
        <p className="mt-4 text-sm">
          <span className="font-semibold">Answer:</span> {question.answer}
        </p>
      ) : null}
    </article>
  );
}
