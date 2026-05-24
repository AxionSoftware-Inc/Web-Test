"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { getSessionResult } from "@/features/assessment/lib/assessment-scoring";
import { QuestionPreviewCard } from "@/features/assessment/ui/question-preview-card";
import { TestReviewList } from "@/features/assessment/ui/test-review-list";
import { TestSessionView } from "@/features/assessment/ui/test-session-view";
import { mathematicsTests } from "@/features/subjects/mathematics/model/mathematics-content";
import { parseLatexTest } from "@/features/test-generator/lib/latex-test-parser";
import type {
  GeneratedQuestion,
  LatexTestSource,
  TestAnswerMap,
} from "@/features/test-generator/model/test-generator-types";
import { Container } from "@/shared/ui/container";

type MathematicsTestPageProps = {
  test: LatexTestSource;
};

export function MathematicsTestPage({ test }: MathematicsTestPageProps) {
  const questions = useMemo(() => parseLatexTest(test.latex), [test.latex]);
  const [mode, setMode] = useState<"intro" | "session" | "result">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<TestAnswerMap>({});
  const currentQuestion = questions[currentIndex];
  const result = getSessionResult(questions, answers);

  function start() {
    setAnswers({});
    setCurrentIndex(0);
    setMode("session");
  }

  function setAnswer(questionId: string, answer: string) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  return (
    <main className="min-h-screen bg-background text-ink">
      <Container className="py-8">
        <header className="border-b border-black/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/subjects/mathematics" className="inline-flex items-center gap-2 text-sm font-semibold text-brand">
              <ArrowLeft className="size-4" />
              Mathematics
            </Link>
            <Link href="/test-generator" className="text-sm font-semibold text-black/55">
              Open generator
            </Link>
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight">{test.title}</h1>
          <p className="mt-3 text-sm text-black/55">
            {test.category} / {test.difficulty} / {test.estimatedMinutes} min / {questions.length} questions
          </p>
        </header>

        {mode === "intro" ? (
          <IntroView questions={questions} test={test} onStart={start} />
        ) : null}

        {mode === "session" && currentQuestion ? (
          <TestSessionView
            answer={answers[currentQuestion.id] ?? ""}
            currentIndex={currentIndex}
            question={currentQuestion}
            questionCount={questions.length}
            onAnswer={setAnswer}
            onBack={() => setCurrentIndex((value) => Math.max(0, value - 1))}
            onFinish={() => setMode("result")}
            onNext={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
            onReset={start}
          />
        ) : null}

        {mode === "result" ? (
          <ResultView
            answers={answers}
            questions={questions}
            result={result}
            test={test}
            onRetry={start}
          />
        ) : null}
      </Container>
    </main>
  );
}

function IntroView({
  questions,
  test,
  onStart,
}: {
  questions: GeneratedQuestion[];
  test: LatexTestSource;
  onStart: () => void;
}) {
  return (
    <section className="grid gap-5 py-8 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-lg border border-black/10 bg-white p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">
          Test overview
        </p>
        <h2 className="mt-3 text-2xl font-semibold">Boshlashga tayyor</h2>
        <p className="mt-3 text-sm leading-6 text-black/62">
          Test savollari LaTeX source fayldan parser orqali yaratiladi. Javoblar
          tugagach score va har bir savol bo&apos;yicha review chiqadi.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-6 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white"
        >
          Start test
        </button>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-5">
        <h2 className="font-semibold">Generated sequence</h2>
        <div className="mt-4 grid gap-3">
          {questions.map((question, index) => (
            <QuestionPreviewCard key={question.id} index={index} question={question} compact />
          ))}
        </div>
        <p className="mt-4 text-xs text-black/45">Source: {test.id}</p>
      </div>
    </section>
  );
}

function ResultView({
  answers,
  questions,
  result,
  test,
  onRetry,
}: {
  answers: TestAnswerMap;
  questions: GeneratedQuestion[];
  result: { correct: number; total: number; percent: number };
  test: LatexTestSource;
  onRetry: () => void;
}) {
  const relatedTests = mathematicsTests.filter((item) => item.id !== test.id);

  return (
    <section className="grid gap-5 py-8 lg:grid-cols-[1fr_0.45fr]">
      <div className="rounded-lg border border-black/10 bg-white p-5">
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-brand">{test.title}</p>
            <h2 className="mt-2 text-3xl font-semibold">
              Result: {result.correct}/{result.total} ({result.percent}%)
            </h2>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>

        <div className="mt-5">
          <TestReviewList answers={answers} questions={questions} />
        </div>
      </div>

      <aside className="rounded-lg border border-black/10 bg-white p-5">
        <h2 className="font-semibold">Keyingi matematika testlari</h2>
        <div className="mt-4 grid gap-3">
          {relatedTests.map((item) => (
            <Link
              key={item.id}
              href={`/subjects/mathematics/tests/${item.id}`}
              className="rounded-md border border-black/10 bg-surface-soft p-3 text-sm"
            >
              <span className="font-semibold">{item.title}</span>
              <span className="mt-1 block text-black/55">{item.difficulty}</span>
            </Link>
          ))}
        </div>
      </aside>
    </section>
  );
}
