import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Layers3, PackageCheck } from "lucide-react";

import { questApi, type ApiTest } from "@/shared/api/questlab-api";
import { PremiumPage, PremiumPanel } from "@/shared/ui/premium-shell";

export const metadata: Metadata = {
  title: "Testlar | QuestLab",
  description: "Fan, yo'nalish va packlar bo'yicha real test katalogi.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const [tests, packs] = await Promise.all([
    questApi.tests(),
    questApi.examPacks(),
  ]);
  const publishedTests = tests.filter((test) => test.status === "published");
  const activePacks = packs.filter((pack) => pack.is_active);
  const modules = Array.from(
    publishedTests.reduce((map, test) => {
      const key = `${test.subject_slug}/${test.topic_slug}`;
      const current = map.get(key) ?? { subject: test.subject_slug, topic: test.topic_slug, tests: [] as ApiTest[] };
      current.tests.push(test);
      map.set(key, current);
      return map;
    }, new Map<string, { subject: string; topic: string; tests: ApiTest[] }>()),
  ).map(([, value]) => value);

  return (
    <PremiumPage>
      <PremiumPanel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Test katalogi</p>
        <h1 className="mt-3 text-4xl font-semibold">Fanlar, yo&apos;nalishlar va packlar</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">
          Eski sintetik ro&apos;yxatlar olib tashlandi. Bu yerda backenddagi published testlar va yaratilgan packlar ko&apos;rinadi.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Metric icon={BookOpenCheck} label="Published testlar" value={publishedTests.length} />
          <Metric icon={Layers3} label="Modullar" value={modules.length} />
          <Metric icon={PackageCheck} label="Packlar" value={activePacks.length} />
        </div>
      </PremiumPanel>

      <section id="packs" className="mt-6">
        <PremiumPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Packlar</p>
              <h2 className="mt-2 text-2xl font-semibold">Pack bo&apos;yicha ishlash</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activePacks.map((pack) => (
              <Link key={pack.id} href={`/exam-packs/${pack.slug}`} className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-[#fbfbf6]">
                <PackageCheck className="size-5 text-[#276a5b]" />
                <h3 className="mt-3 text-xl font-semibold">{pack.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/55">{pack.description || pack.exam_type}</p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{pack.item_count} test / {pack.visibility === "public" ? "ochiq" : "kod bilan"}</p>
              </Link>
            ))}
            {!activePacks.length ? <Empty copy="Hali active pack yo'q." /> : null}
          </div>
        </PremiumPanel>
      </section>

      <section className="mt-6 grid gap-6">
        {modules.map((module) => (
          <PremiumPanel key={`${module.subject}-${module.topic}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">{module.subject}</p>
                <h2 className="mt-2 text-2xl font-semibold">{module.topic}</h2>
              </div>
              <span className="rounded-full bg-[#edf7f3] px-3 py-1 text-xs font-semibold text-[#276a5b]">{module.tests.length} test</span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {module.tests.map((test) => (
                <article key={test.id} className="rounded-3xl border border-black/8 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{test.difficulty} / {test.estimated_minutes} daqiqa</p>
                  <h3 className="mt-3 text-lg font-semibold">{test.title}</h3>
                  <p className="mt-2 text-sm text-black/52">{test.test_questions.length} savol / o&apos;tish bali {test.passing_score}%</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href={`/tests/${test.slug}/start`} className="rounded-2xl bg-[#151713] px-4 py-3 text-sm font-semibold text-white">Boshlash</Link>
                    <Link href={`/tests/${test.slug}`} className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold">Batafsil</Link>
                  </div>
                </article>
              ))}
            </div>
          </PremiumPanel>
        ))}
        {!modules.length ? <PremiumPanel><Empty copy="Hali published test yo'q." /></PremiumPanel> : null}
      </section>
    </PremiumPage>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof BookOpenCheck; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <Icon className="size-5 text-[#276a5b]" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Empty({ copy }: { copy: string }) {
  return <p className="rounded-2xl border border-dashed border-black/12 bg-white p-6 text-sm text-black/55">{copy}</p>;
}
