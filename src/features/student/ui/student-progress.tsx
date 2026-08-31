"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnalyticsBars, CompactCard, Empty, ProgressRing, Section, StudentShell, TopicActionList, TrendChart } from "@/components/student/student-ui";
import type { ApiMasteryProgress, ApiProfileSummary } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { CompactEmpty, InfoPill, OverallMasteryCard, ScoreTrendChart, WeakTopicsCard, shortDate } from "@/features/student/ui/student-dashboard";

export function StudentProgress({ summary }: { summary: ApiProfileSummary }) {
  const [studentSummary, setStudentSummary] = useState(summary);
  const [mastery, setMastery] = useState<ApiMasteryProgress | null>(null);
  useEffect(() => {
    let cancelled = false;
    const studentCode = getStudentCode();
    Promise.all([questApi.profileSummary(studentCode), questApi.profileMastery(studentCode)]).then(([nextSummary, nextMastery]) => {
      if (cancelled) return;
      setStudentSummary(nextSummary);
      setMastery(nextMastery);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  const topicProgress = mastery?.topics.map((item) => ({ topic: item.topic, slug: item.topic_slug, value: item.mastery, attempts: item.attempts })) ?? studentSummary.topic_progress;
  const strong = topicProgress.filter((item) => item.value >= 75);
  const weak = topicProgress.filter((item) => item.value < 70);
  const orderedTopics = [...topicProgress].sort((a, b) => a.value - b.value);
  const skillGaps = mastery?.skills.filter((item) => item.mastery < 85).slice(0, 8) ?? [];
  const overallMastery = mastery?.overview.mastery ?? studentSummary.math_mastery;
  const nextRecommendation = mastery?.recommendations[0];
  const scoreRows = studentSummary.recent_tests.slice(0, 8).reverse().map((item) => ({
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
            <ProgressRing label="Observed mastery" value={overallMastery} />
            <ProgressRing label="Observed accuracy" value={mastery?.overview.accuracy ?? studentSummary.average_score} />
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
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Skill gaps — what to learn">
          {skillGaps.length ? (
            <div className="grid gap-3">
              {skillGaps.map((skill) => (
                <div key={`${skill.topic_slug}-${skill.skill_slug}`} className="rounded-[var(--radius-control)] border border-line bg-surface p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold">{skill.skill}</p>
                      <p className="mt-1 text-xs text-muted">{skill.topic} · {skill.correct}/{skill.attempts} correct · {skill.confidence} confidence</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold" style={{ color: skill.mastery < 50 ? "var(--danger)" : "var(--warning)" }}>{skill.mastery}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-soft"><div className="h-full rounded-full bg-danger transition-all" style={{ width: `${skill.mastery}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <Empty text="Skill gap xaritasi uchun hali test signali yo'q." />}
        </Section>
        <Section title="Recommended learning plan">
          {nextRecommendation ? (
            <div className="rounded-[var(--radius-card)] border border-brand/20 bg-brand-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">{nextRecommendation.priority} priority</p>
              <h3 className="mt-2 text-base font-semibold text-ink">{nextRecommendation.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{nextRecommendation.reason}</p>
              <Button asChild className="mt-4"><Link href={nextRecommendation.href}>{nextRecommendation.type === "review" ? "Review gaps" : "Start focused test"}</Link></Button>
            </div>
          ) : <Empty text="Test topshirilgach, shaxsiy o'quv tavsiyalari shu yerda chiqadi." />}
        </Section>
      </div>
      <Section title="Strong topics">
        <div className="quest-card-grid-3">{strong.map((topic) => <CompactCard key={topic.slug} title={topic.topic} meta={`${topic.attempts} attempts`} href="/student/tests" action="Practice" stats={[`${topic.value}% mastery`]} />)}{!strong.length ? <Empty text="Kuchli mavzular hali yetarli emas." /> : null}</div>
      </Section>
    </StudentShell>
  );
}

export function StudentProfile({ summary }: { summary: ApiProfileSummary }) {
  const [studentSummary, setStudentSummary] = useState(summary);
  const [mastery, setMastery] = useState<ApiMasteryProgress | null>(null);
  useEffect(() => {
    let cancelled = false;
    const studentCode = getStudentCode();
    Promise.all([questApi.profileSummary(studentCode), questApi.profileMastery(studentCode)]).then(([nextSummary, nextMastery]) => {
      if (cancelled) return;
      setStudentSummary(nextSummary);
      setMastery(nextMastery);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  const topicProgress = mastery?.topics.map((item) => ({ topic: item.topic, slug: item.topic_slug, value: item.mastery, attempts: item.attempts })) ?? studentSummary.topic_progress;
  const scoreTrend = studentSummary.recent_tests.slice(0, 10).reverse().map((test) => ({
    label: shortDate(test.submitted_at),
    score: test.score,
    testTitle: test.title,
    date: test.submitted_at,
  }));
  const weakTopics = [...topicProgress].sort((a, b) => a.value - b.value).slice(0, 5).map((topic) => ({
    topic: topic.topic,
    mastery: topic.value,
    attempts: topic.attempts,
  }));
  const strongTopics = topicProgress.filter((topic) => topic.value >= 75).slice(0, 3);
  const recommendation = mastery?.recommendations[0] ? { title: mastery.recommendations[0].title, description: mastery.recommendations[0].reason, href: mastery.recommendations[0].href } : studentSummary.recommendations[0] ?? {
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
              {studentSummary.recent_tests.slice(0, 6).map((test) => <CompactCard key={test.id} title={test.title} meta={test.topic} href={`/student/results/${test.id}`} action="View result" stats={[`${test.score}%`, `${test.correct}/${test.total}`, test.submitted_at.slice(0, 10)]} />)}
              {!studentSummary.recent_tests.length ? <Empty text="Recent test history hali yo'q." /> : null}
            </div>
          </Section>
        </div>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <OverallMasteryCard value={mastery?.overview.mastery ?? (studentSummary.math_mastery || studentSummary.average_score || 0)} />
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
