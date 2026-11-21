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
  const teacherRows = (analytics?.teachers ?? []).slice(0, 6);
  const activeTeacherCount = analytics?.teachers.filter((teacher) => teacher.is_active).length ?? teachers.filter((teacher) => teacher.is_active).length;
  const averageScore = analytics?.average_score ?? average(classRows.map((item) => item.average_score));
  const submittedStudents = analytics?.students_submitted ?? classRows.reduce((sum, item) => sum + item.students_submitted, 0);
  const attempts = analytics?.attempts ?? classRows.reduce((sum, item) => sum + item.attempts, 0);
  return (
    <QuestPage variant="wide">
      <div className="grid gap-4">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">O&apos;quv markaz tahlili</p>
                <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink md:text-3xl">{school.name}</h1>
                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-black/55">Sinflar, o&apos;qituvchilar, o&apos;quvchilar va umumiy o&apos;zlashtirish ko&apos;rsatkichlari yagona panelda.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm" className="rounded-xl"><Link href="/school/classes">Sinflar</Link></Button>
                <Button asChild variant="secondary" size="sm" className="rounded-xl"><Link href="/school/teachers">O&apos;qituvchilar</Link></Button>
                <Button asChild variant="secondary" size="sm" className="rounded-xl"><Link href="/school/students">O&apos;quvchilar</Link></Button>
              </div>
            </div>
            <SchoolMetricStrip
              metrics={[
                { label: "O'qituvchilar", value: analytics?.teacher_count ?? (teachers.length || school.teacher_count), note: `${activeTeacherCount} faol`, tone: "neutral" },
                { label: "Sinflar", value: analytics?.class_count ?? classes.length, note: "guruh", tone: "neutral" },
                { label: "O'quvchilar", value: submittedStudents, note: "topshirdi", tone: "green" },
                { label: "Urinishlar", value: attempts, note: "sessiya", tone: "amber" },
                { label: "O'rtacha ball", value: `${averageScore}%`, note: "natija", tone: averageScore >= 70 ? "green" : averageScore ? "amber" : "neutral" },
              ]}
            />
          </Card>
          <SchoolHealthCard score={averageScore} attempts={attempts} students={submittedStudents} weakSkills={weakRows.length} />
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          <main className="grid gap-4">
            <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
              <TeacherSectionHeader title="Sinflar dinamikasi" action={<Button asChild variant="secondary" size="sm" className="rounded-xl"><Link href="/school/classes">Barcha sinflar</Link></Button>} />
              <div className="mt-4"><SchoolClassTerrain rows={classRows} /></div>
            </Card>
            <div className="grid gap-4 2xl:grid-cols-[1fr_0.95fr]">
              <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
                <TeacherSectionHeader title="Sinflar taqsimoti" />
                <div className="mt-4"><SchoolClassOrbit rows={classRows} /></div>
              </Card>
              <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
                <TeacherSectionHeader title="Kuchsiz mavzular matritsasi" />
                <div className="mt-4"><SchoolWeakSkillMatrix rows={weakRows} /></div>
              </Card>
            </div>
            <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
              <TeacherSectionHeader title="O'qituvchilar yuki" action={<Button asChild variant="secondary" size="sm" className="rounded-xl"><Link href="/school/teachers">Barchasi</Link></Button>} />
              <div className="mt-4"><SchoolTeacherLoadBoard teachers={teacherRows} /></div>
            </Card>
          </main>
          <aside className="grid h-fit gap-4 xl:sticky xl:top-24">
            <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
              <TeacherSectionHeader title="Markaz ma'lumotlari" />
              <div className="mt-4 grid gap-2.5">
                <MiniInfo label="Ko'rinish" value={school.visibility} />
                <MiniInfo label="O'qituvchilar" value={school.teacher_count} />
                <MiniInfo label="Taklif kodi" value={school.student_invite_code ? "Mavjud" : "Kiritilmagan"} />
              </div>
            </Card>
            <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
              <TeacherSectionHeader title="Tezkor amallar" />
              <div className="mt-4 grid gap-2">
                <Button asChild className="rounded-xl"><Link href="/school/classes">Sinflar diagnostikasi</Link></Button>
                <Button asChild variant="secondary" className="rounded-xl"><Link href="/school/students">O&apos;quvchilar ro&apos;yxati</Link></Button>
                <Button asChild variant="secondary" className="rounded-xl"><Link href="/school/progress">Natijalar hisoboti</Link></Button>
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
    <div className="mt-4 grid overflow-hidden rounded-xl border border-black/8 bg-[#fafaf8] sm:grid-cols-5">
      {metrics.map((metric) => (
        <div key={metric.label} className="border-b border-black/8 px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">{metric.label}</p>
          <p className={`mt-1 text-2xl font-bold ${schoolToneClass(metric.tone)}`}>{metric.value}</p>
          <p className="mt-0.5 text-xs text-black/50">{metric.note}</p>
        </div>
      ))}
    </div>
  );
}

function SchoolHealthCard({ score, attempts, students, weakSkills }: { score: number; attempts: number; students: number; weakSkills: number }) {
  const health = attempts ? Math.max(0, Math.min(100, Math.round(score - weakSkills * 2 + Math.min(10, students)))) : 0;
  const ring = Math.max(8, health) * 3.6;
  return (
    <Card className="rounded-2xl border border-black/8 bg-[#11130f] p-5 text-white shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Faoliyat salomatligi</p>
      <div className="mt-4 grid grid-cols-[96px_1fr] items-center gap-4">
        <div className="relative grid size-24 place-items-center rounded-full" style={{ background: `conic-gradient(var(--success) 0 ${ring}deg, rgba(255,255,255,.14) ${ring}deg 360deg)` }}>
          <span className="absolute inset-2.5 rounded-full border border-white/10 bg-[#151a15]" />
          <b className="relative text-xl text-white">{health}%</b>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <DarkMetric label="O'rtacha" value={`${score}%`} />
          <DarkMetric label="Topshirildi" value={attempts} />
          <DarkMetric label="O'quvchilar" value={students} />
          <DarkMetric label="Kuchsiz" value={weakSkills} />
        </div>
      </div>
    </Card>
  );
}

function DarkMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5 text-center">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/45">{label}</span>
      <b className="mt-0.5 block text-base font-semibold text-white">{value}</b>
    </div>
  );
}

function SchoolClassTerrain({ rows }: { rows: SchoolClassAnalyticsRow[] }) {
  const data = rows.filter((row) => row.sessions_total || row.attempts || row.students_submitted).slice(0, 8);
  if (data.length < 2) return <SchoolCompactEmpty title="Sinflar dinamikasi ko'rinishi uchun kamida ikkita faol sinf kerak." />;
  const points = data.map((row, index) => {
    const x = 6 + index * (88 / Math.max(1, data.length - 1));
    const y = 86 - Math.max(0, Math.min(100, row.average_score)) * 0.7;
    return { row, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${points.at(-1)?.x ?? 94} 92 L ${points[0]?.x ?? 6} 92 Z`;
  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-black/8 bg-[#fafaf8] p-4">
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="schoolTerrainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--success)" stopOpacity=".24" />
            <stop offset=".55" stopColor="var(--chart-1)" stopOpacity=".15" />
            <stop offset="1" stopColor="var(--warning)" stopOpacity=".10" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#schoolTerrainFill)" />
        <path d={path} fill="none" stroke="var(--ink)" strokeOpacity=".45" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
        <line x1="0" x2="100" y1="37" y2="37" stroke="var(--warning)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="relative grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {points.map(({ row, y }) => (
          <Link key={row.class_id} href={`/school/classes/${row.class_slug}`} className="group rounded-xl border border-black/8 bg-white/95 p-3.5 shadow-sm transition hover:border-black/20" style={{ transform: `translateY(${Math.max(-6, Math.min(10, y - 52))}px)` }}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 font-semibold text-ink group-hover:text-brand transition-colors">{row.class_name}</h3>
              <Badge variant={row.average_score >= 70 ? "success" : row.average_score ? "warning" : "default"}>{row.average_score}%</Badge>
            </div>
            <p className="mt-1 text-xs text-black/50">{row.teacher_name || "O'qituvchi yo'q"}</p>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <MiniInfo label="O'quvchi" value={row.students_submitted} />
              <MiniInfo label="Urinish" value={row.attempts} />
              <MiniInfo label="Sessiya" value={row.sessions_total} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SchoolClassOrbit({ rows }: { rows: SchoolClassAnalyticsRow[] }) {
  const data = rows.filter((row) => row.sessions_total || row.attempts || row.students_submitted).sort((a, b) => b.attempts - a.attempts).slice(0, 5);
  if (!data.length) return <SchoolCompactEmpty title="Sinflar topshiriqlarni bajara boshlagach ko'rinadi." />;
  const positions = [{ left: 50, top: 50 }, { left: 24, top: 30 }, { left: 76, top: 31 }, { left: 26, top: 74 }, { left: 76, top: 73 }];
  return (
    <div className="relative h-[290px] overflow-hidden rounded-2xl border border-black/8 bg-[#fafaf8]">
      <span className="absolute left-1/2 top-1/2 size-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-black/15" />
      <span className="absolute left-1/2 top-1/2 size-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-black/10" />
      {data.map((row, index) => {
        const position = positions[index] ?? positions[0];
        const size = index === 0 ? 80 : 60;
        return (
          <Link key={row.class_id} href={`/school/classes/${row.class_slug}`} className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 p-2 text-center text-white shadow-md transition hover:scale-105" style={{ left: `${position.left}%`, top: `${position.top}%`, width: size, height: size, background: schoolScoreColor(row.average_score) }}>
            <span className="text-[10px] font-bold leading-tight">{row.average_score}%<br />{row.class_name.slice(0, 9)}</span>
          </Link>
        );
      })}
    </div>
  );
}

function SchoolWeakSkillMatrix({ rows }: { rows: SchoolWeakSkillRow[] }) {
  const data = rows.filter((row) => row.total > 0).slice(0, 12);
  if (!data.length) return <SchoolCompactEmpty title="Topshirilgan testlar bo'yicha kuchsiz mavzular ko'rinadi." />;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {data.map((row) => {
        const weakness = Math.max(0, 100 - row.percent);
        return (
          <div key={row.skill} className="rounded-xl border border-black/8 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="line-clamp-1 text-xs font-semibold text-ink">{row.skill}</p>
                <p className="mt-0.5 text-[11px] text-black/50">{row.correct}/{row.total} to&apos;g&apos;ri</p>
              </div>
              <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ background: schoolScoreColor(row.percent) }}>{row.percent}%</span>
            </div>
            <div className="mt-2.5 grid h-4 grid-cols-10 gap-1">
              {Array.from({ length: 10 }).map((_, index) => <span key={index} className={`rounded-sm ${index < Math.ceil(weakness / 10) ? "bg-danger" : "bg-success/20"}`} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SchoolTeacherLoadBoard({ teachers }: { teachers: SchoolTeacherAnalyticsRow[] }) {
  if (!teachers.length) return <SchoolCompactEmpty title="O'qituvchilar faolligi sinflar biriktirilgach paydo bo'ladi." />;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {teachers.map((teacher) => (
        <Link key={teacher.teacher_id} href={`/school/teachers/${teacher.teacher_id}`} className="group rounded-2xl border border-black/8 bg-white p-4 shadow-sm transition hover:border-black/20">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="font-semibold text-ink group-hover:text-brand transition-colors">{teacher.teacher_name}</h3><p className="mt-0.5 text-xs text-black/50">{teacher.email || "Email yo'q"}</p></div>
            <Badge variant={teacher.is_active ? "success" : "default"}>{teacher.is_active ? "faol" : "nofaol"}</Badge>
          </div>
          <div className="mt-3.5 grid grid-cols-3 gap-2">
            <MiniInfo label="Sinflar" value={teacher.class_count} />
            <MiniInfo label="Topshirildi" value={teacher.attempts} />
            <MiniInfo label="O'rtacha" value={`${teacher.average_score}%`} />
          </div>
          <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-[#fafaf8]">
            <span className="block h-full rounded-full" style={{ width: `${Math.min(100, teacher.average_score)}%`, background: schoolScoreColor(teacher.average_score) }} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function SchoolCompactEmpty({ title }: { title: string }) {
  return (
    <div className="grid min-h-[96px] place-items-center rounded-xl border border-dashed border-black/12 bg-[#fafaf8] px-4 py-5 text-center">
      <p className="max-w-[320px] text-xs font-medium leading-5 text-black/50">{title}</p>
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
      <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
        <TeacherSectionHeader title="Sinflar va guruhlar" />
        <div className="mt-4 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
          <div className="grid grid-cols-[1.1fr_1fr_120px_120px_130px] gap-3 border-b border-black/8 bg-[#fafaf8] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-black/40 max-lg:hidden">
            <span>Sinf</span><span>O&apos;qituvchi</span><span>O&apos;quvchilar</span><span>Vazifalar</span><span>O&apos;rtacha ball</span>
          </div>
          {classes.map((item) => {
            const result = validResults.find((row) => row.classroom.slug === item.slug);
            return (
              <Link key={item.id} href={`/school/classes/${item.slug}`} className="grid gap-3 border-b border-black/6 px-4 py-3.5 transition hover:bg-[#fafaf8] last:border-b-0 lg:grid-cols-[1.1fr_1fr_120px_120px_130px] lg:items-center">
                <div><p className="font-semibold text-ink">{item.name}</p><p className="mt-0.5 text-xs text-black/45">{item.slug}</p></div>
                <p className="text-sm text-black/60">{item.teacher_name}</p>
                <p className="text-sm text-black/60">{item.student_count} o&apos;quvchi</p>
                <p className="text-sm text-black/60">{item.assignment_count} vazifa</p>
                <div><Badge variant={result && result.average_score >= 70 ? "success" : "warning"}>{result ? `${result.average_score}%` : "Yo'q"}</Badge></div>
              </Link>
            );
          })}
          {!classes.length ? <div className="p-6 text-center text-sm text-black/50">Hozircha sinflar yo&apos;q.</div> : null}
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
      <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
        <TeacherSectionHeader title="O'qituvchilar ro'yxati" />
        <div className="mt-4 quest-card-grid-3">
          {teachers.map((teacher) => <SchoolTeacherCard key={teacher.id} teacher={teacher} />)}
          {!teachers.length ? <QuestEmptyState title="Hozircha o'qituvchilar yo'q" /> : null}
        </div>
      </Card>
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
      <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
        <TeacherSectionHeader title="O'quvchilar jadvali" />
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
  const weakRows = (results?.weak_skills ?? []).slice(0, 6).map((item) => ({ label: item.skill, value: item.percent, meta: `${item.correct}/${item.total} to'g'ri` }));
  return (
    <QuestPage variant="table">
      <div className="quest-main-aside-grid">
        <div className="grid gap-4">
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <TeacherSectionHeader title="O'qituvchilar" />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(classTeachers.length ? classTeachers : [{ id: 0, name: classroom.teacher_name, email: "", teacher_code: "", class_count: 1, is_active: true }]).map((teacher) => (
                <Link key={teacher.id || teacher.name} href={teacher.id ? `/school/teachers/${teacher.id}` : "/school/teachers"} className="group rounded-xl border border-black/8 bg-white p-3.5 shadow-sm transition hover:border-black/20">
                  <h3 className="font-semibold text-ink group-hover:text-brand transition-colors">{teacher.name}</h3>
                  <p className="mt-0.5 text-xs text-black/50">{teacher.email || teacher.teacher_code || "Sinf o'qituvchisi"}</p>
                </Link>
              ))}
            </div>
          </Card>
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <TeacherSectionHeader title="O'quvchilar" />
            <div className="mt-4 grid gap-2.5">
              {studentRows.map((student) => (
                <Link key={student.code} href={`/school/students/${student.code}`} className="grid gap-3 rounded-xl border border-black/8 bg-white p-3.5 shadow-sm transition hover:border-black/20 md:grid-cols-[1fr_110px_110px_180px] md:items-center">
                  <div><p className="font-semibold text-ink">{student.name}</p><p className="mt-0.5 text-xs text-black/45">{student.code}</p></div>
                  <p className="text-xs text-black/60">{student.completed} test</p>
                  <div><Badge variant={student.average >= 70 ? "success" : student.average > 0 ? "warning" : "default"}>{student.average ? `${student.average}%` : "Yo'q"}</Badge></div>
                  <p className="text-xs text-black/50">{student.last ? new Date(student.last).toLocaleString() : "Topshirilmagan"}</p>
                </Link>
              ))}
              {!studentRows.length ? <QuestEmptyState title="Hozircha o'quvchilar yo'q" /> : null}
            </div>
          </Card>
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <TeacherSectionHeader title="Oxirgi natijalar" />
            <div className="mt-4 grid gap-2.5">
              {resultRows.slice(0, 12).map((row) => (
                <Link key={row.session_id} href={`/school/results/${row.session_id}`} className="grid gap-3 rounded-xl border border-black/8 bg-white p-3.5 shadow-sm transition hover:border-black/20 md:grid-cols-[1fr_1fr_100px_180px] md:items-center">
                  <div><p className="font-semibold text-ink">{row.student_name}</p><p className="mt-0.5 text-xs text-black/45">{row.student_code}</p></div>
                  <p className="text-xs text-black/60">{row.test_title}</p>
                  <div><Badge variant={row.score >= 70 ? "success" : "warning"}>{row.score}%</Badge></div>
                  <p className="text-xs text-black/50">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "Topshirilmagan"}</p>
                </Link>
              ))}
              {!resultRows.length ? <QuestEmptyState title="Hozircha topshirilgan testlar yo'q" /> : null}
            </div>
          </Card>
        </div>
        <aside className="grid h-fit gap-4 xl:sticky xl:top-24">
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm"><TeacherSectionHeader title="Kuchsiz ko'nikmalar" /><div className="mt-4">{weakRows.length ? <WeakTopicBars rows={weakRows} /> : <QuestEmptyState title="Kuchsiz ko'nikmalar yo'q" />}</div></Card>
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm"><TeacherSectionHeader title="Sinf sozlamalari" /><div className="mt-4 grid gap-2.5"><MiniInfo label="Ko'rinish" value={classroom.visibility} /><MiniInfo label="Qo'shilish kodi" value={classroom.join_code ? "Mavjud" : "Kiritilmagan"} /><MiniInfo label="Boshqaruv kodi" value={classroom.manage_code ? "Mavjud" : "Yo'q"} /></div></Card>
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
        <div className="grid gap-4">
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm"><TeacherSectionHeader title="Sinflar" /><div className="mt-4 quest-card-grid-3">{teacherClasses.map((item) => <SchoolClassCard key={item.id} classroom={item} result={results.find((result) => result.classroom.slug === item.slug)} />)}{!teacherClasses.length ? <QuestEmptyState title="Sinflar biriktirilmagan" /> : null}</div></Card>
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
            <TeacherSectionHeader title="O'quvchilar oxirgi natijalari" />
            <div className="mt-4 grid gap-2.5">
              {recentResults.map((row) => (
                <Link key={`${row.session_id}-${row.classSlug}`} href={`/school/students/${row.student_code}`} className="grid gap-3 rounded-xl border border-black/8 bg-white p-3.5 shadow-sm transition hover:border-black/20 md:grid-cols-[1fr_1fr_100px_150px] md:items-center">
                  <div><p className="font-semibold text-ink">{row.student_name}</p><p className="mt-0.5 text-xs text-black/45">{row.className}</p></div>
                  <p className="text-xs text-black/60">{row.test_title}</p>
                  <div><Badge variant={row.score >= 70 ? "success" : "warning"}>{row.score}%</Badge></div>
                  <p className="text-xs text-black/50">{row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : "Topshirilmagan"}</p>
                </Link>
              ))}
              {!recentResults.length ? <QuestEmptyState title="Hozircha natijalar yo'q" /> : null}
            </div>
          </Card>
        </div>
        <aside className="grid h-fit gap-4 xl:sticky xl:top-24">
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm"><TeacherSectionHeader title="O'qituvchi ma'lumotlari" /><div className="mt-4 grid gap-2.5"><MiniInfo label="Email" value={teacher.email || "Email yo'q"} /><MiniInfo label="Kod" value={teacher.teacher_code || "Kod yo'q"} /><MiniInfo label="Sinflar soni" value={teacher.class_count} /></div></Card>
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm"><TeacherSectionHeader title="Kuchsiz ko'nikmalar" /><div className="mt-4">{weakRows.length ? <WeakTopicBars rows={weakRows} /> : <QuestEmptyState title="Kuchsiz ko'nikmalar yo'q" />}</div></Card>
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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
          <TeacherSectionHeader title="Test natijalari tarixi" />
          <div className="mt-4 grid gap-2.5">
            {resultRows.map((row) => (
              <Link key={row.session_id} href={`/school/results/${row.session_id}`} className="grid gap-3 rounded-xl border border-black/8 bg-white p-3.5 shadow-sm transition hover:border-black/20 md:grid-cols-[1fr_1fr_100px_180px] md:items-center">
                <div><p className="font-semibold text-ink">{row.test_title}</p><p className="mt-0.5 text-xs text-black/45">{row.className}</p></div>
                <p className="text-xs text-black/60">{row.correct}/{row.total} to&apos;g&apos;ri</p>
                <div><Badge variant={row.score >= 70 ? "success" : "warning"}>{row.score}%</Badge></div>
                <p className="text-xs text-black/50">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "Topshirilmagan"}</p>
              </Link>
            ))}
            {!resultRows.length ? <QuestEmptyState title="Hozircha natijalar yo'q" /> : null}
          </div>
        </Card>
        <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm"><TeacherSectionHeader title="Sinflar bo'yicha o'zlashtirish" /><div className="mt-4 grid gap-2.5">{progressRows.map((row) => <Link key={row.classSlug} href={`/school/classes/${row.classSlug}`} className="group rounded-xl border border-black/8 bg-white p-3.5 shadow-sm transition hover:border-black/20"><h3 className="font-semibold text-ink group-hover:text-brand transition-colors">{row.className}</h3><p className="mt-1 text-xs text-black/50">{row.completed} topshirildi · {row.average_score}% o&apos;rtacha</p></Link>)}{!progressRows.length ? <QuestEmptyState title="Hozircha natija yo'q" /> : null}</div></Card>
          <Card className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm"><TeacherSectionHeader title="O'quvchi ma'lumotlari" /><div className="mt-4 grid gap-2.5"><MiniInfo label="Kod" value={studentId} /><MiniInfo label="Sinflar" value={classesText || "Sinf yo'q"} /><MiniInfo label="Ko'rinish" value="Maktab" /></div></Card>
        </aside>
      </div>
    </QuestPage>
  );
}
