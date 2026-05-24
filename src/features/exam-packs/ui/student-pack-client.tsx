"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiExamPack, ApiExamPackItem } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { LatexText } from "@/shared/ui/latex-text";

export function StudentPackClient({ pack, items }: { pack: ApiExamPack; items: ApiExamPackItem[] }) {
  const [studentName, setStudentName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="rounded-[28px] border border-black/8 bg-white/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">{pack.exam_type || "Exam pack"}</p>
        <h1 className="mt-2 text-3xl font-semibold"><LatexText text={pack.title} /></h1>
        <p className="mt-3 text-sm leading-6 text-black/58"><LatexText text={pack.description} /></p>
        <div className="mt-4 inline-flex rounded-xl bg-[#edf7f3] px-3 py-2 text-sm font-semibold text-[#276a5b]">{pack.price_label || "Free"}</div>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-black/65">
            Student name
            <input value={studentName} onChange={(event) => setStudentName(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
          </label>
          {pack.visibility === "private" ? (
            <label className="grid gap-2 text-sm font-semibold text-black/65">
              Access code
              <input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
            </label>
          ) : null}
          {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      </section>
      <section className="rounded-[28px] border border-black/8 bg-white/70 p-6">
        <h2 className="text-2xl font-semibold">Pack tests</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <PackItemCard key={item.id} pack={pack} item={item} studentName={studentName} accessCode={accessCode} onError={setError} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PackItemCard({
  pack,
  item,
  studentName,
  accessCode,
  onError,
}: {
  pack: ApiExamPack;
  item: ApiExamPackItem;
  studentName: string;
  accessCode: string;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  async function start() {
    setStarting(true);
    onError("");
    try {
      const session = await questApi.startExamPackItem(pack.slug, item.id, { student_name: studentName, access_code: accessCode, student_code: getStudentCode() });
      router.push(`/test-session/${session.id}/question/1`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Start failed.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <article className="rounded-3xl border border-black/8 bg-white p-5">
      <p className="text-lg font-semibold"><LatexText text={item.title} /></p>
      <p className="mt-2 text-sm text-black/52"><LatexText text={`${item.test_title} / ${item.difficulty} / ${item.question_count} questions`} /></p>
      <button onClick={start} disabled={starting || !studentName} className="mt-5 w-full rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {starting ? "Starting..." : "Start test"}
      </button>
    </article>
  );
}
