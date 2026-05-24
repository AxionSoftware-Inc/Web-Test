"use client";

import { ArrowLeft, ArrowRight, Flag, Search, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AnalyticsBars, Badge, CompactCard, Empty, FilterSelect, MetricTile, MistakeCard, NumberField, ProgressRing, Section, StudentShell, SummaryGrid, TopicActionList, TrendChart } from "@/components/student/student-ui";
import type { ApiExamPack, ApiExamPackItem, ApiMistakesSummary, ApiProfileSummary, ApiSession, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { getStudentCode } from "@/shared/model/local-identity";
import { LatexText } from "@/shared/ui/latex-text";

type TestStatus = "assigned" | "in_progress" | "completed" | "available";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "").replace(/\\/g, "");
}

function scoreSession(session: ApiSession, test: ApiTest) {
  const answers = new Map(session.answers.map((answer) => [answer.question, answer.value]));
  const questions = test.test_questions.map((item) => item.question);
  const correct = questions.filter((question) => normalize(question.answer) === normalize(answers.get(question.id) ?? "")).length;
  const answered = questions.filter((question) => answers.get(question.id)).length;
  const wrong = Math.max(0, answered - correct);
  const skipped = Math.max(0, questions.length - answered);
  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  return { correct, wrong, skipped, answered, total: questions.length, score };
}

function testSkills(test: ApiTest) {
  return Array.from(new Set(test.test_questions.flatMap((item) => item.question.skill_titles))).slice(0, 5);
}

function topCounts(values: string[], limit: number) {
  const counts = values.reduce((map, value) => {
    const label = value || "Unknown";
    map.set(label, (map.get(label) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value, meta: `${value} mistakes` }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function StudentDashboard({ summary, tests, packs, sessions }: { summary: ApiProfileSummary; tests: ApiTest[]; packs: ApiExamPack[]; sessions: ApiSession[] }) {
  const inProgress = sessions.find((item) => item.status === "in_progress");
  const weakTopics = summary.topic_progress.filter((item) => item.value < 70);
  return (
    <StudentShell eyebrow="Student" title="Home" copy="Test ishlash, xatolar va progress uchun ixcham ish paneli." hideHeader>
      <SummaryGrid stats={[
        ["Pending tests", packs.filter((pack) => pack.is_active).length],
        ["Completed tests", summary.tests_taken],
        ["Average score", `${summary.average_score}%`],
        ["Weak topics", weakTopics.length],
      ]} />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Section title="Continue test">
          {inProgress ? <CompactCard title={inProgress.test_title} meta="In progress" href={`/student/test-session/${inProgress.id}`} action="Continue" stats={[`${inProgress.answers.length} answered`]} /> : <Empty text="Davom ettiriladigan test yo'q." />}
        </Section>
        <Section title="Recommended next action">
          <CompactCard title={weakTopics[0]?.topic ?? "Available tests"} meta={weakTopics[0] ? `${weakTopics[0].value}% mastery` : "Start practice"} href={weakTopics[0] ? "/student/mistakes" : "/student/tests"} action={weakTopics[0] ? "Review mistakes" : "Practice"} stats={weakTopics[0] ? [`${weakTopics[0].attempts} attempts`] : [`${tests.length} tests`]} />
        </Section>
      </div>
      <Section title="Assigned packs">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packs.filter((pack) => pack.is_active).slice(0, 6).map((pack) => <PackCard key={pack.id} pack={pack} />)}
        </div>
      </Section>
      <Section title="Recent results">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summary.recent_tests.map((item) => <CompactCard key={item.id} title={item.title} meta={item.topic} href={`/student/results/${item.id}`} action="View result" stats={[`${item.score}%`, `${item.correct}/${item.total}`]} />)}
          {!summary.recent_tests.length ? <Empty text="Hali natija yo'q." /> : null}
        </div>
      </Section>
    </StudentShell>
  );
}

export function StudentTestsWorkspace({ tests, packs, sessions }: { tests: ApiTest[]; packs: ApiExamPack[]; sessions: ApiSession[] }) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const completed = new Set(sessions.filter((item) => item.status === "submitted").map((item) => item.test_slug));
  const inProgress = new Set(sessions.filter((item) => item.status === "in_progress").map((item) => item.test_slug));
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
    <StudentShell eyebrow="Student" title="Tests" copy="Fan, topic, difficulty va packlar bo'yicha test katalogi.">
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {packs.filter((pack) => pack.is_active && `${pack.title} ${pack.exam_type} ${pack.description}`.toLowerCase().includes(query.toLowerCase())).map((pack) => <PackCard key={pack.id} pack={pack} />)}
              {!packs.filter((pack) => pack.is_active).length ? <Empty text="Pack yo'q." /> : null}
            </div>
          </Section>
          <Section title="Test bo'limlari">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
  return (
    <StudentShell eyebrow="Pack" title={pack.title} copy={pack.description || "Tayyor test pack."}>
      <SummaryGrid stats={[
        ["Subject", pack.exam_type || "General"],
        ["Level", "Pack"],
        ["Tests", items.length],
        ["Completed", completed],
        ["Average score", `${results?.average_score ?? 0}%`],
        ["Due date", "No due date"],
      ]} />
      <Section title="Test list">
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
                  <Link href={`/student/tests/${item.test_slug}`} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover">{stat?.attempts ? "View result" : "Start"}</Link>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </StudentShell>
  );
}

export function StudentTestInstructions({ test, session }: { test: ApiTest; session?: ApiSession }) {
  const [questionCount, setQuestionCount] = useState(Math.min(30, Math.max(1, test.test_questions.length)));
  const [minutes, setMinutes] = useState(test.estimated_minutes);
  const status = session?.status ?? "available";
  const skills = testSkills(test);
  return (
    <StudentShell eyebrow="Test bo'limi" title={test.title} copy={`${test.subject_slug} / ${test.topic_slug}`}>
      <SummaryGrid stats={[
        ["Subject", test.subject_slug],
        ["Topic", test.topic_slug],
        ["Level", test.difficulty],
        ["Available tests", test.test_questions.length],
        ["Default time", `${test.estimated_minutes} min`],
        ["Attempt limit", "1+"],
        ["Due date", "No due date"],
        ["Status", status],
      ]} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Section title="Bo'lim haqida">
          <div className="quest-card p-4">
            <p className="line-clamp-2 text-sm leading-6 text-muted">Bu bo&apos;lim quyidagi skilllarni tekshiradi: {skills.length ? skills.join(", ") : "asosiy mavzu tushunchalari"}.</p>
            <p className="mt-3 text-sm text-muted">Savollar va to&apos;g&apos;ri javoblar submit qilinmaguncha ko&apos;rsatilmaydi.</p>
            <div className="mt-4 grid gap-2">
              {skills.map((skill) => <span key={skill} className="rounded-xl bg-surface-soft px-3 py-2 text-sm font-semibold text-muted">{skill}</span>)}
            </div>
          </div>
        </Section>
        <Section title="Boshlash sozlamalari">
          <div className="grid gap-4">
            <NumberField label="Nechta test ishlamoqchisiz?" value={questionCount} min={1} max={Math.max(1, test.test_questions.length)} onChange={setQuestionCount} />
            <NumberField label="Timer, daqiqa" value={minutes} min={1} max={240} onChange={setMinutes} />
            {status === "in_progress" && session ? <Link href={`/student/test-session/${session.id}`} className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-hover">Continue</Link> : null}
            <Link href={`/student/tests/${test.slug}/start?count=${questionCount}&minutes=${minutes}`} className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-hover">Start</Link>
            {status === "submitted" && session ? <Link href={`/student/results/${session.id}`} className="rounded-[var(--radius-control)] border border-line bg-surface px-4 py-3 text-center text-sm font-semibold">View result</Link> : null}
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
      await questApi.submit(String(session.id));
      router.replace(`/student/results/${session.id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submit failed.");
      setSubmitting(false);
    }
  }

  return (
    <StudentShell eyebrow="Active test" title={test.title} copy="Javobni tanlang, flag qiling va submit qiling. To'g'ri javoblar submitdan oldin ko'rsatilmaydi." wide>
      <div className="quest-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-brand px-3 py-2 text-sm font-semibold text-white"><Timer className="size-4" />{timer}</span>
            <span className="rounded-[var(--radius-control)] bg-info-soft px-3 py-2 text-sm font-semibold text-info">{answered}/{questions.length} answered</span>
            <span className="rounded-[var(--radius-control)] bg-neutral-soft px-3 py-2 text-sm font-semibold text-neutral">Question {index + 1}</span>
          </div>
          <button onClick={submit} disabled={submitting} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60">{submitting ? "Finishing..." : "Submit test"}</button>
        </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-soft">
          <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
        </div>
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
            <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-semibold hover:bg-surface-soft"><ArrowLeft className="size-4" />Previous</button>
            <button
              type="button"
              onClick={() => {
                if (shouldFinish) void submit();
                else setIndex((value) => Math.min(questions.length - 1, value + 1));
              }}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
            >
              {shouldFinish ? (submitting ? "Finishing..." : "Finish") : "Next"}{!shouldFinish ? <ArrowRight className="size-4" /> : null}
            </button>
          </div>
        </article>
      </div>
    </StudentShell>
  );
}

export function StudentResult({ session, test }: { session: ApiSession; test: ApiTest }) {
  const stats = scoreSession(session, test);
  const answerMap = new Map(session.answers.map((answer) => [answer.question, answer.value]));
  const questions = test.test_questions.map((item) => item.question);
  const mistakes = questions.filter((question) => normalize(question.answer) !== normalize(answerMap.get(question.id) ?? ""));
  const correctQuestions = questions.filter((question) => normalize(question.answer) === normalize(answerMap.get(question.id) ?? ""));
  const skills = Array.from(new Set(mistakes.flatMap((question) => question.skill_titles))).slice(0, 6);
  const skillRows = topCounts(mistakes.flatMap((question) => question.skill_titles.length ? question.skill_titles : ["Untagged skill"]), 6);
  const answerRows = [
    { label: "Correct", value: stats.correct, meta: `${stats.correct}/${stats.total}` },
    { label: "Wrong", value: stats.wrong, meta: `${stats.wrong}/${stats.total}` },
    { label: "Skipped", value: stats.skipped, meta: `${stats.skipped}/${stats.total}` },
  ];
  const resultTone = stats.score >= test.passing_score ? "Passed" : "Needs review";
  return (
    <StudentShell eyebrow="Result" title={test.title} copy="Score, breakdown, weak skills va keyingi qadamlar.">
      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="quest-card p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Final score</p>
              <h1 className="mt-2 text-6xl font-semibold tracking-tight">{stats.score}%</h1>
              <p className="mt-2 text-sm text-muted">{resultTone} / passing score {test.passing_score}%</p>
            </div>
            <ProgressRing label="Result quality" value={stats.score} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetricTile label="Correct" value={stats.correct} sub={`${stats.total} total`} tone="green" />
            <MetricTile label="Wrong" value={stats.wrong} sub="Needs review" tone="red" />
            <MetricTile label="Skipped" value={stats.skipped} sub="No answer" tone="neutral" />
          </div>
        </div>
        <aside className="quest-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Next actions</p>
          <h2 className="mt-2 text-xl font-semibold">{skills[0] ?? (stats.score >= test.passing_score ? "Keep momentum" : "Review mistakes")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {skills[0] ? `${skills[0]} bo'yicha xatolar bor. Avval mistake review, keyin shu topicdagi testni qayta ishlang.` : "Natija yaxshi. Keyingi topic yoki packga o'ting."}
          </p>
          <div className="mt-4 grid gap-2">
            <Link href="/student/mistakes" className="rounded-[var(--radius-control)] bg-brand px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-brand-hover">Review mistakes</Link>
            <Link href={`/student/tests/${test.slug}/start`} className="rounded-[var(--radius-control)] border border-line bg-surface px-4 py-2 text-center text-sm font-semibold">Start</Link>
            <Link href="/student/tests" className="rounded-[var(--radius-control)] border border-line bg-surface px-4 py-2 text-center text-sm font-semibold">Practice</Link>
          </div>
        </aside>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Answer breakdown">
          <AnalyticsBars rows={answerRows} empty="Breakdown yo'q." />
        </Section>
        <Section title="Weak skill distribution">
          <AnalyticsBars rows={skillRows} tone="critical" empty="Weak skill topilmadi." />
        </Section>
      </div>

      <Section title="Question review">
        <div className="grid gap-3">
          {questions.map((question, index) => {
            const userAnswer = answerMap.get(question.id) ?? "";
            const isCorrect = normalize(question.answer) === normalize(userAnswer);
            const isSkipped = !userAnswer;
            return (
              <Link key={question.id} href={`/student/mistakes/${session.id}-${question.id}`} className="grid gap-3 quest-card p-4 hover:bg-surface-soft md:grid-cols-[40px_1fr_auto] md:items-center">
                <span className={cn("grid size-9 place-items-center rounded-lg text-sm font-semibold", isCorrect ? "bg-brand-soft text-brand" : isSkipped ? "bg-surface-soft text-subtle" : "bg-danger-soft text-danger")}>{index + 1}</span>
                <div className="min-w-0">
                  <p className="line-clamp-1 font-semibold"><LatexText text={question.prompt} /></p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted">{question.skill_titles.join(", ") || test.topic_slug}</p>
                </div>
                <Badge>{isCorrect ? "correct" : isSkipped ? "skipped" : "wrong"}</Badge>
              </Link>
            );
          })}
        </div>
      </Section>

      {correctQuestions.length ? (
        <Section title="Strong signals">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from(new Set(correctQuestions.flatMap((question) => question.skill_titles))).slice(0, 6).map((skill) => (
              <CompactCard key={skill} title={skill} meta="Answered correctly" href="/student/tests" action="Practice" stats={["strong"]} />
            ))}
          </div>
        </Section>
      ) : null}
    </StudentShell>
  );
}

export function StudentMistakes({ initialSummary }: { initialSummary: ApiMistakesSummary }) {
  const [summary, setSummary] = useState(initialSummary);
  const [query, setQuery] = useState("");
  useEffect(() => {
    questApi.mistakesSummary(getStudentCode()).then(setSummary).catch(() => undefined);
  }, []);
  const mistakes = summary.mistakes.filter((item) => `${item.test_title} ${item.topic} ${item.skills.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const totalMistakes = summary.mistakes.length;
  const topicRows = topCounts(summary.mistakes.map((item) => item.topic), 6);
  const testRows = topCounts(summary.mistakes.map((item) => item.test_title), 5);
  const skillRows = summary.weak_skills.slice(0, 8).map((item) => ({
    label: item.skill,
    value: Math.max(0, 100 - item.percent),
    meta: `${item.percent}% mastery / ${item.total} questions`,
  }));
  const focus = summary.weak_skills[0];
  return (
    <StudentShell eyebrow="Mistake analytics" title="Xatolar analizi" copy="Ishlangan testlardan xatolar ajratiladi, zaif skilllar va keyingi o'rganish yo'nalishi ko'rsatiladi.">
      <SummaryGrid stats={[
        ["Total mistakes", totalMistakes],
        ["Weak skills", summary.weak_skills.length],
        ["Main weak skill", focus?.skill ?? "No data"],
        ["Lowest mastery", focus ? `${focus.percent}%` : "No data"],
      ]} />
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Section title="Skill weakness index">
          <AnalyticsBars rows={skillRows} tone="critical" empty="Skill data hali yo'q." />
        </Section>
        <Section title="Recommended next action">
          <div className="quest-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">Priority</p>
            <h3 className="mt-2 text-xl font-semibold">{focus?.skill ?? "Avval test ishlang"}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {focus ? `${focus.skill} bo'yicha mastery ${focus.percent}%. Avval xato savollarni ko'rib chiqing, keyin shu skillga yaqin testni qayta ishlang.` : "Mistake analytics uchun kamida bitta test submit qiling."}
            </p>
            <Link href="/student/tests" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover">Practice topic</Link>
          </div>
        </Section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Mistakes by topic">
          <AnalyticsBars rows={topicRows} empty="Topic bo'yicha xato yo'q." />
        </Section>
        <Section title="Mistakes by test">
          <AnalyticsBars rows={testRows} empty="Test bo'yicha xato yo'q." />
        </Section>
      </div>
      <Section title="Mistake review queue">
        <div className="mb-4 flex items-center gap-2 quest-card px-3 py-2">
          <Search className="size-4 text-subtle" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Subject, topic, test, status..." className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mistakes.map((mistake) => <MistakeCard key={`${mistake.session_id}-${mistake.question_id}`} mistake={mistake} />)}
          {!mistakes.length ? <Empty text="Xato topilmadi." /> : null}
        </div>
      </Section>
    </StudentShell>
  );
}

export function StudentMistakeDetail({ initialSummary, mistakeId }: { initialSummary: ApiMistakesSummary; mistakeId: string }) {
  const [summary, setSummary] = useState(initialSummary);
  useEffect(() => {
    questApi.mistakesSummary(getStudentCode()).then(setSummary).catch(() => undefined);
  }, []);
  const mistake = summary.mistakes.find((item) => `${item.session_id}-${item.question_id}` === mistakeId) ?? summary.mistakes[0];
  if (!mistake) return <StudentShell eyebrow="Mistake" title="Mistake not found"><Empty text="Bu xato topilmadi." /></StudentShell>;
  return (
    <StudentShell eyebrow="Mistake detail" title={mistake.test_title} copy={mistake.topic}>
      <Section title="Question">
        <div className="quest-card p-4">
          <LatexText text={mistake.prompt} />
          <div className="mt-4 grid gap-2 text-sm text-muted">
            <p><strong>Your answer:</strong> {mistake.user_answer || "Skipped"}</p>
            <p><strong>Correct answer:</strong> {mistake.correct_answer}</p>
            <p><strong>Related topic:</strong> {mistake.topic}</p>
            <p><strong>Common mistake:</strong> {mistake.skills.length ? `${mistake.skills.join(", ")} skillini qayta ko'rib chiqish kerak.` : "Asosiy tushunchani qayta tekshiring."}</p>
          </div>
          {mistake.explanation ? <div className="mt-4 rounded-xl bg-surface-soft p-4 text-sm leading-6 text-muted"><LatexText text={mistake.explanation} /></div> : null}
        </div>
      </Section>
      <div className="flex flex-wrap gap-3">
        <Link href="/student/tests" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover">Practice topic</Link>
      </div>
    </StudentShell>
  );
}

export function StudentProgress({ summary }: { summary: ApiProfileSummary }) {
  const strong = summary.topic_progress.filter((item) => item.value >= 75);
  const weak = summary.topic_progress.filter((item) => item.value < 70);
  const orderedTopics = [...summary.topic_progress].sort((a, b) => a.value - b.value);
  const scoreRows = summary.recent_tests.slice(0, 8).reverse().map((item) => ({
    label: item.title,
    value: item.score,
    meta: `${item.correct}/${item.total} correct`,
  }));
  const masteryRows = orderedTopics.map((item) => ({
    label: item.topic,
    value: item.value,
    meta: `${item.attempts} attempts`,
  }));
  return (
    <StudentShell eyebrow="Student analytics" title="Progress" copy="Overall progress, topic mastery, score trend va kuchli/zaif mavzular.">
      <SummaryGrid stats={[["Average score", `${summary.average_score}%`], ["Completed tests", summary.tests_taken], ["Answered", summary.answered_questions], ["Correct", summary.correct_answers]]} />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Section title="Score trend">
          <TrendChart rows={scoreRows} />
        </Section>
        <Section title="Mastery overview">
          <div className="grid gap-3">
            <ProgressRing label="Average score" value={summary.average_score} />
            <ProgressRing label="Math mastery" value={summary.math_mastery} />
          </div>
        </Section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Topic mastery">
          <AnalyticsBars rows={masteryRows} tone="mastery" empty="Topic mastery hali yo'q." />
        </Section>
        <Section title="Weak topics to study next">
          <TopicActionList items={weak} />
        </Section>
      </div>
      <Section title="Strong topics">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{strong.map((topic) => <CompactCard key={topic.slug} title={topic.topic} meta={`${topic.attempts} attempts`} href="/student/tests" action="Practice" stats={[`${topic.value}% mastery`]} />)}{!strong.length ? <Empty text="Kuchli mavzular hali yetarli emas." /> : null}</div>
      </Section>
    </StudentShell>
  );
}

export function StudentProfile({ summary }: { summary: ApiProfileSummary }) {
  return (
    <StudentShell eyebrow="Student" title="Profile" copy="Basic settings va test history summary.">
      <SummaryGrid stats={[["Name", summary.name], ["Role", "Student"], ["School", "Not linked"], ["Class", "Not linked"], ["Teacher", "Not linked"], ["Tests", summary.tests_taken]]} />
      <Section title="Test history summary">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{summary.recent_tests.map((test) => <CompactCard key={test.id} title={test.title} meta={test.topic} href={`/student/results/${test.id}`} action="View result" stats={[`${test.score}%`, test.submitted_at.slice(0, 10)]} />)}</div>
      </Section>
    </StudentShell>
  );
}

function TestCatalogCard({ test, status, session, relatedCount }: { test: ApiTest; status: TestStatus; session?: ApiSession; relatedCount: number }) {
  const router = useRouter();
  const startHref = status === "in_progress" && session ? `/student/test-session/${session.id}` : `/student/tests/${test.slug}/start`;
  return (
    <article onClick={() => router.push(`/student/tests/${test.slug}`)} className="flex min-h-[158px] cursor-pointer flex-col quest-card p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold leading-5">{test.title}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted">{test.subject_slug} / {test.topic_slug}</p>
        </div>
        <Badge>{status === "completed" ? "done" : status === "in_progress" ? "active" : test.difficulty}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-subtle">
        <span className="rounded-lg bg-surface-soft px-2 py-1">{relatedCount} tests</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.test_questions.length} questions</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.estimated_minutes} min</span>
      </div>
      <button
        onClick={(event) => {
          event.stopPropagation();
          router.push(startHref);
        }}
        className="mt-auto w-fit rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        {status === "in_progress" ? "Continue" : "Start"}
      </button>
    </article>
  );
}

function PackCard({ pack }: { pack: ApiExamPack }) {
  return <CompactCard title={pack.title} meta={pack.exam_type || "Pack"} href={`/student/packs/${pack.slug}`} action="Start" status={pack.visibility} stats={[`${pack.item_count} tests`, pack.price_label || "Free"]} />;
}
