"use client";

import { Award, BookOpen, Flame, Target } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { MasteryRadialChart } from "@/components/questlab/charts/mastery-radial-chart";
import { TopicBreakdownChart } from "@/components/questlab/charts/topic-breakdown-chart";
import { getAllFakeSessions } from "@/features/test-engine/model/fake-test-backend";
import { getTestOrThrow, getTestQuestions } from "@/features/test-engine/model/test-engine-content";
import { getFakeSessionStats } from "@/features/test-engine/model/fake-test-backend";
import { GlassCard } from "@/shared/ui/glass-card";

const fallbackWeekly = [
  { day: "Mon", value: 22 },
  { day: "Tue", value: 35 },
  { day: "Wed", value: 28 },
  { day: "Thu", value: 44 },
  { day: "Fri", value: 52 },
  { day: "Sat", value: 38 },
  { day: "Sun", value: 65 },
];

export function ProfileDashboardClient() {
  const [sessions] = useState(() => getAllFakeSessions());
  const attempts = useMemo(() => {
    return sessions.map((session) => {
      const test = getTestOrThrow(session.testSlug);
      const questions = getTestQuestions(test.id);
      const stats = getFakeSessionStats(session, questions);

      return {
        id: session.sessionId,
        title: test.title,
        topic: test.category,
        submittedAt: session.submittedAt,
        score: stats.percent,
        answered: stats.answered,
        total: stats.total,
      };
    });
  }, [sessions]);

  const completed = attempts.filter((attempt) => attempt.submittedAt);
  const average = completed.length === 0 ? 0 : Math.round(completed.reduce((sum, item) => sum + item.score, 0) / completed.length);
  const mastery = Math.max(18, average || 0);
  const weeklyRows = fallbackWeekly.map((item) => ({ label: item.day, value: item.value, meta: `${item.value} activity` }));
  const masteryRows = ["Algebra", "Arithmetic", "Geometry", "Calculus"].map((topic, index) => ({
    label: topic,
    value: Math.max(12, mastery - index * 14),
    meta: "Local demo mastery",
  }));

  if (attempts.length === 0) {
    return (
      <section className="py-8">
        <GlassCard className="p-8 text-center">
          <h2 className="text-3xl font-semibold">Profile hali bo‘sh</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/60">
            Birinchi algebra testini ishlang. Natija, progress, weak topics va tavsiyalar shu yerda avtomatik chiqadi.
          </p>
          <Link href="/subjects/mathematics/topics/algebra" className="mt-6 inline-block rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white">
            Start Algebra
          </Link>
        </GlassCard>
      </section>
    );
  }

  return (
    <>
      <section className="grid gap-4 py-8 md:grid-cols-4">
        <ProfileMetric icon={<BookOpen className="size-5" />} label="Tests taken" value={attempts.length} />
        <ProfileMetric icon={<Target className="size-5" />} label="Average score" value={`${average}%`} />
        <ProfileMetric icon={<Flame className="size-5" />} label="Study streak" value="Demo 9 days" />
        <ProfileMetric icon={<Award className="size-5" />} label="Main focus" value="Algebra" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <GlassCard className="p-5">
          <h2 className="text-xl font-semibold">Weekly activity</h2>
          <div className="mt-6">
            <TopicBreakdownChart rows={weeklyRows} color="var(--chart-1)" />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-xl font-semibold">Math mastery</h2>
          <div className="mt-5">
            <MasteryRadialChart label="Math mastery" value={mastery} />
          </div>
          <p className="mt-3 text-sm leading-6 text-black/60">
            Calculated from fake local test sessions. Backend later replaces this with real result analytics.
          </p>
          <div className="mt-5">
            <TopicBreakdownChart rows={masteryRows} color="var(--chart-2)" />
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 py-8 lg:grid-cols-[1fr_0.75fr]">
        <GlassCard className="p-5">
          <h2 className="text-xl font-semibold">Recent tests</h2>
          <div className="mt-4 grid gap-3">
            {attempts.slice(-5).reverse().map((test) => (
              <div key={test.id} className="flex flex-col justify-between gap-3 rounded-xl bg-white/58 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold">{test.title}</p>
                  <p className="mt-1 text-sm text-black/55">{test.topic} / {test.answered}/{test.total} answered</p>
                </div>
                <span className="rounded-xl bg-white px-3 py-2 text-sm font-semibold">{test.score}%</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <aside className="rounded-2xl border border-black/10 bg-ink p-5 text-white">
          <h2 className="text-xl font-semibold">Recommended next</h2>
          <div className="mt-4 grid gap-3">
            <p className="rounded-xl bg-white/8 p-3 text-sm leading-6 text-white/70">Mistake analysis orqali zaif skillni aniqlang.</p>
            <p className="rounded-xl bg-white/8 p-3 text-sm leading-6 text-white/70">Recommended lessonni tugating.</p>
            <p className="rounded-xl bg-white/8 p-3 text-sm leading-6 text-white/70">Targeted practicedan keyin retake qiling.</p>
          </div>
          <Link href="/subjects/mathematics/topics/algebra" className="mt-5 block rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-ink">
            Continue Algebra
          </Link>
        </aside>
      </section>
    </>
  );
}

function ProfileMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <GlassCard className="p-4">
      <div className="text-brand">{icon}</div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/45">{label}</p>
    </GlassCard>
  );
}
