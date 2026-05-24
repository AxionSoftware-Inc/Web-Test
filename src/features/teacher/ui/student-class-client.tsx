"use client";

import { ArrowRight, CheckCircle2, ClipboardList, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ApiClassAssignment, ApiTeacherClass } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";

export function StudentClassClient({ classroom, assignments }: { classroom: ApiTeacherClass; assignments: ApiClassAssignment[] }) {
  const [studentName, setStudentName] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("questlab-student-name") ?? "";
  });
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const activeAssignments = assignments.filter((item) => item.is_active);
  const singleSession = activeAssignments.length === 1;

  useEffect(() => {
    if (studentName) window.localStorage.setItem("questlab-student-name", studentName);
  }, [studentName]);

  return (
    <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <section className="rounded-[30px] border border-black/8 bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Class test entry</p>
        <h1 className="mt-2 text-3xl font-semibold">{classroom.name}</h1>
        <p className="mt-3 text-sm leading-6 text-black/58">{classroom.description || "O'qituvchi yuborgan link orqali test sessionni boshlang."}</p>

        <div className="mt-5 grid gap-3">
          <Step icon={UserRound} title="1. Ismingizni kiriting" copy="Natija teacher dashboardida shu nom bilan ko'rinadi." />
          <Step icon={LockKeyhole} title="2. Kod kerak bo'lsa kiriting" copy="Private class uchun teacher bergan join code ishlatiladi." />
          <Step icon={ClipboardList} title="3. Sessionni tanlang" copy={singleSession ? "Bu link bitta test sessionga olib kelgan." : "Ochiq sessionlardan keraklisini boshlang."} />
          <Step icon={CheckCircle2} title="4. Submit qiling" copy="Test tugagach score avtomatik o'qituvchiga ko'rinadi." />
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-black/65">
            Student name
            <input value={studentName} onChange={(event) => setStudentName(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-brand/50 focus:ring-4 focus:ring-accent/20" />
          </label>
          {classroom.visibility === "private" ? (
            <label className="grid gap-2 text-sm font-semibold text-black/65">
              Join code
              <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-brand/50 focus:ring-4 focus:ring-accent/20" />
            </label>
          ) : null}
          {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      </section>
      <section className="rounded-[30px] border border-black/8 bg-white/75 p-6 shadow-[0_18px_55px_rgba(21,23,19,0.06)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/38">Open sessions</p>
            <h2 className="mt-2 text-2xl font-semibold">{singleSession ? "Teacher yuborgan test session" : "Boshlash mumkin bo'lgan sessionlar"}</h2>
          </div>
          <span className="rounded-2xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand">{activeAssignments.length} open</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {activeAssignments.map((item) => (
            <AssignmentCard
              key={item.id}
              classroom={classroom}
              assignment={item}
              studentName={studentName}
              joinCode={joinCode}
              onError={setError}
            />
          ))}
          {!activeAssignments.length ? <p className="rounded-3xl border border-dashed border-black/12 bg-white p-8 text-sm text-black/56 md:col-span-2">Hozircha ochiq test session yo&apos;q.</p> : null}
        </div>
      </section>
    </div>
  );
}

function AssignmentCard({
  classroom,
  assignment,
  studentName,
  joinCode,
  onError,
}: {
  classroom: ApiTeacherClass;
  assignment: ApiClassAssignment;
  studentName: string;
  joinCode: string;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  async function start() {
    const resolvedStudentName = studentName.trim() || "Student";
    setStarting(true);
    onError("");
    try {
      const studentCode = getStudentCode();
      await questApi.joinClass(classroom.slug, { student_name: resolvedStudentName, join_code: joinCode, student_code: studentCode });
      const session = await questApi.startClassAssignment(classroom.slug, assignment.id, { student_name: resolvedStudentName, join_code: joinCode, student_code: studentCode });
      router.push(`/test-session/${session.id}/question/1`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Start failed.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <article className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_14px_36px_rgba(21,23,19,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{assignment.title}</p>
          <p className="mt-2 text-sm text-black/52">{assignment.test_title}</p>
        </div>
            <span className="rounded-xl bg-brand-soft px-3 py-2 text-xs font-semibold capitalize text-brand">{assignment.mode}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Mini label="Questions" value={assignment.question_count} />
        <Mini label="Attempts" value={assignment.mode === "homework" ? assignment.attempt_limit : "Live"} />
        {assignment.mode === "homework" ? <Mini label="Due" value={assignment.due_at ? new Date(assignment.due_at).toLocaleDateString() : "No due"} /> : null}
        {assignment.mode === "homework" ? <Mini label="Late" value={assignment.allow_late_submission ? "Allowed" : "Closed"} /> : <Mini label="Status" value="Open" />}
      </div>
      <button onClick={start} disabled={starting} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {starting ? "Ochilyapti..." : assignment.mode === "homework" ? "Start homework" : "Start test session"}
        <ArrowRight className="size-4" />
      </button>
    </article>
  );
}

function Step({ icon: Icon, title, copy }: { icon: typeof UserRound; title: string; copy: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-surface-soft p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-black/50">{copy}</span>
      </span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-3">
      <p className="text-xs font-semibold text-black/38">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
