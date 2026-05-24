"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchCheck } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import {
  getFakeSession,
  getFakeSessionStats,
  type FakeSessionState,
} from "@/features/test-engine/model/fake-test-backend";
import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";

export function ResultDetailClient({
  resultId,
  sessionId,
  testSlug,
  questions,
  topicSlug,
}: {
  resultId: string;
  sessionId: string;
  testSlug: string;
  questions: GeneratedQuestion[];
  topicSlug: string;
}) {
  const [session] = useState<FakeSessionState>(() => getFakeSession(sessionId, testSlug));
  const stats = useMemo(() => getFakeSessionStats(session, questions), [session, questions]);

  return (
    <>
      <section className="grid gap-5 py-8 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-5">
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-brand">Result breakdown</p>
            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-6xl font-semibold">{stats.percent}%</h2>
                <p className="mt-3 text-sm leading-6 text-black/60">
                  {stats.correct} correct out of {stats.total}. Review wrong or skipped questions before retaking.
                </p>
              </div>
              <Link href={`/results/${resultId}/analysis`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">
                <SearchCheck className="size-4" />
                Mistake analysis
              </Link>
            </div>
            <Progress value={stats.percent} className="mt-6 h-3" />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <ResultStat label="Score" value={`${stats.percent}%`} />
            <ResultStat label="Correct" value={`${stats.correct}/${stats.total}`} />
            <ResultStat label="Wrong" value={String(stats.wrong)} />
            <ResultStat label="Skipped" value={String(stats.skipped)} />
          </div>
        </div>

        <aside className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-xl font-semibold">Next steps</h2>
          <div className="mt-4 grid gap-3">
            <Link href={`/results/${resultId}/analysis`} className="rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white">
              Mistake analysis
            </Link>
            <Link href={`/results/${resultId}/questions`} className="rounded-xl border border-black/10 px-4 py-3 text-center text-sm font-semibold">
              Review questions
            </Link>
            <Link href={`/practice/${topicSlug}`} className="rounded-xl border border-black/10 px-4 py-3 text-center text-sm font-semibold">
              Practice weak topic
            </Link>
            <Link href={`/test-session/${sessionId}/question/1`} className="rounded-xl border border-black/10 px-4 py-3 text-center text-sm font-semibold">
              Back to session
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
