import Link from "next/link";
import { notFound } from "next/navigation";

import { TopicBreakdownChart } from "@/components/questlab/charts/topic-breakdown-chart";
import { WeakTopicBars } from "@/components/questlab/charts/weak-topic-bars";
import { EmptyState } from "@/components/questlab/feedback/empty-state";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ApiClassResults } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";

type PageProps = {
  params: Promise<{ studentId: string }>;
};

export const dynamic = "force-dynamic";

export default async function Page({ params }: PageProps) {
  const { studentId } = await params;
  const classes = await questApi.classes();
  const results = (await Promise.all(classes.map((classroom) => questApi.classResults(classroom.slug).catch(() => null)))).filter((item): item is ApiClassResults => Boolean(item));
  const studentRows = results.flatMap((result) =>
    result.student_progress
      .filter((student) => student.student_code === studentId)
      .map((student) => ({ ...student, classroom: result.classroom, classResult: result })),
  );

  const profile = studentRows[0];
  if (!profile) notFound();

  const submissions = results
    .flatMap((result) => result.results.filter((row) => row.student_code === studentId).map((row) => ({ ...row, className: result.classroom.name, classSlug: result.classroom.slug })))
    .sort((a, b) => new Date(b.submitted_at ?? 0).getTime() - new Date(a.submitted_at ?? 0).getTime());
  const classRows = studentRows.map((row) => ({
    label: row.classroom.name,
    value: row.average_score,
    meta: `${row.completed} completed`,
  }));
  const testRows = submissions.slice(0, 8).reverse().map((row) => ({
    label: row.test_title,
    value: row.score,
    meta: row.className,
  }));
  const weakRows = studentRows
    .flatMap((row) => row.classResult.weak_skills.slice(0, 3).map((skill) => ({ label: skill.skill, value: skill.percent, meta: row.classroom.name })))
    .sort((a, b) => a.value - b.value)
    .slice(0, 6);

  return (
    <QuestPage variant="table">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-5">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Score by recent tests</h2>
            <div className="mt-4">
              <TopicBreakdownChart rows={testRows} color="var(--chart-1)" />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Submission history</h2>
            <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line">
              <div className="grid grid-cols-[1fr_1fr_100px_110px] gap-3 border-b border-line bg-surface-soft px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle max-lg:hidden">
                <span>Test</span><span>Class</span><span>Correct</span><span>Score</span>
              </div>
              {submissions.map((row) => (
                <Link key={row.session_id} href={`/teacher/results/${row.session_id}`} className="grid gap-3 border-b border-line px-4 py-4 hover:bg-surface-soft lg:grid-cols-[1fr_1fr_100px_110px] lg:items-center">
                  <div>
                    <p className="line-clamp-1 font-semibold">{row.test_title}</p>
                    <p className="mt-1 text-xs text-muted">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "Submitted"}</p>
                  </div>
                  <p className="text-sm text-muted">{row.className}</p>
                  <p className="text-sm font-semibold text-muted">{row.correct}/{row.total}</p>
                  <Badge variant={row.score >= 70 ? "success" : "warning"}>{row.score}%</Badge>
                </Link>
              ))}
              {!submissions.length ? <div className="p-5"><EmptyState title="No submissions yet" /></div> : null}
            </div>
          </Card>
        </div>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Class averages</h2>
            <div className="mt-4"><TopicBreakdownChart rows={classRows} color="var(--chart-2)" /></div>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Weak topic signals</h2>
            <div className="mt-4">{weakRows.length ? <WeakTopicBars rows={weakRows} /> : <EmptyState title="No weak topics yet" />}</div>
          </Card>
        </aside>
      </div>
    </QuestPage>
  );
}
