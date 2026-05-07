"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Flag } from "lucide-react";

import {
  getFakeSession,
  getFakeSessionStats,
  type FakeSessionState,
} from "@/features/test-engine/model/fake-test-backend";
import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";

export function SessionReviewClient({
  sessionId,
  testSlug,
  questions,
}: {
  sessionId: string;
  testSlug: string;
  questions: GeneratedQuestion[];
}) {
  const [session] = useState<FakeSessionState>(() => getFakeSession(sessionId, testSlug));
  const stats = useMemo(() => getFakeSessionStats(session, questions), [session, questions]);
  const progress = Math.round((stats.answered / stats.total) * 100);

  return (
    <section className="grid gap-5 py-8 lg:grid-cols-[1fr_340px]">
      <div className="grid gap-5">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Ready to submit?</h2>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Check unanswered and flagged questions before final submission.
              </p>
            </div>
            <div className="rounded-md bg-[#edf7f3] px-4 py-3 text-sm font-semibold text-[#276a5b]">
              {progress}% complete
            </div>
          </div>
          <div className="mt-5 h-2 rounded bg-black/10">
            <div className="h-2 rounded bg-[#276a5b]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid gap-3">
        {questions.map((question, index) => {
          const state = session.answers[question.id];
          const status = state?.answer ? "Answered" : "Unanswered";

          return (
            <Link key={question.id} href={`/test-session/${sessionId}/question/${index + 1}`} className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-4 hover:border-black/20 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#fbfbf8] text-sm font-semibold">
                  {index + 1}
                </span>
                <div>
                <p className="font-semibold">Question {index + 1}</p>
                <p className="mt-1 line-clamp-1 text-sm text-black/55">{question.prompt}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-sm font-semibold">
                {state?.flagged ? <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-3 py-1 text-amber-700"><Flag className="size-3" /> Flagged</span> : null}
                <span className={status === "Answered" ? "rounded-md bg-[#edf7f3] px-3 py-1 text-[#276a5b]" : "rounded-md bg-[#f8eeee] px-3 py-1 text-[#8d3d3d]"}>
                  {status}
                </span>
              </div>
            </Link>
          );
        })}
        </div>
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">Submit summary</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <SummaryLine label="Answered" value={stats.answered} positive />
            <SummaryLine label="Unanswered" value={stats.unanswered} warning={stats.unanswered > 0} />
            <SummaryLine label="Flagged" value={stats.flagged} warning={stats.flagged > 0} />
          </div>
          {stats.unanswered > 0 ? (
            <div className="mt-5 rounded-md bg-[#f8eeee] p-3 text-sm leading-6 text-[#8d3d3d]">
              {stats.unanswered} question still has no answer. You can submit, but review is recommended.
            </div>
          ) : (
            <div className="mt-5 rounded-md bg-[#edf7f3] p-3 text-sm leading-6 text-[#276a5b]">
              Every question has an answer. You can submit now.
            </div>
          )}
          <Link href={`/test-session/${sessionId}/submit`} className="mt-5 block rounded-md bg-[#151713] px-4 py-3 text-center text-sm font-semibold text-white">
            Submit test
          </Link>
        </div>
      </aside>
    </section>
  );
}

function SummaryLine({
  label,
  value,
  positive = false,
  warning = false,
}: {
  label: string;
  value: number;
  positive?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-black/10 pb-2 last:border-b-0">
      <span className="flex items-center gap-2 text-black/60">
        {positive ? <CheckCircle2 className="size-4 text-[#276a5b]" /> : null}
        {warning ? <AlertTriangle className="size-4 text-amber-600" /> : null}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}
