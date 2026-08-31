"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricTile, Section, StudentShell } from "@/components/student/student-ui";
import { apiSessionToAnswerSnapshots, buildMasteryReport, readRuntimeQuestionTimes, readRuntimeReport } from "@/features/mastery-engine/model";
import type { MasteryReport } from "@/features/mastery-engine/model";
import type { ApiMasteryProgress, ApiSession, ApiSessionResult, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { formatDate } from "@/features/student/ui/student-dashboard";
import { OverallMasteryAnalytics, QuestionSignalScatter, RecommendationCard, SkillGapMatrix, WeakTopicsBarChart, WrongQuestionList } from "@/features/student/ui/student-diagnostics";

export function StudentResult({ session, test, result }: { session: ApiSession; test: ApiTest; result: ApiSessionResult }) {
  const [serverProgress, setServerProgress] = useState<ApiMasteryProgress | null>(null);
  useEffect(() => {
    let cancelled = false;
    questApi.profileMastery(getStudentCode()).then((next) => {
      if (!cancelled) setServerProgress(next);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  const stats = result.summary;
  const evaluationTest = result.test;
  const answerSnapshots = apiSessionToAnswerSnapshots({ session, test: evaluationTest, studentId: getStudentCode(), timeSpentByQuestionId: readRuntimeQuestionTimes(session.id) });
  const fallbackReport = buildMasteryReport(getStudentCode(), answerSnapshots);
  const report = readRuntimeReport<MasteryReport>(session.id) ?? fallbackReport;
  const subjectTopics = serverProgress?.topics.filter((topic) => topic.topic_slug === test.topic_slug).map(toResultTopic) ?? report.topics.filter((topic) => topic.subject === test.subject_slug || topic.topicSlug === test.topic_slug);
  const subjectSkills = serverProgress?.skills.filter((skill) => skill.topic_slug === test.topic_slug).map(toResultSkill) ?? report.skills.filter((skill) => subjectTopics.some((topic) => topic.topicSlug === skill.topicSlug));
  const subjectMistakes = report.mistakes.filter((mistake) => mistake.subject === test.subject_slug || mistake.topicSlug === test.topic_slug);
  const serverRecommendation = serverProgress?.recommendations.find((action) => action.topic_slug === test.topic_slug) ?? serverProgress?.recommendations[0];
  const recommendation = serverRecommendation ? {
    type: serverRecommendation.type,
    label: serverRecommendation.title,
    href: serverRecommendation.href,
    reason: serverRecommendation.reason,
    topicSlug: serverRecommendation.topic_slug,
    priority: serverRecommendation.priority,
  } : report.recommendedActions.find((action) => subjectTopics.some((topic) => topic.topicSlug === action.topicSlug)) ?? report.recommendedActions[0];
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
  const overallMastery = serverProgress?.overview.mastery ?? Math.round(topicBreakdown.reduce((sum, item) => sum + item.mastery, 0) / Math.max(1, topicBreakdown.length));
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

function toResultTopic(item: ApiMasteryProgress["topics"][number]): MasteryReport["topics"][number] {
  return {
    studentId: item.subject,
    subject: item.subject,
    topic: item.topic,
    topicSlug: item.topic_slug,
    attempts: item.attempts,
    correct: item.correct,
    wrong: item.wrong,
    accuracy: item.accuracy,
    mastery: item.mastery,
    averageTimeSeconds: 0,
    expectedAverageTimeSeconds: 0,
    confidence: item.confidence,
    status: item.status as MasteryReport["topics"][number]["status"],
    isFundamental: item.is_fundamental,
    prerequisites: item.prerequisites,
    lastPracticedAt: item.last_practiced_at ?? undefined,
    updatedAt: item.updated_at,
    priorityScore: item.priority_score,
  };
}

function toResultSkill(item: ApiMasteryProgress["skills"][number]): MasteryReport["skills"][number] {
  return {
    studentId: item.subject,
    subject: item.subject,
    skill: item.skill,
    skillSlug: item.skill_slug,
    topicSlug: item.topic_slug,
    attempts: item.attempts,
    correct: item.correct,
    wrong: item.wrong,
    accuracy: item.accuracy,
    mastery: item.mastery,
    confidence: item.confidence,
    status: item.status as MasteryReport["skills"][number]["status"],
    updatedAt: item.updated_at,
  };
}
