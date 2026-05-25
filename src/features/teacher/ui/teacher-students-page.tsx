"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TopicBreakdownChart } from "@/components/questlab/charts/topic-breakdown-chart";
import { EmptyState } from "@/components/questlab/feedback/empty-state";
import { PageHeader } from "@/components/questlab/layout/page-header";
import { QuestPage } from "@/components/questlab/layout/quest-page";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ApiClassResults, ApiClassStudent, ApiTeacherClass } from "@/shared/api/questlab-api";

type StudentRow = {
  student_name: string;
  student_code: string;
  class_name: string;
  class_slug: string;
  completed: number;
  average_score: number;
  last_submitted_at: string | null;
};

export function TeacherStudentsPage({ classes, results, rosters = [] }: { classes: ApiTeacherClass[]; results: ApiClassResults[]; rosters?: ApiClassStudent[][] }) {
  const [query, setQuery] = useState("");
  const students = useMemo<StudentRow[]>(() => {
    const progressRows = results.flatMap((result) =>
      result.student_progress.map((student) => ({
        ...student,
        class_name: result.classroom.name,
        class_slug: result.classroom.slug,
      })),
    );
    const existing = new Set(progressRows.map((student) => `${student.class_slug}:${student.student_code}`));
    const rosterRows = rosters.flatMap((rows, index) => rows.map((student) => {
      const classroom = classes[index];
      return {
        student_name: student.name,
        student_code: student.student_code || String(student.id),
        class_name: classroom?.name ?? "Class",
        class_slug: classroom?.slug ?? "",
        completed: 0,
        average_score: 0,
        last_submitted_at: null,
      };
    })).filter((student) => !existing.has(`${student.class_slug}:${student.student_code}`));
    return [...progressRows, ...rosterRows];
  }, [classes, results, rosters]);
  const filtered = students.filter((student) => `${student.student_name} ${student.student_code} ${student.class_name}`.toLowerCase().includes(query.toLowerCase()));
  const average = students.length ? Math.round(students.reduce((sum, item) => sum + item.average_score, 0) / students.length) : 0;
  const studentRows = [...students].sort((a, b) => a.average_score - b.average_score).slice(0, 8).map((student) => ({
    label: student.student_name,
    value: student.average_score,
    meta: `${student.class_name} / ${student.completed} tests`,
  }));

  return (
    <QuestPage variant="table">
      <PageHeader eyebrow="Teacher" title="Students" copy="Student progress across your classes, sorted for quick intervention." />
      <div className="quest-metric-grid">
        <Metric label="Classes" value={classes.length} />
        <Metric label="Students" value={students.length} />
        <Metric label="Average score" value={`${average}%`} />
        <Metric label="Needs review" value={students.filter((item) => item.average_score < 70).length} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Student table</h2>
            <div className="flex min-w-[280px] items-center gap-2 rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2">
              <Search className="size-4 text-subtle" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student, code or class..." className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-line">
            <div className="grid grid-cols-[1fr_1fr_120px_120px_180px] gap-3 border-b border-line bg-surface-soft px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle max-lg:hidden">
              <span>Student</span><span>Class</span><span>Completed</span><span>Average</span><span>Last submit</span>
            </div>
            {filtered.map((student) => (
              <Link key={`${student.class_slug}-${student.student_code}`} href={`/teacher/students/${student.student_code}`} className="grid gap-3 border-b border-line px-4 py-4 hover:bg-surface-soft lg:grid-cols-[1fr_1fr_120px_120px_180px] lg:items-center">
                <div>
                  <p className="font-semibold">{student.student_name}</p>
                  <p className="mt-1 text-xs text-muted">{student.student_code}</p>
                </div>
                <p className="text-sm font-semibold text-muted">{student.class_name}</p>
                <p className="text-sm text-muted">{student.completed} tests</p>
                <Badge variant={student.average_score >= 70 ? "success" : student.average_score > 0 ? "warning" : "default"}>{student.average_score ? `${student.average_score}%` : "No data"}</Badge>
                <p className="text-sm text-muted">{student.last_submitted_at ? new Date(student.last_submitted_at).toLocaleString() : "No submit"}</p>
              </Link>
            ))}
            {!filtered.length ? <div className="p-5"><EmptyState title="No student results yet" /></div> : null}
          </div>
        </Card>
        <aside className="grid h-fit gap-5 xl:sticky xl:top-24">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Lowest averages</h2>
            <div className="mt-4"><TopicBreakdownChart rows={studentRows} color="var(--warning)" /></div>
          </Card>
        </aside>
      </div>
    </QuestPage>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="quest-stat-card flex items-center justify-between gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </Card>
  );
}
