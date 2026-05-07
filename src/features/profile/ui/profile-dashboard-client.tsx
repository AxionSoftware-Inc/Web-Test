"use client";

import { Award, BookOpen, Flame, Target } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

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
  const maxWeekly = Math.max(...fallbackWeekly.map((item) => item.value));

  if (attempts.length === 0) {
    return (
      <section className="py-8">
        <GlassCard className="p-8 text-center">
          <h2 className="text-3xl font-semibold">Profile hali bo‘sh</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-black/60">
            Birinchi algebra testini ishlang. Natija, progress, weak topics va tavsiyalar shu yerda avtomatik chiqadi.
          </p>
          <Link href="/subjects/mathematics/topics/algebra" className="mt-6 inline-block rounded-xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white">
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
          <div className="mt-6 flex h-56 items-end gap-3">
            {fallbackWeekly.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-44 w-full items-end rounded-xl bg-white/50 px-2">
                  <div className="w-full rounded-t-lg bg-[#276a5b]" style={{ height: `${Math.max(12, (item.value / maxWeekly) * 100)}%` }} />
                </div>
                <span className="text-xs font-semibold text-black/50">{item.day}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-xl font-semibold">Math mastery</h2>
          <div className="mt-5 h-3 rounded bg-black/10">
            <div className="h-3 rounded bg-[#276a5b]" style={{ width: `${mastery}%` }} />
          </div>
          <p className="mt-3 text-sm leading-6 text-black/60">
            Calculated from fake local test sessions. Backend later replaces this with real result analytics.
          </p>
          <div className="mt-5 grid gap-4">
            {["Algebra", "Arithmetic", "Geometry", "Calculus"].map((topic, index) => {
              const value = Math.max(12, mastery - index * 14);
              return (
                <div key={topic}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{topic}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded bg-black/10">
                    <div className="h-2 rounded bg-[#276a5b]" style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
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

        <aside className="rounded-2xl border border-black/10 bg-[#151713] p-5 text-white">
          <h2 className="text-xl font-semibold">Recommended next</h2>
          <div className="mt-4 grid gap-3">
            <p className="rounded-xl bg-white/8 p-3 text-sm leading-6 text-white/70">Mistake analysis orqali zaif skillni aniqlang.</p>
            <p className="rounded-xl bg-white/8 p-3 text-sm leading-6 text-white/70">Recommended lessonni tugating.</p>
            <p className="rounded-xl bg-white/8 p-3 text-sm leading-6 text-white/70">Targeted practicedan keyin retake qiling.</p>
          </div>
          <Link href="/subjects/mathematics/topics/algebra" className="mt-5 block rounded-xl bg-[#8fd6bd] px-4 py-3 text-center text-sm font-semibold text-[#151713]">
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
      <div className="text-[#276a5b]">{icon}</div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/45">{label}</p>
    </GlassCard>
  );
}
