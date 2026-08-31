import Link from "next/link";
import { notFound } from "next/navigation";

import type { ApiClassResults } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { LatexText } from "@/shared/ui/latex-text";
import { TopicBreakdownChart } from "@/components/questlab/charts/topic-breakdown-chart";
import { WeakTopicBars } from "@/components/questlab/charts/weak-topic-bars";
import { EmptyState as QuestEmptyState } from "@/components/questlab/feedback/empty-state";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MiniInfo, classResults, TeacherClassSummary, TeacherSectionHeader } from "@/features/platform/ui/panel-shared";

export async function TeacherHomePage() {
  const classes = await questApi.classes();
  const results = await classResults(classes);
  const validResults = results.filter((item): item is ApiClassResults => Boolean(item));
  const classRows = validResults
    .map((item) => ({ label: item.classroom.name, value: item.average_score, meta: `${item.students_submitted}/${item.students_total || item.students_submitted} submitted` }))
    .sort((a, b) => a.value - b.value)
    .slice(0, 8);
  const weakRows = validResults
    .flatMap((item) => item.weak_skills.slice(0, 2).map((skill) => ({ label: skill.skill, value: skill.percent, meta: `${item.classroom.name} / ${skill.total} questions` })))
    .sort((a, b) => a.value - b.value)
    .slice(0, 6);
  const attentionClasses = [...validResults]
    .sort((a, b) => a.average_score - b.average_score)
    .slice(0, 4);
  const studentsNeedingReview = validResults
    .flatMap((item) => item.student_progress.map((student) => ({ ...student, className: item.classroom.name, classSlug: item.classroom.slug })))
    .sort((a, b) => a.average_score - b.average_score)
    .slice(0, 6);
  const activeAssignments = validResults
    .flatMap((item) => item.assignment_stats.filter((assignment) => assignment.is_active).map((assignment) => ({ ...assignment, className: item.classroom.name, classSlug: item.classroom.slug })))
    .sort((a, b) => b.unique_students - a.unique_students)
    .slice(0, 6);
  const recentResults = validResults
    .flatMap((item) => item.results.map((row) => ({ ...row, className: item.classroom.name })))
    .sort((a, b) => new Date(b.submitted_at ?? 0).getTime() - new Date(a.submitted_at ?? 0).getTime())
    .slice(0, 5);
  return (
    <QuestPage variant="wide">
      <div className="quest-main-aside-grid">
        <div className="grid gap-5">
          <Card className="p-5">
            <TeacherSectionHeader title="Class performance" action={<Button asChild variant="secondary" size="sm"><Link href="/teacher/results">View results</Link></Button>} />
            <div className="mt-4">
              <TopicBreakdownChart rows={classRows} color="var(--chart-1)" />
            </div>
          </Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Active assignments" action={<Button asChild variant="secondary" size="sm"><Link href="/teacher/classes">Manage</Link></Button>} />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeAssignments.map((assignment) => (
                <Link key={`${assignment.classSlug}-${assignment.assignment_id}`} href={`/teacher/classes/${assignment.classSlug}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-sm font-semibold">{assignment.assignment_title}</h3>
                      <p className="mt-1 line-clamp-1 text-xs text-muted">{assignment.className} / {assignment.test_title}</p>
                    </div>
                    <Badge variant={assignment.average_score >= 70 ? "success" : "warning"}>{assignment.average_score}%</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold text-muted">
                    <span className="rounded-lg bg-surface-soft px-2 py-1">{assignment.attempts} attempts</span>
                    <span className="rounded-lg bg-surface-soft px-2 py-1">{assignment.unique_students} students</span>
                    <span className="rounded-lg bg-surface-soft px-2 py-1">{assignment.late_submissions} late</span>
                  </div>
                </Link>
              ))}
              {!activeAssignments.length ? <QuestEmptyState title="No active assignments" copy="Assignments opened for classes will appear here." /> : null}
            </div>
          </Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Classes needing attention" />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {attentionClasses.map((item) => <TeacherClassSummary key={item.classroom.id} result={item} />)}
              {!attentionClasses.length ? <QuestEmptyState title="No class data yet" copy="Assigned tests and submitted results will appear here." /> : null}
            </div>
          </Card>
        </div>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5">
            <TeacherSectionHeader title="Weak topics" />
            <div className="mt-4">{weakRows.length ? <WeakTopicBars rows={weakRows} /> : <QuestEmptyState title="No weak topics yet" />}</div>
          </Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Students needing review" action={<Button asChild variant="secondary" size="sm"><Link href="/teacher/students">All</Link></Button>} />
            <div className="mt-4 grid gap-3">
              {studentsNeedingReview.map((student) => (
                <Link key={`${student.classSlug}-${student.student_code}`} href={`/teacher/students/${student.student_code}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-3 hover:bg-surface-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold">{student.student_name}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-muted">{student.className} / {student.completed} tests</p>
                    </div>
                    <Badge variant={student.average_score >= 70 ? "success" : "warning"}>{student.average_score}%</Badge>
                  </div>
                </Link>
              ))}
              {!studentsNeedingReview.length ? <QuestEmptyState title="No student data yet" /> : null}
            </div>
          </Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Recent submissions" action={<Button asChild variant="secondary" size="sm"><Link href="/teacher/results">All</Link></Button>} />
            <div className="mt-4 grid gap-3">
              {recentResults.map((row) => (
                <Link key={row.session_id} href={`/teacher/results/${row.session_id}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-3 hover:bg-surface-soft">
                  <div className="flex items-center justify-between gap-3">
                    <p className="line-clamp-1 text-sm font-semibold">{row.student_name}</p>
                    <Badge variant={row.score >= 70 ? "success" : "warning"}>{row.score}%</Badge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted">{row.test_title} / {row.className}</p>
                </Link>
              ))}
              {!recentResults.length ? <QuestEmptyState title="No submissions yet" /> : null}
            </div>
          </Card>
        </aside>
      </div>
    </QuestPage>
  );
}

export async function TeacherResultsPage() {
  const classes = await questApi.classes();
  const results = await classResults(classes);
  const validResults = results.filter((item): item is ApiClassResults => Boolean(item));
  const rows = validResults.flatMap((result) => result.results.map((row) => ({ ...row, className: result.classroom.name, weakSkill: result.weak_skills[0]?.skill ?? "No data" })));
  const classRows = validResults.map((item) => ({ label: item.classroom.name, value: item.average_score, meta: `${item.attempts} attempts` }));
  const weakRows = validResults.flatMap((item) => item.weak_skills.slice(0, 2).map((skill) => ({ label: skill.skill, value: skill.percent, meta: item.classroom.name }))).slice(0, 8);
  return (
    <QuestPage variant="table">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-5">
          <TeacherSectionHeader title="Results table" />
          <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line">
            <div className="grid grid-cols-[1.1fr_1fr_1fr_100px_110px] gap-3 border-b border-line bg-surface-soft px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle max-lg:hidden">
              <span>Student</span><span>Class</span><span>Test</span><span>Correct</span><span>Score</span>
            </div>
            {rows.map((row) => (
              <Link key={row.session_id} href={`/teacher/results/${row.session_id}`} className="grid gap-3 border-b border-line px-4 py-4 hover:bg-surface-soft lg:grid-cols-[1.1fr_1fr_1fr_100px_110px] lg:items-center">
                <div><p className="font-semibold">{row.student_name}</p><p className="mt-1 text-xs text-muted">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "Submitted"}</p></div>
                <p className="text-sm text-muted">{row.className}</p>
                <p className="line-clamp-1 text-sm text-muted">{row.test_title}</p>
                <p className="text-sm font-semibold text-muted">{row.correct}/{row.total}</p>
                <Badge variant={row.score >= 70 ? "success" : "warning"}>{row.score}%</Badge>
              </Link>
            ))}
            {!rows.length ? <div className="p-5"><QuestEmptyState title="No submitted results yet" /></div> : null}
          </div>
        </Card>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5"><TeacherSectionHeader title="Class average" /><div className="mt-4"><TopicBreakdownChart rows={classRows} color="var(--chart-2)" /></div></Card>
          <Card className="p-5"><TeacherSectionHeader title="Weak topic mastery" /><div className="mt-4">{weakRows.length ? <WeakTopicBars rows={weakRows} /> : <QuestEmptyState title="No weak topics yet" />}</div></Card>
        </aside>
      </div>
    </QuestPage>
  );
}

export async function ResultDetailPage({ resultId, role = "teacher" }: { resultId: string; role?: "teacher" | "school" }) {
  const [session, result, classes] = await Promise.all([
    questApi.session(resultId),
    questApi.sessionResult(resultId),
    questApi.classes(),
  ]);
  const scopedSession = session as typeof session & { classroom?: number | null };
  const classroom = classes.find((item) => item.id === scopedSession.classroom);
  const workspaceBase = role === "school" ? "/school" : "/teacher";
  const rows = result.questions.map((item) => ({ ...item, answer: item.student_answer, correct: item.is_correct }));
  const weakSkills = rows
    .filter((row) => !row.correct)
    .flatMap((row) => row.question.skill_titles.length ? row.question.skill_titles : ["general"])
    .reduce((map, skill) => map.set(skill, (map.get(skill) ?? 0) + 1), new Map<string, number>());
  const weakRows = Array.from(weakSkills.entries()).map(([label, value]) => ({ label, value: Math.max(4, 100 - value * 20), meta: `${value} wrong` })).slice(0, 6);
  return (
    <QuestPage variant="table">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5">
          <TeacherSectionHeader title="Question results" />
          <div className="mt-4 grid gap-3">
            {rows.map((row) => (
              <div key={row.question.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{row.question.difficulty} / {row.question.skill_titles.join(", ") || "general"}</p>
                    <div className="mt-2 font-semibold"><LatexText text={row.question.prompt} /></div>
                  </div>
                  <Badge variant={row.correct ? "success" : "warning"}>{row.correct ? "correct" : "wrong"}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-2">
                  <p><strong>Student answer:</strong> {row.answer || "Skipped"}</p>
                  <p><strong>Correct answer:</strong> {row.question.answer}</p>
                </div>
                {row.question.explanation ? <div className="mt-3 rounded-[var(--radius-control)] bg-surface-soft p-3 text-sm leading-6 text-muted"><LatexText text={row.question.explanation} /></div> : null}
              </div>
            ))}
          </div>
        </Card>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5"><TeacherSectionHeader title="Weak skills in this result" /><div className="mt-4">{weakRows.length ? <WeakTopicBars rows={weakRows} /> : <QuestEmptyState title="No wrong answers" />}</div></Card>
          <Card className="p-5"><TeacherSectionHeader title="Actions" /><div className="mt-4 grid gap-3"><Button asChild><Link href={classroom ? `${workspaceBase}/classes/${classroom.slug}` : `${workspaceBase}/classes`}>Open class</Link></Button><Button asChild variant="secondary"><Link href={`${workspaceBase}/students/${session.student_code || session.student_name}`}>Open student</Link></Button></div></Card>
        </aside>
      </div>
    </QuestPage>
  );
}

export async function TeacherClassAssignmentDetailPage({ classSlug, assignmentId }: { classSlug: string; assignmentId: string }) {
  const [assignments, results] = await Promise.all([
    questApi.classAssignments(classSlug),
    questApi.classResults(classSlug),
  ]);
  const assignment = assignments.find((item) => String(item.id) === assignmentId);
  if (!assignment) notFound();
  const submissions = results.results.filter((row) => String(row.assignment_id ?? "") === assignmentId);
  const affectedStudents = results.student_progress.filter((student) => submissions.some((row) => row.student_code === student.student_code));
  return (
    <QuestPage variant="table">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5">
          <TeacherSectionHeader title="Submissions" />
          <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line">
            <div className="grid grid-cols-[1fr_100px_100px_180px] gap-3 border-b border-line bg-surface-soft px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle max-lg:hidden">
              <span>Student</span><span>Correct</span><span>Score</span><span>Submitted</span>
            </div>
            {submissions.map((row) => (
              <Link key={row.session_id} href={`/teacher/results/${row.session_id}`} className="grid gap-3 border-b border-line px-4 py-4 hover:bg-surface-soft lg:grid-cols-[1fr_100px_100px_180px] lg:items-center">
                <div><p className="font-semibold">{row.student_name}</p><p className="mt-1 text-xs text-muted">{row.student_code}</p></div>
                <p className="text-sm text-muted">{row.correct}/{row.total}</p>
                <Badge variant={row.score >= 70 ? "success" : "warning"}>{row.score}%</Badge>
                <p className="text-sm text-muted">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "No submit"}</p>
              </Link>
            ))}
            {!submissions.length ? <div className="p-5"><QuestEmptyState title="No submissions yet" /></div> : null}
          </div>
        </Card>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5">
            <TeacherSectionHeader title="Assignment settings" />
            <div className="mt-4 grid gap-3">
              <MiniInfo label="Test" value={assignment.test_title} />
              <MiniInfo label="Difficulty" value={assignment.difficulty} />
              <MiniInfo label="Questions" value={assignment.question_count} />
              <MiniInfo label="Due date" value={assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "No deadline"} />
              <MiniInfo label="Attempt limit" value={assignment.attempt_limit} />
              <MiniInfo label="Grading" value={assignment.grading_policy} />
            </div>
          </Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Students" />
            <div className="mt-4 grid gap-3">
              {affectedStudents.map((student) => (
                <Link key={student.student_code} href={`/teacher/students/${student.student_code}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-3 hover:bg-surface-soft">
                  <p className="font-semibold">{student.student_name}</p>
                  <p className="mt-1 text-sm text-muted">{student.completed} completed / {student.average_score}% average</p>
                </Link>
              ))}
              {!affectedStudents.length ? <QuestEmptyState title="No student submissions yet" /> : null}
            </div>
          </Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Actions" />
            <div className="mt-4 grid gap-3">
              <Button asChild><Link href={`/class/${classSlug}/assignments/${assignment.id}`}>Open student preview</Link></Button>
              <Button asChild variant="secondary"><Link href={`/tests/${assignment.test_slug}`}>Open test</Link></Button>
            </div>
          </Card>
        </aside>
      </div>
    </QuestPage>
  );
}
