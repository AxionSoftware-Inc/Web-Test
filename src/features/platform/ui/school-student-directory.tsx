"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { EmptyState as QuestEmptyState } from "@/components/questlab/feedback/empty-state";

export type SchoolStudentDirectoryRow = {
  studentCode: string;
  studentName: string;
  classNames: string[];
  classSlug: string;
  completed: number;
  averageScore: number;
  lastSubmittedAt?: string | null;
  status: "strong" | "good" | "needs_review" | "no_data";
};

export function SchoolStudentDirectory({ students }: { students: SchoolStudentDirectoryRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.toLowerCase();
    return students.filter((student) => `${student.studentName} ${student.studentCode} ${student.classNames.join(" ")} ${student.status}`.toLowerCase().includes(value));
  }, [query, students]);

  return (
    <div className="mt-4 grid gap-3">
      <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface-soft px-3 py-2">
        <Search className="size-4 text-subtle" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Student, class, status..." className="w-full bg-transparent text-sm outline-none" />
      </div>
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
        <div className="grid grid-cols-[1fr_1fr_120px_120px_140px_180px] gap-3 border-b border-line bg-surface-soft px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-subtle max-lg:hidden">
          <span>Student</span><span>Class</span><span>Status</span><span>Completed</span><span>Average</span><span>Last submit</span>
        </div>
        {filtered.map((student) => (
          <Link key={student.studentCode} href={`/school/students/${student.studentCode}`} className="grid gap-3 border-b border-line px-4 py-4 hover:bg-surface-soft lg:grid-cols-[1fr_1fr_120px_120px_140px_180px] lg:items-center">
            <div><p className="font-semibold">{student.studentName}</p><p className="mt-1 text-xs text-muted">{student.studentCode}</p></div>
            <p className="text-sm text-muted">{student.classNames.join(", ") || "No class"}</p>
            <Badge variant={student.status === "strong" || student.status === "good" ? "success" : student.status === "needs_review" ? "warning" : "default"}>{student.status.replace("_", " ")}</Badge>
            <p className="text-sm text-muted">{student.completed} tests</p>
            <Badge variant={student.averageScore >= 70 ? "success" : student.averageScore > 0 ? "warning" : "default"}>{student.averageScore ? `${student.averageScore}%` : "No data"}</Badge>
            <p className="text-sm text-muted">{student.lastSubmittedAt ? new Date(student.lastSubmittedAt).toLocaleString() : "No submit"}</p>
          </Link>
        ))}
        {!filtered.length ? <div className="p-5"><QuestEmptyState title="No students found" /></div> : null}
      </div>
    </div>
  );
}
