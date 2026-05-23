import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, BookOpenCheck, Building2, FileWarning, GraduationCap, PackageCheck, Settings, UsersRound } from "lucide-react";

import type { ApiExamPack, ApiSchool, ApiTeacherClass, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { PremiumPage, PremiumPanel } from "@/shared/ui/premium-shell";

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
  const students = new Set(classStats.flatMap((item) => item?.student_progress.map((student) => student.student_code) ?? [])).size;
  const teachers = new Set(data.classes.map((item) => item.teacher_name).filter(Boolean)).size + data.schools.reduce((sum, school) => sum + school.teacher_count, 0);
  const activeSessions = data.sessions.filter((item) => item.status === "in_progress").length;
  const completedToday = data.sessions.filter((item) => item.status === "submitted").length;
  return (
    <PanelShell eyebrow="Admin" title="Platforma dashboard" copy="Butun platforma bo'yicha school, class, test, pack va sessionlar nazorati.">
      <StatsGrid stats={[
        { label: "Schools", value: data.schools.length },
        { label: "Teachers", value: teachers },
        { label: "Students", value: students },
        { label: "Classes", value: data.classes.length },
        { label: "Tests", value: data.tests.length },
        { label: "Packs", value: data.packs.length },
        { label: "Active sessions", value: activeSessions },
        { label: "Tests completed today", value: completedToday },
      ]} />
      <TwoColumns
        leftTitle="Recently added schools"
        left={<CardGrid cards={data.schools.slice(0, 6).map((school) => schoolCard(school, `/admin/schools/${school.slug}`))} />}
        rightTitle="Top used packs"
        right={<CardGrid cards={data.packs.slice(0, 6).map((pack) => {
          const result = packStats.find((item) => item?.pack.slug === pack.slug);
          return packCard(pack, `/admin/packs/${pack.slug}`, result?.attempts ?? 0);
        })} />}
      />
      <Section title="Most active teachers">
        <CardGrid cards={classStats.filter((item) => item !== null).slice(0, 6).map((item) => ({
          title: item.classroom.teacher_name,
          href: `/admin/classes/${item.classroom.slug}`,
          meta: item.classroom.name,
          stats: [
            { label: "Attempts", value: item.attempts },
            { label: "Average", value: `${item.average_score}%` },
          ],
        }))} />
      </Section>
      <ReportsEmpty />
    </PanelShell>
  );
}

export async function AdminSchoolsPage() {
  const schools = await questApi.schools();
  return (
    <PanelShell eyebrow="Admin" title="Schools" copy="Barcha school va o'quv markazlar ro'yxati.">
      <CardGrid cards={schools.map((school) => schoolCard(school, `/admin/schools/${school.slug}`))} />
    </PanelShell>
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
    <PanelShell eyebrow="Admin school" title={school.name} copy={school.description || "School overview, teachers, classes, students and reports."}>
      <StatsGrid stats={[
        { label: "Owner", value: school.owner_name || "No owner" },
        { label: "Plan", value: "Free" },
        { label: "Active teachers", value: analytics?.teacher_count ?? teachers.length },
        { label: "Active students", value: analytics?.students_submitted ?? 0 },
        { label: "Total sessions", value: analytics?.attempts ?? 0 },
        { label: "Average score", value: `${analytics?.average_score ?? 0}%` },
      ]} />
      <Section title="Teachers">
        <CardGrid cards={teachers.map((teacher) => ({
          title: teacher.name,
          href: `/admin/teachers/${teacher.id}`,
          meta: teacher.email || teacher.teacher_code,
          stats: [{ label: "Classes", value: teacher.class_count }, { label: "Status", value: teacher.is_active ? "active" : "inactive" }],
        }))} />
      </Section>
      <Section title="Classes">
        <CardGrid cards={classes.map((item) => classCard(item, `/admin/classes/${item.slug}`))} />
      </Section>
    </PanelShell>
  );
}

export async function AdminClassesPage() {
  const classes = await questApi.classes();
  const results = await classResults(classes);
  return (
    <PanelShell eyebrow="Admin" title="Classes" copy="Platformadagi barcha classlar.">
      <CardGrid cards={classes.map((item) => {
        const result = results.find((row) => row?.classroom.slug === item.slug);
        return classCard(item, `/admin/classes/${item.slug}`, result?.average_score ?? 0, result?.weak_skills[0]?.skill);
      })} />
    </PanelShell>
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
    <PanelShell eyebrow="Class detail" title={classroom.name} copy={`${classroom.teacher_name} classi bo'yicha natija va o'quvchilar.`}>
      <StatsGrid stats={[
        { label: "Teacher", value: classroom.teacher_name },
        { label: "Students", value: students.length || classroom.student_count },
        { label: "Active sessions", value: results?.sessions_open ?? 0 },
        { label: "Average score", value: `${results?.average_score ?? 0}%` },
        { label: "Weakest topic", value: results?.weak_skills[0]?.skill ?? "No data" },
        { label: "Status", value: classroom.visibility },
      ]} />
      <Section title="Student list">
        <CardGrid cards={studentCards} />
      </Section>
    </PanelShell>
  );
}

export async function AdminTestsPage() {
  const [tests, classes] = await Promise.all([questApi.tests(), questApi.classes()]);
  const results = await classResults(classes);
  return (
    <PanelShell eyebrow="Admin" title="Tests" copy="Subject, topic, difficulty, creator va status bo'yicha testlar.">
      <CardGrid cards={tests.map((test) => {
        const used = results.reduce((sum, item) => sum + (item?.assignment_stats.filter((row) => row.test_slug === test.slug).length ?? 0), 0);
        return testCard(test, `/admin/tests/${test.slug}`, used);
      })} />
    </PanelShell>
  );
}

export async function AdminTestDetailPage({ testId }: { testId: string }) {
  const tests = await questApi.tests();
  const test = byIdOrSlug(tests, testId);
  if (!test) notFound();
  return (
    <PanelShell eyebrow="Test detail" title={test.title} copy={`${test.subject_slug} / ${test.topic_slug}`}>
      <StatsGrid stats={[
        { label: "Questions", value: test.test_questions.length },
        { label: "Difficulty", value: test.difficulty },
        { label: "Time limit", value: `${test.estimated_minutes} min` },
        { label: "Status", value: test.status },
        { label: "Creator", value: test.creator_name || "Unknown" },
        { label: "Passing score", value: `${test.passing_score}%` },
      ]} />
      <Section title="Questions preview">
        <CardGrid cards={test.test_questions.slice(0, 12).map((item) => ({
          title: item.question.prompt.slice(0, 80),
          href: `/questions/${item.question.id}`,
          meta: item.question.difficulty,
          copy: item.question.explanation,
        }))} />
      </Section>
    </PanelShell>
  );
}

export async function AdminPacksPage() {
  const packs = await questApi.examPacks();
  const results = await packResults(packs);
  return (
    <PanelShell eyebrow="Admin" title="Packs" copy="Barcha test packlar va usage.">
      <CardGrid cards={packs.map((pack) => {
        const result = results.find((item) => item?.pack.slug === pack.slug);
        return packCard(pack, `/admin/packs/${pack.slug}`, result?.attempts ?? 0);
      })} />
    </PanelShell>
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
    <PanelShell eyebrow="Pack detail" title={pack.title} copy={pack.description || pack.exam_type}>
      <StatsGrid stats={[
        { label: "Tests", value: items.length },
        { label: "Questions", value: items.reduce((sum, item) => sum + item.question_count, 0) },
        { label: "Usage", value: results?.attempts ?? 0 },
        { label: "Students", value: results?.students_submitted ?? 0 },
        { label: "Average", value: `${results?.average_score ?? 0}%` },
        { label: "Status", value: pack.is_active ? "published" : "draft" },
      ]} />
      <Section title="Tests">
        <CardGrid cards={items.map((item) => ({
          title: item.title,
          href: `${base}/${pack.slug}`,
          meta: `${item.difficulty} / ${item.question_count} questions`,
          stats: [{ label: "Order", value: item.order }, { label: "Required", value: item.is_required ? "yes" : "no" }],
        }))} />
      </Section>
    </PanelShell>
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
  const usage = results.reduce((sum, item) => sum + (item?.attempts ?? 0), 0);
  return (
    <PanelShell eyebrow="Creator" title="Content dashboard" copy="Pack, test, question va usage analitikasi.">
      <StatsGrid stats={[
        { label: "My packs", value: data.packs.length },
        { label: "My tests", value: data.tests.length },
        { label: "My questions", value: data.questions.length },
        { label: "Published content", value: data.tests.filter((item) => item.status === "published").length },
        { label: "Draft content", value: data.tests.filter((item) => item.status === "draft").length },
        { label: "Total usage", value: usage },
      ]} />
      <TwoColumns
        leftTitle="Recent packs"
        left={<CardGrid cards={data.packs.slice(0, 6).map((pack) => packCard(pack, `/creator/packs/${pack.slug}`, results.find((item) => item?.pack.slug === pack.slug)?.attempts ?? 0))} />}
        rightTitle="Draft tests"
        right={<CardGrid cards={data.tests.filter((item) => item.status === "draft").slice(0, 6).map((test) => testCard(test, `/creator/tests/${test.slug}/edit`))} />}
      />
    </PanelShell>
  );
}

export async function CreatorPacksPage() {
  const packs = await questApi.examPacks();
  const results = await packResults(packs);
  return (
    <PanelShell eyebrow="Creator" title="Packs" copy="Yaratilgan packlar, edit, preview, export va publish oqimi.">
      <CardGrid cards={packs.map((pack) => packCard(pack, `/creator/packs/${pack.slug}`, results.find((item) => item?.pack.slug === pack.slug)?.attempts ?? 0))} />
    </PanelShell>
  );
}

export async function CreatorTestsPage() {
  const tests = await questApi.tests();
  return (
    <PanelShell eyebrow="Creator" title="Tests" copy="Creator testlari va edit oynasi.">
      <CardGrid cards={tests.map((test) => testCard(test, `/creator/tests/${test.slug}/edit`))} />
    </PanelShell>
  );
}

export async function CreatorQuestionsPage() {
  const questions = await questApi.questions();
  return (
    <PanelShell eyebrow="Creator" title="Question bank" copy="Subject, topic, skill, difficulty va type bo'yicha savollar.">
      <CardGrid cards={questions.map((question) => ({
        title: question.prompt.slice(0, 90),
        href: `/creator/questions/${question.id}/edit`,
        meta: `${question.type} / ${question.difficulty}`,
        copy: question.skill_titles.join(", ") || question.explanation,
        status: "published",
      }))} />
    </PanelShell>
  );
}

export async function SchoolHomePage() {
  const school = await firstSchool();
  const [analytics, classes, teachers] = await Promise.all([
    questApi.schoolAnalytics(school.slug).catch(() => null),
    questApi.schoolClasses(school.slug).catch(() => []),
    questApi.schoolTeachers(school.slug).catch(() => []),
  ]);
  return (
    <PanelShell eyebrow="School" title={school.name} copy="School owner dashboard: classlar, teacherlar va umumiy natijalar.">
      <StatsGrid stats={[
        { label: "Classes", value: classes.length },
        { label: "Teachers", value: teachers.length },
        { label: "Students", value: analytics?.students_submitted ?? 0 },
        { label: "Average score", value: `${analytics?.average_score ?? 0}%` },
        { label: "Active sessions", value: analytics?.classes.reduce((sum, item) => sum + item.sessions_total, 0) ?? 0 },
      ]} />
      <TwoColumns
        leftTitle="Top classes"
        left={<CardGrid cards={classes.map((item) => classCard(item, `/school/classes/${item.slug}`)).slice(0, 6)} />}
        rightTitle="Recent teacher activity"
        right={<CardGrid cards={teachers.map((teacher) => ({ title: teacher.name, href: `/school/teachers/${teacher.id}`, meta: teacher.email, stats: [{ label: "Classes", value: teacher.class_count }] })).slice(0, 6)} />}
      />
    </PanelShell>
  );
}

export async function SchoolClassesPage() {
  const school = await firstSchool();
  const classes = await questApi.schoolClasses(school.slug);
  const results = await classResults(classes);
  return (
    <PanelShell eyebrow="School" title="Classes" copy="Schooldagi barcha classlar.">
      <CardGrid cards={classes.map((item) => classCard(item, `/school/classes/${item.slug}`, results.find((row) => row?.classroom.slug === item.slug)?.average_score ?? 0, results.find((row) => row?.classroom.slug === item.slug)?.weak_skills[0]?.skill))} />
    </PanelShell>
  );
}

export async function SchoolTeachersPage() {
  const school = await firstSchool();
  const teachers = await questApi.schoolTeachers(school.slug);
  return (
    <PanelShell eyebrow="School" title="Teachers" copy="Schooldagi barcha teacherlar.">
      <CardGrid cards={teachers.map((teacher) => ({ title: teacher.name, href: `/school/teachers/${teacher.id}`, meta: teacher.email || teacher.teacher_code, stats: [{ label: "Classes", value: teacher.class_count }, { label: "Status", value: teacher.is_active ? "active" : "inactive" }] }))} />
    </PanelShell>
  );
}

export async function SchoolStudentsPage() {
  const school = await firstSchool();
  const classes = await questApi.schoolClasses(school.slug);
  const results = await classResults(classes);
  return (
    <PanelShell eyebrow="School" title="Students" copy="Schooldagi barcha o'quvchilar va progress.">
      <CardGrid cards={results.flatMap((result) => result?.student_progress.map((student) => ({
        title: student.student_name,
        href: `/school/students/${student.student_code}`,
        meta: result.classroom.name,
        stats: [{ label: "Average", value: `${student.average_score}%` }, { label: "Tests", value: student.completed }],
      })) ?? [])} />
    </PanelShell>
  );
}

export async function TeacherHomePage() {
  const classes = await questApi.classes();
  const results = await classResults(classes);
  const students = new Set(results.flatMap((item) => item?.student_progress.map((student) => student.student_code) ?? [])).size;
  return (
    <PanelShell eyebrow="Teacher" title="Teacher dashboard" copy="Classlar, studentlar, active sessions va weak topiclar.">
      <StatsGrid stats={[
        { label: "My classes", value: classes.length },
        { label: "My students", value: students },
        { label: "Active sessions", value: results.reduce((sum, item) => sum + (item?.sessions_open ?? 0), 0) },
        { label: "Average score", value: `${average(results.map((item) => item?.average_score ?? 0))}%` },
      ]} />
      <TwoColumns
        leftTitle="Classes needing attention"
        left={<CardGrid cards={classes.map((item) => classCard(item, `/teacher/classes/${item.slug}`, results.find((row) => row?.classroom.slug === item.slug)?.average_score ?? 0, results.find((row) => row?.classroom.slug === item.slug)?.weak_skills[0]?.skill)).slice(0, 6)} />}
        rightTitle="Recent student mistakes"
        right={<CardGrid cards={results.flatMap((item) => item?.weak_skills.slice(0, 2).map((skill) => ({ title: skill.skill, href: "/mistakes", meta: item.classroom.name, stats: [{ label: "Mastery", value: `${skill.percent}%` }] })) ?? []).slice(0, 6)} />}
      />
    </PanelShell>
  );
}

export async function TeacherResultsPage() {
  const classes = await questApi.classes();
  const results = await classResults(classes);
  return (
    <PanelShell eyebrow="Teacher" title="Results" copy="Class, test, student, date va score bo'yicha natijalar.">
      <CardGrid cards={results.flatMap((result) => result?.results.map((row) => ({
        title: row.student_name,
        href: `/results/${row.session_id}`,
        meta: `${row.test_title} / ${result.classroom.name}`,
        stats: [{ label: "Score", value: `${row.score}%` }, { label: "Weak topic", value: result.weak_skills[0]?.skill ?? "No data" }],
      })) ?? [])} />
    </PanelShell>
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
        <Link href={`/tests/${test.slug}/start`} className="rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white">Start test</Link>
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

function schoolCard(school: ApiSchool, href: string): Card {
  return {
    title: school.name,
    href,
    meta: `Owner: ${school.owner_name || "No owner"}`,
    copy: school.description || school.portal_domain || school.portal_subdomain,
    status: school.visibility === "public" ? "active" : "trial",
    stats: [
      { label: "Plan", value: "Free" },
      { label: "Teachers", value: school.teacher_count },
      { label: "Monthly usage", value: "live" },
    ],
  };
}

function classCard(item: ApiTeacherClass, href: string, averageScore = 0, weakTopic = "No data"): Card {
  return {
    title: item.name,
    href,
    meta: `Teacher: ${item.teacher_name}`,
    copy: item.description,
    status: item.visibility,
    stats: [
      { label: "Students", value: item.student_count },
      { label: "Sessions", value: item.assignment_count },
      { label: "Average", value: `${averageScore}%` },
      { label: "Weak topic", value: weakTopic },
    ],
  };
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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">{eyebrow}</p>
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
            <Icon className="size-5 text-[#276a5b]" />
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

function TwoColumns({ leftTitle, left, rightTitle, right }: { leftTitle: string; left: React.ReactNode; rightTitle: string; right: React.ReactNode }) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Section title={leftTitle}>{left}</Section>
      <Section title={rightTitle}>{right}</Section>
    </section>
  );
}

function CardGrid({ cards }: { cards: Card[] }) {
  if (!cards.length) return <EmptyState />;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Link key={`${card.href}-${card.title}`} href={card.href} className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_14px_42px_rgba(21,23,19,0.04)] hover:bg-[#fbfbf6]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
              {card.meta ? <p className="mt-1 text-sm text-black/50">{card.meta}</p> : null}
            </div>
            {card.status ? <span className="rounded-full bg-[#edf7f3] px-3 py-1 text-xs font-semibold text-[#276a5b]">{card.status}</span> : null}
          </div>
          {card.copy ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-black/55">{card.copy}</p> : null}
          {card.stats?.length ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {card.stats.slice(0, 4).map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-[#fbfbf6] px-3 py-3">
                  <p className="truncate text-sm font-semibold">{stat.value}</p>
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
