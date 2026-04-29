"use client";

import {
  ClipboardList,
  FileCode2,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getTestGeneratorStats,
  parseLatexTest,
} from "@/features/test-generator/lib/latex-test-parser";
import { getSessionResult } from "@/features/assessment/lib/assessment-scoring";
import { QuestionPreviewCard } from "@/features/assessment/ui/question-preview-card";
import { TestReviewList } from "@/features/assessment/ui/test-review-list";
import { TestSessionView } from "@/features/assessment/ui/test-session-view";
import { latexTestBank } from "@/features/test-generator/model/latex-test-bank";
import type {
  GeneratedQuestion,
  LatexTestSource,
  TestAnswerMap,
  TestDifficulty,
  TestSubject,
} from "@/features/test-generator/model/test-generator-types";
import { cn } from "@/shared/lib/cn";
import { Container } from "@/shared/ui/container";

const subjects: Array<"all" | TestSubject> = ["all", "mathematics", "physics", "programming"];
const difficulties: Array<"all" | TestDifficulty> = ["all", "beginner", "intermediate", "advanced"];
const allCategories = ["all", ...new Set(latexTestBank.map((test) => test.category))];

export function TestGeneratorPage() {
  const [subject, setSubject] = useState<"all" | TestSubject>("all");
  const [difficulty, setDifficulty] = useState<"all" | TestDifficulty>("all");
  const [category, setCategory] = useState("all");
  const [selectedTestId, setSelectedTestId] = useState(latexTestBank[0].id);
  const [mode, setMode] = useState<"builder" | "session" | "result">("builder");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<TestAnswerMap>({});

  const filteredTests = useMemo(
    () =>
      latexTestBank.filter((test) => {
        const subjectMatches = subject === "all" || test.subject === subject;
        const difficultyMatches = difficulty === "all" || test.difficulty === difficulty;
        const categoryMatches = category === "all" || test.category === category;

        return subjectMatches && difficultyMatches && categoryMatches;
      }),
    [category, difficulty, subject],
  );

  const selectedTest = filteredTests.find((test) => test.id === selectedTestId) ?? filteredTests[0];
  const questions = useMemo(
    () => (selectedTest ? parseLatexTest(selectedTest.latex) : []),
    [selectedTest],
  );
  const stats = getTestGeneratorStats(questions);
  const result = getSessionResult(questions, answers);
  const currentQuestion = questions[currentIndex];

  function selectTest(test: LatexTestSource) {
    setSelectedTestId(test.id);
    resetSession();
  }

  function startSession() {
    setAnswers({});
    setCurrentIndex(0);
    setMode("session");
  }

  function resetSession() {
    setAnswers({});
    setCurrentIndex(0);
    setMode("builder");
  }

  function finishSession() {
    setMode("result");
  }

  function setAnswer(questionId: string, answer: string) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-8">
        <header className="flex flex-col justify-between gap-5 border-b border-black/10 pb-8 lg:flex-row lg:items-end">
          <div>
            <Link href="/" className="text-sm font-semibold text-[#276a5b]">
              QuestLab
            </Link>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              LaTeX test generator MVP.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-black/62">
              Fake LaTeX test bankdan fan, kategoriya va daraja bo&apos;yicha test
              tanlanadi. Parser savollarni yaratadi, keyin learner ketma-ket test
              ishlaydi va natija review qiladi.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-black/10 bg-white p-3">
            <Stat label="Total" value={stats.total} />
            <Stat label="MCQ" value={stats.multipleChoice} />
            <Stat label="Short" value={stats.shortAnswer} />
          </div>
        </header>

        {mode === "builder" ? (
          <BuilderView
            category={category}
            difficulty={difficulty}
            filteredTests={filteredTests}
            questions={questions}
            selectedTest={selectedTest}
            subject={subject}
            onCategoryChange={setCategory}
            onDifficultyChange={setDifficulty}
            onSelectTest={selectTest}
            onStart={startSession}
            onSubjectChange={setSubject}
          />
        ) : null}

        {mode === "session" && currentQuestion ? (
          <TestSessionView
            answer={answers[currentQuestion.id] ?? ""}
            currentIndex={currentIndex}
            question={currentQuestion}
            questionCount={questions.length}
            onAnswer={setAnswer}
            onBack={() => setCurrentIndex((value) => Math.max(0, value - 1))}
            onFinish={finishSession}
            onNext={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
            resetLabel="Builder"
            onReset={resetSession}
          />
        ) : null}

        {mode === "result" && selectedTest ? (
          <ResultView
            answers={answers}
            questions={questions}
            result={result}
            selectedTest={selectedTest}
            onReset={resetSession}
            onRetry={startSession}
          />
        ) : null}
      </Container>
    </main>
  );
}

function BuilderView({
  category,
  difficulty,
  filteredTests,
  questions,
  selectedTest,
  subject,
  onCategoryChange,
  onDifficultyChange,
  onSelectTest,
  onStart,
  onSubjectChange,
}: {
  category: string;
  difficulty: "all" | TestDifficulty;
  filteredTests: LatexTestSource[];
  questions: GeneratedQuestion[];
  selectedTest?: LatexTestSource;
  subject: "all" | TestSubject;
  onCategoryChange: (value: string) => void;
  onDifficultyChange: (value: "all" | TestDifficulty) => void;
  onSelectTest: (test: LatexTestSource) => void;
  onStart: () => void;
  onSubjectChange: (value: "all" | TestSubject) => void;
}) {
  return (
    <section className="grid gap-5 py-8 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="rounded-lg border border-black/10 bg-white p-4">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="size-5 text-[#276a5b]" />
          <h2 className="font-semibold">Test tanlash</h2>
        </div>

        <div className="grid gap-3">
          <SelectField label="Fan" value={subject} options={subjects} onChange={onSubjectChange} />
          <SelectField
            label="Daraja"
            value={difficulty}
            options={difficulties}
            onChange={onDifficultyChange}
          />
          <SelectField
            label="Kategoriya"
            value={category}
            options={allCategories}
            onChange={onCategoryChange}
          />
        </div>

        <div className="mt-5 grid gap-3">
          {filteredTests.length > 0 ? (
            filteredTests.map((test) => (
              <button
                key={test.id}
                type="button"
                onClick={() => onSelectTest(test)}
                className={cn(
                  "rounded-md border p-4 text-left",
                  test.id === selectedTest?.id
                    ? "border-[#276a5b] bg-[#edf7f3]"
                    : "border-black/10 bg-[#fbfbf8]",
                )}
              >
                <p className="font-semibold">{test.title}</p>
                <p className="mt-2 text-sm text-black/55">
                  {test.subject} / {test.category} / {test.difficulty}
                </p>
                <p className="mt-1 text-sm text-black/45">{test.estimatedMinutes} min</p>
              </button>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-black/15 bg-[#fbfbf8] p-4 text-sm text-black/55">
              Bu filterlar bo&apos;yicha test topilmadi.
            </div>
          )}
        </div>
      </aside>

      <div className="grid gap-5">
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCode2 className="size-5 text-[#276a5b]" />
              <h2 className="font-semibold">LaTeX source</h2>
            </div>
            <button
              type="button"
              onClick={onStart}
              disabled={!selectedTest || questions.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-[#276a5b] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Play className="size-4" />
              Start test
            </button>
          </div>
          <pre className="max-h-80 overflow-auto rounded-md border border-black/10 bg-[#fbfbf8] p-4 text-sm leading-6">
            {selectedTest?.latex ?? "Test tanlang yoki filterlarni o'zgartiring."}
          </pre>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-4">
          <h2 className="font-semibold">Generated questions</h2>
          <div className="mt-4 grid gap-3">
                {questions.map((question, index) => (
                  <QuestionPreviewCard key={question.id} index={index} question={question} />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultView({
  answers,
  questions,
  result,
  selectedTest,
  onReset,
  onRetry,
}: {
  answers: TestAnswerMap;
  questions: GeneratedQuestion[];
  result: { correct: number; total: number; percent: number };
  selectedTest: LatexTestSource;
  onReset: () => void;
  onRetry: () => void;
}) {
  return (
    <section className="py-8">
      <div className="rounded-lg border border-black/10 bg-white p-5">
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-[#276a5b]">{selectedTest.title}</p>
            <h2 className="mt-2 text-3xl font-semibold">
              Result: {result.correct}/{result.total} ({result.percent}%)
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-black/10 px-4 py-2 text-sm font-semibold"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-md bg-[#151713] px-4 py-2 text-sm font-semibold text-white"
            >
              Choose test
            </button>
          </div>
        </div>

        <div className="mt-5">
          <TestReviewList answers={answers} questions={questions} />
        </div>
      </div>
    </section>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="rounded-md border border-black/10 bg-[#fbfbf8] px-3 py-2 text-sm outline-none focus:border-[#276a5b]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 rounded-md bg-[#f7f7f2] p-3 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-black/45">{label}</p>
    </div>
  );
}
