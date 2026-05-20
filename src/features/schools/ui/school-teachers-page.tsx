"use client";

import { BarChart3, GraduationCap, Plus, Search, UsersRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { ApiSchool, ApiSchoolTeacher, ApiTeacherClass } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getSchoolManageCode } from "@/shared/model/local-identity";
import { Eyebrow, FieldShell, PremiumPanel, premiumInputClass } from "@/shared/ui/premium-shell";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export function SchoolTeachersPage({ school, initialTeachers, classes }: { school: ApiSchool; initialTeachers: ApiSchoolTeacher[]; classes: ApiTeacherClass[] }) {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("Math teacher");
  const [email, setEmail] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = teachers.filter((teacher) => `${teacher.name} ${teacher.email} ${teacher.teacher_code}`.toLowerCase().includes(query.toLowerCase()));

  async function createTeacher() {
    if (!name.trim()) {
      setNotice("Teacher name kerak.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const teacher = await questApi.createSchoolTeacher(school.slug, {
        name,
        email,
        teacher_code: `${slugify(name)}-${Date.now().toString().slice(-4)}`,
        classes: selectedClasses,
        manage_code: getSchoolManageCode(school.slug),
      });
      setTeachers((items) => [teacher, ...items]);
      setNotice("Teacher yaratildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Teacher create failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <PremiumPanel>
        <Eyebrow>School teachers</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold">Create teacher</h1>
        <div className="mt-6 grid gap-4">
          <FieldShell label="Teacher name"><input value={name} onChange={(event) => setName(event.target.value)} className={premiumInputClass} /></FieldShell>
          <FieldShell label="Email"><input value={email} onChange={(event) => setEmail(event.target.value)} className={premiumInputClass} /></FieldShell>
          <FieldShell label="Attach classes">
            <select multiple value={selectedClasses.map(String)} onChange={(event) => setSelectedClasses(Array.from(event.target.selectedOptions).map((option) => Number(option.value)))} className="min-h-36 rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none">
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name} / {item.teacher_name}</option>)}
            </select>
          </FieldShell>
          <button onClick={createTeacher} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4" />Create teacher</button>
          {notice ? <p className="rounded-2xl bg-[#edf7f3] p-3 text-sm font-semibold text-[#276a5b]">{notice}</p> : null}
        </div>
      </PremiumPanel>

      <PremiumPanel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow>{school.name}</Eyebrow>
            <h2 className="mt-2 text-3xl font-semibold">Teachers</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric icon={UsersRound} label="Teachers" value={teachers.length} />
            <Metric icon={GraduationCap} label="Classes" value={classes.length} />
            <Metric icon={BarChart3} label="Linked" value={teachers.reduce((sum, item) => sum + item.class_count, 0)} />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3">
          <Search className="size-4 text-black/35" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Teacher qidirish..." className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {filtered.map((teacher) => (
            <Link key={teacher.id} href={`/schools/teachers/${teacher.id}`} className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-[#fbfbf8]">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-lg font-semibold">{teacher.name}</p><p className="mt-1 text-sm text-black/52">{teacher.email || "No email"}</p></div>
                <span className="rounded-xl bg-[#edf7f3] px-3 py-2 text-xs font-semibold text-[#276a5b]">{teacher.is_active ? "active" : "inactive"}</span>
              </div>
              <p className="mt-4 text-sm text-black/58">Code: {teacher.teacher_code || "not set"}</p>
              <p className="mt-5 text-xs font-semibold text-black/45">{teacher.class_count} linked classes</p>
            </Link>
          ))}
        </div>
      </PremiumPanel>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string | number }) {
  return <div className="rounded-2xl border border-black/8 bg-white p-4"><Icon className="size-4 text-[#276a5b]" /><p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}
