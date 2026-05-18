"use client";

import {
  BarChart3,
  CheckCircle2,
  Clipboard,
  Download,
  Eye,
  FileJson,
  FileUp,
  Link2,
  Plus,
  Search,
  Upload,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import type { ApiClassAssignment, ApiClassResults, ApiTeacherClass, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { cn } from "@/shared/lib/cn";
import { getTeacherManageCode } from "@/shared/model/local-identity";
import { Eyebrow, FieldShell, premiumInputClass } from "@/shared/ui/premium-shell";

type Props = {
  classroom: ApiTeacherClass;
  initialAssignments: ApiClassAssignment[];
  results: ApiClassResults;
  tests: ApiTest[];
};

export function TeacherClassDashboard({ classroom, initialAssignments, results, tests }: Props) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedTestId, setSelectedTestId] = useState(tests[0]?.id ?? 0);
  const [assignmentTitle, setAssignmentTitle] = useState(tests[0]?.title ?? "");
  const [isActive, setIsActive] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resultRows = results.results;
  const activeAssignments = assignments.filter((item) => item.is_active).length;
  const studentCount = new Set(resultRows.map((item) => item.student_name)).size || classroom.student_count;
  const csvExport = useMemo(() => {
    return [
      "student,test,assignment,score,correct,total,submitted_at",
      ...resultRows.map((item) =>
        [item.student_name, item.test_title, item.assignment_title, item.score, item.correct, item.total, item.submitted_at ?? ""]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
  }, [resultRows]);

  const filteredAssignments = assignments.filter((item) => {
    const text = `${item.title} ${item.test_title} ${item.difficulty}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  async function addAssignment() {
    if (!selectedTestId) return;
    setBusy(true);
    setNotice("");
    try {
      const created = await questApi.createClassAssignment(classroom.slug, {
        test: selectedTestId,
        title: assignmentTitle || tests.find((test) => test.id === selectedTestId)?.title || "Class test",
        is_active: isActive,
        manage_code: getTeacherManageCode(classroom.slug),
      });
      setAssignments((items) => [created, ...items]);
      setNotice("Assignment qo'shildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Assignment qo'shishda xatolik.");
    } finally {
      setBusy(false);
    }
  }

  async function copyStudentLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/class/${classroom.slug}`);
    setNotice("Student link clipboardga olindi.");
  }

  function downloadFile(name: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = name;
    link.click();
    URL.revokeObjectURL(href);
  }

  function exportResults() {
    downloadFile(`${classroom.slug}-results.csv`, csvExport, "text/csv;charset=utf-8");
  }

  function exportClassJson() {
    downloadFile(
      `${classroom.slug}-class.json`,
      JSON.stringify({ classroom, assignments, results }, null, 2),
      "application/json;charset=utf-8",
    );
  }

  async function importAssignments(file: File) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const rows = lines[0]?.toLowerCase().includes("test_slug") ? lines.slice(1) : lines;
    const testBySlug = new Map(tests.map((test) => [test.slug, test]));
    const created: ApiClassAssignment[] = [];
    setBusy(true);
    setNotice("");
    try {
      for (const row of rows) {
        const [testSlug, title, activeValue] = row.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
        const test = testBySlug.get(testSlug);
        if (!test) continue;
        const assignment = await questApi.createClassAssignment(classroom.slug, {
          test: test.id,
          title: title || test.title,
          is_active: activeValue ? activeValue.toLowerCase() !== "false" : true,
          manage_code: getTeacherManageCode(classroom.slug),
        });
        created.push(assignment);
      }
      setAssignments((items) => [...created, ...items]);
      setNotice(created.length ? `${created.length} ta assignment import qilindi.` : "Mos test_slug topilmadi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7ef] px-5 py-8 text-[#151713] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[32px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(21,23,19,0.09)]">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <Eyebrow>Teacher workspace</Eyebrow>
              <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{classroom.name}</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-black/58">{classroom.description || "Class description qo'shilmagan."}</p>
                </div>
                <span className="rounded-2xl bg-[#edf7f3] px-4 py-3 text-sm font-semibold capitalize text-[#276a5b]">{classroom.visibility}</span>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                <ActionButton icon={Link2} onClick={copyStudentLink}>Copy student link</ActionButton>
                <ActionButton icon={Download} onClick={exportResults}>Export results CSV</ActionButton>
                <ActionButton icon={FileJson} onClick={exportClassJson}>Export JSON</ActionButton>
                <ActionButton icon={Upload} onClick={() => fileInputRef.current?.click()}>Import CSV</ActionButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importAssignments(file);
                  }}
                />
              </div>
              {notice ? <p className="mt-4 rounded-2xl bg-[#fbfbf6] px-4 py-3 text-sm font-semibold text-black/62">{notice}</p> : null}
            </div>
            <div className="border-t border-black/8 bg-[#151713] p-6 text-white lg:border-l lg:border-t-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">Class health</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric icon={Clipboard} label="Assignments" value={assignments.length} dark />
                <Metric icon={CheckCircle2} label="Active" value={activeAssignments} dark />
                <Metric icon={UsersRound} label="Students" value={studentCount} dark />
                <Metric icon={BarChart3} label="Average" value={`${results.average_score}%`} dark />
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-[28px] border border-black/8 bg-white/82 p-5 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Eyebrow>Assignments</Eyebrow>
                <h2 className="mt-2 text-2xl font-semibold">Testlarni boshqarish</h2>
              </div>
              <Link href={`/teacher/classes/${classroom.slug}/assign`} className="inline-flex items-center gap-2 rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white">
                <Plus className="size-4" />
                Full assign page
              </Link>
            </div>

            <div className="mt-5 grid gap-4 rounded-3xl border border-black/8 bg-[#fbfbf6] p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <FieldShell label="Backend test">
                <select
                  value={selectedTestId}
                  onChange={(event) => {
                    const id = Number(event.target.value);
                    setSelectedTestId(id);
                    setAssignmentTitle(tests.find((test) => test.id === id)?.title ?? assignmentTitle);
                  }}
                  className={premiumInputClass}
                >
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>{test.title} / {test.difficulty}</option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell label="Assignment title">
                <input value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} className={premiumInputClass} />
              </FieldShell>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsActive((value) => !value)}
                  className={cn("rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold", isActive ? "bg-[#edf7f3] text-[#276a5b]" : "bg-white text-black/55")}
                >
                  {isActive ? "Active" : "Paused"}
                </button>
                <button onClick={addAssignment} disabled={busy || !selectedTestId} className="inline-flex items-center gap-2 rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                  <Plus className="size-4" />
                  Add
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3">
              <Search className="size-4 text-black/35" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Assignment qidirish..." className="w-full bg-transparent text-sm font-medium outline-none" />
            </div>

            <div className="mt-5 grid gap-3">
              {filteredAssignments.map((item) => (
                <article key={item.id} className="grid gap-4 rounded-3xl border border-black/8 bg-white p-4 transition hover:shadow-[0_16px_45px_rgba(21,23,19,0.08)] md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", item.is_active ? "bg-[#edf7f3] text-[#276a5b]" : "bg-black/5 text-black/45")}>{item.is_active ? "Active" : "Paused"}</span>
                    </div>
                    <p className="mt-2 text-sm text-black/52">{item.test_title} / {item.difficulty} / {item.question_count} questions</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/class/${classroom.slug}/assignments/${item.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]">
                      <Eye className="size-4" />
                      Student view
                    </Link>
                    <Link href={`/tests/${item.test_slug}`} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]">
                      Open test
                    </Link>
                  </div>
                </article>
              ))}
              {!filteredAssignments.length ? (
                <div className="rounded-3xl border border-dashed border-black/12 bg-white p-8 text-center">
                  <FileUp className="mx-auto size-9 text-black/28" />
                  <h3 className="mt-3 text-lg font-semibold">Assignment yo&apos;q</h3>
                  <p className="mt-2 text-sm text-black/52">Test tanlab Add bosing yoki CSV import qiling. Format: test_slug,title,is_active</p>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="grid gap-6">
            <section className="rounded-[28px] border border-black/8 bg-[#151713] p-5 text-white shadow-[0_18px_55px_rgba(21,23,19,0.11)]">
              <h2 className="text-2xl font-semibold">Weak skills</h2>
              <div className="mt-4 grid gap-3">
                {results.weak_skills.length ? results.weak_skills.map((item) => (
                  <div key={item.skill} className="rounded-2xl bg-white/8 p-4">
                    <div className="flex justify-between gap-3 text-sm font-semibold">
                      <span>{item.skill}</span>
                      <span>{item.percent}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/12">
                      <div className="h-2 rounded-full bg-[#8fd6bd]" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                )) : <p className="text-sm leading-6 text-white/65">Studentlar test topshirgandan keyin weak skilllar shu yerda chiqadi.</p>}
              </div>
            </section>

            <section className="rounded-[28px] border border-black/8 bg-white/82 p-5 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">
              <h2 className="text-2xl font-semibold">Import format</h2>
              <div className="mt-4 rounded-2xl bg-[#fbfbf6] p-4 font-mono text-xs leading-6 text-black/62">
                test_slug,title,is_active<br />
                algebra-basics,Algebra warmup,true<br />
                linear-equations,Linear equations,true
              </div>
              <button
                onClick={() => downloadFile("class-assignment-template.csv", "test_slug,title,is_active\nalgebra-basics,Algebra warmup,true\n", "text/csv;charset=utf-8")}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]"
              >
                <Download className="size-4" />
                Download template
              </button>
            </section>
          </aside>
        </section>

        <section className="mt-6 rounded-[28px] border border-black/8 bg-white/82 p-5 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Eyebrow>Results</Eyebrow>
              <h2 className="mt-2 text-2xl font-semibold">Student results</h2>
            </div>
            <button onClick={exportResults} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]">
              <Download className="size-4" />
              Export table
            </button>
          </div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-black/8 bg-white">
            <div className="grid grid-cols-[1.1fr_1fr_100px_110px] gap-3 border-b border-black/8 bg-[#fbfbf6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-black/40 max-md:hidden">
              <span>Student</span>
              <span>Assignment</span>
              <span>Correct</span>
              <span>Score</span>
            </div>
            {resultRows.map((item) => (
              <Link key={item.session_id} href={`/results/${item.session_id}`} className="grid gap-3 border-b border-black/6 px-4 py-4 hover:bg-[#fbfbf6] md:grid-cols-[1.1fr_1fr_100px_110px] md:items-center">
                <div>
                  <p className="font-semibold">{item.student_name}</p>
                  <p className="mt-1 text-xs text-black/45">{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : "Submitted"}</p>
                </div>
                <p className="text-sm text-black/58">{item.assignment_title || item.test_title}</p>
                <p className="text-sm font-semibold text-black/62">{item.correct}/{item.total}</p>
                <span className="rounded-xl bg-[#edf7f3] px-3 py-2 text-center text-sm font-semibold text-[#276a5b]">{item.score}%</span>
              </Link>
            ))}
            {!resultRows.length ? <p className="p-6 text-sm text-black/56">Hali submitted natijalar yo&apos;q.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function ActionButton({ icon: Icon, children, onClick }: { icon: typeof Link2; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]">
      <Icon className="size-4" />
      {children}
    </button>
  );
}

function Metric({ icon: Icon, label, value, dark = false }: { icon: typeof Clipboard; label: string; value: string | number; dark?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-4", dark ? "bg-white/8" : "bg-[#fbfbf8]")}>
      <Icon className={cn("size-4", dark ? "text-[#8fd6bd]" : "text-[#276a5b]")} />
      <p className={cn("mt-3 text-xs font-semibold uppercase tracking-[0.14em]", dark ? "text-white/45" : "text-black/40")}>{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
