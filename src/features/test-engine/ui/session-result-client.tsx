"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Award, RotateCcw, SearchCheck } from "lucide-react";

import {
  getFakeSession,
  getFakeSessionStats,
  submitFakeSession,
  type FakeSessionState,
} from "@/features/test-engine/model/fake-test-backend";
import { getResultId } from "@/features/test-engine/model/test-engine-content";
import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";

export function SessionResultClient({
  sessionId,
  testSlug,
  questions,
}: {
  sessionId: string;
  testSlug: string;
  questions: GeneratedQuestion[];
}) {
  const [session, setSession] = useState<FakeSessionState>(() => {
    const current = getFakeSession(sessionId, testSlug);
    return current.submittedAt ? current : submitFakeSession(current);
  });
  const stats = useMemo(() => getFakeSessionStats(session, questions), [session, questions]);

  function submitAgain() {
    setSession((value) => submitFakeSession(value));
  }

  return (
    <section className="grid gap-5 py-8 lg:grid-cols-[1fr_340px]">
      <div className="grid gap-5">
        <div className="rounded-lg border border-black/10 bg-white p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#276a5b]">
                <Award className="size-4" />
                Final score
              </p>
              <h2 className="mt-3 text-6xl font-semibold">{stats.percent}%</h2>
              <p className="mt-3 text-sm leading-6 text-black/60">
                {stats.percent >= 70 ? "Passing score reached. Review mistakes and move to the next level." : "Below passing score. Review weak questions before retaking."}
              </p>
            </div>
            <div className="grid size-36 place-items-center rounded-full border-[10px] border-[#edf7f3] bg-[#fbfbf8]">
              <span className="text-3xl font-semibold text-[#276a5b]">{stats.correct}/{stats.total}</span>
            </div>
          </div>
          <div className="mt-6 h-3 rounded bg-black/10">
            <div className="h-3 rounded bg-[#276a5b]" style={{ width: `${stats.percent}%` }} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <ResultStat label="Correct" value={`${stats.correct}/${stats.total}`} tone="green" />
          <ResultStat label="Wrong" value={String(stats.wrong)} tone="red" />
          <ResultStat label="Skipped" value={String(stats.skipped)} />
          <ResultStat label="Flagged" value={String(stats.flagged)} tone="amber" />
        </div>
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">Next actions</h2>
          <p className="mt-2 text-sm leading-6 text-black/60">
            Use the detailed review to turn wrong answers into targeted practice.
          </p>
          <div className="mt-4 grid gap-3">
          <Link href={`/results/${getResultId(sessionId)}`} className="rounded-md bg-[#151713] px-4 py-3 text-center text-sm font-semibold text-white">
            <span className="inline-flex items-center justify-center gap-2">
              <SearchCheck className="size-4" />
            Full result review
            </span>
          </Link>
          <Link href={`/test-session/${sessionId}/question/1`} className="rounded-md border border-black/10 px-4 py-3 text-center text-sm font-semibold">
            Review in session
          </Link>
          <button type="button" onClick={submitAgain} className="inline-flex items-center justify-center gap-2 rounded-md border border-black/10 px-4 py-3 text-sm font-semibold">
            <RotateCcw className="size-4" />
            Refresh score
          </button>
          </div>
        </div>
      </aside>
    </section>
  );
}

function ResultStat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "green" | "red" | "amber" }) {
  const toneClass = {
    neutral: "bg-white text-[#151713]",
    green: "bg-[#edf7f3] text-[#276a5b]",
    red: "bg-[#f8eeee] text-[#8d3d3d]",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className={`rounded-lg border border-black/10 p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
