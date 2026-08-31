"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnalyticsBars, CompactCard, Empty, ProgressRing, Section, StudentShell, TopicActionList, TrendChart } from "@/components/student/student-ui";
import type { ApiProfileSummary } from "@/shared/api/questlab-api";
import { CompactEmpty, InfoPill, OverallMasteryCard, ScoreTrendChart, WeakTopicsCard, shortDate } from "@/features/student/ui/student-dashboard";

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
