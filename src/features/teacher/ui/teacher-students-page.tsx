"use client";

import { BarChart3, GraduationCap, Search, UsersRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { ApiClassResults, ApiTeacherClass } from "@/shared/api/questlab-api";
import { Eyebrow, PremiumPanel } from "@/shared/ui/premium-shell";

type StudentRow = {
  student_name: string;
  student_code: string;
  class_name: string;
  class_slug: string;
  completed: number;
  average_score: number;
  last_submitted_at: string | null;
};

export function TeacherStudentsPage({ classes, results }: { classes: ApiTeacherClass[]; results: ApiClassResults[] }) {
  const [query, setQuery] = useState("");
  const students = useMemo<StudentRow[]>(() => {
    return results.flatMap((result) =>
      result.student_progress.map((student) => ({
        ...student,
        class_name: result.classroom.name,
        class_slug: result.classroom.slug,
      })),
    );
  }, [results]);
  const filtered = students.filter((student) => `${student.student_name} ${student.student_code} ${student.class_name}`.toLowerCase().includes(query.toLowerCase()));
  const average = students.length ? Math.round(students.reduce((sum, item) => sum + item.average_score, 0) / students.length) : 0;

  return (
    <PremiumPanel>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow>Teacher students</Eyebrow>
          <h1 className="mt-2 text-3xl font-semibold">Students</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">Teacher classlaridagi barcha o&apos;quvchilar, progress va oxirgi topshirilgan natijalar.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Metric icon={GraduationCap} label="Classes" value={classes.length} />
          <Metric icon={UsersRound} label="Students" value={students.length} />
          <Metric icon={BarChart3} label="Avg" value={`${average}%`} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3">
        <Search className="size-4 text-black/35" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Student, code yoki class qidirish..." className="w-full bg-transparent text-sm outline-none" />
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-black/8 bg-white">
        <div className="grid grid-cols-[1fr_1fr_120px_120px_180px] gap-3 border-b border-black/8 bg-[#fbfbf6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-black/40 max-lg:hidden">
          <span>Student</span>
          <span>Class</span>
          <span>Completed</span>
          <span>Average</span>
          <span>Last submit</span>
        </div>
        {filtered.map((student) => (
          <Link key={`${student.class_slug}-${student.student_code}`} href={`/teacher/classes/${student.class_slug}`} className="grid gap-3 border-b border-black/6 px-4 py-4 hover:bg-[#fbfbf6] lg:grid-cols-[1fr_1fr_120px_120px_180px] lg:items-center">
            <div>
              <p className="font-semibold">{student.student_name}</p>
              <p className="mt-1 text-xs text-black/45">{student.student_code}</p>
            </div>
            <p className="text-sm font-semibold text-black/58">{student.class_name}</p>
            <p className="text-sm text-black/58">{student.completed} tests</p>
            <span className="w-fit rounded-xl bg-[#edf7f3] px-3 py-2 text-sm font-semibold text-[#276a5b]">{student.average_score}%</span>
            <p className="text-sm text-black/48">{student.last_submitted_at ? new Date(student.last_submitted_at).toLocaleString() : "No submit"}</p>
          </Link>
        ))}
        {!filtered.length ? <p className="p-6 text-sm text-black/56">Hali student natijalari yo&apos;q.</p> : null}
      </div>
    </PremiumPanel>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <Icon className="size-4 text-[#276a5b]" />
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
