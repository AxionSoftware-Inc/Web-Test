"use client";

import { ArrowLeft, ArrowRight, Flag, Search, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PackCard, TestCatalogCard } from "@/components/student/student-cards";
import { AnalyticsBars, Badge, CompactCard, Empty, FilterSelect, MetricTile, NumberField, ProgressRing, Section, StudentShell, TopicActionList, TrendChart } from "@/components/student/student-ui";
import { apiSessionToAnswerSnapshots, apiSessionsToAnswerSnapshots, buildMasteryReport, clearRuntimeSession, readRuntimeQuestionTimes, writeRuntimeQuestionTimes, writeRuntimeReport } from "@/features/mastery-engine/model";
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
    <StudentShell>
      <section className="quest-main-aside-grid">
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
            <Button asChild><Link href="/student/mistakes">Review mistakes</Link></Button>
            <Button asChild variant="secondary"><Link href={`/student/tests/${test.slug}/start`}>Start</Link></Button>
            <Button asChild variant="secondary"><Link href="/student/tests">Practice</Link></Button>
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
          <div className="quest-card-grid-3">
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
  const [report, setReport] = useState<MasteryReport | null>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    Promise.all([questApi.mistakesSummary(getStudentCode()), questApi.sessions(), questApi.tests()]).then(([next, sessions, tests]) => {
      const studentId = getStudentCode();
      setSummary(next);
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
