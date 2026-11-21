"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";

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
      <div className="flex items-center gap-2.5 rounded-xl border border-black/8 bg-white px-3.5 py-2.5 shadow-sm">
        <Search className="size-4 text-black/40" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="O'quvchi, sinf, holat bo'yicha qidirish..." className="w-full bg-transparent text-sm outline-none placeholder:text-black/40" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_1fr_120px_120px_140px_180px] gap-3 border-b border-black/8 bg-[#fafaf8] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-black/40 max-lg:hidden">
          <span>O&apos;quvchi</span><span>Sinf</span><span>Holat</span><span>Topshirildi</span><span>O&apos;rtacha</span><span>Oxirgi topshirish</span>
        </div>
        {filtered.map((student) => (
          <Link key={student.studentCode} href={`/school/students/${student.studentCode}`} className="grid gap-3 border-b border-black/6 px-4 py-3.5 transition hover:bg-[#fafaf8] last:border-b-0 lg:grid-cols-[1fr_1fr_120px_120px_140px_180px] lg:items-center">
            <div><p className="font-semibold text-ink">{student.studentName}</p><p className="mt-0.5 text-xs text-black/45">{student.studentCode}</p></div>
            <p className="text-sm text-black/60">{student.classNames.join(", ") || "Sinf yo'q"}</p>
            <div><Badge variant={student.status === "strong" || student.status === "good" ? "success" : student.status === "needs_review" ? "warning" : "default"}>{student.status.replace("_", " ")}</Badge></div>
            <p className="text-sm text-black/60">{student.completed} test</p>
            <div><Badge variant={student.averageScore >= 70 ? "success" : student.averageScore > 0 ? "warning" : "default"}>{student.averageScore ? `${student.averageScore}%` : "Yo'q"}</Badge></div>
            <p className="text-xs text-black/50">{student.lastSubmittedAt ? new Date(student.lastSubmittedAt).toLocaleString() : "Topshirilmagan"}</p>
          </Link>
        ))}
        {!filtered.length ? <div className="p-6 text-center text-sm text-black/50">O&apos;quvchi topilmadi.</div> : null}
      </div>
    </div>
  );
}
