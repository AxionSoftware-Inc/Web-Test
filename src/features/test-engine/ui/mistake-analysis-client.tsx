"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { TopicBreakdownChart } from "@/components/questlab/charts/topic-breakdown-chart";
import { getFakeSession, type FakeSessionState } from "@/features/test-engine/model/fake-test-backend";
import { getSkillDiagnosis, getWeakSkills } from "@/features/test-engine/model/skill-diagnosis";
import type { GeneratedQuestion } from "@/features/test-generator/model/test-generator-types";
import { GlassCard } from "@/shared/ui/glass-card";

export function MistakeAnalysisClient({
  sessionId,
  testSlug,
  questions,
}: {
  sessionId: string;
  testSlug: string;
  questions: GeneratedQuestion[];
}) {
  const [session] = useState<FakeSessionState>(() => getFakeSession(sessionId, testSlug));
  const diagnosis = useMemo(() => getSkillDiagnosis(session, questions), [session, questions]);
  const weakSkills = useMemo(() => getWeakSkills(session, questions), [session, questions]);
  const diagnosisRows = diagnosis.map((item) => ({
    label: item.skill,
    value: Math.round((item.correct / item.total) * 100),
    meta: `${item.correct}/${item.total} correct`,
  }));

  return (
    <section className="grid gap-5 py-8 lg:grid-cols-[1fr_340px]">
      <div className="grid gap-4">
        <TopicBreakdownChart rows={diagnosisRows} color="var(--chart-1)" />
        {diagnosis.map((item) => (
          <GlassCard key={item.skill} className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xl font-semibold capitalize">{item.skill}</p>
                <p className="mt-2 text-sm text-black/55">
                  {item.correct}/{item.total} skill-linked questions correct
                </p>
              </div>
              <span className={statusClass(item.status)}>{item.status}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <GlassCard className="p-5">
          <h2 className="text-xl font-semibold">Recommended recovery</h2>
          <p className="mt-3 text-sm leading-6 text-black/60">
            {weakSkills.length > 0
              ? `Start with ${weakSkills[0].skill}. Then practice the same skill and retake the test.`
              : "No major weak skill found. Retake or move to the next level."}
          </p>
          <div className="mt-5 grid gap-3">
            <Link href="/learn/algebra-foundations/quadratics/factoring-basics" className="rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white">
              Recommended lesson
            </Link>
            <Link href="/practice/algebra/targeted" className="rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-center text-sm font-semibold">
              Targeted practice
            </Link>
            <Link href={`/test-session/${sessionId}/question/1`} className="rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-center text-sm font-semibold">
              Retake path
            </Link>
          </div>
        </GlassCard>
      </aside>
    </section>
  );
}

function statusClass(status: "strong" | "review" | "weak") {
  if (status === "strong") {
    return "rounded-xl bg-brand-soft px-3 py-2 text-sm font-semibold text-brand";
  }

  if (status === "review") {
    return "rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700";
  }

  return "rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-[#8d3d3d]";
}
