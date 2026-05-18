"use client";

import { BarChart3, Building2, GraduationCap, Plus, Search, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { ApiSchool, ApiSchoolAnalytics, ApiTeacherClass } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getSchoolManageCode, saveSchoolManageCode } from "@/shared/model/local-identity";
import { Eyebrow, FieldShell, premiumInputClass } from "@/shared/ui/premium-shell";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export function SchoolDashboardClient({ initialSchools, classes }: { initialSchools: ApiSchool[]; classes: ApiTeacherClass[] }) {
  const [schools, setSchools] = useState(initialSchools);
  const [activeSlug, setActiveSlug] = useState(initialSchools[0]?.slug ?? "");
  const [analytics, setAnalytics] = useState<ApiSchoolAnalytics | null>(null);
  const [name, setName] = useState("Dirac Learning Center");
  const [owner, setOwner] = useState("School owner");
  const [description, setDescription] = useState("Teacherlar va classlar umumiy nazorati.");
  const [teacherName, setTeacherName] = useState("Math teacher");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const activeSchool = schools.find((school) => school.slug === activeSlug);
  const visibleTeachers = (analytics?.teachers ?? []).filter((teacher) => `${teacher.teacher_name} ${teacher.email}`.toLowerCase().includes(query.toLowerCase()));

  async function loadAnalytics(slug = activeSlug) {
    if (!slug) return;
    const data = await questApi.schoolAnalytics(slug);
    setAnalytics(data);
  }

  async function createSchool() {
    setBusy(true);
    setNotice("");
    try {
      const manageCode = getSchoolManageCode();
      const school = await questApi.createSchool({
        name,
        slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
        owner_name: owner,
        manage_code: manageCode,
        visibility: "private",
        description,
      });
      saveSchoolManageCode(school.slug, school.manage_code);
      setSchools((items) => [school, ...items]);
      setActiveSlug(school.slug);
      setNotice("School workspace yaratildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "School create failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addTeacher() {
    if (!activeSlug) return;
    setBusy(true);
    setNotice("");
    try {
      await questApi.createSchoolTeacher(activeSlug, {
        name: teacherName,
        email: teacherEmail,
        teacher_code: `${slugify(teacherName)}-${Date.now().toString().slice(-4)}`,
        classes: selectedClasses,
        manage_code: getSchoolManageCode(activeSlug),
      });
      await loadAnalytics(activeSlug);
      setNotice("Teacher schoolga qo'shildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Teacher add failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deactivateTeacher(teacherId: number) {
    if (!activeSlug) return;
    setBusy(true);
    try {
      await questApi.deleteSchoolTeacher(activeSlug, teacherId, getSchoolManageCode(activeSlug));
      await loadAnalytics(activeSlug);
      setNotice("Teacher inactive qilindi.");
    } finally {
      setBusy(false);
    }
  }

  const classOptions = useMemo(() => classes.map((item) => ({ id: item.id, label: `${item.name} / ${item.teacher_name}` })), [classes]);

  return (
    <main className="min-h-screen bg-[#f7f7ef] px-5 py-8 text-[#151713] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[32px] border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(21,23,19,0.09)] sm:p-8">
          <Eyebrow>School workspace</Eyebrow>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">School analytics</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-black/58">
                School class yoki session ochmaydi. Teacherlarni qo&apos;shadi, ularning classlarini bog&apos;laydi va barcha student natijalarini nazorat qiladi.
              </p>
            </div>
            <div className="grid gap-2">
              <select value={activeSlug} onChange={(event) => setActiveSlug(event.target.value)} className={premiumInputClass}>
                <option value="">School tanlang</option>
                {schools.map((school) => <option key={school.id} value={school.slug}>{school.name}</option>)}
              </select>
              <button onClick={() => void loadAnalytics()} disabled={!activeSlug} className="rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Open dashboard</button>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="grid gap-6">
            <Panel>
              <Eyebrow>Create school</Eyebrow>
              <div className="mt-4 grid gap-4">
                <Input label="School name" value={name} onChange={setName} />
                <Input label="Owner" value={owner} onChange={setOwner} />
                <FieldShell label="Description"><textarea value={description} onChange={(event) => setDescription(event.target.value)} className={premiumInputClass} rows={3} /></FieldShell>
                <button onClick={createSchool} disabled={busy} className="rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Create school</button>
              </div>
            </Panel>

            <Panel>
              <Eyebrow>Add teacher</Eyebrow>
              <div className="mt-4 grid gap-4">
                <Input label="Teacher name" value={teacherName} onChange={setTeacherName} />
                <Input label="Email" value={teacherEmail} onChange={setTeacherEmail} />
                <FieldShell label="Attach existing classes">
                  <select multiple value={selectedClasses.map(String)} onChange={(event) => setSelectedClasses(Array.from(event.target.selectedOptions).map((option) => Number(option.value)))} className="min-h-32 rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none">
                    {classOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </FieldShell>
                <button onClick={addTeacher} disabled={busy || !activeSlug} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4" />Add teacher</button>
              </div>
            </Panel>
          </aside>

          <div className="grid gap-6">
            <section className="grid gap-3 md:grid-cols-5">
              <Metric icon={Building2} label="School" value={activeSchool?.name ?? "-"} />
              <Metric icon={GraduationCap} label="Teachers" value={analytics?.teacher_count ?? 0} />
              <Metric icon={ShieldCheck} label="Classes" value={analytics?.class_count ?? 0} />
              <Metric icon={UsersRound} label="Students" value={analytics?.students_submitted ?? 0} />
              <Metric icon={BarChart3} label="Average" value={`${analytics?.average_score ?? 0}%`} />
            </section>

            <Panel>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><Eyebrow>Teachers</Eyebrow><h2 className="mt-2 text-2xl font-semibold">Teacher performance</h2></div>
                <div className="flex items-center gap-2 rounded-2xl border border-black/8 bg-white px-4 py-3"><Search className="size-4 text-black/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="bg-transparent text-sm outline-none" placeholder="Teacher search" /></div>
              </div>
              <div className="mt-5 grid gap-3">
                {visibleTeachers.map((teacher) => (
                  <div key={teacher.teacher_id} className="grid gap-3 rounded-2xl border border-black/8 bg-white p-4 md:grid-cols-[1fr_110px_110px_110px_auto] md:items-center">
                    <div><p className="font-semibold">{teacher.teacher_name}</p><p className="text-sm text-black/45">{teacher.email || "No email"}</p></div>
                    <p className="text-sm text-black/58">{teacher.class_count} class</p>
                    <p className="text-sm text-black/58">{teacher.students_submitted} students</p>
                    <span className="w-fit rounded-xl bg-[#edf7f3] px-3 py-2 text-sm font-semibold text-[#276a5b]">{teacher.average_score}%</span>
                    <button onClick={() => void deactivateTeacher(teacher.teacher_id)} className="grid size-10 place-items-center rounded-xl border border-red-100 text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button>
                  </div>
                ))}
                {!visibleTeachers.length ? <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Teacher analytics hali yo&apos;q.</p> : null}
              </div>
            </Panel>

            <Panel>
              <Eyebrow>Classes</Eyebrow>
              <h2 className="mt-2 text-2xl font-semibold">Class monitoring</h2>
              <div className="mt-5 grid gap-3">
                {analytics?.classes.map((item) => (
                  <Link key={item.class_id} href={`/teacher/classes/${item.class_slug}`} className="grid gap-3 rounded-2xl border border-black/8 bg-white p-4 hover:bg-[#fbfbf6] md:grid-cols-[1fr_130px_130px_100px] md:items-center">
                    <div><p className="font-semibold">{item.class_name}</p><p className="text-sm text-black/45">{item.teacher_name}</p></div>
                    <p className="text-sm text-black/58">{item.sessions_total} sessions</p>
                    <p className="text-sm text-black/58">{item.students_submitted} students</p>
                    <span className="rounded-xl bg-[#edf7f3] px-3 py-2 text-center text-sm font-semibold text-[#276a5b]">{item.average_score}%</span>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>
        </section>
        {notice ? <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black/62">{notice}</p> : null}
      </div>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[28px] border border-black/8 bg-white/82 p-5 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">{children}</section>;
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <FieldShell label={label}><input value={value} onChange={(event) => onChange(event.target.value)} className={premiumInputClass} /></FieldShell>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string | number }) {
  return <div className="rounded-2xl border border-black/8 bg-white p-4 shadow-[0_14px_36px_rgba(21,23,19,0.05)]"><Icon className="size-4 text-[#276a5b]" /><p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/38">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>;
}
