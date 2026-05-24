"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Flag, RotateCcw, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  getFakeSession,
  getFakeSessionStats,
  markFakeVisited,
  resetFakeSession,
  setFakeAnswer,
  toggleFakeFlag,
  type FakeSessionState,
} from "@/features/test-engine/model/fake-test-backend";
import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";
import { cn } from "@/shared/lib/cn";

export function SessionQuestionClient({
  sessionId,
  testSlug,
  questionIndex,
  questions,
  estimatedMinutes = 10,
}: {
  sessionId: string;
  testSlug: string;
  questionIndex: number;
  questions: GeneratedQuestion[];
  estimatedMinutes?: number;
}) {
  const question = questions[questionIndex];
  const [session, setSession] = useState<FakeSessionState>(() => {
    const currentSession = getFakeSession(sessionId, testSlug);
    return markFakeVisited(currentSession, question.id);
  });
  const current = session.answers[question.id];
  const stats = useMemo(() => getFakeSessionStats(session, questions), [session, questions]);
  const [now, setNow] = useState(() => Date.now());
  const previous = Math.max(1, questionIndex);
  const next = Math.min(questions.length, questionIndex + 2);
  const progress = Math.round((stats.answered / stats.total) * 100);
  const totalSeconds = estimatedMinutes * 60;
  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000));
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const timerLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  function chooseAnswer(answer: string) {
    setSession((value) => setFakeAnswer(value, question.id, answer));
  }

  function toggleFlag() {
    setSession((value) => toggleFakeFlag(value, question.id));
  }

  function reset() {
    setSession(resetFakeSession(sessionId, testSlug));
  }

  return (
    <section className="py-8">
      <div className="mb-5 rounded-lg border border-black/10 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white">
              <Timer className="size-4" />
              {timerLabel}
            </span>
            <span className="rounded-md bg-brand-soft px-3 py-2 text-sm font-semibold text-brand">
              {stats.answered}/{stats.total} answered
            </span>
            <span className="rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              {stats.flagged} flagged
            </span>
          </div>
          <div className="min-w-0 flex-1 lg:max-w-md">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded bg-black/10">
              <div className="h-2 rounded bg-brand" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <Link href={`/test-session/${sessionId}/submit`} className="rounded-md bg-ink px-4 py-2 text-center text-sm font-semibold text-white">
            Submit
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr_300px]">
        <nav className="rounded-lg border border-black/10 bg-white p-4 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Questions</h2>
            <span className="text-xs font-semibold text-black/45">{questions.length} total</span>
          </div>
          <div className="mt-4 grid grid-cols-6 gap-2 lg:grid-cols-4">
            {questions.map((item, itemIndex) => {
              const state = session.answers[item.id];

              return (
                <Link
                  key={item.id}
                  href={`/test-session/${sessionId}/question/${itemIndex + 1}`}
                  className={cn(
                    "relative rounded-md border px-3 py-2 text-center text-sm font-semibold",
                    itemIndex === questionIndex && "border-ink bg-ink text-white",
                    itemIndex !== questionIndex && state?.answer && "border-brand/40 bg-brand-soft text-brand",
                    itemIndex !== questionIndex && !state?.answer && "border-black/10 bg-surface-soft",
                  )}
                >
                  {itemIndex + 1}
                  {state?.flagged ? <span className="absolute right-1 top-1 size-1.5 rounded-full bg-amber-500" /> : null}
                </Link>
              );
            })}
          </div>
          <div className="mt-5 grid gap-2 text-xs text-black/55">
            <Legend color="bg-ink" label="Current" />
            <Legend color="bg-brand" label="Answered" />
            <Legend color="bg-amber-500" label="Flagged" />
          </div>
        </nav>

        <article className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <p className="text-sm font-semibold text-brand">Question {questionIndex + 1} of {questions.length}</p>
              <p className="mt-1 text-sm text-black/55">{question.type}</p>
            </div>
          <button
            type="button"
            onClick={toggleFlag}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold",
              current?.flagged ? "border-amber-300 bg-amber-50 text-amber-700" : "border-black/10",
            )}
          >
            <Flag className="size-4" />
            {current?.flagged ? "Flagged" : "Flag"}
          </button>
          </div>

          <p className="mt-7 whitespace-pre-wrap text-xl leading-9">{question.prompt}</p>
          {question.options.length > 0 ? (
            <div className="mt-7 grid gap-3">
              {question.options.map((option, optionIndex) => {
                const selected = current?.answer === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => chooseAnswer(option)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border px-4 py-4 text-left text-sm leading-6",
                      selected ? "border-brand bg-brand-soft" : "border-black/10 bg-surface-soft hover:border-black/25",
                    )}
                  >
                    <span className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-md border text-xs font-bold",
                      selected ? "border-brand bg-brand text-white" : "border-black/10 bg-white text-black/55",
                    )}>
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              value={current?.answer ?? ""}
              onChange={(event) => chooseAnswer(event.target.value)}
              placeholder="Answer"
              className="mt-7 w-full rounded-lg border border-black/10 bg-surface-soft px-4 py-4 text-sm outline-none focus:border-brand"
            />
          )}

          <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
            <Link href={`/test-session/${sessionId}/question/${previous}`} className="inline-flex items-center justify-center gap-2 rounded-md border border-black/10 px-4 py-3 text-sm font-semibold">
              <ArrowLeft className="size-4" />
              Previous
            </Link>
            <Link href={questionIndex + 1 === questions.length ? `/test-session/${sessionId}/review` : `/test-session/${sessionId}/question/${next}`} className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white">
              {questionIndex + 1 === questions.length ? "Review answers" : "Next question"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </article>

        <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-black/10 bg-white p-4">
            <h2 className="text-sm font-semibold">Session summary</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <SummaryRow label="Answered" value={`${stats.answered}/${stats.total}`} />
              <SummaryRow label="Unanswered" value={String(stats.unanswered)} />
              <SummaryRow label="Flagged" value={String(stats.flagged)} />
            </div>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-4">
            <h2 className="text-sm font-semibold">Current answer</h2>
            <p className="mt-3 min-h-10 rounded-md bg-surface-soft p-3 text-sm leading-6 text-black/60">
              {current?.answer || "No answer selected yet."}
            </p>
          </div>
          <Link href={`/test-session/${sessionId}/review`} className="rounded-md bg-brand px-4 py-3 text-center text-sm font-semibold text-white">
            Review answers
          </Link>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-4 py-3 text-sm font-semibold"
          >
            <RotateCcw className="size-4" />
            Reset session
          </button>
        </aside>
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-2 rounded-full", color)} />
      <span>{label}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/10 pb-2 last:border-b-0 last:pb-0">
      <span className="text-black/55">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
