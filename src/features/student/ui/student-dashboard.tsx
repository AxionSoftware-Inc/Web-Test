"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { StudentShell } from "@/components/student/student-ui";
import type { ApiExamPack, ApiMasteryProgress, ApiMistakesSummary, ApiProfileSummary, ApiSession, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";

export function nowMs() {
  return new Date().getTime();
}

export function testSkills(test: ApiTest) {
  return Array.from(new Set(test.test_questions.flatMap((item) => item.question.skill_titles))).slice(0, 5);
}

export function topCounts(values: string[], limit: number) {
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
  const [studentSummary, setStudentSummary] = useState(summary);
  const [studentSessions, setStudentSessions] = useState(sessions);
  const [mastery, setMastery] = useState<ApiMasteryProgress | null>(null);
  useEffect(() => {
    let cancelled = false;
    const studentCode = getStudentCode();
    Promise.all([questApi.profileSummary(studentCode), questApi.profileMastery(studentCode), questApi.sessions(studentCode)]).then(([nextSummary, nextMastery, nextSessions]) => {
      if (cancelled) return;
      setStudentSummary(nextSummary);
      setMastery(nextMastery);
      setStudentSessions(nextSessions);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  const inProgressSessions = studentSessions.filter((item) => item.status === "in_progress");
  const completedSessions = studentSessions.filter((item) => item.status === "submitted");
  const activeSession = inProgressSessions[0];
  const completedSlugs = new Set(completedSessions.map((item) => item.test_slug));
  const inProgressBySlug = new Map(inProgressSessions.map((item) => [item.test_slug, item]));
  const topicProgress = mastery?.topics.map((item) => ({ topic: item.topic, slug: item.topic_slug, value: item.mastery, attempts: item.attempts })) ?? studentSummary.topic_progress;
  const weakTopics = [...topicProgress].filter((item) => item.value < 75).sort((a, b) => a.value - b.value);
  const skillGaps = mastery?.skills.filter((item) => item.mastery < 85).slice(0, 6) ?? [];
  const availableTests = tests.filter((test) => !completedSlugs.has(test.slug));
  const nextTest = activeSession
    ? tests.find((test) => test.slug === activeSession.test_slug)
    : availableTests[0] ?? tests[0];
  const assignedTests = buildAssignedTests(tests, studentSessions).slice(0, 6);
  const activePackCount = packs.filter((pack) => pack.is_active).length;
  const trendRows = studentSummary.recent_tests.slice(-12).map((item) => ({
    label: shortDate(item.submitted_at),
    score: item.score,
    testTitle: item.title,
    date: formatDate(item.submitted_at),
  }));
  const topicRows = [...topicProgress]
    .sort((a, b) => a.value - b.value)
    .slice(0, 8)
    .map((item) => ({ topic: item.topic, mastery: item.value, attempts: item.attempts }));
  const recentMistakes = (mistakes?.mistakes ?? []).slice(0, 3);
  const recentResults = studentSummary.recent_tests.slice(0, 3);
  const recommendation = deriveRecommendation({ activeSession, nextTest, weakTopics, assignedTests, mastery });
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
        <StudentHomeStat label="Observed mastery" value={`${mastery?.overview.mastery ?? studentSummary.math_mastery ?? 0}%`} />
        <StudentHomeStat label="Skill gaps" value={mastery?.overview.weak_skill_count ?? weakTopics.length} />
        <StudentHomeStat label="Questions analyzed" value={mastery?.overview.questions_attempted ?? studentSummary.answered_questions} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="grid gap-6">
          <ContinueOrNextTestCard activeSession={activeSession} nextTest={nextTest} />
          <LearningFocusCard skills={skillGaps} recommendation={mastery?.recommendations[0]} />
          <AssignedTestsPreview tests={assignedTests} inProgressBySlug={inProgressBySlug} />
          <ScoreTrendChart rows={trendRows} />
        </main>

        <aside className="grid h-fit gap-4 xl:sticky xl:top-24">
          <OverallMasteryCard value={mastery?.overview.mastery ?? (studentSummary.math_mastery || studentSummary.average_score || 0)} />
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
  mastery,
}: {
  activeSession?: ApiSession;
  nextTest?: ApiTest;
  weakTopics: ApiProfileSummary["topic_progress"];
  assignedTests: StudentAssignedTest[];
  mastery?: ApiMasteryProgress | null;
}) {
  if (activeSession) {
    return {
      title: `Continue ${activeSession.test_title}`,
      reason: "You already started this test. Finish it while the context is fresh.",
      actionLabel: "Continue",
      href: `/student/test-session/${activeSession.id}`,
    };
  }
  if (mastery?.recommendations[0]) {
    const next = mastery.recommendations[0];
    return {
      title: next.title,
      reason: next.reason,
      actionLabel: next.type === "review" ? "Review gaps" : "Start focused test",
      href: next.href,
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

function LearningFocusCard({ skills, recommendation }: { skills: ApiMasteryProgress["skills"]; recommendation?: ApiMasteryProgress["recommendations"][number] }) {
  return (
    <Card className="border-brand/20 bg-brand-soft p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Learning focus</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">What to learn next</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Progress is based on skill evidence, not just the number of correct answers.</p>
        </div>
        {recommendation ? <Button asChild><Link href={recommendation.href}>{recommendation.type === "review" ? "Review gaps" : "Practice now"}</Link></Button> : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => (
          <div key={`${skill.topic_slug}-${skill.skill_slug}`} className="rounded-[var(--radius-control)] border border-brand/15 bg-surface p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><p className="line-clamp-1 text-sm font-semibold">{skill.skill}</p><p className="mt-1 text-xs text-muted">{skill.topic} · {skill.confidence} confidence</p></div>
              <span className="shrink-0 text-sm font-bold" style={{ color: masteryColor(skill.mastery) }}>{skill.mastery}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-soft"><div className="h-full rounded-full" style={{ width: `${skill.mastery}%`, background: masteryColor(skill.mastery) }} /></div>
          </div>
        ))}
        {!skills.length ? <p className="text-sm text-muted">Submit a test to build your first skill map.</p> : null}
      </div>
    </Card>
  );
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

export function ScoreTrendChart({ rows }: { rows: StudentTrendRow[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Score trend</h2>
      <p className="mt-1 text-sm text-muted">Last completed tests, scored from 0 to 100.</p>
      <div className="mt-4 h-[300px]">
        {rows.length ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 1, height: 1 }}>
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

export function OverallMasteryCard({ value }: { value: number }) {
  const data = [{ name: "Overall mastery", value, fill: "var(--chart-1)" }];
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">Overall mastery</h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative size-28">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 1, height: 1 }}>
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

export function WeakTopicsCard({ rows }: { rows: StudentTopicRow[] }) {
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

export function InfoPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-control)] bg-surface-soft px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

export function CompactEmpty({ title }: { title: string }) {
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

export function masteryColor(value: number) {
  if (value >= 75) return "var(--success)";
  if (value >= 50) return "var(--warning)";
  return "var(--danger)";
}

export function formatDate(value?: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function shortDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
