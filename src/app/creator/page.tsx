import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, FileJson, ListPlus, PackageCheck, Plus, TestTube2, UsersRound } from "lucide-react";

import { questApi } from "@/shared/api/questlab-api";
import { PremiumPage, PremiumPanel } from "@/shared/ui/premium-shell";

export const metadata: Metadata = {
  title: "Creator | QuestLab",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const [tests, packs, questions] = await Promise.all([
    questApi.tests(),
    questApi.examPacks(),
    questApi.questions(),
  ]);
  const packResults = (await Promise.all(
    packs.map((pack) => questApi.examPackResults(pack.slug).catch(() => null)),
  )).filter((result) => result !== null);

  const totalAttempts = packResults.reduce((sum, result) => sum + result.attempts, 0);
  const totalStudents = packResults.reduce((sum, result) => sum + result.students_submitted, 0);
  const averageScore = packResults.length
    ? Math.round(packResults.reduce((sum, result) => sum + result.average_score, 0) / packResults.length)
    : 0;

  const packUsage = packs
    .map((pack) => {
      const usage = packResults.find((result) => result.pack.slug === pack.slug);
      return {
        title: pack.title,
        slug: pack.slug,
        attempts: usage?.attempts ?? 0,
        students: usage?.students_submitted ?? 0,
        average: usage?.average_score ?? 0,
      };
    })
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 6);

  const subjectUsage = Array.from(
    tests.reduce((map, test) => {
      const key = test.subject_slug || "general";
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <PremiumPage>
      <PremiumPanel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Creator home</p>
            <h1 className="mt-3 text-4xl font-semibold">Analytics dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">
              Packlar, test ishlanishlari, fanlar va auditoriya holati bitta joyda.
            </p>
          </div>
          <Link href="/crud" className="inline-flex items-center gap-2 rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white">
            <Plus className="size-4" />
            Add test
          </Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric icon={BarChart3} label="Attempts" value={totalAttempts} />
          <Metric icon={UsersRound} label="Students used" value={totalStudents} />
          <Metric icon={PackageCheck} label="Packs" value={packs.length} />
          <Metric icon={TestTube2} label="Avg score" value={`${averageScore}%`} />
        </div>
      </PremiumPanel>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <PremiumPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Usage</p>
              <h2 className="mt-2 text-2xl font-semibold">Top packs</h2>
            </div>
            <Link href="/exam-packs" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]">Open packs</Link>
          </div>
          <div className="mt-6 grid gap-3">
            {packUsage.length ? packUsage.map((item) => (
              <ChartRow key={item.slug} href={`/exam-packs/${item.slug}`} label={item.title} value={item.attempts} max={Math.max(1, ...packUsage.map((row) => row.attempts))} suffix={`${item.students} students / ${item.average}% avg`} />
            )) : <Empty copy="Hali pack ishlatilmagan." />}
          </div>
        </PremiumPanel>

        <PremiumPanel>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Subjects</p>
          <h2 className="mt-2 text-2xl font-semibold">Ko&apos;p tayyorlangan fanlar</h2>
          <div className="mt-6 grid gap-3">
            {subjectUsage.length ? subjectUsage.map((item) => (
              <ChartRow key={item.label} label={item.label} value={item.value} max={Math.max(1, ...subjectUsage.map((row) => row.value))} suffix="tests" />
            )) : <Empty copy="Fanlar bo'yicha testlar hali yo'q." />}
          </div>
        </PremiumPanel>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <Action href="/exam-packs" icon={PackageCheck} title="Packs" copy="Yaratilgan packlarni ko'rish, usage va edit." />
        <Action href="/crud" icon={ListPlus} title="Manual add" copy="Testni qo'lda savollari bilan kiritish." />
        <Action href="/crud/schema" icon={FileJson} title="Schema" copy="JSON import strukturasini ko'rish." />
        <Action href="/questions" icon={ListPlus} title="Questions" copy={`${questions.length} ta savol bankda.`} />
      </section>
    </PremiumPage>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof TestTube2; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <Icon className="size-5 text-[#276a5b]" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ChartRow({ label, value, max, suffix, href }: { label: string; value: number; max: number; suffix: string; href?: string }) {
  const content = (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate font-semibold">{label}</p>
        <p className="shrink-0 text-sm font-semibold text-black/55">{value} {suffix}</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-[#ecece3]">
        <div className="h-2 rounded-full bg-[#276a5b]" style={{ width: `${Math.max(5, Math.round((value / max) * 100))}%` }} />
      </div>
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90">{content}</Link> : content;
}

function Empty({ copy }: { copy: string }) {
  return <p className="rounded-2xl border border-dashed border-black/12 bg-white p-6 text-sm text-black/55">{copy}</p>;
}

function Action({ href, icon: Icon, title, copy }: { href: string; icon: typeof TestTube2; title: string; copy: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_14px_42px_rgba(21,23,19,0.05)] hover:bg-[#fbfbf6]">
      <Icon className="size-5 text-[#276a5b]" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-black/58">{copy}</p>
    </Link>
  );
}
