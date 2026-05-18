"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Flag, Timer } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ApiAnswer, ApiQuestion, ApiSession } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { LatexText } from "@/shared/ui/latex-text";

export function BackendSessionQuestionClient({
  initialSession,
  questions,
  questionIndex,
  estimatedMinutes,
}: {
  initialSession: ApiSession;
  questions: ApiQuestion[];
  questionIndex: number;
  estimatedMinutes: number;
}) {
  const [session, setSession] = useState(initialSession);
  const [optimisticAnswers, setOptimisticAnswers] = useState<Record<number, string>>({});
  const [savingQuestionId, setSavingQuestionId] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const question = questions[questionIndex];
  const answerMap = useMemo(() => new Map(session.answers.map((answer) => [answer.question, answer])), [session.answers]);
  const current = answerMap.get(question.id);
  const currentValue = optimisticAnswers[question.id] ?? current?.value ?? "";
  const answered = questions.filter((item) => answerMap.get(item.id)?.value).length;
  const flagged = questions.filter((item) => answerMap.get(item.id)?.is_flagged).length;
  const progress = Math.round((answered / questions.length) * 100);
  const previous = Math.max(1, questionIndex);
  const next = Math.min(questions.length, questionIndex + 2);
  const totalSeconds = estimatedMinutes * 60;
  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(session.created_at).getTime()) / 1000));
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const timerLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  async function saveAnswer(value: string, isFlagged = current?.is_flagged ?? false) {
    setOptimisticAnswers((answers) => ({ ...answers, [question.id]: value }));
    setSavingQuestionId(question.id);
    try {
      const next = await questApi.answer(String(session.id), {
        question: question.id,
        value,
        is_flagged: isFlagged,
      });
      setSession(next);
    } finally {
      setSavingQuestionId(null);
    }
  }

  async function toggleFlag() {
    await saveAnswer(currentValue, !(current?.is_flagged ?? false));
  }

  return (
    <section className="py-8">
      <div className="mb-5 rounded-lg border border-black/10 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md bg-[#151713] px-3 py-2 text-sm font-semibold text-white">
              <Timer className="size-4" />
              {timerLabel}
            </span>
            <span className="rounded-md bg-[#edf7f3] px-3 py-2 text-sm font-semibold text-[#276a5b]">{answered}/{questions.length} answered</span>
            <span className="rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">{flagged} flagged</span>
          </div>
          <div className="min-w-0 flex-1 lg:max-w-md">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded bg-black/10">
              <div className="h-2 rounded bg-[#276a5b]" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <Link href={`/test-session/${session.id}/submit`} className="rounded-md bg-[#151713] px-4 py-2 text-center text-sm font-semibold text-white">Finish test</Link>
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
              const state = answerMap.get(item.id);
              return (
                <Link key={item.id} href={`/test-session/${session.id}/question/${itemIndex + 1}`} className={cn(
                  "relative rounded-md border px-3 py-2 text-center text-sm font-semibold",
                  itemIndex === questionIndex && "border-[#151713] bg-[#151713] text-white",
                  itemIndex !== questionIndex && state?.value && "border-[#276a5b]/40 bg-[#edf7f3] text-[#276a5b]",
                  itemIndex !== questionIndex && !state?.value && "border-black/10 bg-[#fbfbf8]",
                )}>
                  {itemIndex + 1}
                  {state?.is_flagged ? <span className="absolute right-1 top-1 size-1.5 rounded-full bg-amber-500" /> : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <article className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <p className="text-sm font-semibold text-[#276a5b]">Question {questionIndex + 1} of {questions.length}</p>
              <p className="mt-1 text-sm text-black/55">{question.type}</p>
            </div>
            <button type="button" onClick={toggleFlag} className={cn("inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold", current?.is_flagged ? "border-amber-300 bg-amber-50 text-amber-700" : "border-black/10")}>
              <Flag className="size-4" />
              {current?.is_flagged ? "Flagged" : "Flag"}
            </button>
          </div>

          <p className="mt-7 whitespace-pre-wrap text-xl leading-9"><LatexText text={question.prompt} /></p>
          {question.options.length > 0 ? (
            <div className="mt-7 grid gap-3">
              {question.options.map((option, optionIndex) => {
                const selected = currentValue === option;
                return (
                  <button key={option} type="button" onClick={() => saveAnswer(option)} className={cn("flex items-start gap-3 rounded-lg border px-4 py-4 text-left text-sm leading-6 transition", selected ? "border-[#276a5b] bg-[#dff4eb] shadow-[0_0_0_3px_rgba(39,106,91,0.16)]" : "border-black/10 bg-[#fbfbf8] hover:border-black/25")}>
                    <span className={cn("grid size-7 shrink-0 place-items-center rounded-md border text-xs font-bold", selected ? "border-[#276a5b] bg-[#276a5b] text-white" : "border-black/10 bg-white text-black/55")}>
                      {selected ? <CheckCircle2 className="size-4" /> : String.fromCharCode(65 + optionIndex)}
                    </span>
                    <LatexText text={option} />
                    {selected ? <span className="ml-auto shrink-0 rounded-md bg-white/70 px-2 py-1 text-xs font-semibold text-[#276a5b]">{savingQuestionId === question.id ? "Saving..." : "Selected"}</span> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <input value={currentValue} onChange={(event) => saveAnswer(event.target.value)} placeholder="Answer" className="mt-7 w-full rounded-lg border border-black/10 bg-[#fbfbf8] px-4 py-4 text-sm font-semibold text-[#151713] caret-[#276a5b] outline-none focus:border-[#276a5b]" />
          )}

          <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
            <Link href={`/test-session/${session.id}/question/${previous}`} className="inline-flex items-center justify-center gap-2 rounded-md border border-black/10 px-4 py-3 text-sm font-semibold"><ArrowLeft className="size-4" />Previous</Link>
            <Link href={questionIndex + 1 === questions.length ? `/test-session/${session.id}/submit` : `/test-session/${session.id}/question/${next}`} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#151713] px-4 py-3 text-sm font-semibold text-white">
              {questionIndex + 1 === questions.length ? "Finish test" : "Next question"}<ArrowRight className="size-4" />
            </Link>
          </div>
        </article>

        <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
          <SummaryCard answers={session.answers} questions={questions} />
          <Link href={`/test-session/${session.id}/submit`} className="rounded-md bg-[#276a5b] px-4 py-3 text-center text-sm font-semibold text-white">Finish test</Link>
        </aside>
      </div>
    </section>
  );
}

function SummaryCard({ answers, questions }: { answers: ApiAnswer[]; questions: ApiQuestion[] }) {
  const map = new Map(answers.map((answer) => [answer.question, answer]));
  const answered = questions.filter((question) => map.get(question.id)?.value).length;
  const flagged = questions.filter((question) => map.get(question.id)?.is_flagged).length;
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <h2 className="text-sm font-semibold">Session summary</h2>
      <div className="mt-4 grid gap-3 text-sm">
        <div className="flex justify-between border-b border-black/10 pb-2"><span>Answered</span><strong>{answered}/{questions.length}</strong></div>
        <div className="flex justify-between border-b border-black/10 pb-2"><span>Unanswered</span><strong>{questions.length - answered}</strong></div>
        <div className="flex justify-between"><span>Flagged</span><strong>{flagged}</strong></div>
      </div>
    </div>
  );
}
