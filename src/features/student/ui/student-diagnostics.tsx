"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
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
import { Card } from "@/components/ui/card";
import { AnalyticsBars, Badge, Empty, Section, StudentShell } from "@/components/student/student-ui";
import { apiSessionsToAnswerSnapshots, buildMasteryReport } from "@/features/mastery-engine/model";
import type { MasteryReport } from "@/features/mastery-engine/model";
import type { ApiMistakesSummary } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { getStudentCode } from "@/shared/model/local-identity";
import { LatexText } from "@/shared/ui/latex-text";
import { masteryColor, shortDate, topCounts } from "@/features/student/ui/student-dashboard";

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
  const primaryTopic = [...weakTopics].sort((a, b) => b.priorityScore - a.priorityScore)[0] ?? [...topics].sort((a, b) => b.priorityScore - a.priorityScore)[0];

  return (
    <StudentShell variant="wide">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="border-line bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">Mastery Console</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Weak Topic Center</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <LifecycleSummary lifecycle={lifecycle} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Button key={subject} type="button" variant={activeSubject === subject ? "default" : "secondary"} size="sm" onClick={() => setSelectedSubject(subject)}>{subject}</Button>
            ))}
            {!subjects.length ? <Badge>no subject data</Badge> : null}
          </div>
        </Card>
        <PriorityDecisionCard topic={primaryTopic} recommendation={focus} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="grid gap-5">
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Prerequisite basin</h2>
                <p className="mt-1 text-sm leading-6 text-muted">Weak topic qaysi prerequisite va keyingi topiclarga tasir qilayotganini korsatadi.</p>
              </div>
              <Badge>dependency chart</Badge>
            </div>
            <PrerequisiteBasin topics={topics} primaryTopic={primaryTopic} />
          </Card>

          <div className="grid gap-5 2xl:grid-cols-[1fr_0.95fr]">
            <Card className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Evidence distribution</h2>
                  <p className="mt-1 text-sm leading-6 text-muted">X = expected time, Y = spent time, bubble = priority/difficulty signal.</p>
                </div>
                <Badge>signal map</Badge>
              </div>
              <MistakeSignalScatter mistakes={mistakes} />
            </Card>
            <Card className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Mastery lanes</h2>
                  <p className="mt-1 text-sm leading-6 text-muted">70% threshold bilan topic holati bir qatorda.</p>
                </div>
                <Badge>70% threshold</Badge>
              </div>
              <MasteryTerrain topics={weakTopics.length ? weakTopics : topics} />
            </Card>
          </div>

          <Section title="Wrong questions by topic">
            <WrongQuestionsByTopic groups={groupedMistakes} />
          </Section>
          <Section title="Skill gap matrix">
            <SkillGapMatrix skills={skills.filter((skill) => skill.mastery < 85)} />
          </Section>
        </main>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <RecoveryProtocol recommendation={focus} />
          <TopicOrbitMap topics={topics} />
          <MasteryConstellation topics={topics} value={overallMastery} label={`${activeSubject || "Subject"} mastery`} />
          <Card className="p-4">
            <h2 className="text-lg font-semibold">Mistake trend</h2>
            <div className="mt-4">
              <MistakePulseTimeline mistakes={mistakes} />
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
type MistakeLifecycleSummary = { newMistakes: number; reviewed: number; practiced: number; mastered: number; highPriorityTopics: number };

function LifecycleSummary({ lifecycle }: { lifecycle: MistakeLifecycleSummary }) {
  return (
    <div className="grid w-full grid-cols-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-soft md:w-auto">
      <DiagnosticKpi label="New" value={lifecycle.newMistakes} note="not reviewed" tone="red" />
      <DiagnosticKpi label="Reviewed" value={lifecycle.reviewed} note="opened" tone="neutral" />
      <DiagnosticKpi label="Practiced" value={lifecycle.practiced} note="follow-up" tone="green" />
      <DiagnosticKpi label="Mastered" value={lifecycle.mastered} note="closed" tone="green" />
      <DiagnosticKpi label="Priority" value={lifecycle.highPriorityTopics} note="topics" tone="amber" />
    </div>
  );
}

function DiagnosticKpi({ label, value, note, tone }: { label: string; value: number | string; note: string; tone: "red" | "green" | "amber" | "neutral" }) {
  const toneClass = tone === "red" ? "text-danger" : tone === "green" ? "text-success" : tone === "amber" ? "text-warning" : "text-ink";
  return (
    <div className="min-w-[78px] border-r border-line px-3 py-2 last:border-r-0">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-subtle">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold leading-none", toneClass)}>{value}</p>
      <p className="mt-1 truncate text-[11px] font-medium text-muted">{note}</p>
    </div>
  );
}

function PriorityDecisionCard({ topic, recommendation }: { topic?: TopicMasteryView; recommendation?: MasteryReport["recommendedActions"][number] }) {
  const score = topic ? Math.min(140, Math.round(topic.priorityScore)) : 0;
  const ringValue = Math.min(100, Math.max(8, score));
  return (
    <Card className="overflow-hidden border-[#263029] bg-[#11130f] p-4 text-white shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200">Primary decision</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">{recommendation?.label ?? (topic ? `Practice ${topic.topic}` : "Start diagnostic practice")}</h2>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/70">
        {recommendation?.reason ?? (topic ? `${topic.correct}/${topic.attempts} correct. ${topic.confidence} confidence weakness. Engine bu topicni birinchi o'ringa qo'ydi.` : "Mistake analytics uchun kamida bitta test yakunlang.")}
      </p>
      <div className="mt-4 grid grid-cols-[86px_1fr] gap-3">
        <div className="relative grid size-[86px] place-items-center rounded-full" style={{ background: `conic-gradient(var(--danger) 0 ${ringValue * 3.6}deg, rgba(255,255,255,0.16) ${ringValue * 3.6}deg 360deg)` }}>
          <span className="absolute inset-2 rounded-full border border-white/10 bg-[#151a15]" />
          <b className="relative text-2xl text-white">{score}</b>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PriorityMetric label="Accuracy" value={topic ? `${topic.accuracy}%` : "-"} />
          <PriorityMetric label="Mastery" value={topic ? `${topic.mastery}%` : "-"} />
          <PriorityMetric label="Wrong" value={topic?.wrong ?? "-"} />
          <PriorityMetric label="Confidence" value={topic?.confidence ?? "-"} />
        </div>
      </div>
      <Button asChild className="mt-4 w-full bg-white text-[#11130f] hover:bg-white/90">
        <Link href={recommendation?.href ?? "/student/tests"}>{recommendation?.label ?? "Open tests"}</Link>
      </Button>
    </Card>
  );
}

function PriorityMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.065] p-3">
      <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/45">{label}</span>
      <b className="mt-1 block text-lg text-white">{value}</b>
    </div>
  );
}

function PrerequisiteBasin({ topics, primaryTopic }: { topics: TopicMasteryView[]; primaryTopic?: TopicMasteryView }) {
  const nodes = [...topics].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
  if (!primaryTopic || nodes.length < 2) return <CompactChartEmpty text="Dependency basin uchun kamida 2 ta topic signali kerak." />;
  const left = nodes.find((item) => primaryTopic.prerequisites.includes(item.topicSlug)) ?? nodes.find((item) => item.topicSlug !== primaryTopic.topicSlug);
  const right = nodes.filter((item) => item.topicSlug !== primaryTopic.topicSlug && item.topicSlug !== left?.topicSlug).slice(0, 2);
  const stable = nodes.find((item) => item.mastery >= 75 && item.topicSlug !== primaryTopic.topicSlug);

  return (
    <div className="relative h-[420px] overflow-hidden rounded-[18px] border border-line bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px),var(--surface-soft)] bg-[size:100%_25%,12.5%_100%,auto]">
      <svg className="absolute inset-0 size-full" viewBox="0 0 1000 420" preserveAspectRatio="none">
        <defs>
          <linearGradient id="qlFlowRisk" x1="0" x2="1"><stop offset="0" stopColor="var(--danger)" stopOpacity=".14" /><stop offset="1" stopColor="var(--danger)" stopOpacity=".52" /></linearGradient>
          <linearGradient id="qlFlowStable" x1="0" x2="1"><stop offset="0" stopColor="var(--success)" stopOpacity=".12" /><stop offset="1" stopColor="var(--success)" stopOpacity=".38" /></linearGradient>
        </defs>
        <path d="M170 248 C310 150, 410 142, 530 206" stroke="url(#qlFlowRisk)" strokeWidth="42" fill="none" strokeLinecap="round" />
        <path d="M530 206 C650 138, 735 108, 850 112" stroke="url(#qlFlowRisk)" strokeWidth="28" fill="none" strokeLinecap="round" />
        <path d="M530 206 C650 278, 720 315, 850 312" stroke="url(#qlFlowRisk)" strokeWidth="23" fill="none" strokeLinecap="round" />
        <path d="M170 248 C340 298, 415 318, 540 335" stroke="url(#qlFlowStable)" strokeWidth="18" fill="none" strokeLinecap="round" />
      </svg>
      {left ? <BasinNode className="left-[17%] top-[58%]" topic={left} /> : null}
      <BasinNode className="left-[53%] top-[48%]" topic={primaryTopic} weak />
      {right[0] ? <BasinNode className="left-[84%] top-[27%]" topic={right[0]} weak={right[0].mastery < 70} /> : null}
      {right[1] ? <BasinNode className="left-[84%] top-[74%]" topic={right[1]} weak={right[1].mastery < 70} /> : null}
      {stable ? <BasinNode className="left-[54%] top-[80%]" topic={stable} /> : null}
    </div>
  );
}

function BasinNode({ topic, weak, className }: { topic: TopicMasteryView; weak?: boolean; className: string }) {
  return (
    <div className={cn("absolute min-w-[154px] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-line bg-surface/95 px-3 py-2 shadow-[0_12px_28px_rgba(20,23,19,.07)]", weak ? "ring-4 ring-danger/10" : "", className)}>
      <b className="block text-sm">{topic.topic}</b>
      <span className="mt-1 block text-xs font-medium text-muted">{topic.mastery}% mastery · {topic.status.replace("_", " ")}</span>
    </div>
  );
}

function MasteryTerrain({ topics }: { topics: TopicMasteryView[] }) {
  const rows = [...topics].sort((a, b) => a.mastery - b.mastery).slice(0, 6);
  if (!rows.length) return <CompactChartEmpty text="Mastery terrain uchun topic signali yo'q." />;
  const points = rows.map((topic, index) => {
    const x = 8 + index * (84 / Math.max(1, rows.length - 1));
    const y = 86 - topic.mastery * 0.72;
    return { topic, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${path} L ${points.at(-1)?.x ?? 92} 92 L ${points[0]?.x ?? 8} 92 Z`;

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-[18px] border border-line bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px),var(--surface-soft)] bg-[size:100%_25%,16.66%_100%,auto] p-4">
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="qlTerrainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--danger)" stopOpacity=".30" />
            <stop offset=".55" stopColor="var(--warning)" stopOpacity=".18" />
            <stop offset="1" stopColor="var(--success)" stopOpacity=".10" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#qlTerrainFill)" />
        <path d={path} fill="none" stroke="var(--ink)" strokeOpacity=".58" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
        <line x1="0" x2="100" y1="35.6" y2="35.6" stroke="var(--warning)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="relative grid h-full grid-cols-2 gap-3 md:grid-cols-3">
        {points.map(({ topic, x, y }) => (
          <div key={topic.topicSlug} className="min-h-[92px] rounded-[14px] border border-line bg-surface/90 p-3 shadow-[0_10px_26px_rgba(20,23,19,.06)]" style={{ transform: `translateY(${Math.max(-10, Math.min(16, y - 50))}px)` }}>
            <div className="flex items-start justify-between gap-2">
              <b className="line-clamp-2 text-sm">{topic.topic}</b>
              <span className="rounded-lg px-2 py-1 text-xs font-bold text-white" style={{ background: masteryColor(topic.mastery) }}>{topic.mastery}%</span>
            </div>
            <p className="mt-2 text-xs text-muted">{topic.correct}/{topic.attempts} correct · x{x.toFixed(0)} y{y.toFixed(0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecoveryProtocol({ recommendation }: { recommendation?: MasteryReport["recommendedActions"][number] }) {
  return (
    <Card className="border-white/10 bg-[#11130f] p-5 text-white shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Recovery protocol</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">Aniq remediation flow: practice to retest to maintenance.</p>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-emerald-200">active</span>
      </div>
      <Button asChild className="mt-4 w-full"><Link href={recommendation?.href ?? "/student/tests"}>Generate targeted practice</Link></Button>
      <div className="mt-4 grid gap-3">
        <ProtocolStep index={1} title="Practice weak prerequisite" copy="Eng past mastery topicdan 10 adaptive question." />
        <ProtocolStep index={2} title="Run mini retest" copy="5 unseen variant, target 80%+." />
        <ProtocolStep index={3} title="Reduce frequency" copy="Pass bo'lsa maintenance savollarga o'tkaziladi." />
      </div>
    </Card>
  );
}

function ProtocolStep({ index, title, copy }: { index: number; title: string; copy: string }) {
  return (
    <div className="grid grid-cols-[38px_1fr] gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-white/10 font-black text-emerald-100">{index}</span>
      <div className="rounded-[14px] border border-white/10 bg-white/[0.06] p-3">
        <b className="block text-sm">{title}</b>
        <span className="mt-1 block text-xs leading-5 text-white/60">{copy}</span>
      </div>
    </div>
  );
}

function TopicOrbitMap({ topics }: { topics: TopicMasteryView[] }) {
  const rows = [...topics].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
  if (!rows.length) return <Card className="p-4"><CompactChartEmpty text="Topic orbit uchun data yo'q." /></Card>;
  const positions = [
    { left: 50, top: 50 },
    { left: 24, top: 29 },
    { left: 77, top: 32 },
    { left: 24, top: 73 },
    { left: 77, top: 72 },
  ];

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold">Topic orbit map</h2>
      <p className="mt-1 text-sm text-muted">Priority gravitatsiyasi: markazdagi topic eng katta action talab qiladi.</p>
      <div className="relative mt-4 h-[300px] overflow-hidden rounded-[18px] border border-line bg-[radial-gradient(circle_at_center,var(--surface)_0,transparent_24%),linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px),var(--surface-soft)] bg-[size:auto,100%_25%,25%_100%,auto]">
        <span className="absolute left-1/2 top-1/2 size-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line-strong" />
        <span className="absolute left-1/2 top-1/2 size-[132px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line" />
        {rows.map((topic, index) => {
          const position = positions[index] ?? positions[0];
          const size = index === 0 ? 84 : 62;
          return (
            <Link
              key={topic.topicSlug}
              href="/student/tests"
              className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 text-center shadow-[0_14px_34px_rgba(20,23,19,.12)] transition hover:scale-105"
              style={{ left: `${position.left}%`, top: `${position.top}%`, width: size, height: size, background: masteryColor(topic.mastery), color: "white" }}
            >
              <span className="px-2 text-[10px] font-black leading-tight">{topic.mastery}%<br />{topic.topic.slice(0, 10)}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function MasteryConstellation({ topics, value, label }: { topics: TopicMasteryView[]; value: number; label: string }) {
  const rows = [...topics].sort((a, b) => a.mastery - b.mastery).slice(0, 9);
  if (!rows.length) return <Card className="p-4"><CompactChartEmpty text="Constellation uchun topic data yo'q." /></Card>;
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold">{label}</h2>
      <div className="mt-4 grid grid-cols-[120px_1fr] gap-4">
        <div className="relative grid size-[120px] place-items-center rounded-[28px] border border-line bg-surface-soft">
          <span className="absolute inset-4 rounded-[22px] border border-dashed border-line-strong" />
          <b className="relative text-3xl">{value}%</b>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {rows.map((topic, index) => (
            <div key={topic.topicSlug} className="relative min-h-16 rounded-[14px] border border-line bg-surface-soft p-2">
              <span className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: masteryColor(topic.mastery) }}>{topic.mastery}</span>
              <span className="block pt-7 text-[11px] font-semibold leading-tight text-muted">{index + 1}. {topic.topic.slice(0, 16)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function OverallMasteryAnalytics({ value, label }: { value: number; label: string }) {
  const data = [{ name: label, value, fill: value >= 85 ? "var(--success)" : value >= 70 ? "var(--chart-1)" : value >= 50 ? "var(--warning)" : "var(--danger)" }];
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold">{label}</h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative size-32">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 1, height: 1 }}>
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

export function WeakTopicsBarChart({ topics }: { topics: TopicMasteryView[] }) {
  const data = [...topics]
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 8)
    .map((topic) => ({ name: topic.topic, mastery: topic.mastery, accuracy: topic.accuracy, wrong: topic.wrong, status: topic.status, isFundamental: topic.isFundamental }));

  if (!data.length) return <Empty text="Topic mastery uchun yetarli data yo'q." />;

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 1, height: 1 }}>
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

export function SkillGapMatrix({ skills, compact = false }: { skills: SkillMasteryView[]; compact?: boolean }) {
  const data = [...skills].sort((a, b) => a.mastery - b.mastery).slice(0, 18);
  if (!data.length) return <CompactChartEmpty text="Bu fan uchun skill signali hali yo'q." />;

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

  if (!data.length) return <CompactChartEmpty text="Bu fan uchun xato signali yo'q." />;

  return <SignalScatterChart data={data} />;
}

export function QuestionSignalScatter({ signals }: { signals: QuestionSignalRow[] }) {
  const data: ScatterRow[] = signals.map((signal) => ({
    expected: Math.max(1, signal.estimatedSeconds || 1),
    spent: Math.max(1, signal.timeSpentSeconds || signal.estimatedSeconds || 1),
    priority: signal.difficulty === "hard" ? 150 : signal.difficulty === "medium" ? 105 : 75,
    topic: `#${signal.questionNumber} · ${signal.topic}`,
    skill: signal.difficulty,
    quality: signal.isCorrect ? "correct" : "wrong",
    isCorrect: signal.isCorrect,
  }));

  if (!data.length) return <CompactChartEmpty text="Question signal uchun yetarli data yo'q." />;

  return <SignalScatterChart data={data} />;
}

function SignalScatterChart({ data }: { data: ScatterRow[] }) {
  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 1, height: 1 }}>
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

function MistakePulseTimeline({ mistakes }: { mistakes: MistakeView[] }) {
  const groups = mistakes.reduce((map, mistake) => {
    const key = shortDate(mistake.createdAt);
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  const data: TrendRow[] = Array.from(groups.entries()).map(([label, value]) => ({ label, mistakes: value })).slice(-8);
  if (data.length < 2) return <CompactChartEmpty text="Pulse timeline uchun kamida 2 ta vaqt nuqtasi kerak." />;
  const max = Math.max(...data.map((item) => item.mistakes), 1);

  return (
    <div className="relative h-[250px] overflow-hidden rounded-[18px] border border-line bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px),var(--surface-soft)] bg-[size:100%_25%,12.5%_100%,auto] p-4">
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {data.map((item, index) => {
          const x = 10 + index * (80 / Math.max(1, data.length - 1));
          const y = 82 - (item.mistakes / max) * 58;
          const next = data[index + 1];
          const nextX = 10 + (index + 1) * (80 / Math.max(1, data.length - 1));
          const nextY = next ? 82 - (next.mistakes / max) * 58 : y;
          return next ? <path key={`${item.label}-line`} d={`M ${x} ${y} C ${x + 7} ${y}, ${nextX - 7} ${nextY}, ${nextX} ${nextY}`} stroke="var(--danger)" strokeOpacity=".48" strokeWidth="1.1" fill="none" vectorEffect="non-scaling-stroke" /> : null;
        })}
      </svg>
      <div className="relative flex h-full items-end justify-between gap-2">
        {data.map((item) => {
          const height = 34 + (item.mistakes / max) * 126;
          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="relative grid w-full place-items-center" style={{ height }}>
                <span className="absolute size-11 rounded-full bg-danger/10" />
                <span className="absolute size-7 rounded-full bg-danger/20" />
                <span className="relative grid size-5 place-items-center rounded-full bg-danger text-[10px] font-black text-white">{item.mistakes}</span>
              </div>
              <span className="max-w-full truncate text-[10px] font-semibold text-muted">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompactChartEmpty({ text }: { text: string }) {
  return (
    <div className="grid min-h-[96px] place-items-center rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface-soft px-4 py-5 text-center">
      <p className="max-w-[320px] text-sm font-medium leading-6 text-muted">{text}</p>
    </div>
  );
}

export function RecommendationCard({ recommendation, fallbackHref }: { recommendation?: MasteryReport["recommendedActions"][number]; fallbackHref: string }) {
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

export function WrongQuestionList({ mistakes }: { mistakes: Array<MistakeView & { questionNumber?: number }> }) {
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
