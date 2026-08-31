import Link from "next/link";
import { notFound } from "next/navigation";

import { questApi } from "@/shared/api/questlab-api";
import { CardGrid, byIdOrSlug, packCard, PanelShell, Section, testCard } from "@/features/platform/ui/panel-shared";

export async function StudentTestsPage() {
  const [tests, packs] = await Promise.all([questApi.tests(), questApi.examPacks()]);
  return (
    <PanelShell>
      <Section title="Packlar">
        <CardGrid cards={packs.filter((pack) => pack.is_active).map((pack) => packCard(pack, `/exam-packs/${pack.slug}`))} />
      </Section>
      <Section title="Available tests">
        <CardGrid cards={tests.filter((test) => test.status === "published").map((test) => testCard(test, `/student/tests/${test.slug}`))} />
      </Section>
    </PanelShell>
  );
}

export async function StudentTestDetailPage({ testId }: { testId: string }) {
  const tests = await questApi.tests();
  const test = byIdOrSlug(tests, testId);
  if (!test) notFound();
  return (
    <PanelShell>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/tests/${test.slug}/start`} className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">Start test</Link>
        <Link href={`/tests/${test.slug}`} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold">Instructions</Link>
      </div>
    </PanelShell>
  );
}

export async function StudentProgressPage() {
  const summary = await questApi.profileSummary();
  return (
    <PanelShell>
      <Section title="Topic mastery">
        <CardGrid cards={summary.topic_progress.map((topic) => ({ title: topic.topic, href: "/student/mistakes", meta: `${topic.attempts} attempts`, stats: [{ label: "Mastery", value: `${topic.value}%` }] }))} />
      </Section>
      <Section title="Recent tests">
        <CardGrid cards={summary.recent_tests.map((test) => ({ title: test.title, href: `/student/results/${test.id}`, meta: test.topic, stats: [{ label: "Score", value: `${test.score}%` }, { label: "Correct", value: `${test.correct}/${test.total}` }] }))} />
      </Section>
    </PanelShell>
  );
}
