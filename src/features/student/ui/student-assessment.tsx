"use client";

import { ArrowLeft, ArrowRight, Flag, Search, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge, Empty, FilterSelect, NumberField, Section, StudentShell } from "@/components/student/student-ui";
import { PackCard, TestCatalogCard } from "@/components/student/student-cards";
import { apiSessionToAnswerSnapshots, buildMasteryReport, clearRuntimeSession, readRuntimeQuestionTimes, writeRuntimeQuestionTimes, writeRuntimeReport } from "@/features/mastery-engine/model";
import type { ApiExamPack, ApiExamPackItem, ApiSession, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { getStudentCode } from "@/shared/model/local-identity";
import { LatexText } from "@/shared/ui/latex-text";
import { InfoPill, OverallMasteryCard, nowMs, testSkills } from "@/features/student/ui/student-dashboard";

export function StudentTestsWorkspace({ tests, packs, sessions }: { tests: ApiTest[]; packs: ApiExamPack[]; sessions: ApiSession[] }) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const completed = new Set(sessions.filter((item) => item.status === "submitted").map((item) => item.test_slug));
  const inProgress = new Set(sessions.filter((item) => item.status === "in_progress").map((item) => item.test_slug));
  const activePacks = packs.filter((pack) => pack.is_active);
  const subjects = Array.from(new Set(tests.map((test) => test.subject_slug))).filter(Boolean);
  const topics = Array.from(new Set(tests.map((test) => test.topic_slug))).filter(Boolean);
  const filtered = tests.filter((test) => {
    const haystack = `${test.title} ${test.subject_slug} ${test.topic_slug} ${test.difficulty} ${testSkills(test).join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase())
      && (subject === "all" || test.subject_slug === subject)
      && (topic === "all" || test.topic_slug === topic)
      && (difficulty === "all" || test.difficulty === difficulty);
  });
  return (
    <StudentShell variant="table">
      <div className="quest-card p-4">
        <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface-soft px-4 py-3">
          <Search className="size-5 shrink-0 text-subtle" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Test, pack, fan, topic yoki skill qidirish..."
            className="min-h-10 w-full bg-transparent text-base font-medium outline-none placeholder:text-subtle"
          />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit quest-card p-4 lg:sticky lg:top-24">
          <div className="grid gap-4">
            <FilterSelect label="Subject" value={subject} onChange={setSubject} options={subjects} />
            <FilterSelect label="Topic" value={topic} onChange={setTopic} options={topics} />
            <FilterSelect label="Difficulty" value={difficulty} onChange={setDifficulty} options={["beginner", "intermediate", "advanced"]} />
            <button onClick={() => { setQuery(""); setSubject("all"); setTopic("all"); setDifficulty("all"); }} className="rounded-[var(--radius-control)] border border-line px-4 py-3 text-sm font-semibold hover:bg-surface-soft">Clear filters</button>
          </div>
        </aside>
        <div className="grid gap-4">
          <Section title="Test paketlar">
            <div className="quest-card-grid-3">
              {activePacks.filter((pack) => `${pack.title} ${pack.exam_type} ${pack.description}`.toLowerCase().includes(query.toLowerCase())).map((pack) => <PackCard key={pack.id} pack={pack} />)}
              {!activePacks.length ? <Empty text="Pack yo'q." /> : null}
            </div>
          </Section>
          <Section title="Test bo'limlari">
            <div className="quest-card-grid-3">
              {filtered.map((test) => <TestCatalogCard key={test.id} test={test} status={completed.has(test.slug) ? "completed" : inProgress.has(test.slug) ? "in_progress" : "available"} session={sessions.find((item) => item.test_slug === test.slug)} relatedCount={tests.filter((item) => item.subject_slug === test.subject_slug && item.topic_slug === test.topic_slug).length} />)}
              {!filtered.length ? <Empty text="Bu filtr bo'yicha test yo'q." /> : null}
            </div>
          </Section>
        </div>
      </div>
    </StudentShell>
  );
}

export function StudentPackDetail({ pack, items, results }: { pack: ApiExamPack; items: ApiExamPackItem[]; results?: { attempts: number; students_submitted: number; average_score: number; item_stats: Array<{ item_id: number; attempts: number; average_score: number }> } | null }) {
  const completed = results?.item_stats.filter((item) => item.attempts > 0).length ?? 0;
  const averageScore = results?.average_score ?? 0;
  return (
    <StudentShell variant="wide">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Section title={pack.title}>
          <div className="grid gap-4">
            {items.map((item) => {
              const stat = results?.item_stats.find((row) => row.item_id === item.id);
              return (
                <div key={item.id} className="grid gap-3 quest-card p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge>{stat?.attempts ? "completed" : "available"}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{item.difficulty} / {item.question_count} questions / skills-based test</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {stat?.attempts ? <span className="text-sm font-semibold text-muted">{stat.average_score}%</span> : null}
                    <Button asChild size="sm">
                      <Link href={`/student/tests/${item.test_slug}`}>{stat?.attempts ? "View result" : "Start"}</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
        <aside className="grid h-fit gap-4 xl:sticky xl:top-24">
          <OverallMasteryCard value={averageScore} />
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Pack progress</h2>
            <div className="mt-4 grid gap-3">
              <InfoPill label="Completed" value={`${completed}/${items.length}`} />
              <InfoPill label="Attempts" value={results?.attempts ?? 0} />
              <InfoPill label="Submitted" value={results?.students_submitted ?? 0} />
            </div>
          </Card>
        </aside>
      </div>
    </StudentShell>
  );
}

export function StudentTestInstructions({ test, session }: { test: ApiTest; session?: ApiSession }) {
  const [questionCount, setQuestionCount] = useState(Math.min(30, Math.max(1, test.test_questions.length)));
  const [minutes, setMinutes] = useState(test.estimated_minutes);
  const status = session?.status ?? "available";
  const skills = testSkills(test);
  return (
    <StudentShell variant="reading">
      <div className="quest-main-aside-grid">
        <Section title="Bo'lim haqida">
          <div className="quest-card p-5">
            <p className="line-clamp-2 text-sm leading-6 text-muted">Bu bo&apos;lim quyidagi skilllarni tekshiradi: {skills.length ? skills.join(", ") : "asosiy mavzu tushunchalari"}.</p>
            <p className="mt-3 text-sm text-muted">Savollar va to&apos;g&apos;ri javoblar submit qilinmaguncha ko&apos;rsatilmaydi.</p>
            <div className="mt-4 grid gap-2">
              {skills.length ? skills.map((skill) => <span key={skill} className="rounded-xl bg-surface-soft px-3 py-2 text-sm font-semibold text-muted">{skill}</span>) : <Empty text="Skill taglari hali ulanmagan." />}
            </div>
          </div>
        </Section>
        <Section title="Boshlash sozlamalari">
          <div className="grid gap-4">
            <NumberField label="Nechta test ishlamoqchisiz?" value={questionCount} min={1} max={Math.max(1, test.test_questions.length)} onChange={setQuestionCount} />
            <NumberField label="Timer, daqiqa" value={minutes} min={1} max={240} onChange={setMinutes} />
            {status === "in_progress" && session ? <Button asChild><Link href={`/student/test-session/${session.id}`}>Continue</Link></Button> : null}
            <Button asChild><Link href={`/student/tests/${test.slug}/start?count=${questionCount}&minutes=${minutes}`}>Start</Link></Button>
            {status === "submitted" && session ? <Button asChild variant="secondary"><Link href={`/student/results/${session.id}`}>View result</Link></Button> : null}
          </div>
        </Section>
      </div>
    </StudentShell>
  );
}

export function StudentActiveSession({ initialSession, test }: { initialSession: ApiSession; test: ApiTest }) {
  const router = useRouter();
  const questions = test.test_questions.map((item) => item.question);
  const [session, setSession] = useState(initialSession);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [draftAnswers, setDraftAnswers] = useState<Record<number, string>>({});
  const [savingQuestionId, setSavingQuestionId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const timeSpentRef = useRef<Record<string, number>>({});
  const activeQuestionRef = useRef<number | null>(null);
  const activeStartedAtRef = useRef(0);
  const question = questions[index];
  const answerMap = useMemo(() => new Map(session.answers.map((answer) => [answer.question, answer])), [session.answers]);
  const current = answerMap.get(question.id);
  const currentValue = draftAnswers[question.id] ?? current?.value ?? "";
  const answered = questions.filter((item) => (draftAnswers[item.id] ?? answerMap.get(item.id)?.value)).length;
  const allAnswered = answered === questions.length;
  const shouldFinish = index === questions.length - 1 || allAnswered;
  const progress = questions.length ? Math.round((answered / questions.length) * 100) : 0;
  const elapsed = Math.max(0, Math.floor((now - new Date(session.created_at).getTime()) / 1000));
  const remaining = Math.max(0, test.estimated_minutes * 60 - elapsed);
  const timer = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const flushQuestionTime = useCallback(() => {
    const questionId = activeQuestionRef.current;
    if (!questionId || !activeStartedAtRef.current) return;
    const elapsedSeconds = Math.max(0, Math.round((nowMs() - activeStartedAtRef.current) / 1000));
    if (elapsedSeconds < 1) return;
    const key = String(questionId);
    timeSpentRef.current = {
      ...timeSpentRef.current,
      [key]: Math.min(60 * 30, (timeSpentRef.current[key] ?? 0) + elapsedSeconds),
    };
    writeRuntimeQuestionTimes(session.id, timeSpentRef.current);
    activeStartedAtRef.current = nowMs();
  }, [session.id]);

  useEffect(() => {
    timeSpentRef.current = readRuntimeQuestionTimes(session.id);
    activeQuestionRef.current = question.id;
    activeStartedAtRef.current = nowMs();
    return () => {
      flushQuestionTime();
    };
  }, [flushQuestionTime, question.id, session.id]);

  useEffect(() => {
    flushQuestionTime();
    activeQuestionRef.current = question.id;
    activeStartedAtRef.current = nowMs();
  }, [flushQuestionTime, question.id]);

  async function save(value: string, flagged = current?.is_flagged ?? false) {
    setDraftAnswers((answers) => ({ ...answers, [question.id]: value }));
    setSavingQuestionId(question.id);
    try {
      const next = await questApi.answer(String(session.id), { question: question.id, value, is_flagged: flagged });
      setSession(next);
    } finally {
      setSavingQuestionId(null);
    }
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      flushQuestionTime();
      const submitted = await questApi.submit(String(session.id));
      const studentId = getStudentCode();
      const report = buildMasteryReport(studentId, apiSessionToAnswerSnapshots({
        session: submitted,
        test,
        studentId,
        timeSpentByQuestionId: timeSpentRef.current,
      }));
      writeRuntimeReport(session.id, report);
      clearRuntimeSession(session.id);
      router.replace(`/student/results/${session.id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submit failed.");
      setSubmitting(false);
    }
  }

  return (
    <StudentShell variant="test">
      <div className="quest-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-brand px-3 py-2 text-sm font-semibold text-white"><Timer className="size-4" />{timer}</span>
            <span className="rounded-[var(--radius-control)] bg-info-soft px-3 py-2 text-sm font-semibold text-info">{answered}/{questions.length} answered</span>
            <span className="rounded-[var(--radius-control)] bg-neutral-soft px-3 py-2 text-sm font-semibold text-neutral">Question {index + 1}</span>
          </div>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Finishing..." : "Submit test"}</Button>
        </div>
        <Progress value={progress} className="mt-4" />
        {submitError ? <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{submitError}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="quest-card p-4 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Questions</h2>
            <span className="text-sm font-semibold text-subtle">{progress}%</span>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                className={cn(
                  "relative rounded-lg border px-2 py-2 text-sm font-semibold transition",
                  itemIndex === index ? "border-brand bg-brand text-white shadow-sm" : (draftAnswers[item.id] ?? answerMap.get(item.id)?.value) ? "border-brand/30 bg-success-soft text-success" : "border-line bg-surface-soft text-muted hover:border-line-strong",
                )}
              >
                {itemIndex + 1}
                {answerMap.get(item.id)?.is_flagged ? <span className="absolute right-1 top-1 size-1.5 rounded-full bg-warning" /> : null}
              </button>
            ))}
          </div>
        </aside>

        <article className="quest-card p-4">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-sm font-semibold text-brand">Question {index + 1} of {questions.length}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{question.type.replace("_", " ")}</p>
            </div>
            <button
              type="button"
              onClick={() => save(currentValue, !(current?.is_flagged ?? false))}
              className={cn("inline-flex items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-semibold transition", current?.is_flagged ? "border-warning-soft bg-warning-soft text-warning" : "border-line bg-surface hover:bg-surface-soft")}
            >
              <Flag className="size-4" />
              {current?.is_flagged ? "Flagged" : "Flag"}
            </button>
          </div>
          <div className="mt-5 rounded-xl bg-surface-soft p-4 text-lg leading-8"><LatexText text={question.prompt} /></div>
          {question.options.length ? (
            <div className="mt-5 grid gap-3">
              {question.options.map((option, optionIndex) => {
                const selected = currentValue === option;
                return (
                  <button
                    key={`${question.id}-${optionIndex}`}
                    type="button"
                    onClick={() => save(option)}
                    className={cn(
                      "flex min-h-14 items-start gap-3 rounded-xl border p-4 text-left text-sm leading-6 transition",
                      selected ? "border-brand bg-brand-soft ring-4 ring-brand-ring" : "border-line bg-surface hover:border-line-strong hover:bg-surface-soft",
                    )}
                  >
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border text-xs font-bold", selected ? "border-brand bg-brand text-white" : "border-line bg-surface-soft text-muted")}>{String.fromCharCode(65 + optionIndex)}</span>
                    <span className="min-w-0 flex-1"><LatexText text={option} /></span>
                    {selected ? <span className="shrink-0 rounded-lg bg-surface px-2 py-1 text-xs font-semibold text-brand">{savingQuestionId === question.id ? "Saving" : "Selected"}</span> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              value={currentValue}
              onChange={(event) => setDraftAnswers((answers) => ({ ...answers, [question.id]: event.target.value }))}
              onBlur={(event) => save(event.target.value)}
              rows={4}
              className="mt-5 w-full resize-none rounded-[var(--radius-control)] border border-line bg-surface-soft px-4 py-3 text-sm outline-none focus:border-brand focus:bg-surface"
              placeholder="Answer"
            />
          )}
          <div className="mt-5 flex justify-between gap-3">
            <Button type="button" variant="secondary" onClick={() => setIndex((value) => Math.max(0, value - 1))}><ArrowLeft className="size-4" />Previous</Button>
            <Button
              type="button"
              onClick={() => {
                if (shouldFinish) void submit();
                else setIndex((value) => Math.min(questions.length - 1, value + 1));
              }}
              disabled={submitting}
            >
              {shouldFinish ? (submitting ? "Finishing..." : "Finish") : "Next"}{!shouldFinish ? <ArrowRight className="size-4" /> : null}
            </Button>
          </div>
        </article>
      </div>
    </StudentShell>
  );
}
