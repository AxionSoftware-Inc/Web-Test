"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiClassAssignment, ApiTeacherClass } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";

export function StudentClassClient({ classroom, assignments }: { classroom: ApiTeacherClass; assignments: ApiClassAssignment[] }) {
  const [studentName, setStudentName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="rounded-[28px] border border-black/8 bg-white/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">Student entry</p>
        <h1 className="mt-2 text-3xl font-semibold">{classroom.name}</h1>
        <p className="mt-3 text-sm leading-6 text-black/58">{classroom.description}</p>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-black/65">
            Student name
            <input value={studentName} onChange={(event) => setStudentName(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </label>
          {classroom.visibility === "private" ? (
            <label className="grid gap-2 text-sm font-semibold text-black/65">
              Join code
              <input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            </label>
          ) : null}
          {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      </section>
      <section className="rounded-[28px] border border-black/8 bg-white/70 p-6">
        <h2 className="text-2xl font-semibold">Assigned tests</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {assignments.filter((item) => item.is_active).map((item) => (
            <AssignmentCard
              key={item.id}
              classroom={classroom}
              assignment={item}
              studentName={studentName}
              joinCode={joinCode}
              onError={setError}
            />
          ))}
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
    setStarting(true);
    onError("");
    try {
      await questApi.joinClass(classroom.slug, { student_name: studentName, join_code: joinCode });
      const session = await questApi.startClassAssignment(classroom.slug, assignment.id, { student_name: studentName, join_code: joinCode });
      router.push(`/test-session/${session.id}/question/1`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Start failed.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <article className="rounded-3xl border border-black/8 bg-white p-5">
      <p className="text-lg font-semibold">{assignment.title}</p>
      <p className="mt-2 text-sm text-black/52">{assignment.test_title} / {assignment.difficulty} / {assignment.question_count} questions</p>
      <button onClick={start} disabled={starting || !studentName} className="mt-5 w-full rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {starting ? "Starting..." : "Start test"}
      </button>
    </article>
  );
}
