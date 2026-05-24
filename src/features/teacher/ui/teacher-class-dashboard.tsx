"use client";

import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clipboard,
  Download,
  Eye,
  FileJson,
  FileUp,
  Link2,
  Plus,
  Search,
  Send,
  ToggleLeft,
  ToggleRight,
  Trash2,
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
  const [mode, setMode] = useState<ApiClassAssignment["mode"]>("session");
  const [dueAt, setDueAt] = useState("");
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [showAnswersAfterDeadline, setShowAnswersAfterDeadline] = useState(false);
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [gradingPolicy, setGradingPolicy] = useState<ApiClassAssignment["grading_policy"]>("best");
  const [isActive, setIsActive] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resultRows = results.results;
  const activeAssignments = assignments.filter((item) => item.is_active).length;
  const studentCount = results.students_total || results.students_submitted || classroom.student_count;
  const studentProgress = results.student_progress ?? [];
  const sessionStats = results.assignment_stats ?? [];
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
        mode,
        due_at: mode === "homework" && dueAt ? new Date(dueAt).toISOString() : null,
        attempt_limit: mode === "homework" ? Math.max(1, attemptLimit) : 1,
        show_answers_after_deadline: mode === "homework" ? showAnswersAfterDeadline : false,
        allow_late_submission: mode === "homework" ? allowLateSubmission : false,
        grading_policy: mode === "homework" ? gradingPolicy : "best",
        is_active: isActive,
        manage_code: getTeacherManageCode(classroom.slug),
      });
      setAssignments((items) => [created, ...items]);
      setAssignmentTitle(tests.find((test) => test.id === selectedTestId)?.title ?? "");
      setNotice(mode === "homework" ? "Homework yaratildi. Linkni o'quvchilarga yuborishingiz mumkin." : "Test session ochildi. Endi student linkini o'quvchilarga yuborishingiz mumkin.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Test session ochishda xatolik.");
    } finally {
      setBusy(false);
    }
  }

  async function copyStudentLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/class/${classroom.slug}`);
      setNotice("Student link clipboardga olindi.");
    } catch {
      setNotice(`/class/${classroom.slug}`);
    }
  }

  async function copySessionLink(assignmentId: number) {
    const href = `${window.location.origin}/class/${classroom.slug}/assignments/${assignmentId}`;
    try {
      await navigator.clipboard.writeText(href);
      setNotice("Session link clipboardga olindi.");
    } catch {
      setNotice(href);
    }
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
    const rowsToImport: Array<{
      test_slug: string;
      title: string;
      is_active: boolean;
      mode: ApiClassAssignment["mode"];
      due_at: string | null;
      attempt_limit: number;
      show_answers_after_deadline: boolean;
      allow_late_submission: boolean;
      grading_policy: ApiClassAssignment["grading_policy"];
    }> = [];
    setBusy(true);
    setNotice("");
    try {
      for (const row of rows) {
        const [testSlug, title, activeValue, modeValue, dueValue, attemptValue, showValue, lateValue, gradingValue] = row.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
        rowsToImport.push({
          test_slug: testSlug,
          title,
          is_active: activeValue ? activeValue.toLowerCase() !== "false" : true,
          mode: modeValue === "homework" ? "homework" : "session",
          due_at: dueValue || null,
          attempt_limit: Number(attemptValue || 1),
          show_answers_after_deadline: showValue ? showValue.toLowerCase() === "true" : false,
          allow_late_submission: lateValue ? lateValue.toLowerCase() === "true" : false,
          grading_policy: gradingValue === "latest" || gradingValue === "first" ? gradingValue : "best",
        });
      }
      const imported = await questApi.bulkCreateClassAssignments(classroom.slug, {
        manage_code: getTeacherManageCode(classroom.slug),
        assignments: rowsToImport,
      });
      const created = imported.created;
      setAssignments((items) => [...created, ...items]);
      setNotice(created.length ? `${created.length} ta session import qilindi. ${imported.skipped.length} ta qator o'tkazib yuborildi.` : "Mos test_slug topilmadi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function toggleAssignment(assignment: ApiClassAssignment) {
    setBusy(true);
    setNotice("");
    try {
      const updated = await questApi.updateClassAssignment(classroom.slug, assignment.id, {
        is_active: !assignment.is_active,
        manage_code: getTeacherManageCode(classroom.slug),
      });
      setAssignments((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(updated.is_active ? "Session ochildi." : "Session yopildi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Session update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAssignment(assignment: ApiClassAssignment) {
    setBusy(true);
    setNotice("");
    try {
      const deleted = await questApi.deleteClassAssignment(classroom.slug, assignment.id, getTeacherManageCode(classroom.slug));
      if (deleted) {
        setAssignments((items) => items.map((item) => (item.id === deleted.id ? deleted : item)));
        setNotice("Sessionda natija borligi uchun yopildi.");
      } else {
        setAssignments((items) => items.filter((item) => item.id !== assignment.id));
        setNotice("Session o'chirildi.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Session delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-ink sm:px-8 lg:px-10">
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
                <span className="rounded-2xl bg-brand-soft px-4 py-3 text-sm font-semibold capitalize text-brand">{classroom.visibility}</span>
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
              {notice ? <p className="mt-4 rounded-2xl bg-surface-soft px-4 py-3 text-sm font-semibold text-black/62">{notice}</p> : null}
            </div>
            <div className="border-t border-black/8 bg-ink p-6 text-white lg:border-l lg:border-t-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">Class health</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric icon={Clipboard} label="Sessions" value={assignments.length} dark />
                <Metric icon={CheckCircle2} label="Open" value={activeAssignments} dark />
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
                <Eyebrow>Test sessions</Eyebrow>
                <h2 className="mt-2 text-2xl font-semibold">Class ichida sessiya ochish</h2>
              </div>
              <Link href={`/teacher/classes/${classroom.slug}/assign`} className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">
                <Plus className="size-4" />
                Advanced setup
              </Link>
            </div>

            <div className="mt-5 grid gap-4 rounded-3xl border border-black/8 bg-surface-soft p-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_auto] xl:items-end">
              {!tests.length ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-black/55 lg:col-span-2 xl:col-span-3">Published test topilmadi. Avval CRUD orqali test yarating yoki draft testni published qiling.</p> : null}
              <FieldShell label="Backend test">
                <select
                  value={selectedTestId}
                  onChange={(event) => {
                    const id = Number(event.target.value);
                    setSelectedTestId(id);
                    setAssignmentTitle(tests.find((test) => test.id === id)?.title ?? assignmentTitle);
                  }}
                  className={premiumInputClass}
                  disabled={!tests.length}
                >
                  {tests.map((test) => (
                    <option key={test.id} value={test.id}>{test.title} / {test.difficulty}</option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell label="Session title">
                <input value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} className={premiumInputClass} />
              </FieldShell>
              <FieldShell label="Mode">
                <select value={mode} onChange={(event) => setMode(event.target.value as ApiClassAssignment["mode"])} className={premiumInputClass}>
                  <option value="session">Live session</option>
                  <option value="homework">Homework</option>
                </select>
              </FieldShell>
              {mode === "homework" ? (
                <>
                  <FieldShell label="Due date">
                    <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className={premiumInputClass} />
                  </FieldShell>
                  <FieldShell label="Attempt limit">
                    <input type="number" min={1} value={attemptLimit} onChange={(event) => setAttemptLimit(Number(event.target.value))} className={premiumInputClass} />
                  </FieldShell>
                  <FieldShell label="Grading">
                    <select value={gradingPolicy} onChange={(event) => setGradingPolicy(event.target.value as ApiClassAssignment["grading_policy"])} className={premiumInputClass}>
                      <option value="best">Best attempt</option>
                      <option value="latest">Latest attempt</option>
                      <option value="first">First attempt</option>
                    </select>
                  </FieldShell>
                  <button type="button" onClick={() => setShowAnswersAfterDeadline((value) => !value)} className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold", showAnswersAfterDeadline ? "border-accent bg-brand-soft text-brand" : "border-black/10 bg-white text-black/55")}>Show answers after due</button>
                  <button type="button" onClick={() => setAllowLateSubmission((value) => !value)} className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold", allowLateSubmission ? "border-amber-200 bg-amber-50 text-amber-700" : "border-black/10 bg-white text-black/55")}>Late submission</button>
                </>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsActive((value) => !value)}
                  className={cn("rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold", isActive ? "bg-brand-soft text-brand" : "bg-white text-black/55")}
                >
                  {isActive ? "Active" : "Paused"}
                </button>
                <button onClick={addAssignment} disabled={busy || !selectedTestId || !tests.length} className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                  <Plus className="size-4" />
                  {mode === "homework" ? "Create homework" : "Open session"}
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3">
              <Search className="size-4 text-black/35" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Session qidirish..." className="w-full bg-transparent text-sm font-medium outline-none" />
            </div>

            <div className="mt-5 grid gap-3">
              {filteredAssignments.map((item) => (
                <article key={item.id} className="grid gap-4 rounded-3xl border border-black/8 bg-white p-4 transition hover:shadow-[0_16px_45px_rgba(21,23,19,0.08)] md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold capitalize text-black/50">{item.mode}</span>
                      <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", item.is_active ? "bg-brand-soft text-brand" : "bg-black/5 text-black/45")}>{item.is_active ? "Active" : "Paused"}</span>
                    </div>
                    <p className="mt-2 text-sm text-black/52">{item.test_title} / {item.difficulty} / {item.question_count} questions</p>
                    {item.mode === "homework" ? (
                      <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-black/52">
                        <CalendarClock className="size-4 text-brand" />
                        Due: {item.due_at ? new Date(item.due_at).toLocaleString() : "No deadline"} / {item.attempt_limit} attempt
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void copySessionLink(item.id)} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-surface-soft">
                      <Send className="size-4" />
                      Copy link
                    </button>
                    <button onClick={() => void toggleAssignment(item)} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-surface-soft disabled:opacity-50">
                      {item.is_active ? <ToggleRight className="size-4 text-brand" /> : <ToggleLeft className="size-4 text-black/40" />}
                      {item.is_active ? "Close" : "Open"}
                    </button>
                    <button onClick={() => void removeAssignment(item)} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl border border-red-100 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                      <Trash2 className="size-4" />
                      Remove
                    </button>
                    <Link href={`/class/${classroom.slug}/assignments/${item.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-surface-soft">
                      <Eye className="size-4" />
                      Preview
                    </Link>
                    <Link href={`/tests/${item.test_slug}`} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-surface-soft">
                      Open test
                    </Link>
                  </div>
                </article>
              ))}
              {!filteredAssignments.length ? (
                <div className="rounded-3xl border border-dashed border-black/12 bg-white p-8 text-center">
                  <FileUp className="mx-auto size-9 text-black/28" />
                  <h3 className="mt-3 text-lg font-semibold">Session yo&apos;q</h3>
                  <p className="mt-2 text-sm text-black/52">Test tanlab session yoki homework yarating. CSV format: test_slug,title,is_active,mode,due_at,attempt_limit,show_answers_after_deadline,allow_late_submission,grading_policy</p>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="grid gap-6">
            <section className="rounded-[28px] border border-black/8 bg-ink p-5 text-white shadow-[0_18px_55px_rgba(21,23,19,0.11)]">
              <h2 className="text-2xl font-semibold">Weak skills</h2>
              <div className="mt-4 grid gap-3">
                {results.weak_skills.length ? results.weak_skills.map((item) => (
                  <div key={item.skill} className="rounded-2xl bg-white/8 p-4">
                    <div className="flex justify-between gap-3 text-sm font-semibold">
                      <span>{item.skill}</span>
                      <span>{item.percent}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/12">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                )) : <p className="text-sm leading-6 text-white/65">Studentlar test topshirgandan keyin weak skilllar shu yerda chiqadi.</p>}
              </div>
            </section>

            <section className="rounded-[28px] border border-black/8 bg-white/82 p-5 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">
              <h2 className="text-2xl font-semibold">Import format</h2>
              <div className="mt-4 rounded-2xl bg-surface-soft p-4 font-mono text-xs leading-6 text-black/62">
                test_slug,title,is_active,mode,due_at,attempt_limit,show_answers_after_deadline,allow_late_submission,grading_policy<br />
                algebra-basics,Algebra homework,true,homework,2026-05-25T18:00:00Z,2,true,true,best<br />
                linear-equations,Linear live,true,session,,1,false,false,best
              </div>
              <button
                onClick={() => downloadFile("class-assignment-template.csv", "test_slug,title,is_active,mode,due_at,attempt_limit,show_answers_after_deadline,allow_late_submission,grading_policy\nalgebra-basics,Algebra homework,true,homework,2026-05-25T18:00:00Z,2,true,true,best\n", "text/csv;charset=utf-8")}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-surface-soft"
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
              <Eyebrow>Session analytics</Eyebrow>
              <h2 className="mt-2 text-2xl font-semibold">Har bir sessiya bo&apos;yicha holat</h2>
            </div>
            <span className="rounded-2xl bg-surface-soft px-4 py-3 text-sm font-semibold text-black/52">
              {results.students_submitted}/{results.students_total || results.students_submitted} students submitted
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sessionStats.map((item) => (
              <article key={item.assignment_id} className="rounded-3xl border border-black/8 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.assignment_title}</p>
                    <p className="mt-1 text-sm text-black/50">{item.test_title}</p>
                    <p className="mt-1 text-xs font-semibold capitalize text-black/38">{item.mode}{item.due_at ? ` / due ${new Date(item.due_at).toLocaleDateString()}` : ""}</p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", item.is_active ? "bg-brand-soft text-brand" : "bg-black/5 text-black/45")}>
                    {item.is_active ? "Open" : "Closed"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                  <MiniMetric label="Attempts" value={item.attempts} />
                  <MiniMetric label="Students" value={item.unique_students} />
                  <MiniMetric label="Avg" value={`${item.average_score}%`} />
                  <MiniMetric label="Late" value={item.late_submissions} />
                </div>
                <button onClick={() => void copySessionLink(item.assignment_id)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold hover:bg-surface-soft">
                  <Link2 className="size-4" />
                  Copy session link
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-black/8 bg-white/82 p-5 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Eyebrow>Results</Eyebrow>
              <h2 className="mt-2 text-2xl font-semibold">Student results</h2>
            </div>
            <button onClick={exportResults} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-surface-soft">
              <Download className="size-4" />
              Export table
            </button>
          </div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-black/8 bg-white">
            <div className="grid grid-cols-[1.1fr_1fr_100px_110px] gap-3 border-b border-black/8 bg-surface-soft px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-black/40 max-md:hidden">
              <span>Student</span>
              <span>Assignment</span>
              <span>Correct</span>
              <span>Score</span>
            </div>
            {resultRows.map((item) => (
              <Link key={item.session_id} href={`/results/${item.session_id}`} className="grid gap-3 border-b border-black/6 px-4 py-4 hover:bg-surface-soft md:grid-cols-[1.1fr_1fr_100px_110px] md:items-center">
                <div>
                  <p className="font-semibold">{item.student_name}</p>
                  <p className="mt-1 text-xs text-black/45">{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : "Submitted"}</p>
                </div>
                <p className="text-sm text-black/58">{item.assignment_title || item.test_title}</p>
                <p className="text-sm font-semibold text-black/62">{item.correct}/{item.total}</p>
                <span className="rounded-xl bg-brand-soft px-3 py-2 text-center text-sm font-semibold text-brand">{item.score}%</span>
              </Link>
            ))}
            {!resultRows.length ? <p className="p-6 text-sm text-black/56">Hali submitted natijalar yo&apos;q.</p> : null}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-black/8 bg-white/82 p-5 shadow-[0_18px_55px_rgba(21,23,19,0.07)]">
          <Eyebrow>Students</Eyebrow>
          <h2 className="mt-2 text-2xl font-semibold">O&apos;quvchi kesimida progress</h2>
          <div className="mt-5 overflow-hidden rounded-3xl border border-black/8 bg-white">
            <div className="grid grid-cols-[1fr_120px_120px_180px] gap-3 border-b border-black/8 bg-surface-soft px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-black/40 max-md:hidden">
              <span>Student</span>
              <span>Completed</span>
              <span>Average</span>
              <span>Last submit</span>
            </div>
            {studentProgress.map((student) => (
              <div key={student.student_code} className="grid gap-3 border-b border-black/6 px-4 py-4 md:grid-cols-[1fr_120px_120px_180px] md:items-center">
                <p className="font-semibold">{student.student_name}</p>
                <p className="text-sm text-black/58">{student.completed}/{assignments.length} tests</p>
                <span className="w-fit rounded-xl bg-brand-soft px-3 py-2 text-sm font-semibold text-brand">{student.average_score}%</span>
                <p className="text-sm text-black/48">{student.last_submitted_at ? new Date(student.last_submitted_at).toLocaleString() : "No submit"}</p>
              </div>
            ))}
            {!studentProgress.length ? <p className="p-6 text-sm text-black/56">Hali hech kim test topshirmagan.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function ActionButton({ icon: Icon, children, onClick }: { icon: typeof Link2; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-surface-soft">
      <Icon className="size-4" />
      {children}
    </button>
  );
}

function Metric({ icon: Icon, label, value, dark = false }: { icon: typeof Clipboard; label: string; value: string | number; dark?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-4", dark ? "bg-white/8" : "bg-surface-soft")}>
      <Icon className={cn("size-4", dark ? "text-accent" : "text-brand")} />
      <p className={cn("mt-3 text-xs font-semibold uppercase tracking-[0.14em]", dark ? "text-white/45" : "text-black/40")}>{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-3">
      <p className="text-xs font-semibold text-black/38">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
