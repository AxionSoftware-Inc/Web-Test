import Link from "next/link";
import { notFound } from "next/navigation";

import type { ApiExamPackResults } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { CreatorPacksManager } from "@/features/exam-packs/ui/creator-packs-manager";
import { LatexText } from "@/shared/ui/latex-text";
import { TopicBreakdownChart } from "@/components/questlab/charts/topic-breakdown-chart";
import { WeakTopicBars } from "@/components/questlab/charts/weak-topic-bars";
import { EmptyState as QuestEmptyState } from "@/components/questlab/feedback/empty-state";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { baseData, byIdOrSlug, CreatorPackSummary, CreatorTestCard, CreatorTestRow, MiniInfo, packResults, TeacherSectionHeader } from "@/features/platform/ui/panel-shared";

export async function CreatorDashboardPage() {
  const data = await baseData();
  const results = await packResults(data.packs);
  const validResults = results.filter((item): item is ApiExamPackResults => Boolean(item));
  const packRows = validResults
    .map((item) => ({ label: item.pack.title, value: item.average_score, meta: `${item.attempts} attempts` }))
    .sort((a, b) => a.value - b.value)
    .slice(0, 8);
  const usageRows = validResults
    .map((item) => ({ label: item.pack.title, value: item.attempts, meta: `${item.students_submitted} students` }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const draftTests = data.tests.filter((item) => item.status === "draft").slice(0, 5);
  const recentPacks = data.packs.slice(0, 5);
  return (
    <QuestPage variant="dashboard">
      <div className="quest-main-aside-grid">
        <div className="grid gap-5">
          <Card className="p-5">
            <TeacherSectionHeader title="Pack performance" action={<Button asChild variant="secondary" size="sm"><Link href="/creator/packs">Manage packs</Link></Button>} />
            <div className="mt-4"><TopicBreakdownChart rows={packRows} color="var(--chart-1)" /></div>
          </Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Recent packs" />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {recentPacks.map((pack) => <CreatorPackSummary key={pack.slug} pack={pack} usage={validResults.find((item) => item.pack.slug === pack.slug)} />)}
              {!recentPacks.length ? <QuestEmptyState title="No packs yet" /> : null}
            </div>
          </Card>
        </div>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5">
            <TeacherSectionHeader title="Usage leaders" />
            <div className="mt-4">{usageRows.length ? <WeakTopicBars rows={usageRows} /> : <QuestEmptyState title="No usage yet" />}</div>
          </Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Draft queue" action={<Button asChild variant="secondary" size="sm"><Link href="/creator/tests">All</Link></Button>} />
            <div className="mt-4 grid gap-3">
              {draftTests.map((test) => <CreatorTestRow key={test.id} test={test} href={`/creator/tests/${test.slug}/edit`} />)}
              {!draftTests.length ? <QuestEmptyState title="No draft tests" /> : null}
            </div>
          </Card>
        </aside>
      </div>
    </QuestPage>
  );
}

export async function CreatorPacksPage() {
  const packs = await questApi.examPacks();
  const results = await packResults(packs);
  const usageBySlug = Object.fromEntries(
    results
      .filter((result): result is NonNullable<typeof result> => Boolean(result))
      .map((result) => [
        result.pack.slug,
        {
          attempts: result.attempts,
          students_submitted: result.students_submitted,
          average_score: result.average_score,
        },
      ]),
  );
  return (
    <QuestPage variant="wide">
      <CreatorPacksManager initialPacks={packs} usageBySlug={usageBySlug} />
    </QuestPage>
  );
}

export async function CreatorTestsPage() {
  const tests = await questApi.tests();
  return (
    <QuestPage variant="wide">
      <Card className="p-5">
        <TeacherSectionHeader title="Test catalog" />
        <div className="mt-4 quest-card-grid-3">
          {tests.map((test) => <CreatorTestCard key={test.id} test={test} />)}
          {!tests.length ? <QuestEmptyState title="No tests yet" /> : null}
        </div>
      </Card>
    </QuestPage>
  );
}

export async function CreatorQuestionsPage() {
  const questions = await questApi.questions();
  const topicRows = Object.entries(questions.reduce<Record<string, number>>((acc, question) => {
    const label = question.skill_titles[0] || `Topic ${question.topic}`;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {})).map(([label, value]) => ({ label, value })).slice(0, 8);
  return (
    <QuestPage variant="table">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-5">
          <TeacherSectionHeader title="Questions" />
          <div className="mt-4 quest-card-grid-3">
            {questions.map((question) => (
              <Link key={question.id} href={`/creator/questions/${question.id}/edit`} className="quest-card flex min-h-[150px] flex-col p-4 hover:bg-surface-soft">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 text-sm font-semibold"><LatexText text={question.prompt.slice(0, 120)} /></h3>
                  <Badge variant="default">{question.difficulty}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted">{question.skill_titles.join(", ") || question.explanation || "No skill tags"}</p>
                <div className="mt-auto pt-4 text-xs font-semibold text-subtle">{question.type} / Topic {question.topic}</div>
              </Link>
            ))}
            {!questions.length ? <QuestEmptyState title="No questions yet" /> : null}
          </div>
        </Card>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5"><TeacherSectionHeader title="Questions by topic" /><div className="mt-4"><TopicBreakdownChart rows={topicRows} color="var(--chart-3)" /></div></Card>
        </aside>
      </div>
    </QuestPage>
  );
}

export async function CreatorTestEditPage({ testId }: { testId: string }) {
  const tests = await questApi.tests();
  const test = byIdOrSlug(tests, testId);
  if (!test) notFound();
  const skillRows = Object.entries(test.test_questions.reduce<Record<string, number>>((acc, item) => {
    const label = item.question.skill_titles[0] || `Question ${item.order}`;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {})).map(([label, value]) => ({ label, value })).slice(0, 8);
  return (
    <QuestPage variant="wide">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-5">
          <TeacherSectionHeader title="Question preview" />
          <div className="mt-4 quest-card-grid-3">
            {test.test_questions.map((item) => (
              <Link key={item.question.id} href={`/creator/questions/${item.question.id}/edit`} className="quest-card flex min-h-[150px] flex-col p-4 hover:bg-surface-soft">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 text-sm font-semibold"><LatexText text={item.question.prompt} /></h3>
                  <Badge variant="default">#{item.order}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted">{item.question.skill_titles.join(", ") || item.question.explanation || "No explanation"}</p>
                <div className="mt-auto pt-4 text-xs font-semibold text-subtle">{item.question.type} / {item.question.difficulty}</div>
              </Link>
            ))}
            {!test.test_questions.length ? <QuestEmptyState title="No questions in this test" /> : null}
          </div>
        </Card>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5"><TeacherSectionHeader title="Skill coverage" /><div className="mt-4"><TopicBreakdownChart rows={skillRows} color="var(--chart-2)" /></div></Card>
          <Card className="p-5"><TeacherSectionHeader title="Creator actions" /><div className="mt-4 grid gap-2"><Button asChild><Link href="/crud">Open editor</Link></Button><Button asChild variant="secondary"><Link href={`/tests/${test.slug}`}>Preview test</Link></Button></div></Card>
        </aside>
      </div>
    </QuestPage>
  );
}

export async function CreatorQuestionEditPage({ questionId }: { questionId: string }) {
  const question = await questApi.questionSolution(questionId);
  return (
    <QuestPage variant="reading">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">Question preview</h2>
          <Badge variant="creator">Topic {question.topic}</Badge>
        </div>
        <div className="mt-4 rounded-[var(--radius-card)] border border-line bg-surface-soft p-4 text-sm leading-6">
          <LatexText text={question.prompt} />
        </div>
        <div className="mt-4 grid gap-3">
          {question.options.map((option, index) => <div key={`${option}-${index}`} className="rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 text-sm">{option}</div>)}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <MiniInfo label="Answer" value={question.answer || "Not set"} />
          <MiniInfo label="Skills" value={question.skill_titles.join(", ") || "No tags"} />
        </div>
        {question.explanation ? <div className="mt-5 rounded-[var(--radius-card)] bg-surface-soft p-4 text-sm leading-6 text-muted"><LatexText text={question.explanation} /></div> : null}
        <div className="mt-5 flex flex-wrap gap-2"><Button asChild><Link href={`/questions/${question.id}`}>Open full editor</Link></Button><Button asChild variant="secondary"><Link href="/crud">Question CRUD</Link></Button></div>
      </Card>
    </QuestPage>
  );
}
