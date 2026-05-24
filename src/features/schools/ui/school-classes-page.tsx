"use client";

import { BarChart3, GraduationCap, Plus, Search, UsersRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { ApiSchool, ApiSchoolTeacher, ApiTeacherClass } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getSchoolManageCode, saveTeacherManageCode } from "@/shared/model/local-identity";
import { Eyebrow, FieldShell, PremiumPanel, premiumInputClass } from "@/shared/ui/premium-shell";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export function SchoolClassesPage({ school, initialClasses, teachers }: { school: ApiSchool; initialClasses: ApiTeacherClass[]; teachers: ApiSchoolTeacher[] }) {
  const [classes, setClasses] = useState(initialClasses);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("Algebra Group A");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? 0);
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [joinCode, setJoinCode] = useState("1234");
  const [description, setDescription] = useState("School class progress tracking.");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = classes.filter((item) => `${item.name} ${item.teacher_name} ${item.description}`.toLowerCase().includes(query.toLowerCase()));

  async function createClass() {
    const teacher = teachers.find((item) => item.id === teacherId);
    if (!teacher || !name.trim()) {
      setNotice("Class name va teacher kerak.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const classroom = await questApi.createSchoolClass(school.slug, {
        name,
        slug: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
        teacher_name: teacher.name,
        visibility,
        join_code: visibility === "private" ? joinCode : "",
        manage_code: getSchoolManageCode(school.slug),
        description,
        teacher_id: teacher.id,
      });
      saveTeacherManageCode(classroom.slug, classroom.manage_code);
      setClasses((items) => [classroom, ...items]);
      setNotice("Class yaratildi va teacherga bog'landi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Class create failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <PremiumPanel>
        <Eyebrow>School classes</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold">Create class</h1>
        <div className="mt-6 grid gap-4">
          <FieldShell label="Class name"><input value={name} onChange={(event) => setName(event.target.value)} className={premiumInputClass} /></FieldShell>
          <FieldShell label="Teacher">
            <select value={teacherId} onChange={(event) => setTeacherId(Number(event.target.value))} className={premiumInputClass}>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} / {teacher.email || "no email"}</option>)}
            </select>
          </FieldShell>
          <FieldShell label="Visibility">
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")} className={premiumInputClass}>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </FieldShell>
          {visibility === "private" ? <FieldShell label="Join code"><input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} className={premiumInputClass} /></FieldShell> : null}
          <FieldShell label="Description"><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className={premiumInputClass} /></FieldShell>
          <button onClick={createClass} disabled={busy || !teachers.length} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4" />Create class</button>
          {!teachers.length ? <p className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">Avval teacher yarating.</p> : null}
          {notice ? <p className="rounded-2xl bg-brand-soft p-3 text-sm font-semibold text-brand">{notice}</p> : null}
        </div>
      </PremiumPanel>

      <PremiumPanel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>{school.name}</Eyebrow>
            <h2 className="mt-2 text-3xl font-semibold">Classes</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric icon={GraduationCap} label="Classes" value={classes.length} />
            <Metric icon={UsersRound} label="Students" value={classes.reduce((sum, item) => sum + item.student_count, 0)} />
            <Metric icon={BarChart3} label="Sessions" value={classes.reduce((sum, item) => sum + item.assignment_count, 0)} />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3">
          <Search className="size-4 text-black/35" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Class yoki teacher qidirish..." className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <Link key={item.id} href={`/schools/classes/${item.slug}`} className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-surface-soft">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-lg font-semibold">{item.name}</p><p className="mt-1 text-sm text-black/52">{item.teacher_name}</p></div>
                <span className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold text-brand">{item.visibility}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-black/58">{item.description || "No description"}</p>
              <div className="mt-5 flex gap-2 text-xs font-semibold text-black/45"><span>{item.student_count} students</span><span>{item.assignment_count} sessions</span></div>
            </Link>
          ))}
          {!filtered.length ? <p className="rounded-3xl border border-dashed border-black/12 bg-white p-8 text-sm text-black/56 md:col-span-2">Bu school uchun class yo&apos;q.</p> : null}
        </div>
      </PremiumPanel>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string | number }) {
  return <div className="rounded-2xl border border-black/8 bg-white p-4"><Icon className="size-4 text-brand" /><p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}
