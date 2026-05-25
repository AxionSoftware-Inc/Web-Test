import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, BookOpenCheck, Building2, FileWarning, GraduationCap, PackageCheck, Settings, UsersRound } from "lucide-react";

import type { ApiClassResults, ApiExamPack, ApiExamPackResults, ApiSchool, ApiTeacherClass, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { LatexText } from "@/shared/ui/latex-text";
import { PremiumPage, PremiumPanel } from "@/shared/ui/premium-shell";
import { CreatorPacksManager } from "@/features/exam-packs/ui/creator-packs-manager";
import { TopicBreakdownChart } from "@/components/questlab/charts/topic-breakdown-chart";
import { WeakTopicBars } from "@/components/questlab/charts/weak-topic-bars";
import { EntityCard as QuestEntityCard } from "@/components/questlab/cards/entity-card";
import { StatCard } from "@/components/questlab/cards/stat-card";
import { EmptyState as QuestEmptyState } from "@/components/questlab/feedback/empty-state";
import { PageHeader as QuestPageHeader } from "@/components/questlab/layout/page-header";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { SectionHeader } from "@/components/questlab/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Stat = { label: string; value: string | number };
type Card = { title: string; href: string; meta?: string; copy?: string; stats?: Stat[]; status?: string };

function byIdOrSlug<T extends { id: number; slug?: string }>(items: T[], value: string) {
  return items.find((item) => String(item.id) === value || item.slug === value);
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length) : 0;
}

async function baseData() {
  const [schools, classes, tests, packs, sessions, questions] = await Promise.all([
    questApi.schools().catch(() => []),
    questApi.classes().catch(() => []),
    questApi.tests().catch(() => []),
    questApi.examPacks().catch(() => []),
    questApi.sessions().catch(() => []),
    questApi.questions().catch(() => []),
  ]);
  return { schools, classes, tests, packs, sessions, questions };
}

async function classResults(classes: ApiTeacherClass[]) {
  return Promise.all(classes.map((item) => questApi.classResults(item.slug).catch(() => null)));
}

async function packResults(packs: ApiExamPack[]) {
  return Promise.all(packs.map((item) => questApi.examPackResults(item.slug).catch(() => null)));
}

export async function AdminHomePage() {
  const data = await baseData();
  const [classStats, packStats] = await Promise.all([classResults(data.classes), packResults(data.packs)]);
  const validClassStats = classStats.filter((item): item is ApiClassResults => Boolean(item));
  const validPackStats = packStats.filter((item): item is ApiExamPackResults => Boolean(item));
  const students = new Set(classStats.flatMap((item) => item?.student_progress.map((student) => student.student_code) ?? [])).size;
  const teachers = new Set(data.classes.map((item) => item.teacher_name).filter(Boolean)).size + data.schools.reduce((sum, school) => sum + school.teacher_count, 0);
  const activeSessions = data.sessions.filter((item) => item.status === "in_progress").length;
  const completedToday = data.sessions.filter((item) => item.status === "submitted").length;
  const classRows = validClassStats.map((item) => ({ label: item.classroom.name, value: item.average_score, meta: `${item.attempts} attempts` })).slice(0, 8);
  const packRows = validPackStats.map((item) => ({ label: item.pack.title, value: item.attempts, meta: `${item.students_submitted} students` })).slice(0, 6);
  return (
    <QuestPage variant="dashboard">
      <QuestPageHeader eyebrow="Admin" title="Platform dashboard" copy="Global schools, classes, tests, packs and session health." />
      <div className="quest-metric-grid">
        <TeacherMetric label="Schools" value={data.schools.length} />
        <TeacherMetric label="Teachers" value={teachers} />
        <TeacherMetric label="Students" value={students} />
        <TeacherMetric label="Classes" value={data.classes.length} />
        <TeacherMetric label="Tests" value={data.tests.length} />
        <TeacherMetric label="Packs" value={data.packs.length} />
        <TeacherMetric label="Active sessions" value={activeSessions} />
        <TeacherMetric label="Submitted tests" value={completedToday} />
      </div>
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
      <QuestPageHeader eyebrow="Admin" title="Schools" copy="All schools and learning centers on the platform." />
      <div className="quest-metric-grid">
        <TeacherMetric label="Schools" value={schools.length} />
        <TeacherMetric label="Public" value={schools.filter((item) => item.visibility === "public").length} />
        <TeacherMetric label="Private" value={schools.filter((item) => item.visibility === "private").length} />
        <TeacherMetric label="Teachers" value={schools.reduce((sum, item) => sum + item.teacher_count, 0)} />
      </div>
      <Card className="p-5"><TeacherSectionHeader title="School directory" /><div className="mt-4 quest-card-grid-3">{schools.map((school) => <AdminSchoolCard key={school.id} school={school} />)}{!schools.length ? <QuestEmptyState title="No schools yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function AdminSchoolDetailPage({ schoolId }: { schoolId: string }) {
  const schools = await questApi.schools();
  const school = byIdOrSlug(schools, schoolId);
  if (!school) notFound();
  const [analytics, classes, teachers] = await Promise.all([
    questApi.schoolAnalytics(school.slug).catch(() => null),
    questApi.schoolClasses(school.slug).catch(() => []),
    questApi.schoolTeachers(school.slug).catch(() => []),
  ]);
  return (
    <QuestPage variant="wide">
      <QuestPageHeader eyebrow="Admin school" title={school.name} copy={school.description || "School overview, teachers, classes, students and reports."} />
      <div className="quest-metric-grid">
        <TeacherMetric label="Owner" value={school.owner_name || "No owner"} />
        <TeacherMetric label="Teachers" value={analytics?.teacher_count ?? teachers.length} />
        <TeacherMetric label="Students" value={analytics?.students_submitted ?? 0} />
        <TeacherMetric label="Attempts" value={analytics?.attempts ?? 0} />
        <TeacherMetric label="Average score" value={`${analytics?.average_score ?? 0}%`} />
      </div>
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
      <QuestPageHeader eyebrow="Admin" title="Classes" copy="Platform class health, teachers and weak topic signals." />
      <div className="quest-metric-grid">
        <TeacherMetric label="Classes" value={classes.length} />
        <TeacherMetric label="Students" value={classes.reduce((sum, item) => sum + item.student_count, 0)} />
        <TeacherMetric label="Assignments" value={classes.reduce((sum, item) => sum + item.assignment_count, 0)} />
        <TeacherMetric label="Average score" value={`${average(validResults.map((item) => item.average_score))}%`} />
      </div>
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
      <QuestPageHeader eyebrow="Admin class" title={classroom.name} copy={`${classroom.teacher_name} classi bo'yicha natija va o'quvchilar.`} />
      <div className="quest-metric-grid">
        <TeacherMetric label="Teacher" value={classroom.teacher_name} />
        <TeacherMetric label="Students" value={students.length || classroom.student_count} />
        <TeacherMetric label="Open sessions" value={results?.sessions_open ?? 0} />
        <TeacherMetric label="Average score" value={`${results?.average_score ?? 0}%`} />
        <TeacherMetric label="Weakest topic" value={results?.weak_skills[0]?.skill ?? "No data"} />
      </div>
      <Card className="p-5"><TeacherSectionHeader title="Student list" /><div className="mt-4 quest-card-grid-3">{studentCards.map((card) => <GenericEntityCard key={`${card.href}-${card.title}`} {...card} />)}{!studentCards.length ? <QuestEmptyState title="No students yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function AdminTestsPage() {
  const [tests, classes] = await Promise.all([questApi.tests(), questApi.classes()]);
  const results = await classResults(classes);
  return (
    <QuestPage variant="wide">
      <QuestPageHeader eyebrow="Admin" title="Tests" copy="Test catalog by subject, creator and publish status." />
      <div className="quest-metric-grid">
        <TeacherMetric label="Tests" value={tests.length} />
        <TeacherMetric label="Published" value={tests.filter((item) => item.status === "published").length} />
        <TeacherMetric label="Draft" value={tests.filter((item) => item.status === "draft").length} />
        <TeacherMetric label="Questions" value={tests.reduce((sum, item) => sum + item.test_questions.length, 0)} />
      </div>
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
      <QuestPageHeader eyebrow="Admin test" title={test.title} copy={`${test.subject_slug} / ${test.topic_slug}`} />
      <div className="quest-metric-grid">
        <TeacherMetric label="Questions" value={test.test_questions.length} />
        <TeacherMetric label="Difficulty" value={test.difficulty} />
        <TeacherMetric label="Time limit" value={`${test.estimated_minutes} min`} />
        <TeacherMetric label="Status" value={test.status} />
        <TeacherMetric label="Passing score" value={`${test.passing_score}%`} />
      </div>
      <Card className="p-5"><TeacherSectionHeader title="Questions preview" /><div className="mt-4 quest-card-grid-3">{test.test_questions.slice(0, 12).map((item) => <GenericEntityCard key={item.question.id} title={item.question.prompt.slice(0, 80)} href={`/questions/${item.question.id}`} meta={item.question.difficulty} copy={item.question.explanation} />)}{!test.test_questions.length ? <QuestEmptyState title="No questions yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function AdminPacksPage() {
  const packs = await questApi.examPacks();
  const results = await packResults(packs);
  const validResults = results.filter((item): item is ApiExamPackResults => Boolean(item));
  return (
    <QuestPage variant="wide">
      <QuestPageHeader eyebrow="Admin" title="Packs" copy="Pack usage, publishing status and content health." />
      <div className="quest-metric-grid">
        <TeacherMetric label="Packs" value={packs.length} />
        <TeacherMetric label="Published" value={packs.filter((item) => item.is_active).length} />
        <TeacherMetric label="Attempts" value={validResults.reduce((sum, item) => sum + item.attempts, 0)} />
        <TeacherMetric label="Average score" value={`${average(validResults.map((item) => item.average_score))}%`} />
      </div>
      <Card className="p-5"><TeacherSectionHeader title="Pack directory" /><div className="mt-4 quest-card-grid-3">{packs.map((pack) => <AdminPackCard key={pack.id} pack={pack} result={validResults.find((item) => item.pack.slug === pack.slug)} />)}{!packs.length ? <QuestEmptyState title="No packs yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function PackDetailPage({ packId, base = "/admin/packs" }: { packId: string; base?: string }) {
  const packs = await questApi.examPacks();
  const pack = byIdOrSlug(packs, packId);
  if (!pack) notFound();
  const [items, results] = await Promise.all([
    questApi.examPackItems(pack.slug).catch(() => []),
    questApi.examPackResults(pack.slug).catch(() => null),
  ]);
  return (
    <QuestPage variant="wide">
      <QuestPageHeader eyebrow="Pack detail" title={pack.title} copy={pack.description || pack.exam_type} />
      <div className="quest-metric-grid">
        <TeacherMetric label="Tests" value={items.length} />
        <TeacherMetric label="Questions" value={items.reduce((sum, item) => sum + item.question_count, 0)} />
        <TeacherMetric label="Usage" value={results?.attempts ?? 0} />
        <TeacherMetric label="Students" value={results?.students_submitted ?? 0} />
        <TeacherMetric label="Average" value={`${results?.average_score ?? 0}%`} />
        <TeacherMetric label="Status" value={pack.is_active ? "published" : "draft"} />
      </div>
      <Card className="p-5"><TeacherSectionHeader title="Tests" /><div className="mt-4 quest-card-grid-3">{items.map((item) => <GenericEntityCard key={item.id} title={item.title} href={`${base}/${pack.slug}`} meta={`${item.difficulty} / ${item.question_count} questions`} stats={[{ label: "Order", value: item.order }, { label: "Required", value: item.is_required ? "yes" : "no" }]} />)}{!items.length ? <QuestEmptyState title="No tests in pack" /> : null}</div></Card>
    </QuestPage>
  );
}

export function ReportsPage({ role = "Admin" }: { role?: string }) {
  return (
    <PanelShell eyebrow={role} title="Reports" copy="Xatoliklar, savol reportlari va performance exportlar shu yerda yig'iladi.">
      <ReportsEmpty />
    </PanelShell>
  );
}

export function SettingsPage({ role = "Admin" }: { role?: string }) {
  return (
    <PanelShell eyebrow={role} title="Settings" copy="Account, permission va platforma sozlamalari.">
      <Section title="MVP settings">
        <CardGrid cards={[
          { title: "Profile", href: "/profile", meta: "Account settings", copy: "Username, phone va active role." },
          { title: "Access", href: "/profile", meta: "Role permissions", copy: "Admin role switch, school/teacher/student permissions." },
          { title: "Data export", href: "#", meta: "Soon", copy: "PDF/Excel export keyingi bosqichda ulanadi." },
        ]} />
      </Section>
    </PanelShell>
  );
}

export async function CreatorDashboardPage() {
  const data = await baseData();
  const results = await packResults(data.packs);
  const validResults = results.filter((item): item is ApiExamPackResults => Boolean(item));
  const usage = results.reduce((sum, item) => sum + (item?.attempts ?? 0), 0);
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
      <QuestPageHeader
        eyebrow="Creator"
        title="Content dashboard"
        copy="Pack quality, usage and publish readiness for your assessment content."
        actions={<Button asChild><Link href="/creator/add-pack">Create pack</Link></Button>}
      />
      <div className="quest-metric-grid">
        <TeacherMetric label="Packs" value={data.packs.length} />
        <TeacherMetric label="Tests" value={data.tests.length} />
        <TeacherMetric label="Questions" value={data.questions.length} />
        <TeacherMetric label="Published tests" value={data.tests.filter((item) => item.status === "published").length} />
        <TeacherMetric label="Draft tests" value={data.tests.filter((item) => item.status === "draft").length} />
        <TeacherMetric label="Total usage" value={usage} />
      </div>
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
      <QuestPageHeader eyebrow="Creator" title="Packs" copy="Manage pack publishing, usage and editing workflow." actions={<Button asChild><Link href="/creator/add-pack">Create pack</Link></Button>} />
      <CreatorPacksManager initialPacks={packs} usageBySlug={usageBySlug} />
    </QuestPage>
  );
}

export async function CreatorTestsPage() {
  const tests = await questApi.tests();
  const published = tests.filter((test) => test.status === "published");
  const draft = tests.filter((test) => test.status === "draft");
  return (
    <QuestPage variant="wide">
      <QuestPageHeader eyebrow="Creator" title="Tests" copy="Review draft tests, published tests and edit readiness." />
      <div className="quest-metric-grid">
        <TeacherMetric label="All tests" value={tests.length} />
        <TeacherMetric label="Published" value={published.length} />
        <TeacherMetric label="Draft" value={draft.length} />
        <TeacherMetric label="Questions linked" value={tests.reduce((sum, test) => sum + test.test_questions.length, 0)} />
      </div>
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
      <QuestPageHeader eyebrow="Creator" title="Question bank" copy="Question inventory by topic, skill and difficulty." />
      <div className="quest-metric-grid">
        <TeacherMetric label="Questions" value={questions.length} />
        <TeacherMetric label="Topics" value={topicRows.length} />
        <TeacherMetric label="Skills tagged" value={questions.filter((q) => q.skill_titles.length).length} />
        <TeacherMetric label="Needs tags" value={questions.filter((q) => !q.skill_titles.length).length} />
      </div>
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
      <QuestPageHeader
        eyebrow="Creator"
        title={test.title}
        copy={`${test.subject_slug} / ${test.topic_slug} / ${test.difficulty}`}
        actions={<Button asChild variant="secondary"><Link href="/creator/tests">Back to tests</Link></Button>}
      />
      <div className="quest-metric-grid">
        <TeacherMetric label="Questions" value={test.test_questions.length} />
        <TeacherMetric label="Time limit" value={`${test.estimated_minutes} min`} />
        <TeacherMetric label="Passing score" value={`${test.passing_score}%`} />
        <TeacherMetric label="Status" value={test.status} />
      </div>
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
  const questions = await questApi.questions();
  const question = questions.find((item) => String(item.id) === questionId);
  if (!question) notFound();
  return (
    <QuestPage variant="reading">
      <QuestPageHeader
        eyebrow="Creator"
        title="Question editor"
        copy={`${question.type} / ${question.difficulty}`}
        actions={<Button asChild variant="secondary"><Link href="/creator/questions">Back to questions</Link></Button>}
      />
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

export async function SchoolHomePage() {
  const school = await firstSchool();
  const [analytics, classes, teachers] = await Promise.all([
    questApi.schoolAnalytics(school.slug).catch(() => null),
    questApi.schoolClasses(school.slug).catch(() => []),
    questApi.schoolTeachers(school.slug).catch(() => []),
  ]);
  const classRows = (analytics?.classes ?? []).map((item) => ({ label: item.class_name, value: item.average_score, meta: `${item.students_submitted} students` })).slice(0, 8);
  const weakRows = (analytics?.weak_skills ?? []).map((item) => ({ label: item.skill, value: item.percent, meta: `${item.total} questions` })).slice(0, 6);
  const teacherRows = (analytics?.teachers ?? []).slice(0, 5);
  return (
    <QuestPage variant="dashboard">
      <QuestPageHeader eyebrow="School" title={school.name} copy="School performance, class health and teacher activity." />
      <div className="quest-metric-grid">
        <TeacherMetric label="Classes" value={classes.length} />
        <TeacherMetric label="Teachers" value={teachers.length} />
        <TeacherMetric label="Students submitted" value={analytics?.students_submitted ?? 0} />
        <TeacherMetric label="Average score" value={`${analytics?.average_score ?? 0}%`} />
        <TeacherMetric label="Sessions" value={analytics?.classes.reduce((sum, item) => sum + item.sessions_total, 0) ?? 0} />
      </div>
      <div className="quest-main-aside-grid">
        <div className="grid gap-5">
          <Card className="p-5"><TeacherSectionHeader title="Class performance" action={<Button asChild variant="secondary" size="sm"><Link href="/school/classes">All classes</Link></Button>} /><div className="mt-4"><TopicBreakdownChart rows={classRows} color="var(--chart-1)" /></div></Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Teacher activity" action={<Button asChild variant="secondary" size="sm"><Link href="/school/teachers">All teachers</Link></Button>} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {teacherRows.map((teacher) => (
                <Link key={teacher.teacher_id} href={`/school/teachers/${teacher.teacher_id}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="font-semibold">{teacher.teacher_name}</h3><p className="mt-1 text-sm text-muted">{teacher.email || "No email"}</p></div>
                    <Badge variant={teacher.is_active ? "success" : "default"}>{teacher.is_active ? "active" : "inactive"}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2"><MiniInfo label="Classes" value={teacher.class_count} /><MiniInfo label="Attempts" value={teacher.attempts} /><MiniInfo label="Avg" value={`${teacher.average_score}%`} /></div>
                </Link>
              ))}
              {!teacherRows.length ? <QuestEmptyState title="No teacher activity yet" /> : null}
            </div>
          </Card>
        </div>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5"><TeacherSectionHeader title="Weak skills" /><div className="mt-4">{weakRows.length ? <WeakTopicBars rows={weakRows} /> : <QuestEmptyState title="No weak skills yet" />}</div></Card>
          <Card className="p-5"><TeacherSectionHeader title="Portal" /><div className="mt-4 grid gap-3"><MiniInfo label="Visibility" value={school.visibility} /><MiniInfo label="Teachers" value={school.teacher_count} /><MiniInfo label="Invite" value={school.student_invite_code || "Not set"} /></div></Card>
        </aside>
      </div>
    </QuestPage>
  );
}

export async function SchoolClassesPage() {
  const school = await firstSchool();
  const classes = await questApi.schoolClasses(school.slug);
  const results = await classResults(classes);
  const validResults = results.filter((item): item is ApiClassResults => Boolean(item));
  return (
    <QuestPage variant="wide">
      <QuestPageHeader eyebrow="School" title="Classes" copy="Class roster, score averages and weak topic signals." />
      <div className="quest-metric-grid">
        <TeacherMetric label="Classes" value={classes.length} />
        <TeacherMetric label="Students" value={classes.reduce((sum, item) => sum + item.student_count, 0)} />
        <TeacherMetric label="Assignments" value={classes.reduce((sum, item) => sum + item.assignment_count, 0)} />
        <TeacherMetric label="Average score" value={`${average(validResults.map((item) => item.average_score))}%`} />
      </div>
      <Card className="p-5"><TeacherSectionHeader title="Class workspaces" /><div className="mt-4 quest-card-grid-3">{classes.map((item) => <SchoolClassCard key={item.id} classroom={item} result={validResults.find((row) => row.classroom.slug === item.slug)} />)}{!classes.length ? <QuestEmptyState title="No classes yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function SchoolTeachersPage() {
  const school = await firstSchool();
  const teachers = await questApi.schoolTeachers(school.slug);
  return (
    <QuestPage variant="wide">
      <QuestPageHeader eyebrow="School" title="Teachers" copy="Teacher roster, activity status and class ownership." />
      <div className="quest-metric-grid">
        <TeacherMetric label="Teachers" value={teachers.length} />
        <TeacherMetric label="Active" value={teachers.filter((item) => item.is_active).length} />
        <TeacherMetric label="Classes owned" value={teachers.reduce((sum, item) => sum + item.class_count, 0)} />
        <TeacherMetric label="Unassigned" value={teachers.filter((item) => !item.class_count).length} />
      </div>
      <Card className="p-5"><TeacherSectionHeader title="Teacher directory" /><div className="mt-4 quest-card-grid-3">{teachers.map((teacher) => <SchoolTeacherCard key={teacher.id} teacher={teacher} />)}{!teachers.length ? <QuestEmptyState title="No teachers yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function SchoolStudentsPage() {
  const school = await firstSchool();
  const classes = await questApi.schoolClasses(school.slug);
  const results = await classResults(classes);
  const students = results.flatMap((result) => result?.student_progress.map((student) => ({ ...student, className: result.classroom.name, classSlug: result.classroom.slug })) ?? []);
  return (
    <QuestPage variant="table">
      <QuestPageHeader eyebrow="School" title="Students" copy="Student progress across school classes." />
      <div className="quest-metric-grid">
        <TeacherMetric label="Students" value={students.length} />
        <TeacherMetric label="Classes" value={classes.length} />
        <TeacherMetric label="Average score" value={`${average(students.map((item) => item.average_score))}%`} />
        <TeacherMetric label="Needs review" value={students.filter((item) => item.average_score < 70).length} />
      </div>
      <Card className="p-5">
        <TeacherSectionHeader title="Student table" />
        <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line">
          <div className="grid grid-cols-[1fr_1fr_120px_120px_180px] gap-3 border-b border-line bg-surface-soft px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle max-lg:hidden"><span>Student</span><span>Class</span><span>Completed</span><span>Average</span><span>Last submit</span></div>
          {students.map((student) => (
            <Link key={`${student.classSlug}-${student.student_code}`} href={`/school/students/${student.student_code}`} className="grid gap-3 border-b border-line px-4 py-4 hover:bg-surface-soft lg:grid-cols-[1fr_1fr_120px_120px_180px] lg:items-center">
              <div><p className="font-semibold">{student.student_name}</p><p className="mt-1 text-xs text-muted">{student.student_code}</p></div>
              <p className="text-sm text-muted">{student.className}</p><p className="text-sm text-muted">{student.completed} tests</p><Badge variant={student.average_score >= 70 ? "success" : "warning"}>{student.average_score}%</Badge><p className="text-sm text-muted">{student.last_submitted_at ? new Date(student.last_submitted_at).toLocaleString() : "No submit"}</p>
            </Link>
          ))}
          {!students.length ? <div className="p-5"><QuestEmptyState title="No student results yet" /></div> : null}
        </div>
      </Card>
    </QuestPage>
  );
}

export async function TeacherHomePage() {
  const classes = await questApi.classes();
  const results = await classResults(classes);
  const validResults = results.filter((item): item is ApiClassResults => Boolean(item));
  const students = new Set(results.flatMap((item) => item?.student_progress.map((student) => student.student_code) ?? [])).size;
  const activeSessions = validResults.reduce((sum, item) => sum + item.sessions_open, 0);
  const avgScore = average(validResults.map((item) => item.average_score));
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
      <QuestPageHeader
        eyebrow="Teacher"
        title="Teacher dashboard"
        copy="Class activity, weak topics and recent submissions in one workspace."
        actions={<Button asChild><Link href="/teacher/classes">Create or manage class</Link></Button>}
      />
      <div className="quest-metric-grid">
        <TeacherMetric label="Classes" value={classes.length} />
        <TeacherMetric label="Students" value={students} />
        <TeacherMetric label="Open sessions" value={activeSessions} />
        <TeacherMetric label="Average score" value={`${avgScore}%`} />
      </div>
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
                <Link key={row.session_id} href={`/results/${row.session_id}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-3 hover:bg-surface-soft">
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
      <QuestPageHeader eyebrow="Teacher" title="Results" copy="Class, test, student and score history for report review." />
      <div className="quest-metric-grid">
        <TeacherMetric label="Submitted results" value={rows.length} />
        <TeacherMetric label="Classes" value={classes.length} />
        <TeacherMetric label="Average score" value={`${average(rows.map((row) => row.score))}%`} />
        <TeacherMetric label="Weak topics" value={weakRows.length} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-5">
          <TeacherSectionHeader title="Results table" />
          <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line">
            <div className="grid grid-cols-[1.1fr_1fr_1fr_100px_110px] gap-3 border-b border-line bg-surface-soft px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle max-lg:hidden">
              <span>Student</span><span>Class</span><span>Test</span><span>Correct</span><span>Score</span>
            </div>
            {rows.map((row) => (
              <Link key={row.session_id} href={`/results/${row.session_id}`} className="grid gap-3 border-b border-line px-4 py-4 hover:bg-surface-soft lg:grid-cols-[1.1fr_1fr_1fr_100px_110px] lg:items-center">
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

export async function StudentTestsPage() {
  const [tests, packs] = await Promise.all([questApi.tests(), questApi.examPacks()]);
  return (
    <PanelShell eyebrow="Student" title="Tests" copy="Assigned, in progress, completed va available testlar.">
      <Section title="Packlar">
        <CardGrid cards={packs.filter((pack) => pack.is_active).map((pack) => packCard(pack, `/exam-packs/${pack.slug}`))} />
      </Section>
      <Section title="Available tests">
        <CardGrid cards={tests.filter((test) => test.status === "published").map((test) => testCard(test, `/student/tests/${test.slug}`))} />
      </Section>
    </PanelShell>
  );
}

export async function StudentTestDetailPage({ testId }: { testId: string }) {
  const tests = await questApi.tests();
  const test = byIdOrSlug(tests, testId);
  if (!test) notFound();
  return (
    <PanelShell eyebrow="Student test" title={test.title} copy={`${test.subject_slug} / ${test.topic_slug}`}>
      <StatsGrid stats={[
        { label: "Questions", value: test.test_questions.length },
        { label: "Time limit", value: `${test.estimated_minutes} min` },
        { label: "Difficulty", value: test.difficulty },
        { label: "Attempts allowed", value: "1+" },
      ]} />
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/tests/${test.slug}/start`} className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">Start test</Link>
        <Link href={`/tests/${test.slug}`} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold">Instructions</Link>
      </div>
    </PanelShell>
  );
}

export async function StudentProgressPage() {
  const summary = await questApi.profileSummary();
  return (
    <PanelShell eyebrow="Student" title="Progress" copy="Average score trend, topic mastery va completed testlar.">
      <StatsGrid stats={[
        { label: "Average score", value: `${summary.average_score}%` },
        { label: "Completed tests", value: summary.tests_taken },
        { label: "Answered questions", value: summary.answered_questions },
        { label: "Correct answers", value: summary.correct_answers },
      ]} />
      <Section title="Topic mastery">
        <CardGrid cards={summary.topic_progress.map((topic) => ({ title: topic.topic, href: "/student/mistakes", meta: `${topic.attempts} attempts`, stats: [{ label: "Mastery", value: `${topic.value}%` }] }))} />
      </Section>
      <Section title="Recent tests">
        <CardGrid cards={summary.recent_tests.map((test) => ({ title: test.title, href: `/results/${test.id}`, meta: test.topic, stats: [{ label: "Score", value: `${test.score}%` }, { label: "Correct", value: `${test.correct}/${test.total}` }] }))} />
      </Section>
    </PanelShell>
  );
}

async function firstSchool() {
  const schools = await questApi.schools();
  const school = schools[0];
  if (!school) notFound();
  return school;
}

function testCard(test: ApiTest, href: string, used = 0): Card {
  return {
    title: test.title,
    href,
    meta: `${test.subject_slug} / ${test.topic_slug}`,
    status: test.status,
    stats: [
      { label: "Questions", value: test.test_questions.length },
      { label: "Difficulty", value: test.difficulty },
      { label: "Used", value: used },
    ],
  };
}

function packCard(pack: ApiExamPack, href: string, usage = 0): Card {
  return {
    title: pack.title,
    href,
    meta: pack.exam_type || "Pack",
    copy: pack.description,
    status: pack.is_active ? "published" : "draft",
    stats: [
      { label: "Tests", value: pack.item_count },
      { label: "Usage", value: usage },
      { label: "Visibility", value: pack.visibility },
    ],
  };
}

function PanelShell({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy?: string; children: React.ReactNode }) {
  return (
    <PremiumPage>
      <PremiumPanel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
        {copy ? <p className="mt-3 max-w-3xl text-sm leading-6 text-black/58">{copy}</p> : null}
      </PremiumPanel>
      <div className="mt-6 grid gap-6">{children}</div>
    </PremiumPage>
  );
}

function StatsGrid({ stats }: { stats: Stat[] }) {
  const icons = [Building2, UsersRound, GraduationCap, BookOpenCheck, PackageCheck, BarChart3, FileWarning, Settings];
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = icons[index % icons.length];
        return (
          <div key={stat.label} className="rounded-2xl border border-black/8 bg-white p-4 shadow-[0_12px_34px_rgba(21,23,19,0.04)]">
            <Icon className="size-5 text-brand" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
          </div>
        );
      })}
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PremiumPanel>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </PremiumPanel>
  );
}

function CardGrid({ cards }: { cards: Card[] }) {
  if (!cards.length) return <EmptyState />;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Link key={`${card.href}-${card.title}`} href={card.href} className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_14px_42px_rgba(21,23,19,0.04)] hover:bg-surface-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold"><LatexText text={card.title} /></h3>
              {card.meta ? <p className="mt-1 text-sm text-black/50"><LatexText text={card.meta} /></p> : null}
            </div>
            {card.status ? <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">{card.status}</span> : null}
          </div>
           {card.copy ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-black/55"><LatexText text={card.copy} /></p> : null}
          {card.stats?.length ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {card.stats.slice(0, 4).map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-surface-soft px-3 py-3">
                  <p className="truncate text-sm font-semibold"><LatexText text={String(stat.value)} /></p>
                  <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-black/35">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

function TeacherMetric({ label, value }: { label: string; value: string | number }) {
  return <StatCard label={label} value={value} />;
}

function TeacherSectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return <SectionHeader title={title} actions={action} />;
}

function TeacherClassSummary({ result }: { result: ApiClassResults }) {
  const weakSkill = result.weak_skills[0];
  return (
    <Link href={`/teacher/classes/${result.classroom.slug}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-base font-semibold">{result.classroom.name}</h3>
          <p className="mt-1 text-sm text-muted">{result.students_submitted}/{result.students_total || result.students_submitted} submitted</p>
        </div>
        <Badge variant={result.average_score >= 70 ? "success" : "warning"}>{result.average_score}%</Badge>
      </div>
      <p className="mt-3 line-clamp-1 text-sm text-muted">Weakest: {weakSkill?.skill ?? "No data"}</p>
    </Link>
  );
}

function CreatorPackSummary({ pack, usage }: { pack: ApiExamPack; usage?: ApiExamPackResults }) {
  return (
    <Link href={`/creator/packs/${pack.slug}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-base font-semibold">{pack.title}</h3>
          <p className="mt-1 text-sm text-muted">{pack.exam_type || "Pack"} / {pack.item_count} tests</p>
        </div>
        <Badge variant={pack.is_active ? "success" : "default"}>{pack.is_active ? "published" : "inactive"}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniInfo label="Usage" value={usage?.attempts ?? 0} />
        <MiniInfo label="Students" value={usage?.students_submitted ?? 0} />
        <MiniInfo label="Avg" value={`${usage?.average_score ?? 0}%`} />
      </div>
    </Link>
  );
}

function CreatorTestRow({ test, href }: { test: ApiTest; href: string }) {
  return (
    <Link href={href} className="rounded-[var(--radius-card)] border border-line bg-surface p-3 hover:bg-surface-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="line-clamp-1 text-sm font-semibold">{test.title}</p>
        <Badge variant={test.status === "published" ? "success" : "default"}>{test.status}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted">{test.subject_slug} / {test.topic_slug} / {test.test_questions.length} questions</p>
    </Link>
  );
}

function CreatorTestCard({ test }: { test: ApiTest }) {
  return (
    <Link href={`/creator/tests/${test.slug}/edit`} className="quest-card flex min-h-[150px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{test.title}</h3>
          <p className="mt-1 text-sm text-muted">{test.subject_slug} / {test.topic_slug}</p>
        </div>
        <Badge variant={test.status === "published" ? "success" : "default"}>{test.status}</Badge>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs font-semibold text-subtle">
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.test_questions.length} questions</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.estimated_minutes} min</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.difficulty}</span>
      </div>
    </Link>
  );
}

function GenericEntityCard({ title, href, meta, copy, stats = [], status }: Card) {
  return <QuestEntityCard title={<LatexText text={title} />} href={href} meta={meta ? <LatexText text={meta} /> : copy ? <LatexText text={copy} /> : undefined} status={status} stats={stats.map((stat) => `${stat.label}: ${stat.value}`)} />;
}

function AdminSchoolCard({ school }: { school: ApiSchool }) {
  return (
    <Link href={`/admin/schools/${school.slug}`} className="quest-card flex min-h-[165px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{school.name}</h3>
          <p className="mt-1 text-sm text-muted">{school.owner_name || "No owner"}</p>
        </div>
        <Badge variant={school.visibility === "public" ? "success" : "default"}>{school.visibility}</Badge>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{school.description || school.portal_domain || school.portal_subdomain || "No description"}</p>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <MiniInfo label="Teachers" value={school.teacher_count} />
        <MiniInfo label="Invite" value={school.student_invite_code || "Not set"} />
      </div>
    </Link>
  );
}

function AdminClassCard({ classroom, result }: { classroom: ApiTeacherClass; result?: ApiClassResults }) {
  return (
    <Link href={`/admin/classes/${classroom.slug}`} className="quest-card flex min-h-[160px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{classroom.name}</h3>
          <p className="mt-1 text-sm text-muted">{classroom.teacher_name}</p>
        </div>
        <Badge variant={result && result.average_score >= 70 ? "success" : "warning"}>{result ? `${result.average_score}%` : "No data"}</Badge>
      </div>
      <p className="mt-3 line-clamp-1 text-sm text-muted">Weakest: {result?.weak_skills[0]?.skill ?? "No weak topic yet"}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs font-semibold text-subtle">
        <span className="rounded-lg bg-surface-soft px-2 py-1">{classroom.student_count} students</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{classroom.assignment_count} assignments</span>
      </div>
    </Link>
  );
}

function AdminTestCard({ test, used }: { test: ApiTest; used: number }) {
  return (
    <Link href={`/admin/tests/${test.slug}`} className="quest-card flex min-h-[150px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{test.title}</h3>
          <p className="mt-1 text-sm text-muted">{test.subject_slug} / {test.topic_slug}</p>
        </div>
        <Badge variant={test.status === "published" ? "success" : "default"}>{test.status}</Badge>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs font-semibold text-subtle">
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.test_questions.length} questions</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{used} assignments</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{test.difficulty}</span>
      </div>
    </Link>
  );
}

function AdminPackCard({ pack, result }: { pack: ApiExamPack; result?: ApiExamPackResults }) {
  return (
    <Link href={`/admin/packs/${pack.slug}`} className="quest-card flex min-h-[165px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{pack.title}</h3>
          <p className="mt-1 text-sm text-muted">{pack.exam_type || "Pack"}</p>
        </div>
        <Badge variant={pack.is_active ? "success" : "default"}>{pack.is_active ? "published" : "draft"}</Badge>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
        <MiniInfo label="Tests" value={pack.item_count} />
        <MiniInfo label="Usage" value={result?.attempts ?? 0} />
        <MiniInfo label="Avg" value={`${result?.average_score ?? 0}%`} />
      </div>
    </Link>
  );
}

function SchoolClassCard({ classroom, result }: { classroom: ApiTeacherClass; result?: ApiClassResults }) {
  return (
    <Link href={`/school/classes/${classroom.slug}`} className="quest-card flex min-h-[160px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{classroom.name}</h3>
          <p className="mt-1 text-sm text-muted">{classroom.teacher_name}</p>
        </div>
        <Badge variant={result && result.average_score >= 70 ? "success" : "warning"}>{result ? `${result.average_score}%` : "No data"}</Badge>
      </div>
      <p className="mt-3 line-clamp-1 text-sm text-muted">Weakest: {result?.weak_skills[0]?.skill ?? "No weak topic yet"}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs font-semibold text-subtle">
        <span className="rounded-lg bg-surface-soft px-2 py-1">{classroom.student_count} students</span>
        <span className="rounded-lg bg-surface-soft px-2 py-1">{classroom.assignment_count} assignments</span>
      </div>
    </Link>
  );
}

function SchoolTeacherCard({ teacher }: { teacher: { id: number; name: string; email: string; teacher_code: string; class_count: number; is_active: boolean } }) {
  return (
    <Link href={`/school/teachers/${teacher.id}`} className="quest-card flex min-h-[150px] flex-col p-4 hover:bg-surface-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold">{teacher.name}</h3>
          <p className="mt-1 text-sm text-muted">{teacher.email || teacher.teacher_code}</p>
        </div>
        <Badge variant={teacher.is_active ? "success" : "default"}>{teacher.is_active ? "active" : "inactive"}</Badge>
      </div>
      <div className="mt-auto pt-4"><MiniInfo label="Classes" value={teacher.class_count} /></div>
    </Link>
  );
}

function MiniInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-control)] bg-surface-soft px-3 py-2">
      <p className="text-sm font-semibold">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
    </div>
  );
}

function ReportsEmpty() {
  return (
    <Section title="Recent reports/issues">
      <CardGrid cards={[
        { title: "Question reports", href: "/admin/reports/question-reports", meta: "MVP empty state", copy: "Report modeli ulanganda savol/test bo'yicha xatoliklar shu yerda chiqadi.", status: "ready" },
        { title: "Platform issues", href: "/admin/reports/platform-issues", meta: "MVP empty state", copy: "User feedback va shikoyatlar uchun alohida model keyingi bosqichda ulanadi.", status: "ready" },
      ]} />
    </Section>
  );
}

function EmptyState() {
  return <p className="rounded-2xl border border-dashed border-black/12 bg-white p-6 text-sm text-black/55">Hozircha ma&apos;lumot yo&apos;q.</p>;
}
