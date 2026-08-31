import Link from "next/link";
import { notFound } from "next/navigation";

import type { ApiClassResults, ApiSchoolAnalytics } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { SchoolStudentDirectory, type SchoolStudentDirectoryRow } from "@/features/platform/ui/school-student-directory";
import { WeakTopicBars } from "@/components/questlab/charts/weak-topic-bars";
import { EmptyState as QuestEmptyState } from "@/components/questlab/feedback/empty-state";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SchoolClassCard, SchoolTeacherCard, TeacherSectionHeader, average, byIdOrSlug, classResults, classStudents, firstSchool, maxIsoDate, MiniInfo } from "@/features/platform/ui/panel-shared";

export async function SchoolHomePage() {
  const school = await firstSchool();
  const [analytics, classes, teachers] = await Promise.all([
    questApi.schoolAnalytics(school.slug).catch(() => null),
    questApi.schoolClasses(school.slug).catch(() => []),
    questApi.schoolTeachers(school.slug).catch(() => []),
  ]);
  const classRows = (analytics?.classes ?? []).slice(0, 8);
  const weakRows = (analytics?.weak_skills ?? []).slice(0, 8);
  const teacherRows = (analytics?.teachers ?? []).slice(0, 5);
  const activeTeacherCount = analytics?.teachers.filter((teacher) => teacher.is_active).length ?? teachers.filter((teacher) => teacher.is_active).length;
  const averageScore = analytics?.average_score ?? average(classRows.map((item) => item.average_score));
  const submittedStudents = analytics?.students_submitted ?? classRows.reduce((sum, item) => sum + item.students_submitted, 0);
  const attempts = analytics?.attempts ?? classRows.reduce((sum, item) => sum + item.attempts, 0);
  return (
    <QuestPage variant="wide">
      <div className="grid gap-5">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="border-line bg-surface p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">School Analytics</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{school.name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Classes, teachers, students and performance signals in one operational view.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm"><Link href="/school/classes">Classes</Link></Button>
                <Button asChild variant="secondary" size="sm"><Link href="/school/teachers">Teachers</Link></Button>
                <Button asChild variant="secondary" size="sm"><Link href="/school/students">Students</Link></Button>
              </div>
            </div>
            <SchoolMetricStrip
              metrics={[
                { label: "Teachers", value: analytics?.teacher_count ?? (teachers.length || school.teacher_count), note: `${activeTeacherCount} active`, tone: "neutral" },
                { label: "Classes", value: analytics?.class_count ?? classes.length, note: "workspaces", tone: "neutral" },
                { label: "Students", value: submittedStudents, note: "submitted", tone: "green" },
                { label: "Attempts", value: attempts, note: "sessions", tone: "amber" },
                { label: "Average", value: `${averageScore}%`, note: "score", tone: averageScore >= 70 ? "green" : averageScore ? "amber" : "neutral" },
              ]}
            />
          </Card>
          <SchoolHealthCard score={averageScore} attempts={attempts} students={submittedStudents} weakSkills={weakRows.length} />
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <main className="grid gap-5">
            <Card className="p-5">
              <TeacherSectionHeader title="Class performance terrain" action={<Button asChild variant="secondary" size="sm"><Link href="/school/classes">All classes</Link></Button>} />
              <div className="mt-4"><SchoolClassTerrain rows={classRows} /></div>
            </Card>
            <div className="grid gap-5 2xl:grid-cols-[1fr_0.95fr]">
              <Card className="p-5">
                <TeacherSectionHeader title="Class orbit map" />
                <div className="mt-4"><SchoolClassOrbit rows={classRows} /></div>
              </Card>
              <Card className="p-5">
                <TeacherSectionHeader title="Weak skill matrix" />
                <div className="mt-4"><SchoolWeakSkillMatrix rows={weakRows} /></div>
              </Card>
            </div>
            <Card className="p-5">
              <TeacherSectionHeader title="Teacher load board" action={<Button asChild variant="secondary" size="sm"><Link href="/school/teachers">All teachers</Link></Button>} />
              <div className="mt-4"><SchoolTeacherLoadBoard teachers={teacherRows} /></div>
            </Card>
          </main>
          <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
            <Card className="p-5">
              <TeacherSectionHeader title="Portal" />
              <div className="mt-4 grid gap-3">
                <MiniInfo label="Visibility" value={school.visibility} />
                <MiniInfo label="Teachers" value={school.teacher_count} />
                <MiniInfo label="Student invite" value={school.student_invite_code ? "set" : "Not set"} />
              </div>
            </Card>
            <Card className="p-5">
              <TeacherSectionHeader title="Fast actions" />
              <div className="mt-4 grid gap-2">
                <Button asChild><Link href="/school/classes">Open class diagnostics</Link></Button>
                <Button asChild variant="secondary"><Link href="/school/students">Student directory</Link></Button>
                <Button asChild variant="secondary"><Link href="/school/progress">Progress reports</Link></Button>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </QuestPage>
  );
}

type SchoolMetric = { label: string; value: string | number; note: string; tone: "green" | "amber" | "red" | "neutral" };
type SchoolClassAnalyticsRow = ApiSchoolAnalytics["classes"][number];
type SchoolWeakSkillRow = ApiSchoolAnalytics["weak_skills"][number];
type SchoolTeacherAnalyticsRow = ApiSchoolAnalytics["teachers"][number];

function SchoolMetricStrip({ metrics }: { metrics: SchoolMetric[] }) {
  return (
    <div className="mt-5 grid overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-soft sm:grid-cols-5">
      {metrics.map((metric) => (
        <div key={metric.label} className="border-b border-line px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-subtle">{metric.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${schoolToneClass(metric.tone)}`}>{metric.value}</p>
          <p className="mt-1 text-xs font-medium text-muted">{metric.note}</p>
        </div>
      ))}
    </div>
  );
}

function SchoolHealthCard({ score, attempts, students, weakSkills }: { score: number; attempts: number; students: number; weakSkills: number }) {
  const health = attempts ? Math.max(0, Math.min(100, Math.round(score - weakSkills * 2 + Math.min(10, students)))) : 0;
  const ring = Math.max(8, health) * 3.6;
  return (
    <Card className="border-[#263029] bg-[#11130f] p-5 text-white shadow-[var(--shadow-card)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Operational health</p>
      <div className="mt-4 grid grid-cols-[104px_1fr] gap-4">
        <div className="relative grid size-[104px] place-items-center rounded-full" style={{ background: `conic-gradient(var(--success) 0 ${ring}deg, rgba(255,255,255,.14) ${ring}deg 360deg)` }}>
          <span className="absolute inset-3 rounded-full border border-white/10 bg-[#151a15]" />
          <b className="relative text-2xl text-white">{health}%</b>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <DarkMetric label="Average" value={`${score}%`} />
          <DarkMetric label="Attempts" value={attempts} />
          <DarkMetric label="Students" value={students} />
          <DarkMetric label="Weak skills" value={weakSkills} />
        </div>
      </div>
    </Card>
  );
}

function DarkMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.065] p-3">
      <span className="block text-[10px] font-black uppercase tracking-[0.13em] text-white/45">{label}</span>
      <b className="mt-1 block text-lg text-white">{value}</b>
    </div>
  );
}

function SchoolClassTerrain({ rows }: { rows: SchoolClassAnalyticsRow[] }) {
  const data = rows.filter((row) => row.sessions_total || row.attempts || row.students_submitted).slice(0, 8);
  if (data.length < 2) return <SchoolCompactEmpty title="Class terrain needs at least two active classes." />;
  const points = data.map((row, index) => {
    const x = 6 + index * (88 / Math.max(1, data.length - 1));
    const y = 86 - Math.max(0, Math.min(100, row.average_score)) * 0.7;
    return { row, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${points.at(-1)?.x ?? 94} 92 L ${points[0]?.x ?? 6} 92 Z`;
  return (
    <div className="relative min-h-[340px] overflow-hidden rounded-[18px] border border-line bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px),var(--surface-soft)] bg-[size:100%_25%,12.5%_100%,auto] p-4">
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="schoolTerrainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--success)" stopOpacity=".24" />
            <stop offset=".55" stopColor="var(--chart-1)" stopOpacity=".15" />
            <stop offset="1" stopColor="var(--warning)" stopOpacity=".10" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#schoolTerrainFill)" />
        <path d={path} fill="none" stroke="var(--ink)" strokeOpacity=".55" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
        <line x1="0" x2="100" y1="37" y2="37" stroke="var(--warning)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="relative grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {points.map(({ row, y }) => (
          <Link key={row.class_id} href={`/school/classes/${row.class_slug}`} className="rounded-[var(--radius-card)] border border-line bg-surface/95 p-4 shadow-[0_10px_26px_rgba(20,23,19,.06)] hover:bg-surface-soft" style={{ transform: `translateY(${Math.max(-8, Math.min(14, y - 52))}px)` }}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 font-semibold">{row.class_name}</h3>
              <Badge variant={row.average_score >= 70 ? "success" : row.average_score ? "warning" : "default"}>{row.average_score}%</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">{row.teacher_name || "No teacher"}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniInfo label="Students" value={row.students_submitted} />
              <MiniInfo label="Attempts" value={row.attempts} />
              <MiniInfo label="Sessions" value={row.sessions_total} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SchoolClassOrbit({ rows }: { rows: SchoolClassAnalyticsRow[] }) {
  const data = rows.filter((row) => row.sessions_total || row.attempts || row.students_submitted).sort((a, b) => b.attempts - a.attempts).slice(0, 5);
  if (!data.length) return <SchoolCompactEmpty title="Class orbit appears after classes start submitting work." />;
  const positions = [{ left: 50, top: 50 }, { left: 24, top: 30 }, { left: 76, top: 31 }, { left: 26, top: 74 }, { left: 76, top: 73 }];
  return (
    <div className="relative h-[320px] overflow-hidden rounded-[18px] border border-line bg-[radial-gradient(circle_at_center,var(--surface)_0,transparent_25%),linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px),var(--surface-soft)] bg-[size:auto,100%_25%,25%_100%,auto]">
      <span className="absolute left-1/2 top-1/2 size-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line-strong" />
      <span className="absolute left-1/2 top-1/2 size-[138px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line" />
      {data.map((row, index) => {
        const position = positions[index] ?? positions[0];
        const size = index === 0 ? 88 : 64;
        return (
          <Link key={row.class_id} href={`/school/classes/${row.class_slug}`} className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 p-2 text-center text-white shadow-[0_14px_34px_rgba(20,23,19,.12)] transition hover:scale-105" style={{ left: `${position.left}%`, top: `${position.top}%`, width: size, height: size, background: schoolScoreColor(row.average_score) }}>
            <span className="text-[10px] font-black leading-tight">{row.average_score}%<br />{row.class_name.slice(0, 10)}</span>
          </Link>
        );
      })}
    </div>
  );
}

function SchoolWeakSkillMatrix({ rows }: { rows: SchoolWeakSkillRow[] }) {
  const data = rows.filter((row) => row.total > 0).slice(0, 12);
  if (!data.length) return <SchoolCompactEmpty title="Weak skill matrix appears after submitted answers." />;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {data.map((row) => {
        const weakness = Math.max(0, 100 - row.percent);
        return (
          <div key={row.skill} className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-semibold">{row.skill}</p>
                <p className="mt-1 text-xs text-muted">{row.correct}/{row.total} correct</p>
              </div>
              <span className="rounded-lg px-2 py-1 text-xs font-bold text-white" style={{ background: schoolScoreColor(row.percent) }}>{row.percent}%</span>
            </div>
            <div className="mt-3 grid h-8 grid-cols-10 gap-1">
              {Array.from({ length: 10 }).map((_, index) => <span key={index} className={`rounded-[4px] ${index < Math.ceil(weakness / 10) ? "bg-danger" : "bg-success/20"}`} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SchoolTeacherLoadBoard({ teachers }: { teachers: SchoolTeacherAnalyticsRow[] }) {
  if (!teachers.length) return <SchoolCompactEmpty title="Teacher activity appears after teachers receive classes and submissions." />;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {teachers.map((teacher) => (
        <Link key={teacher.teacher_id} href={`/school/teachers/${teacher.teacher_id}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="font-semibold">{teacher.teacher_name}</h3><p className="mt-1 text-sm text-muted">{teacher.email || "No email"}</p></div>
            <Badge variant={teacher.is_active ? "success" : "default"}>{teacher.is_active ? "active" : "inactive"}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniInfo label="Classes" value={teacher.class_count} />
            <MiniInfo label="Attempts" value={teacher.attempts} />
            <MiniInfo label="Avg" value={`${teacher.average_score}%`} />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-soft">
            <span className="block h-full rounded-full" style={{ width: `${Math.min(100, teacher.average_score)}%`, background: schoolScoreColor(teacher.average_score) }} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function SchoolCompactEmpty({ title }: { title: string }) {
  return (
    <div className="grid min-h-[96px] place-items-center rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface-soft px-4 py-5 text-center">
      <p className="max-w-[320px] text-sm font-medium leading-6 text-muted">{title}</p>
    </div>
  );
}

function schoolScoreColor(value: number) {
  if (value >= 75) return "var(--success)";
  if (value >= 50) return "var(--warning)";
  return "var(--danger)";
}

function schoolToneClass(tone: SchoolMetric["tone"]) {
  if (tone === "green") return "text-success";
  if (tone === "amber") return "text-warning";
  if (tone === "red") return "text-danger";
  return "text-ink";
}

export async function SchoolClassesPage() {
  const school = await firstSchool();
  const classes = await questApi.schoolClasses(school.slug);
  const results = await classResults(classes);
  const validResults = results.filter((item): item is ApiClassResults => Boolean(item));
  return (
    <QuestPage variant="wide">
      <Card className="p-5">
        <TeacherSectionHeader title="Class workspaces" />
        <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line">
          <div className="grid grid-cols-[1.1fr_1fr_120px_120px_130px] gap-3 border-b border-line bg-surface-soft px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle max-lg:hidden">
            <span>Class</span><span>Teacher</span><span>Students</span><span>Assignments</span><span>Average</span>
          </div>
          {classes.map((item) => {
            const result = validResults.find((row) => row.classroom.slug === item.slug);
            return (
              <Link key={item.id} href={`/school/classes/${item.slug}`} className="grid gap-3 border-b border-line px-4 py-4 hover:bg-surface-soft lg:grid-cols-[1.1fr_1fr_120px_120px_130px] lg:items-center">
                <div><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted">{item.slug}</p></div>
                <p className="text-sm text-muted">{item.teacher_name}</p>
                <p className="text-sm text-muted">{item.student_count}</p>
                <p className="text-sm text-muted">{item.assignment_count}</p>
                <Badge variant={result && result.average_score >= 70 ? "success" : "warning"}>{result ? `${result.average_score}%` : "No data"}</Badge>
              </Link>
            );
          })}
          {!classes.length ? <div className="p-5"><QuestEmptyState title="No classes yet" /></div> : null}
        </div>
      </Card>
    </QuestPage>
  );
}

export async function SchoolTeachersPage() {
  const school = await firstSchool();
  const teachers = await questApi.schoolTeachers(school.slug);
  return (
    <QuestPage variant="wide">
      <Card className="p-5"><TeacherSectionHeader title="Teacher directory" /><div className="mt-4 quest-card-grid-3">{teachers.map((teacher) => <SchoolTeacherCard key={teacher.id} teacher={teacher} />)}{!teachers.length ? <QuestEmptyState title="No teachers yet" /> : null}</div></Card>
    </QuestPage>
  );
}

export async function SchoolStudentsPage() {
  const school = await firstSchool();
  const classes = await questApi.schoolClasses(school.slug);
  const [results, rosters] = await Promise.all([classResults(classes), classStudents(classes)]);
  const progressRows = results.flatMap((result) => result?.student_progress.map((student) => ({ ...student, className: result.classroom.name, classSlug: result.classroom.slug, classId: result.classroom.id })) ?? []);
  const rosterRows = rosters.flatMap((rows, index) => rows.map((student) => ({
    student_name: student.name,
    student_code: student.student_code || String(student.id),
    completed: 0,
    average_score: 0,
    last_submitted_at: null as string | null,
    className: classes[index]?.name ?? "Class",
    classSlug: classes[index]?.slug ?? "",
    classId: classes[index]?.id ?? student.classroom,
  })));
  const byStudent = new Map<string, SchoolStudentDirectoryRow>();
  [...rosterRows, ...progressRows].forEach((student) => {
    const key = student.student_code || `${student.classSlug}-${student.student_name}`;
    const current = byStudent.get(key);
    const classNames = Array.from(new Set([...(current?.classNames ?? []), student.className].filter(Boolean)));
    byStudent.set(key, {
      studentCode: key,
      studentName: student.student_name,
      classNames,
      classSlug: student.classSlug || current?.classSlug || "",
      completed: Math.max(current?.completed ?? 0, student.completed),
      averageScore: Math.max(current?.averageScore ?? 0, student.average_score),
      lastSubmittedAt: maxIsoDate(current?.lastSubmittedAt, student.last_submitted_at),
      status: student.average_score >= 85 ? "strong" : student.average_score >= 70 ? "good" : student.average_score > 0 ? "needs_review" : "no_data",
    });
  });
  const students = Array.from(byStudent.values()).sort((a, b) => a.studentName.localeCompare(b.studentName));
  return (
    <QuestPage variant="table">
      <Card className="p-5">
        <TeacherSectionHeader title="Student table" />
        <SchoolStudentDirectory students={students} />
      </Card>
    </QuestPage>
  );
}

export async function SchoolClassDetailPage({ classId }: { classId: string }) {
  const school = await firstSchool();
  const [classes, teachers] = await Promise.all([
    questApi.schoolClasses(school.slug),
    questApi.schoolTeachers(school.slug).catch(() => []),
  ]);
  const classroom = byIdOrSlug(classes, classId);
  if (!classroom) notFound();
  const [results, students] = await Promise.all([
    questApi.classResults(classroom.slug).catch(() => null),
    questApi.classStudents(classroom.slug).catch(() => []),
  ]);
  const classTeachers = teachers.filter((teacher) => teacher.class_slugs.includes(classroom.slug) || teacher.classes.includes(classroom.id));
  const progressByCode = new Map((results?.student_progress ?? []).map((student) => [student.student_code, student]));
  const studentRows = students.map((student) => {
    const progress = progressByCode.get(student.student_code);
    return {
      code: student.student_code || String(student.id),
      name: student.name,
      completed: progress?.completed ?? 0,
      average: progress?.average_score ?? 0,
      last: progress?.last_submitted_at ?? null,
    };
  });
  const resultRows = results?.results ?? [];
  const weakRows = (results?.weak_skills ?? []).slice(0, 6).map((item) => ({ label: item.skill, value: item.percent, meta: `${item.correct}/${item.total} correct` }));
  return (
    <QuestPage variant="table">
      <div className="quest-main-aside-grid">
        <div className="grid gap-5">
          <Card className="p-5">
            <TeacherSectionHeader title="Teachers" />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(classTeachers.length ? classTeachers : [{ id: 0, name: classroom.teacher_name, email: "", teacher_code: "", class_count: 1, is_active: true }]).map((teacher) => (
                <Link key={teacher.id || teacher.name} href={teacher.id ? `/school/teachers/${teacher.id}` : "/school/teachers"} className="quest-card p-4 hover:bg-surface-soft">
                  <h3 className="font-semibold">{teacher.name}</h3>
                  <p className="mt-1 text-sm text-muted">{teacher.email || teacher.teacher_code || "Class teacher"}</p>
                </Link>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Students" />
            <div className="mt-4 grid gap-3">
              {studentRows.map((student) => (
                <Link key={student.code} href={`/school/students/${student.code}`} className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft md:grid-cols-[1fr_110px_110px_180px] md:items-center">
                  <div><p className="font-semibold">{student.name}</p><p className="mt-1 text-xs text-muted">{student.code}</p></div>
                  <p className="text-sm text-muted">{student.completed} tests</p>
                  <Badge variant={student.average >= 70 ? "success" : student.average > 0 ? "warning" : "default"}>{student.average ? `${student.average}%` : "No data"}</Badge>
                  <p className="text-sm text-muted">{student.last ? new Date(student.last).toLocaleString() : "No submit"}</p>
                </Link>
              ))}
              {!studentRows.length ? <QuestEmptyState title="No students yet" /> : null}
            </div>
          </Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Recent test results" />
            <div className="mt-4 grid gap-3">
              {resultRows.slice(0, 12).map((row) => (
                <Link key={row.session_id} href={`/school/results/${row.session_id}`} className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft md:grid-cols-[1fr_1fr_100px_180px] md:items-center">
                  <div><p className="font-semibold">{row.student_name}</p><p className="mt-1 text-xs text-muted">{row.student_code}</p></div>
                  <p className="text-sm text-muted">{row.test_title}</p>
                  <Badge variant={row.score >= 70 ? "success" : "warning"}>{row.score}%</Badge>
                  <p className="text-sm text-muted">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "No submit"}</p>
                </Link>
              ))}
              {!resultRows.length ? <QuestEmptyState title="No submitted tests yet" /> : null}
            </div>
          </Card>
        </div>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5"><TeacherSectionHeader title="Weak skills" /><div className="mt-4">{weakRows.length ? <WeakTopicBars rows={weakRows} /> : <QuestEmptyState title="No weak skills yet" />}</div></Card>
          <Card className="p-5"><TeacherSectionHeader title="Class settings" /><div className="mt-4 grid gap-3"><MiniInfo label="Visibility" value={classroom.visibility} /><MiniInfo label="Join code" value={classroom.join_code ? "set" : "Not set"} /><MiniInfo label="Manage code" value={classroom.manage_code ? "set" : "missing"} /></div></Card>
        </aside>
      </div>
    </QuestPage>
  );
}

export async function SchoolTeacherDetailPage({ teacherId }: { teacherId: string }) {
  const school = await firstSchool();
  const [teachers, classes] = await Promise.all([
    questApi.schoolTeachers(school.slug),
    questApi.schoolClasses(school.slug),
  ]);
  const teacher = teachers.find((item) => String(item.id) === teacherId || item.teacher_code === teacherId);
  if (!teacher) notFound();
  const teacherClasses = classes.filter((item) => teacher.class_slugs.includes(item.slug) || teacher.classes.includes(item.id) || item.teacher_name === teacher.name);
  const results = (await classResults(teacherClasses)).filter((item): item is ApiClassResults => Boolean(item));
  const recentResults = results.flatMap((item) => item.results.map((row) => ({ ...row, className: item.classroom.name, classSlug: item.classroom.slug }))).sort((a, b) => Date.parse(b.submitted_at ?? "") - Date.parse(a.submitted_at ?? "")).slice(0, 12);
  const weakRows = results.flatMap((item) => item.weak_skills.slice(0, 2).map((skill) => ({ label: skill.skill, value: skill.percent, meta: item.classroom.name }))).slice(0, 6);
  return (
    <QuestPage variant="table">
      <div className="quest-main-aside-grid">
        <div className="grid gap-5">
          <Card className="p-5"><TeacherSectionHeader title="Classes" /><div className="mt-4 quest-card-grid-3">{teacherClasses.map((item) => <SchoolClassCard key={item.id} classroom={item} result={results.find((result) => result.classroom.slug === item.slug)} />)}{!teacherClasses.length ? <QuestEmptyState title="No classes assigned" /> : null}</div></Card>
          <Card className="p-5">
            <TeacherSectionHeader title="Recent student results" />
            <div className="mt-4 grid gap-3">
              {recentResults.map((row) => (
                <Link key={`${row.session_id}-${row.classSlug}`} href={`/school/students/${row.student_code}`} className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft md:grid-cols-[1fr_1fr_100px_150px] md:items-center">
                  <div><p className="font-semibold">{row.student_name}</p><p className="mt-1 text-xs text-muted">{row.className}</p></div>
                  <p className="text-sm text-muted">{row.test_title}</p>
                  <Badge variant={row.score >= 70 ? "success" : "warning"}>{row.score}%</Badge>
                  <p className="text-sm text-muted">{row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : "No submit"}</p>
                </Link>
              ))}
              {!recentResults.length ? <QuestEmptyState title="No submitted tests yet" /> : null}
            </div>
          </Card>
        </div>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5"><TeacherSectionHeader title="Teacher info" /><div className="mt-4 grid gap-3"><MiniInfo label="Email" value={teacher.email || "No email"} /><MiniInfo label="Code" value={teacher.teacher_code || "No code"} /><MiniInfo label="Class count" value={teacher.class_count} /></div></Card>
          <Card className="p-5"><TeacherSectionHeader title="Weak skills" /><div className="mt-4">{weakRows.length ? <WeakTopicBars rows={weakRows} /> : <QuestEmptyState title="No weak skills yet" />}</div></Card>
        </aside>
      </div>
    </QuestPage>
  );
}

export async function SchoolStudentDetailPage({ studentId }: { studentId: string }) {
  const school = await firstSchool();
  const classes = await questApi.schoolClasses(school.slug);
  const [results, rosters] = await Promise.all([classResults(classes), classStudents(classes)]);
  const rosterMatches = rosters.flatMap((rows, index) => rows.map((student) => ({ ...student, className: classes[index]?.name ?? "Class", classSlug: classes[index]?.slug ?? "" }))).filter((student) => String(student.id) === studentId || student.student_code === studentId);
  const resultRows = results.flatMap((result) => result?.results.map((row) => ({ ...row, className: result.classroom.name, classSlug: result.classroom.slug })) ?? []).filter((row) => row.student_code === studentId || rosterMatches.some((student) => student.student_code === row.student_code));
  const progressRows = results.flatMap((result) => result?.student_progress.map((student) => ({ ...student, className: result.classroom.name, classSlug: result.classroom.slug })) ?? []).filter((student) => student.student_code === studentId || rosterMatches.some((row) => row.student_code === student.student_code));
  const name = progressRows[0]?.student_name ?? rosterMatches[0]?.name;
  if (!name) notFound();
  const classesText = Array.from(new Set([...progressRows.map((item) => item.className), ...rosterMatches.map((item) => item.className)])).join(", ");
  return (
    <QuestPage variant="table">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <TeacherSectionHeader title="Test result history" />
          <div className="mt-4 grid gap-3">
            {resultRows.map((row) => (
              <Link key={row.session_id} href={`/school/results/${row.session_id}`} className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft md:grid-cols-[1fr_1fr_100px_180px] md:items-center">
                <div><p className="font-semibold">{row.test_title}</p><p className="mt-1 text-xs text-muted">{row.className}</p></div>
                <p className="text-sm text-muted">{row.correct}/{row.total} correct</p>
                <Badge variant={row.score >= 70 ? "success" : "warning"}>{row.score}%</Badge>
                <p className="text-sm text-muted">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "No submit"}</p>
              </Link>
            ))}
            {!resultRows.length ? <QuestEmptyState title="No test results yet" /> : null}
          </div>
        </Card>
        <aside className="grid h-fit gap-5 lg:sticky lg:top-24">
          <Card className="p-5"><TeacherSectionHeader title="Progress by class" /><div className="mt-4 grid gap-3">{progressRows.map((row) => <Link key={row.classSlug} href={`/school/classes/${row.classSlug}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:bg-surface-soft"><h3 className="font-semibold">{row.className}</h3><p className="mt-2 text-sm text-muted">{row.completed} completed · {row.average_score}% average</p></Link>)}{!progressRows.length ? <QuestEmptyState title="No progress yet" /> : null}</div></Card>
          <Card className="p-5"><TeacherSectionHeader title="Student info" /><div className="mt-4 grid gap-3"><MiniInfo label="Code" value={studentId} /><MiniInfo label="Classes" value={classesText || "No class"} /><MiniInfo label="Visibility" value="school" /></div></Card>
        </aside>
      </div>
    </QuestPage>
  );
}
