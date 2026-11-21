"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StudentShell } from "@/components/student/student-ui";
import type {
  ApiExamPack,
  ApiMasteryProgress,
  ApiMistakesSummary,
  ApiProfileSummary,
  ApiSession,
  ApiTest,
} from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { ModuleGuard } from "@/shared/modules";

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
    Promise.all([
      questApi.profileSummary(studentCode),
      questApi.profileMastery(studentCode),
      questApi.sessions(studentCode),
    ])
      .then(([nextSummary, nextMastery, nextSessions]) => {
        if (cancelled) return;
        setStudentSummary(nextSummary);
        setMastery(nextMastery);
        setStudentSessions(nextSessions);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const inProgressSessions = studentSessions.filter((item) => item.status === "in_progress");
  const completedSessions = studentSessions.filter((item) => item.status === "submitted");
  const activeSession = inProgressSessions[0];
  const completedSlugs = new Set(completedSessions.map((item) => item.test_slug));
  const inProgressBySlug = new Map(inProgressSessions.map((item) => [item.test_slug, item]));

  const topicProgress =
    mastery?.topics.map((item) => ({
      topic: item.topic,
      slug: item.topic_slug,
      value: item.mastery,
      attempts: item.attempts,
    })) ?? studentSummary.topic_progress;

  const weakTopics = [...topicProgress]
    .filter((item) => item.value < 75)
    .sort((a, b) => a.value - b.value);

  const availableTests = tests.filter((test) => !completedSlugs.has(test.slug));
  const nextTest = activeSession
    ? tests.find((test) => test.slug === activeSession.test_slug)
    : availableTests[0] ?? tests[0];

  const assignedTests = buildAssignedTests(tests, studentSessions).slice(0, 5);

  const trendRows = studentSummary.recent_tests.slice(-10).map((item) => ({
    label: shortDate(item.submitted_at),
    score: item.score,
    testTitle: item.title,
    date: formatDate(item.submitted_at),
  }));

  const topicRows = [...topicProgress]
    .sort((a, b) => a.value - b.value)
    .slice(0, 5)
    .map((item) => ({ topic: item.topic, mastery: item.value, attempts: item.attempts }));

  const recentMistakes = (mistakes?.mistakes ?? []).slice(0, 3);
  const recentResults = studentSummary.recent_tests.slice(0, 4);

  const overallMasteryValue =
    mastery?.overview.mastery ??
    (studentSummary.math_mastery || studentSummary.average_score || 0);

  const answeredQuestionsCount =
    mastery?.overview.questions_attempted ?? studentSummary.answered_questions ?? 0;

  return (
    <ModuleGuard id="student">
      <StudentShell variant="wide">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-black/8 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              O&apos;quvchi kabineti
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Sizning testlaringiz, o&apos;zlashtirish darajangiz va yangi vazifalar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/student/mistakes" className="inline-flex items-center gap-1.5">
                <RotateCcw className="size-4" />
                <span>Xatolar banki</span>
              </Link>
            </Button>
            <Button asChild className="rounded-xl bg-ink text-white hover:bg-brand">
              <Link href="/student/tests" className="inline-flex items-center gap-1.5">
                <BookOpen className="size-4" />
                <span>Barcha testlar</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Hero Action Card: Active session or Next recommended test */}
        <div className="mt-6">
          {activeSession ? (
            <div className="flex flex-col gap-4 rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-50/60 to-orange-50/40 p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  <Clock className="size-3.5" />
                  <span>Jarayondagi test</span>
                </span>
                <h2 className="mt-2 text-xl font-bold text-ink sm:text-2xl truncate">
                  {activeSession.test_title}
                </h2>
                <p className="mt-1 text-xs text-ink/65 sm:text-sm">
                  {activeSession.answers.length} ta savolga javob berildi. Testni yakunlang.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  href={`/student/test-session/${activeSession.id}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition"
                >
                  <Play className="size-4 fill-white" />
                  <span>Davom ettirish</span>
                </Link>
              </div>
            </div>
          ) : nextTest ? (
            <div className="flex flex-col gap-4 rounded-3xl border border-black/8 bg-white p-6 sm:flex-row sm:items-center sm:justify-between shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                  <Sparkles className="size-3.5" />
                  <span>Tavsiya etilgan test</span>
                </span>
                <h2 className="mt-2 text-xl font-bold text-ink sm:text-2xl truncate">
                  {nextTest.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink/50">
                  <span>{nextTest.subject_slug} · {nextTest.topic_slug}</span>
                  <span>•</span>
                  <span>{nextTest.test_questions.length} ta savol</span>
                  <span>•</span>
                  <span>{nextTest.estimated_minutes} daqiqa</span>
                </div>
              </div>
              <div className="shrink-0">
                <Link
                  href={`/student/tests/${nextTest.slug}/start`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand transition"
                >
                  <Play className="size-4 fill-white" />
                  <span>Testni boshlash</span>
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {/* 4 Compact KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">O&apos;zlashtirish</span>
              <TrendingUp className="size-4 text-brand" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">{overallMasteryValue}%</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${overallMasteryValue}%` }} />
            </div>
          </div>

          <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">Vazifalar</span>
              <BookOpen className="size-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">{assignedTests.length}</p>
            <p className="mt-1 text-xs text-ink/50">Mavjud testlar</p>
          </div>

          <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">Savollar</span>
              <HelpCircle className="size-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">{answeredQuestionsCount}</p>
            <p className="mt-1 text-xs text-ink/50">Yechilgan jami savol</p>
          </div>

          <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/40">Zaif mavzular</span>
              <AlertTriangle className="size-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">{weakTopics.length}</p>
            <p className="mt-1 text-xs text-ink/50">E&apos;tibor talab bo&apos;limlar</p>
          </div>
        </div>

        {/* Main Content: 2-Column Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left Column: Assigned Tests & Score Trend */}
          <div className="flex flex-col gap-6">
            {/* Assigned / Available Tests */}
            <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between pb-4 border-b border-black/6">
                <div>
                  <h2 className="text-lg font-bold text-ink">Biriktirilgan testlar</h2>
                  <p className="text-xs text-ink/50">Mavjud va navbatdagi amaliy mashqlar</p>
                </div>
                <Link
                  href="/student/tests"
                  className="text-xs font-semibold text-brand hover:text-brand-hover inline-flex items-center gap-1"
                >
                  Hammasi <ArrowRight className="size-3.5" />
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {assignedTests.length ? (
                  assignedTests.map((test) => {
                    const session = inProgressBySlug.get(test.slug);
                    const isDone = test.status === "completed";
                    const isInProgress = test.status === "in_progress";

                    const actionUrl = isInProgress && session
                      ? `/student/test-session/${session.id}`
                      : isDone && session
                      ? `/student/results/${session.id}`
                      : `/student/tests/${test.slug}/start`;

                    const actionText = isInProgress ? "Davom etish" : isDone ? "Natija" : "Boshlash";

                    return (
                      <div
                        key={test.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-black/6 bg-[#fafaf8] p-4 transition-all hover:bg-white hover:border-black/15 hover:shadow-sm"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                              {test.subject} · {test.topic}
                            </span>
                            <StudentStatusBadge status={test.status} />
                          </div>
                          <h3 className="mt-1 text-sm font-semibold text-ink truncate">
                            {test.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-3 text-xs text-ink/45">
                            <span>{test.questionCount} ta savol</span>
                            <span>•</span>
                            <span>{test.estimatedMinutes} daqiqa</span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <Link
                            href={actionUrl}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                              isInProgress
                                ? "bg-amber-600 text-white hover:bg-amber-700"
                                : isDone
                                ? "border border-black/10 bg-white text-ink hover:bg-black/5"
                                : "bg-ink text-white hover:bg-brand"
                            }`}
                          >
                            <span>{actionText}</span>
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-6 text-center text-sm text-ink/45">
                    Hozircha biriktirilgan testlar mavjud emas.
                  </p>
                )}
              </div>
            </div>

            {/* Score Trend Chart */}
            <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <div className="pb-4 border-b border-black/6">
                <h2 className="text-lg font-bold text-ink">Natijalar dinamikasi</h2>
                <p className="text-xs text-ink/50">Topshirilgan testlar bo&apos;yicha ballar o&apos;sishi (0-100%)</p>
              </div>

              <div className="mt-4 h-[220px]">
                {trendRows.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendRows} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f1f1f1" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#999" />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} stroke="#999" />
                      <Tooltip content={<StudentHomeTooltip />} />
                      <Area
                        dataKey="score"
                        type="monotone"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#scoreFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-ink/40">
                    Hali topshirilgan testlar natijasi mavjud emas.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Recent Results & Weak Topics */}
          <div className="flex flex-col gap-6">
            {/* Recent Results */}
            <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between pb-4 border-b border-black/6">
                <div>
                  <h2 className="text-lg font-bold text-ink">So&apos;nggi natijalar</h2>
                  <p className="text-xs text-ink/50">Topshirilgan testlar bahosi</p>
                </div>
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>

              <div className="mt-4 grid gap-2.5">
                {recentResults.length ? (
                  recentResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-black/6 bg-[#fafaf8] p-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{result.title}</p>
                        <p className="mt-0.5 text-xs text-ink/40">{formatDate(result.submitted_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-lg px-2 py-0.5 text-xs font-bold ${
                            result.score >= 70
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {result.score}%
                        </span>
                        <Link
                          href={`/student/results/${result.id}`}
                          className="text-xs font-semibold text-brand hover:text-brand-hover"
                        >
                          Ko&apos;rish
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-ink/40">Natijalar mavjud emas</p>
                )}
              </div>
            </div>

            {/* Weak Topics */}
            <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between pb-4 border-b border-black/6">
                <div>
                  <h2 className="text-lg font-bold text-ink">E&apos;tibor talab mavzular</h2>
                  <p className="text-xs text-ink/50">Ko&apos;proq mashq qilinishi kerak bo&apos;lgan mavzular</p>
                </div>
                <AlertTriangle className="size-4 text-amber-500" />
              </div>

              <div className="mt-4 grid gap-3">
                {topicRows.length ? (
                  topicRows.map((row) => (
                    <div key={row.topic} className="grid gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink truncate">{row.topic}</span>
                        <span className="font-medium text-ink/50">
                          {row.mastery}% · {row.attempts} ta urinish
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${row.mastery}%`,
                            background: masteryColor(row.mastery),
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-ink/40">Hozircha zaif mavzular aniqlanmagan</p>
                )}
              </div>
            </div>

            {/* Recent Mistakes Quick Link */}
            {recentMistakes.length > 0 ? (
              <div className="rounded-3xl border border-red-500/15 bg-red-50/30 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-red-900">Xatolar ustida ishlash</h3>
                  <Link
                    href="/student/mistakes"
                    className="text-xs font-semibold text-red-700 hover:text-red-900"
                  >
                    Barchasi ({recentMistakes.length})
                  </Link>
                </div>
                <p className="mt-1 text-xs text-red-800/70">
                  Oxirgi testlarda yo&apos;l qo&apos;yilgan xatolarni qayta ko&apos;rib chiqing.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </StudentShell>
    </ModuleGuard>
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

function buildAssignedTests(tests: ApiTest[], sessions: ApiSession[]): StudentAssignedTest[] {
  const sessionBySlug = new Map(sessions.map((session) => [session.test_slug, session]));
  return tests
    .map((test) => {
      const session = sessionBySlug.get(test.slug);
      const status: StudentAssignedTest["status"] =
        session?.status === "in_progress"
          ? "in_progress"
          : session?.status === "submitted"
          ? "completed"
          : "assigned";
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

function StudentStatusBadge({ status }: { status: StudentAssignedTest["status"] }) {
  if (status === "completed") {
    return <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Tugallangan</span>;
  }
  if (status === "in_progress") {
    return <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Jarayonda</span>;
  }
  return <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Yangi</span>;
}

function StudentHomeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: StudentTrendRow }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-black/10 bg-white p-2.5 text-xs shadow-md">
      <p className="font-semibold text-ink">{row.testTitle}</p>
      <p className="mt-1 font-bold text-emerald-600">{row.score}%</p>
      <p className="text-[10px] text-ink/40">{row.date}</p>
    </div>
  );
}

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

export function InfoPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-surface-soft px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

export function CompactEmpty({ title }: { title: string }) {
  return <p className="rounded-xl border border-dashed border-black/10 bg-surface p-4 text-sm text-muted">{title}</p>;
}

export function OverallMasteryCard({ value }: { value: number }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-bold text-ink">Umumiy o&apos;zlashtirish</h2>
      <div className="mt-4 flex items-center gap-4">
        <div className="text-3xl font-extrabold text-brand">{value}%</div>
        <p className="text-xs text-ink/50">Topshirilgan testlar va mavzular kesimidagi ko&apos;rsatkich.</p>
      </div>
    </Card>
  );
}

export function ScoreTrendChart({ rows }: { rows: StudentTrendRow[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-bold text-ink">Natijalar o&apos;sishi</h2>
      <div className="mt-4 h-[200px]">
        {rows.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="#f1f1f1" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#999" />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} stroke="#999" />
              <Tooltip content={<StudentHomeTooltip />} />
              <Area dataKey="score" type="monotone" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <CompactEmpty title="Natijalar hali mavjud emas" />
        )}
      </div>
    </Card>
  );
}

export function WeakTopicsCard({ rows }: { rows: Array<{ topic: string; mastery: number; attempts: number }> }) {
  const weakRows = rows.slice(0, 5);
  return (
    <Card className="p-5">
      <h2 className="text-base font-bold text-ink">Zaif mavzular</h2>
      <div className="mt-4 grid gap-3">
        {weakRows.length ? (
          weakRows.map((row) => (
            <div key={row.topic} className="grid gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink truncate">{row.topic}</span>
                <span className="text-ink/40">{row.mastery}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${row.mastery}%`, background: masteryColor(row.mastery) }} />
              </div>
            </div>
          ))
        ) : (
          <CompactEmpty title="Zaif mavzular yo'q" />
        )}
      </div>
    </Card>
  );
}

export function masteryColor(value: number) {
  if (value >= 75) return "#10b981";
  if (value >= 50) return "#f59e0b";
  return "#ef4444";
}

export function formatDate(value?: string | null) {
  if (!value) return "Sana yo'q";
  return new Date(value).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" });
}

export function shortDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" });
}
