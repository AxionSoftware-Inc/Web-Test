import Link from "next/link";
import { notFound } from "next/navigation";

import type { ApiClassResults, ApiExamPackResults } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { EmptyState as QuestEmptyState } from "@/components/questlab/feedback/empty-state";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { TopicBreakdownChart } from "@/components/questlab/charts/topic-breakdown-chart";
import { WeakTopicBars } from "@/components/questlab/charts/weak-topic-bars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminClassCard, AdminPackCard, AdminSchoolCard, AdminTestCard, byIdOrSlug, classResults, GenericEntityCard, packResults, SchoolTeacherCard, TeacherSectionHeader, baseData } from "@/features/platform/ui/panel-shared";

export async function AdminHomePage() {
  const data = await baseData();
  const [classStats, packStats] = await Promise.all([classResults(data.classes), packResults(data.packs)]);
  const validClassStats = classStats.filter((item): item is ApiClassResults => Boolean(item));
  const validPackStats = packStats.filter((item): item is ApiExamPackResults => Boolean(item));
  const classRows = validClassStats.map((item) => ({ label: item.classroom.name, value: item.average_score, meta: `${item.attempts} attempts` })).slice(0, 8);
  const packRows = validPackStats.map((item) => ({ label: item.pack.title, value: item.attempts, meta: `${item.students_submitted} students` })).slice(0, 6);
  return (
    <QuestPage variant="dashboard">
      <div className="quest-main-aside-grid">
        <div className="grid gap-5">
          <Card className="p-5"><TeacherSectionHeader title="Class performance" action={<Button asChild variant="secondary" size="sm"><Link href="/admin/classes">All classes</Link></Button>} /><div className="mt-4"><TopicBreakdownChart rows={classRows} color="var(--chart-1)" /></div></Card>
          <Card className="p-5"><TeacherSectionHeader title="Recent schools" /><div className="mt-4 quest-card-grid-3">{data.schools.slice(0, 6).map((school) => <AdminSchoolCard key={school.id} school={school} />)}{!data.schools.length ? <QuestEmptyState title="No schools yet" /> : null}</div></Card>
        </div>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5"><TeacherSectionHeader title="Top pack usage" action={<Button asChild variant="secondary" size="sm"><Link href="/admin/packs">All packs</Link></Button>} /><div className="mt-4">{packRows.length ? <WeakTopicBars rows={packRows} /> : <QuestEmptyState title="No pack usage yet" />}</div></Card>
          <Card className="p-5"><TeacherSectionHeader title="Active teachers" /><div className="mt-4 grid gap-3">{validClassStats.slice(0, 5).map((item) => <Link key={item.classroom.id} href={`/admin/classes/${item.classroom.slug}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-3 hover:bg-surface-soft"><div className="flex items-center justify-between gap-3"><p className="line-clamp-1 text-sm font-semibold">{item.classroom.teacher_name}</p><Badge variant={item.average_score >= 70 ? "success" : "warning"}>{item.average_score}%</Badge></div><p className="mt-1 text-xs text-muted">{item.classroom.name} / {item.attempts} attempts</p></Link>)}</div></Card>
        </aside>
      </div>
    </QuestPage>
  );
}

export async function AdminSchoolsPage() {
  const schools = await questApi.schools();
  return (
    <QuestPage variant="wide">
      <Card className="p-5"><TeacherSectionHeader title="School directory" /><div className="mt-4 quest-card-grid-3">{schools.map((school) => <AdminSchoolCard key={school.id} school={school} />)}{!schools.length ? <QuestEmptyState title="No schools yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function AdminSchoolDetailPage({ schoolId }: { schoolId: string }) {
  const schools = await questApi.schools();
  const school = byIdOrSlug(schools, schoolId);
  if (!school) notFound();
  const [classes, teachers] = await Promise.all([
    questApi.schoolClasses(school.slug).catch(() => []),
    questApi.schoolTeachers(school.slug).catch(() => []),
  ]);
  return (
    <QuestPage variant="wide">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-5"><TeacherSectionHeader title="Classes" /><div className="mt-4 quest-card-grid-3">{classes.map((item) => <AdminClassCard key={item.id} classroom={item} />)}{!classes.length ? <QuestEmptyState title="No classes yet" /> : null}</div></Card>
        <Card className="h-fit p-5 xl:sticky xl:top-24"><TeacherSectionHeader title="Teachers" /><div className="mt-4 grid gap-3">{teachers.map((teacher) => <SchoolTeacherCard key={teacher.id} teacher={teacher} />)}{!teachers.length ? <QuestEmptyState title="No teachers yet" /> : null}</div></Card>
      </div>
    </QuestPage>
  );
}

export async function AdminClassesPage() {
  const classes = await questApi.classes();
  const results = await classResults(classes);
  const validResults = results.filter((item): item is ApiClassResults => Boolean(item));
  return (
    <QuestPage variant="wide">
      <Card className="p-5"><TeacherSectionHeader title="Class directory" /><div className="mt-4 quest-card-grid-3">{classes.map((item) => <AdminClassCard key={item.id} classroom={item} result={validResults.find((row) => row.classroom.slug === item.slug)} />)}{!classes.length ? <QuestEmptyState title="No classes yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function AdminClassDetailPage({ classId }: { classId: string }) {
  const classes = await questApi.classes();
  const classroom = byIdOrSlug(classes, classId);
  if (!classroom) notFound();
  const [results, students] = await Promise.all([
    questApi.classResults(classroom.slug).catch(() => null),
    questApi.classStudents(classroom.slug).catch(() => []),
  ]);
  const studentCards = results?.student_progress.length
    ? results.student_progress.map((student) => ({
        title: student.student_name,
        href: `/admin/students/${student.student_code}`,
        meta: student.student_code,
        stats: [{ label: "Average", value: `${student.average_score}%` }, { label: "Completed", value: student.completed }],
      }))
    : students.map((student) => ({
        title: student.name,
        href: `/admin/students/${student.id}`,
        meta: student.student_code,
        stats: [],
      }));
  return (
    <QuestPage variant="table">
      <Card className="p-5"><TeacherSectionHeader title="Student list" /><div className="mt-4 quest-card-grid-3">{studentCards.map((card) => <GenericEntityCard key={`${card.href}-${card.title}`} {...card} />)}{!studentCards.length ? <QuestEmptyState title="No students yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function AdminTestsPage() {
  const [tests, classes] = await Promise.all([questApi.tests(), questApi.classes()]);
  const results = await classResults(classes);
  return (
    <QuestPage variant="wide">
      <Card className="p-5"><TeacherSectionHeader title="Test directory" /><div className="mt-4 quest-card-grid-3">{tests.map((test) => {
        const used = results.reduce((sum, item) => sum + (item?.assignment_stats.filter((row) => row.test_slug === test.slug).length ?? 0), 0);
        return <AdminTestCard key={test.id} test={test} used={used} />;
      })}{!tests.length ? <QuestEmptyState title="No tests yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function AdminTestDetailPage({ testId }: { testId: string }) {
  const tests = await questApi.tests();
  const test = byIdOrSlug(tests, testId);
  if (!test) notFound();
  return (
    <QuestPage variant="wide">
      <Card className="p-5"><TeacherSectionHeader title="Questions preview" /><div className="mt-4 quest-card-grid-3">{test.test_questions.slice(0, 12).map((item) => <GenericEntityCard key={item.question.id} title={item.question.prompt.slice(0, 80)} href={`/questions/${item.question.id}`} meta={item.question.difficulty} copy={item.question.explanation ?? "No explanation"} />)}{!test.test_questions.length ? <QuestEmptyState title="No questions yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function AdminPacksPage() {
  const packs = await questApi.examPacks();
  const results = await packResults(packs);
  const validResults = results.filter((item): item is ApiExamPackResults => Boolean(item));
  return (
    <QuestPage variant="wide">
      <Card className="p-5"><TeacherSectionHeader title="Pack directory" /><div className="mt-4 quest-card-grid-3">{packs.map((pack) => <AdminPackCard key={pack.id} pack={pack} result={validResults.find((item) => item.pack.slug === pack.slug)} />)}{!packs.length ? <QuestEmptyState title="No packs yet" /> : null}</div></Card>
    </QuestPage>
  );
}
