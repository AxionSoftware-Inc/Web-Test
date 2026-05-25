"use client";

import { ArrowLeft, ArrowRight, Flag, Search, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PackCard, TestCatalogCard } from "@/components/student/student-cards";
import { AnalyticsBars, Badge, CompactCard, Empty, FilterSelect, MetricTile, NumberField, PageHeader, ProgressRing, Section, StudentShell, TopicActionList, TrendChart } from "@/components/student/student-ui";
import { apiSessionToAnswerSnapshots, apiSessionsToAnswerSnapshots, buildMasteryReport, clearRuntimeSession, readRuntimeQuestionTimes, readRuntimeReport, writeRuntimeQuestionTimes, writeRuntimeReport } from "@/features/mastery-engine/model";
import type { MasteryReport } from "@/features/mastery-engine/model";
import type { ApiExamPack, ApiExamPackItem, ApiMistakesSummary, ApiProfileSummary, ApiSession, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { getStudentCode } from "@/shared/model/local-identity";
import { LatexText } from "@/shared/ui/latex-text";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "").replace(/\\/g, "");
}

function nowMs() {
  return new Date().getTime();
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

export function StudentDashboard({
  summary,
  tests,
  packs,
  sessions,
  mistakes,
}: {
  summary: ApiProfileSummary;
  tests: ApiTest[];
  packs: ApiExamPack[];
  sessions: ApiSession[];
  mistakes?: ApiMistakesSummary;
}) {
  const inProgressSessions = sessions.filter((item) => item.status === "in_progress");
  const completedSessions = sessions.filter((item) => item.status === "submitted");
  const activeSession = inProgressSessions[0];
  const completedSlugs = new Set(completedSessions.map((item) => item.test_slug));
  const inProgressBySlug = new Map(inProgressSessions.map((item) => [item.test_slug, item]));
  const weakTopics = [...summary.topic_progress].filter((item) => item.value < 75).sort((a, b) => a.value - b.value);
  const availableTests = tests.filter((test) => !completedSlugs.has(test.slug));
  const nextTest = activeSession
    ? tests.find((test) => test.slug === activeSession.test_slug)
    : availableTests[0] ?? tests[0];
  const assignedTests = buildAssignedTests(tests, sessions).slice(0, 6);
  const activePackCount = packs.filter((pack) => pack.is_active).length;
  const trendRows = summary.recent_tests.slice(-12).map((item) => ({
    label: shortDate(item.submitted_at),
    score: item.score,
    testTitle: item.title,
    date: formatDate(item.submitted_at),
  }));
  const topicRows = [...summary.topic_progress]
    .sort((a, b) => a.value - b.value)
    .slice(0, 8)
    .map((item) => ({ topic: item.topic, mastery: item.value, attempts: item.attempts }));
  const recentMistakes = (mistakes?.mistakes ?? []).slice(0, 3);
  const recentResults = summary.recent_tests.slice(0, 3);
  const recommendation = deriveRecommendation({ activeSession, nextTest, weakTopics, assignedTests });
  const pendingTests = Math.max(0, assignedTests.filter((item) => item.status === "assigned").length || availableTests.length || activePackCount);

  return (
    <StudentShell variant="wide">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink md:text-3xl">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Your tests, progress and weak topics are ready.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/student/tests">View all tests</Link>
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StudentHomeStat label="Pending tests" value={pendingTests} />
        <StudentHomeStat label="In progress" value={inProgressSessions.length} />
        <StudentHomeStat label="Average score" value={`${summary.average_score || 0}%`} />
        <StudentHomeStat label="Weak topics" value={weakTopics.length} />
        <StudentHomeStat label="Completed tests" value={summary.tests_taken || completedSessions.length} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="grid gap-6">
          <ContinueOrNextTestCard activeSession={activeSession} nextTest={nextTest} />
          <AssignedTestsPreview tests={assignedTests} inProgressBySlug={inProgressBySlug} />
          <ScoreTrendChart rows={trendRows} />
        </main>

        <aside className="grid h-fit gap-4 xl:sticky xl:top-24">
          <OverallMasteryCard value={summary.math_mastery || summary.average_score || 0} />
          <WeakTopicsCard rows={topicRows} />
          <RecommendedNextActionCard recommendation={recommendation} />
          <RecentMistakesCard mistakes={recentMistakes} />
          <RecentResultsCard results={recentResults} />
        </aside>
      </div>
    </StudentShell>
  );
}

type StudentAssignedTest = {
  id: number;
  slug: string;
  title: string;
  subject: string;
  topic: string;
  status: "assigned" | "in_progress" | "completed" | "expired";
  questionCount: number;
  estimatedMinutes: number;
  score?: number;
  activeSessionId?: number;
};

type StudentTrendRow = {
  label: string;
  score: number;
  testTitle: string;
  date: string;
};

type StudentTopicRow = {
  topic: string;
  mastery: number;
  attempts: number;
};

function buildAssignedTests(tests: ApiTest[], sessions: ApiSession[]): StudentAssignedTest[] {
  const sessionBySlug = new Map(sessions.map((session) => [session.test_slug, session]));
  return tests
    .map((test) => {
      const session = sessionBySlug.get(test.slug);
      const status: StudentAssignedTest["status"] = session?.status === "in_progress" ? "in_progress" : session?.status === "submitted" ? "completed" : "assigned";
      return {
        id: test.id,
        slug: test.slug,
        title: test.title,
        subject: test.subject_slug,
        topic: test.topic_slug,
        status,
        questionCount: test.test_questions.length,
        estimatedMinutes: test.estimated_minutes,
        activeSessionId: session?.status === "in_progress" ? session.id : undefined,
      };
    })
    .sort((a, b) => statusRank(a.status) - statusRank(b.status));
}

function statusRank(status: StudentAssignedTest["status"]) {
  if (status === "in_progress") return 0;
  if (status === "assigned") return 1;
  if (status === "expired") return 2;
  return 3;
}

function deriveRecommendation({
  activeSession,
  nextTest,
  weakTopics,
  assignedTests,
}: {
  activeSession?: ApiSession;
  nextTest?: ApiTest;
  weakTopics: ApiProfileSummary["topic_progress"];
  assignedTests: StudentAssignedTest[];
}) {
  if (activeSession) {
    return {
      title: `Continue ${activeSession.test_title}`,
      reason: "You already started this test. Finish it while the context is fresh.",
      actionLabel: "Continue",
      href: `/student/test-session/${activeSession.id}`,
    };
  }
  if (weakTopics.length) {
    return {
      title: `Review ${weakTopics[0].topic}`,
      reason: `${weakTopics[0].value}% mastery across ${weakTopics[0].attempts} attempts. Start with focused practice.`,
      actionLabel: "Review mistakes",
      href: "/student/mistakes",
    };
  }
  if (nextTest ?? assignedTests[0]) {
    const test = nextTest;
    return {
      title: test ? `Start ${test.title}` : `Start ${assignedTests[0].title}`,
      reason: "A short diagnostic will update your progress and recommendations.",
      actionLabel: "Start",
      href: test ? `/student/tests/${test.slug}/start` : `/student/tests/${assignedTests[0].slug}/start`,
    };
  }
  return {
    title: "Check available tests",
    reason: "No assigned work is waiting right now. Browse the catalog for practice.",
    actionLabel: "Practice",
    href: "/student/tests",
  };
}

function StudentHomeStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="min-h-[104px] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
    </Card>
  );
}

function ContinueOrNextTestCard({ activeSession, nextTest }: { activeSession?: ApiSession; nextTest?: ApiTest }) {
  const questionCount = nextTest?.test_questions.length ?? 0;
  const answeredCount = activeSession?.answers.length ?? 0;
  const estimatedMinutesLeft = nextTest ? Math.max(1, nextTest.estimated_minutes - Math.floor((answeredCount / Math.max(1, questionCount)) * nextTest.estimated_minutes)) : 0;
  const href = activeSession ? `/student/test-session/${activeSession.id}` : nextTest ? `/student/tests/${nextTest.slug}/start` : "/student/tests";
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">{activeSession ? "Continue your test" : "Next assigned test"}</p>
          <h2 className="mt-2 line-clamp-2 text-xl font-semibold text-ink">{activeSession?.test_title ?? nextTest?.title ?? "No active test"}</h2>
          <p className="mt-2 text-sm text-muted">
            {nextTest ? `${nextTest.subject_slug} · ${nextTest.topic_slug}` : "Choose a test from the catalog when you are ready."}
          </p>
        </div>
        <div className="grid gap-2 text-sm text-muted sm:grid-cols-3 lg:min-w-[360px]">
          <InfoPill label="Answered" value={`${answeredCount}/${questionCount}`} />
          <InfoPill label="Questions" value={questionCount || "-"} />
          <InfoPill label="Time left" value={estimatedMinutesLeft ? `${estimatedMinutesLeft} min` : "-"} />
        </div>
        <Button asChild className="w-fit">
          <Link href={href}>{activeSession ? "Continue" : "Start"}</Link>
        </Button>
      </div>
    </Card>
  );
}

function AssignedTestsPreview({ tests, inProgressBySlug }: { tests: StudentAssignedTest[]; inProgressBySlug: Map<string, ApiSession> }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Assigned tests</h2>
          <p className="mt-1 text-sm text-muted">Most relevant tests are shown first.</p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/student/tests">View all</Link>
        </Button>
      </div>
      <div className="mt-4 grid gap-3 2xl:grid-cols-2">
        {tests.length ? tests.map((test) => {
          const session = inProgressBySlug.get(test.slug);
          const action = test.status === "in_progress" ? "Continue" : test.status === "completed" ? "View result" : "Start";
          const href = test.status === "in_progress" && session ? `/student/test-session/${session.id}` : test.status === "completed" && session ? `/student/results/${session.id}` : `/student/tests/${test.slug}/start`;
          return (
            <article key={test.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-sm font-semibold text-ink">{test.title}</h3>
                  <p className="mt-1 text-sm text-muted">{test.subject} · {test.topic}</p>
                </div>
                <StudentStatusBadge status={test.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-subtle">
                <span className="rounded-lg bg-neutral-soft px-2 py-1">{test.questionCount} questions</span>
                <span className="rounded-lg bg-neutral-soft px-2 py-1">{test.estimatedMinutes} min</span>
              </div>
              <Button asChild size="sm" className="mt-4">
                <Link href={href}>{action}</Link>
              </Button>
            </article>
          );
        }) : <CompactEmpty title="No assigned tests" />}
      </div>
    </Card>
  );
}

function ScoreTrendChart({ rows }: { rows: StudentTrendRow[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Score trend</h2>
      <p className="mt-1 text-sm text-muted">Last completed tests, scored from 0 to 100.</p>
      <div className="mt-4 h-[300px]">
        {rows.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ left: 0, right: 16, top: 12, bottom: 0 }}>
              <defs>
                <linearGradient id="studentHomeScoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted)" fontSize={12} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} stroke="var(--muted)" fontSize={12} width={32} />
              <ReferenceLine y={70} stroke="var(--warning)" strokeDasharray="4 4" />
              <Tooltip content={<StudentHomeTooltip />} />
              <Area dataKey="score" type="monotone" stroke="var(--chart-1)" strokeWidth={2} fill="url(#studentHomeScoreFill)" isAnimationActive animationDuration={850} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <CompactEmpty title="No score trend yet" />}
      </div>
    </Card>
  );
}

function OverallMasteryCard({ value }: { value: number }) {
  const data = [{ name: "Overall mastery", value, fill: "var(--chart-1)" }];
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Overall mastery</h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative size-28">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart data={data} innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "var(--surface-soft)" }} isAnimationActive animationDuration={850} animationEasing="ease-out" />
            </RadialBarChart>
          </ResponsiveContainer>
          <span className="absolute inset-0 grid place-items-center text-2xl font-semibold">{value}%</span>
        </div>
        <p className="text-sm leading-6 text-muted">Based on completed tests and topic mastery.</p>
      </div>
    </Card>
  );
}

function WeakTopicsCard({ rows }: { rows: StudentTopicRow[] }) {
  const weakRows = rows.slice(0, 6);
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Weak topics</h2>
      <div className="mt-4 grid gap-3">
        {weakRows.length ? weakRows.map((row) => (
          <div key={row.topic} className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="line-clamp-1 font-semibold">{row.topic}</span>
              <span className="text-muted">{row.mastery}% · {row.attempts} attempts</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-soft">
              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${row.mastery}%`, background: masteryColor(row.mastery) }} />
            </div>
            <Link href="/student/tests" className="w-fit text-xs font-semibold text-brand hover:text-brand-hover">Practice</Link>
          </div>
        )) : <CompactEmpty title="No weak topics yet" />}
      </div>
    </Card>
  );
}

function RecommendedNextActionCard({ recommendation }: { recommendation: { title: string; reason: string; actionLabel: string; href: string } }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Recommended next</h2>
      <h3 className="mt-3 line-clamp-2 text-base font-semibold">{recommendation.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{recommendation.reason}</p>
      <Button asChild className="mt-4">
        <Link href={recommendation.href}>{recommendation.actionLabel}</Link>
      </Button>
    </Card>
  );
}

function RecentMistakesCard({ mistakes }: { mistakes: ApiMistakesSummary["mistakes"] }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Recent mistakes</h2>
      <div className="mt-4 grid gap-3">
        {mistakes.length ? mistakes.map((mistake) => (
          <div key={`${mistake.session_id}-${mistake.question_id}`} className="rounded-[var(--radius-control)] border border-line bg-surface p-3">
            <p className="line-clamp-2 text-sm font-semibold">{mistake.prompt}</p>
            <p className="mt-1 text-xs text-muted">{mistake.topic} · {mistake.test_title}</p>
            <Link href={`/student/mistakes/${mistake.session_id}-${mistake.question_id}`} className="mt-2 inline-flex text-xs font-semibold text-brand hover:text-brand-hover">Review</Link>
          </div>
        )) : <CompactEmpty title="No recent mistakes" />}
      </div>
    </Card>
  );
}

function RecentResultsCard({ results }: { results: ApiProfileSummary["recent_tests"] }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Recent results</h2>
      <div className="mt-4 grid gap-3">
        {results.length ? results.map((result) => (
          <div key={result.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-line bg-surface p-3">
            <div className="min-w-0">
              <p className="line-clamp-1 text-sm font-semibold">{result.title}</p>
              <p className="mt-1 text-xs text-muted">{formatDate(result.submitted_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <UiBadge variant={result.score >= 70 ? "success" : "warning"}>{result.score}%</UiBadge>
              <Link href={`/student/results/${result.id}`} className="text-xs font-semibold text-brand hover:text-brand-hover">View result</Link>
            </div>
          </div>
        )) : <CompactEmpty title="No recent results" />}
      </div>
    </Card>
  );
}

function StudentStatusBadge({ status }: { status: StudentAssignedTest["status"] }) {
  const variant = status === "completed" ? "success" : status === "in_progress" ? "warning" : status === "expired" ? "danger" : "info";
  return <UiBadge variant={variant}>{status.replace("_", " ")}</UiBadge>;
}

function InfoPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-control)] bg-surface-soft px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

function CompactEmpty({ title }: { title: string }) {
  return <p className="rounded-[var(--radius-control)] border border-dashed border-line-strong bg-surface p-4 text-sm text-muted">{title}</p>;
}

function StudentHomeTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: StudentTrendRow }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-[12px] border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="font-semibold text-ink">{row.testTitle}</p>
      <p className="mt-1 text-muted">{row.score}%</p>
      <p className="mt-1 text-subtle">{row.date}</p>
    </div>
  );
}

function masteryColor(value: number) {
  if (value >= 75) return "var(--success)";
  if (value >= 50) return "var(--warning)";
  return "var(--danger)";
}

function formatDate(value?: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function shortDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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

export function StudentResult({ session, test }: { session: ApiSession; test: ApiTest }) {
  const stats = scoreSession(session, test);
  const answerSnapshots = apiSessionToAnswerSnapshots({ session, test, studentId: getStudentCode(), timeSpentByQuestionId: readRuntimeQuestionTimes(session.id) });
  const fallbackReport = buildMasteryReport(getStudentCode(), answerSnapshots);
  const report = readRuntimeReport<MasteryReport>(session.id) ?? fallbackReport;
  const subjectTopics = report.topics.filter((topic) => topic.subject === test.subject_slug || topic.topicSlug === test.topic_slug);
  const subjectSkills = report.skills.filter((skill) => subjectTopics.some((topic) => topic.topicSlug === skill.topicSlug));
  const subjectMistakes = report.mistakes.filter((mistake) => mistake.subject === test.subject_slug || mistake.topicSlug === test.topic_slug);
  const recommendation = report.recommendedActions.find((action) => subjectTopics.some((topic) => topic.topicSlug === action.topicSlug)) ?? report.recommendedActions[0];
  const expectedTimeSeconds = answerSnapshots.reduce((sum, item) => sum + item.estimatedSeconds, 0);
  const timeSpentSeconds = answerSnapshots.reduce((sum, item) => sum + item.timeSpentSeconds, 0);
  const averageTimePerQuestion = Math.round(timeSpentSeconds / Math.max(1, answerSnapshots.length));
  const topicBreakdown = subjectTopics.length ? subjectTopics : [{
    studentId: getStudentCode(),
    subject: test.subject_slug,
    topic: test.topic_slug,
    topicSlug: test.topic_slug,
    attempts: stats.total,
    correct: stats.correct,
    wrong: stats.wrong,
    accuracy: stats.score,
    mastery: stats.score,
    averageTimeSeconds: averageTimePerQuestion,
    expectedAverageTimeSeconds: Math.round(expectedTimeSeconds / Math.max(1, stats.total)),
    confidence: stats.total >= 15 ? "high" as const : stats.total >= 6 ? "medium" as const : "low" as const,
    status: stats.score < 50 ? "weak" as const : stats.score < 70 ? "needs_practice" as const : stats.score < 85 ? "good" as const : "mastered" as const,
    isFundamental: false,
    prerequisites: [],
    updatedAt: session.submitted_at ?? session.created_at,
    priorityScore: Math.max(0, 70 - stats.score) + stats.wrong * 2,
  }];
  const questionSignals = answerSnapshots.map((answer, index) => ({
    questionNumber: index + 1,
    topic: answer.topic,
    isCorrect: answer.isCorrect,
    timeSpentSeconds: answer.timeSpentSeconds,
    estimatedSeconds: answer.estimatedSeconds,
    difficulty: answer.difficulty,
  }));
  const wrongQuestions = subjectMistakes.length ? subjectMistakes : answerSnapshots.filter((answer) => !answer.isCorrect).map((answer, index) => ({
    id: `${answer.sessionId}-${answer.questionId}`,
    studentId: answer.studentId,
    sessionId: answer.sessionId,
    testId: answer.testId,
    questionId: answer.questionId,
    subject: answer.subject,
    topic: answer.topic,
    topicSlug: answer.topicSlug,
    skills: answer.skills,
    questionTitle: answer.questionTitle,
    questionPreview: answer.questionPreview,
    studentAnswer: answer.selectedAnswer,
    correctAnswer: answer.correctAnswer,
    explanation: answer.explanation,
    difficulty: answer.difficulty,
    timeSpentSeconds: answer.timeSpentSeconds,
    estimatedSeconds: answer.estimatedSeconds,
    timeQuality: "normal" as const,
    status: "new" as const,
    priority: "medium" as const,
    mistakeType: "unknown" as const,
    recommendedAction: recommendation ?? { type: "practice" as const, label: "Practice", href: "/student/tests", reason: "Review this topic.", priority: "medium" as const, topicSlug: answer.topicSlug },
    createdAt: answer.answeredAt,
    questionNumber: index + 1,
  }));
  const overallMastery = Math.round(topicBreakdown.reduce((sum, item) => sum + item.mastery, 0) / Math.max(1, topicBreakdown.length));
  const resultTone = stats.score >= test.passing_score ? "Passed" : "Needs review";
  return (
    <StudentShell variant="wide">
      <Card className="p-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{test.subject_slug} · {test.topic_slug}</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">{test.title}</h1>
            <p className="mt-2 text-sm text-muted">{resultTone} · completed {formatDate(session.submitted_at ?? session.created_at)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-5 xl:min-w-[640px]">
            <MetricTile label="Score" value={`${stats.score}%`} sub={`pass ${test.passing_score}%`} tone={stats.score >= test.passing_score ? "green" : "red"} />
            <MetricTile label="Correct" value={stats.correct} sub={`${stats.total} total`} tone="green" />
            <MetricTile label="Wrong" value={stats.wrong} sub="review" tone="red" />
            <MetricTile label="Skipped" value={stats.skipped} sub="no answer" tone="neutral" />
            <MetricTile label="Avg time" value={`${averageTimePerQuestion}s`} sub={`expected ${Math.round(expectedTimeSeconds / Math.max(1, stats.total))}s`} tone="neutral" />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="grid gap-5">
          <Section title="Topic breakdown">
            <WeakTopicsBarChart topics={topicBreakdown} />
          </Section>
          <Section title="Wrong questions">
            <WrongQuestionList mistakes={wrongQuestions} />
          </Section>
          <Section title="Time and accuracy signal map">
            <QuestionSignalScatter signals={questionSignals} />
          </Section>
        </main>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <OverallMasteryAnalytics value={overallMastery} label="Overall mastery" />
          <RecommendationCard recommendation={recommendation} fallbackHref={`/student/mistakes?subject=${encodeURIComponent(test.subject_slug)}`} />
          <Card className="p-4">
            <h2 className="text-lg font-semibold">Weak skills</h2>
            <div className="mt-4">
              <SkillGapMatrix skills={subjectSkills.filter((skill) => skill.mastery < 80)} compact />
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold">Actions</h2>
            <div className="mt-4 grid gap-2">
              <Button asChild><Link href={`/student/mistakes?subject=${encodeURIComponent(test.subject_slug)}`}>Review diagnostics</Link></Button>
              <Button asChild variant="secondary"><Link href={`/student/tests/${test.slug}/start`}>Retake test</Link></Button>
              <Button asChild variant="secondary"><Link href="/student/tests">Practice</Link></Button>
            </div>
          </Card>
        </aside>
      </div>
    </StudentShell>
  );
}

export function StudentMistakes({ initialSummary: _initialSummary }: { initialSummary: ApiMistakesSummary }) {
  void _initialSummary;
  const [report, setReport] = useState<MasteryReport | null>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    Promise.all([questApi.sessions(), questApi.tests()]).then(([sessions, tests]) => {
      const studentId = getStudentCode();
      setReport(buildMasteryReport(studentId, apiSessionsToAnswerSnapshots({ sessions, tests, studentId })));
    }).catch(() => undefined);
  }, []);
  const engineMistakes = report?.mistakes ?? [];
  const mistakes = engineMistakes.filter((item) => `${item.topic} ${item.skills.join(" ")} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  const weakTopics = report?.weakTopics ?? [];
  const skillRows = (report?.skills ?? []).filter((item) => item.mastery < 75).slice(0, 8).map((item) => ({
    label: item.skill,
    value: Math.max(0, 100 - item.mastery),
    meta: `${item.mastery}% mastery / ${item.attempts} attempts`,
  }));
  const topicRows = weakTopics.slice(0, 8).map((item) => ({
    label: item.topic,
    value: Math.max(0, 100 - item.mastery),
    meta: `${item.correct}/${item.attempts} correct · ${item.confidence}`,
  }));
  const statusRows = topCounts(engineMistakes.map((item) => item.status), 5);
  const focus = report?.recommendedActions[0];
  return (
    <StudentShell variant="table">
      <div className="quest-main-aside-grid">
        <Section title="Skill weakness index">
          <AnalyticsBars rows={skillRows} tone="critical" empty="Skill data hali yo'q." />
        </Section>
        <Section title="Recommended next action">
          <div className="quest-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">Priority</p>
            <h3 className="mt-2 text-xl font-semibold">{focus?.label ?? "Avval test ishlang"}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {focus?.reason ?? "Mistake analytics uchun kamida bitta test submit qiling."}
            </p>
            <Button asChild className="mt-4"><Link href={focus?.href ?? "/student/tests"}>Practice topic</Link></Button>
          </div>
        </Section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Weak topics by priority">
          <AnalyticsBars rows={topicRows} empty="Topic bo'yicha xato yo'q." />
        </Section>
        <Section title="Mistake lifecycle">
          <AnalyticsBars rows={statusRows} empty="Lifecycle data yo'q." />
        </Section>
      </div>
      <Section title="Mistake review queue">
        <div className="mb-4 flex items-center gap-2 quest-card px-3 py-2">
          <Search className="size-4 text-subtle" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Subject, topic, test, status..." className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="quest-card-grid-3">
          {mistakes.map((mistake) => <EngineMistakeCard key={mistake.id} mistake={mistake} />)}
          {!mistakes.length ? <Empty text="Xato topilmadi." /> : null}
        </div>
      </Section>
    </StudentShell>
  );
}

export function StudentMistakesDiagnostic({ initialSummary }: { initialSummary: ApiMistakesSummary }) {
  const [report, setReport] = useState<MasteryReport | null>(null);
  const searchParams = useSearchParams();
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get("subject") ?? "");

  useEffect(() => {
    Promise.all([questApi.sessions(), questApi.tests()]).then(([sessions, tests]) => {
      const studentId = getStudentCode();
      setReport(buildMasteryReport(studentId, apiSessionsToAnswerSnapshots({ sessions, tests, studentId })));
    }).catch(() => undefined);
  }, []);

  const subjects = Array.from(new Set([...(report?.topics.map((item) => item.subject) ?? []), ...(report?.mistakes.map((item) => item.subject) ?? [])])).filter(Boolean);
  const activeSubject = selectedSubject || subjects[0] || "";
  const topics = (report?.topics ?? []).filter((item) => !activeSubject || item.subject === activeSubject);
  const weakTopics = (report?.weakTopics ?? []).filter((item) => !activeSubject || item.subject === activeSubject);
  const skills = (report?.skills ?? []).filter((item) => topics.some((topic) => topic.topicSlug === item.topicSlug));
  const mistakes = (report?.mistakes ?? []).filter((item) => !activeSubject || item.subject === activeSubject);
  const focus = report?.recommendedActions.find((action) => topics.some((topic) => topic.topicSlug === action.topicSlug)) ?? report?.recommendedActions[0];
  const lifecycle = {
    newMistakes: mistakes.filter((item) => item.status === "new").length || initialSummary.mistakes.length,
    reviewed: mistakes.filter((item) => item.status === "reviewed").length,
    practiced: mistakes.filter((item) => item.status === "practiced").length,
    mastered: mistakes.filter((item) => item.status === "mastered").length,
    highPriorityTopics: weakTopics.filter((item) => item.priorityScore >= 40 || item.status === "weak").length,
  };
  const overallMastery = topics.length ? Math.round(topics.reduce((sum, topic) => sum + topic.mastery, 0) / topics.length) : 0;
  const groupedMistakes = groupMistakesByTopic(mistakes);
  const recentReviewed = mistakes.filter((item) => item.status !== "new").slice(0, 4);

  return (
    <StudentShell variant="wide">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <PageHeader eyebrow="Mastery Engine" title="Weak Topic / Review Center" copy="Fanlar aralashmaydi: har bir subject uchun topic, skill va mistake signallari alohida ko'rinadi." />
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <Button key={subject} type="button" variant={activeSubject === subject ? "default" : "secondary"} size="sm" onClick={() => setSelectedSubject(subject)}>{subject}</Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricTile label="New mistakes" value={lifecycle.newMistakes} sub="not reviewed" tone="red" />
        <MetricTile label="Reviewed" value={lifecycle.reviewed} sub="opened" tone="neutral" />
        <MetricTile label="Practiced" value={lifecycle.practiced} sub="follow-up" tone="green" />
        <MetricTile label="Mastered" value={lifecycle.mastered} sub="closed" tone="green" />
        <MetricTile label="High priority" value={lifecycle.highPriorityTopics} sub="topics" tone="red" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="grid gap-5">
          <Section title="Weak topic board">
            <WeakTopicsBarChart topics={weakTopics.length ? weakTopics : topics.filter((topic) => topic.mastery < 80)} />
          </Section>
          <Section title="Wrong questions by topic">
            <WrongQuestionsByTopic groups={groupedMistakes} />
          </Section>
          <Section title="Skill gap matrix">
            <SkillGapMatrix skills={skills.filter((skill) => skill.mastery < 85)} />
          </Section>
        </main>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <RecommendationCard recommendation={focus} fallbackHref="/student/tests" />
          <OverallMasteryAnalytics value={overallMastery} label={`${activeSubject || "Subject"} mastery`} />
          <Card className="p-4">
            <h2 className="text-lg font-semibold">Mistake trend</h2>
            <div className="mt-4">
              <MistakeTrendArea mistakes={mistakes} />
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold">Mistake signal map</h2>
            <div className="mt-4">
              <MistakeSignalScatter mistakes={mistakes} />
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold">Recent reviewed</h2>
            <div className="mt-4 grid gap-3">
              {recentReviewed.map((mistake) => <ReviewedMistakeItem key={mistake.id} mistake={mistake} />)}
              {!recentReviewed.length ? <Empty text="Reviewed mistake hali yo'q." /> : null}
            </div>
          </Card>
        </aside>
      </div>
    </StudentShell>
  );
}

export function StudentMistakeDetail({ initialSummary, mistakeId }: { initialSummary: ApiMistakesSummary; mistakeId: string }) {
  const [summary, setSummary] = useState(initialSummary);
  const [report, setReport] = useState<MasteryReport | null>(null);
  useEffect(() => {
    Promise.all([questApi.mistakesSummary(getStudentCode()), questApi.sessions(), questApi.tests()]).then(([next, sessions, tests]) => {
      const studentId = getStudentCode();
      setSummary(next);
      setReport(buildMasteryReport(studentId, apiSessionsToAnswerSnapshots({ sessions, tests, studentId })));
    }).catch(() => undefined);
  }, []);
  const mistake = report?.mistakes.find((item) => item.id === mistakeId) ?? report?.mistakes[0];
  const fallback = summary.mistakes.find((item) => `${item.session_id}-${item.question_id}` === mistakeId) ?? summary.mistakes[0];
  if (!mistake && !fallback) return <StudentShell variant="reading"><Empty text="Bu xato topilmadi." /></StudentShell>;
  if (!mistake && fallback) {
    return (
      <StudentShell variant="reading">
        <Section title="Question">
          <div className="quest-card p-4">
            <LatexText text={fallback.prompt} />
            <div className="mt-4 grid gap-2 text-sm text-muted">
              <p><strong>Your answer:</strong> {fallback.user_answer || "Skipped"}</p>
              <p><strong>Correct answer:</strong> {fallback.correct_answer}</p>
            </div>
          </div>
        </Section>
      </StudentShell>
    );
  }
  if (!mistake) return null;
  return (
    <StudentShell variant="reading">
      <Section title="Question">
        <div className="quest-card p-4">
          <LatexText text={mistake.questionPreview} />
          <div className="mt-4 grid gap-2 text-sm text-muted">
            <p><strong>Your answer:</strong> {mistake.studentAnswer || "Skipped"}</p>
            <p><strong>Correct answer:</strong> {mistake.correctAnswer}</p>
            <p><strong>Related topic:</strong> {mistake.topic}</p>
            <p><strong>Signals:</strong> {mistake.status} · {mistake.timeQuality} · {mistake.mistakeType}</p>
            <p><strong>Skills:</strong> {mistake.skills.length ? mistake.skills.join(", ") : "general"}</p>
          </div>
          {mistake.explanation ? <div className="mt-4 rounded-xl bg-surface-soft p-4 text-sm leading-6 text-muted"><LatexText text={mistake.explanation} /></div> : null}
        </div>
      </Section>
      <div className="flex flex-wrap gap-3">
        <Button asChild><Link href={mistake.recommendedAction.href}>{mistake.recommendedAction.label}</Link></Button>
      </div>
    </StudentShell>
  );
}

function EngineMistakeCard({ mistake }: { mistake: NonNullable<MasteryReport["mistakes"][number]> }) {
  return (
    <Link href={`/student/mistakes/${mistake.id}`} className="quest-card flex min-h-[170px] flex-col p-4 transition hover:bg-surface-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-student">{mistake.topic}</p>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 sm:text-base"><LatexText text={mistake.questionPreview} /></h3>
      <div className="mt-auto pt-4 text-xs text-muted">
        <p className="line-clamp-1">{mistake.priority} priority · {mistake.status}</p>
        <p className="line-clamp-1">{mistake.skills.join(", ") || "general"}</p>
      </div>
    </Link>
  );
}

type TopicMasteryView = MasteryReport["topics"][number];
type SkillMasteryView = MasteryReport["skills"][number];
type MistakeView = MasteryReport["mistakes"][number];
type QuestionSignalRow = { questionNumber: number; topic: string; isCorrect: boolean; timeSpentSeconds: number; estimatedSeconds: number; difficulty: string };
type ScatterRow = { expected: number; spent: number; priority: number; topic: string; skill: string; quality: string; isCorrect: boolean };
type TrendRow = { label: string; mistakes: number };
type TopicMistakeGroup = { topic: string; topicSlug: string; mistakes: MistakeView[] };

function OverallMasteryAnalytics({ value, label }: { value: number; label: string }) {
  const data = [{ name: label, value, fill: value >= 85 ? "var(--success)" : value >= 70 ? "var(--chart-1)" : value >= 50 ? "var(--warning)" : "var(--danger)" }];
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold">{label}</h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative size-32">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart data={data} innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" background={{ fill: "var(--surface-soft)" }} cornerRadius={10} isAnimationActive animationDuration={850} animationEasing="ease-out" />
            </RadialBarChart>
          </ResponsiveContainer>
          <span className="absolute inset-0 grid place-items-center text-2xl font-semibold">{value}%</span>
        </div>
        <p className="text-sm leading-6 text-muted">Engine hisoblagan mastery. 70% threshold pastidagi topiclar practice uchun ustuvor.</p>
      </div>
    </Card>
  );
}

function WeakTopicsBarChart({ topics }: { topics: TopicMasteryView[] }) {
  const data = [...topics]
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 8)
    .map((topic) => ({ name: topic.topic, mastery: topic.mastery, accuracy: topic.accuracy, wrong: topic.wrong, status: topic.status, isFundamental: topic.isFundamental }));

  if (!data.length) return <Empty text="Topic mastery uchun yetarli data yo'q." />;

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 22, bottom: 8, left: 16 }}>
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} stroke="var(--muted)" fontSize={12} />
          <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} stroke="var(--muted)" fontSize={12} />
          <ReferenceLine x={70} stroke="var(--warning)" strokeDasharray="4 4" />
          <Tooltip cursor={{ fill: "var(--surface-soft)" }} content={<WeakTopicTooltip />} />
          <Bar dataKey="mastery" radius={[0, 8, 8, 0]} isAnimationActive animationDuration={850} animationEasing="ease-out">
            {data.map((row) => <Cell key={row.name} fill={row.mastery < 50 ? "var(--danger)" : row.mastery < 70 ? "var(--warning)" : "var(--chart-1)"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WeakTopicTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; mastery: number; accuracy: number; wrong: number; status: string; isFundamental: boolean } }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-[12px] border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="font-semibold text-ink">{row.name}</p>
      <p className="mt-1 text-muted">Mastery: {row.mastery}% · Accuracy: {row.accuracy}%</p>
      <p className="mt-1 text-muted">Wrong: {row.wrong} · {row.status.replace("_", " ")}</p>
      {row.isFundamental ? <p className="mt-1 text-subtle">Fundamental topic</p> : null}
    </div>
  );
}

function SkillGapMatrix({ skills, compact = false }: { skills: SkillMasteryView[]; compact?: boolean }) {
  const data = [...skills].sort((a, b) => a.mastery - b.mastery).slice(0, 18);
  if (!data.length) return <Empty text="Bu fan uchun skill signali hali yo'q." />;

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-3")}>
      {data.map((skill) => {
        const gap = Math.max(0, 100 - skill.mastery);
        return (
          <div key={`${skill.topicSlug}-${skill.skillSlug}`} className="rounded-[var(--radius-control)] border border-line bg-surface p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-semibold text-ink">{skill.skill}</p>
                <p className="mt-1 text-xs text-muted">{skill.correct}/{skill.attempts} correct · {skill.confidence}</p>
              </div>
              <span className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-white" style={{ background: masteryColor(skill.mastery) }}>{skill.mastery}%</span>
            </div>
            <div className="mt-3 grid h-9 grid-cols-10 gap-1">
              {Array.from({ length: 10 }).map((_, index) => {
                const filled = index < Math.ceil(gap / 10);
                return <span key={index} className={cn("rounded-[4px]", filled ? "bg-danger" : "bg-success/20")} />;
              })}
            </div>
            <p className="mt-2 text-xs text-subtle">{skill.status.replace("_", " ")} · gap {gap}%</p>
          </div>
        );
      })}
    </div>
  );
}

function MistakeSignalScatter({ mistakes }: { mistakes: MistakeView[] }) {
  const data: ScatterRow[] = mistakes.map((mistake) => ({
    expected: Math.max(1, mistake.estimatedSeconds || 1),
    spent: Math.max(1, mistake.timeSpentSeconds || mistake.estimatedSeconds || 1),
    priority: mistake.priority === "high" ? 180 : mistake.priority === "medium" ? 110 : 70,
    topic: mistake.topic,
    skill: mistake.skills[0] ?? "general",
    quality: mistake.timeQuality,
    isCorrect: false,
  }));

  if (!data.length) return <Empty text="Bu fan uchun xato signali yo'q." />;

  return <SignalScatterChart data={data} />;
}

function QuestionSignalScatter({ signals }: { signals: QuestionSignalRow[] }) {
  const data: ScatterRow[] = signals.map((signal) => ({
    expected: Math.max(1, signal.estimatedSeconds || 1),
    spent: Math.max(1, signal.timeSpentSeconds || signal.estimatedSeconds || 1),
    priority: signal.difficulty === "hard" ? 150 : signal.difficulty === "medium" ? 105 : 75,
    topic: `#${signal.questionNumber} · ${signal.topic}`,
    skill: signal.difficulty,
    quality: signal.isCorrect ? "correct" : "wrong",
    isCorrect: signal.isCorrect,
  }));

  if (!data.length) return <Empty text="Question signal uchun yetarli data yo'q." />;

  return <SignalScatterChart data={data} />;
}

function SignalScatterChart({ data }: { data: ScatterRow[] }) {
  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 18, right: 22, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="expected" name="Expected" unit="s" tickLine={false} axisLine={false} stroke="var(--muted)" fontSize={12} />
          <YAxis dataKey="spent" name="Spent" unit="s" tickLine={false} axisLine={false} stroke="var(--muted)" fontSize={12} />
          <ZAxis dataKey="priority" range={[80, 260]} />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 180, y: 180 }]} stroke="var(--warning)" strokeDasharray="4 4" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<ScatterTooltip />} />
          <Scatter data={data} fillOpacity={0.82} isAnimationActive animationDuration={800} animationEasing="ease-out">
            {data.map((row, index) => <Cell key={`${row.topic}-${index}`} fill={row.isCorrect ? "var(--success)" : "var(--danger)"} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterRow }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-[12px] border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="font-semibold text-ink">{row.topic}</p>
      <p className="mt-1 text-muted">{row.skill}</p>
      <p className="mt-1 text-muted">expected {row.expected}s · spent {row.spent}s</p>
      <p className="mt-1 text-subtle">{row.quality}</p>
    </div>
  );
}

function MistakeTrendArea({ mistakes }: { mistakes: MistakeView[] }) {
  const groups = mistakes.reduce((map, mistake) => {
    const key = shortDate(mistake.createdAt);
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  const data: TrendRow[] = Array.from(groups.entries()).map(([label, value]) => ({ label, mistakes: value })).slice(-8);
  if (data.length < 2) return <Empty text="Trend uchun kamida 2 ta vaqt nuqtasi kerak." />;

  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="mistakeTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.22} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted)" fontSize={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="var(--muted)" fontSize={12} width={28} />
          <Tooltip content={<TrendTooltip />} />
          <Area dataKey="mistakes" type="monotone" stroke="var(--chart-1)" strokeWidth={2} fill="url(#mistakeTrendFill)" isAnimationActive animationDuration={800} animationEasing="ease-out" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendRow }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-[12px] border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="font-semibold text-ink">{row.label}</p>
      <p className="mt-1 text-muted">{row.mistakes} mistakes</p>
    </div>
  );
}

function RecommendationCard({ recommendation, fallbackHref }: { recommendation?: MasteryReport["recommendedActions"][number]; fallbackHref: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">Recommended next action</p>
      <h2 className="mt-2 text-lg font-semibold">{recommendation?.label ?? "Start diagnostic practice"}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{recommendation?.reason ?? "Engine recommendation paydo bo'lishi uchun kamida bitta testni yakunlang."}</p>
      <Button asChild className="mt-4">
        <Link href={recommendation?.href ?? fallbackHref}>{recommendation?.label ?? "Open tests"}</Link>
      </Button>
    </Card>
  );
}

function WrongQuestionList({ mistakes }: { mistakes: Array<MistakeView & { questionNumber?: number }> }) {
  if (!mistakes.length) return <Empty text="Bu resultda wrong question yo'q." />;
  return (
    <div className="grid gap-3">
      {mistakes.map((mistake, index) => (
        <Link key={mistake.id} href={`/student/mistakes/${mistake.id}`} className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 transition hover:bg-surface-soft md:grid-cols-[44px_1fr_auto] md:items-start">
          <span className="grid size-10 place-items-center rounded-lg bg-danger-soft text-sm font-semibold text-danger">{mistake.questionNumber ?? index + 1}</span>
          <div className="min-w-0">
            <p className="line-clamp-2 font-semibold"><LatexText text={mistake.questionPreview} /></p>
            <p className="mt-2 line-clamp-1 text-sm text-muted">{mistake.topic} · {mistake.skills[0] ?? "general"}</p>
            <p className="mt-1 line-clamp-1 text-xs text-subtle">Your answer: {mistake.studentAnswer || "Skipped"} · Correct: {mistake.correctAnswer}</p>
          </div>
          <Badge>{mistake.difficulty}</Badge>
        </Link>
      ))}
    </div>
  );
}

function groupMistakesByTopic(mistakes: MistakeView[]): TopicMistakeGroup[] {
  const map = new Map<string, TopicMistakeGroup>();
  for (const mistake of mistakes) {
    const key = mistake.topicSlug || mistake.topic;
    const group = map.get(key) ?? { topic: mistake.topic, topicSlug: mistake.topicSlug, mistakes: [] };
    group.mistakes.push(mistake);
    map.set(key, group);
  }
  return Array.from(map.values()).sort((a, b) => b.mistakes.length - a.mistakes.length);
}

function WrongQuestionsByTopic({ groups }: { groups: TopicMistakeGroup[] }) {
  if (!groups.length) return <Empty text="Bu fan uchun wrong question topilmadi." />;
  return (
    <div className="grid gap-4">
      {groups.slice(0, 6).map((group) => (
        <div key={group.topicSlug} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">{group.topic}</h3>
            <Badge>{group.mistakes.length} mistakes</Badge>
          </div>
          <div className="mt-3 grid gap-2">
            {group.mistakes.slice(0, 4).map((mistake) => (
              <Link key={mistake.id} href={`/student/mistakes/${mistake.id}`} className="rounded-[var(--radius-control)] bg-surface-soft p-3 transition hover:bg-neutral-soft">
                <p className="line-clamp-1 text-sm font-semibold"><LatexText text={mistake.questionPreview} /></p>
                <p className="mt-1 line-clamp-1 text-xs text-muted">{mistake.status} · {mistake.skills[0] ?? "general"}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewedMistakeItem({ mistake }: { mistake: MistakeView }) {
  return (
    <Link href={`/student/mistakes/${mistake.id}`} className="rounded-[var(--radius-control)] border border-line bg-surface p-3 transition hover:bg-surface-soft">
      <p className="line-clamp-2 text-sm font-semibold"><LatexText text={mistake.questionPreview} /></p>
      <p className="mt-1 text-xs text-muted">{mistake.topic} · {mistake.status}</p>
    </Link>
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
    <StudentShell variant="wide">
      <div className="quest-main-aside-grid">
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
        <div className="quest-card-grid-3">{strong.map((topic) => <CompactCard key={topic.slug} title={topic.topic} meta={`${topic.attempts} attempts`} href="/student/tests" action="Practice" stats={[`${topic.value}% mastery`]} />)}{!strong.length ? <Empty text="Kuchli mavzular hali yetarli emas." /> : null}</div>
      </Section>
    </StudentShell>
  );
}

export function StudentProfile({ summary }: { summary: ApiProfileSummary }) {
  const scoreTrend = summary.recent_tests.slice(0, 10).reverse().map((test) => ({
    label: shortDate(test.submitted_at),
    score: test.score,
    testTitle: test.title,
    date: test.submitted_at,
  }));
  const weakTopics = [...summary.topic_progress].sort((a, b) => a.value - b.value).slice(0, 5).map((topic) => ({
    topic: topic.topic,
    mastery: topic.value,
    attempts: topic.attempts,
  }));
  const strongTopics = summary.topic_progress.filter((topic) => topic.value >= 75).slice(0, 3);
  const recommendation = summary.recommendations[0] ?? {
    title: weakTopics[0] ? `Practice ${weakTopics[0].topic}` : "Start a new test",
    description: weakTopics[0] ? `${weakTopics[0].topic} is your lowest current mastery topic.` : "Complete a test to build your profile.",
    href: "/student/tests",
  };

  return (
    <StudentShell variant="wide">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-5">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Score trend</h2>
              <Button asChild variant="secondary" size="sm"><Link href="/student/progress">Open progress</Link></Button>
            </div>
            <div className="mt-4">
              <ScoreTrendChart rows={scoreTrend} />
            </div>
          </Card>
          <Section title="Recent tests">
            <div className="quest-card-grid-3">
              {summary.recent_tests.slice(0, 6).map((test) => <CompactCard key={test.id} title={test.title} meta={test.topic} href={`/student/results/${test.id}`} action="View result" stats={[`${test.score}%`, `${test.correct}/${test.total}`, test.submitted_at.slice(0, 10)]} />)}
              {!summary.recent_tests.length ? <Empty text="Recent test history hali yo'q." /> : null}
            </div>
          </Section>
        </div>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <OverallMasteryCard value={summary.math_mastery || summary.average_score || 0} />
          <WeakTopicsCard rows={weakTopics} />
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Recommended next</h2>
            <h3 className="mt-3 text-base font-semibold">{recommendation.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{recommendation.description}</p>
            <Button asChild className="mt-4"><Link href={recommendation.href}>Continue</Link></Button>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Strong topics</h2>
            <div className="mt-4 grid gap-3">
              {strongTopics.map((topic) => <InfoPill key={topic.slug} label={topic.topic} value={`${topic.value}%`} />)}
              {!strongTopics.length ? <CompactEmpty title="No strong topics yet" /> : null}
            </div>
          </Card>
        </aside>
      </div>
    </StudentShell>
  );
}
