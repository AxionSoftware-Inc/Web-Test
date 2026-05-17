import type { Metadata } from "next";
import Link from "next/link";

import { StudentPackClient } from "@/features/exam-packs/ui/student-pack-client";
import { questApi } from "@/shared/api/questlab-api";
import { ShareActions } from "@/shared/ui/share-actions";

type PageProps = {
  params: Promise<{ packSlug: string }>;
};

export const metadata: Metadata = {
  title: "Exam Pack | QuestLab",
};

export default async function Page({ params }: PageProps) {
  const { packSlug } = await params;
  const [pack, items, results] = await Promise.all([
    questApi.examPack(packSlug),
    questApi.examPackItems(packSlug),
    questApi.examPackResults(packSlug),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f7ef] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[28px] border border-black/8 bg-white/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">Pack manager</p>
              <h1 className="mt-2 text-4xl font-semibold">{pack.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">{pack.description}</p>
            </div>
            <Link href={`/exam-packs/${pack.slug}/add-test`} className="rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white">
              Add test
            </Link>
          </div>
          <div className="mt-5">
            <ShareActions
              url={`/exam-packs/${pack.slug}`}
              exportText={[
                "student,test,score,correct,total",
                ...results.results.map((item) => `${item.student_name},${item.test_title},${item.score},${item.correct},${item.total}`),
              ].join("\n")}
            />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <Metric label="Tests" value={items.length} />
            <Metric label="Attempts" value={results.attempts} />
            <Metric label="Avg score" value={`${results.average_score}%`} />
            <Metric label="Price" value={pack.price_label || "Free"} />
          </div>
        </header>
        <StudentPackClient pack={pack} items={items} />
        <section className="mt-6 rounded-[28px] border border-black/8 bg-white/70 p-5">
          <h2 className="text-2xl font-semibold">Pack results</h2>
          <div className="mt-4 grid gap-3">
            {results.results.map((item) => (
              <Link key={item.session_id} href={`/results/${item.session_id}`} className="grid gap-3 rounded-2xl border border-black/8 bg-white p-4 hover:bg-[#fbfbf8] md:grid-cols-[1fr_1fr_90px] md:items-center">
                <div>
                  <p className="font-semibold">{item.student_name}</p>
                  <p className="mt-1 text-sm text-black/52">{item.item_title || item.test_title}</p>
                </div>
                <p className="text-sm text-black/52">{item.correct}/{item.total} correct</p>
                <span className="rounded-xl bg-[#edf7f3] px-3 py-2 text-center text-sm font-semibold text-[#276a5b]">{item.score}%</span>
              </Link>
            ))}
            {!results.results.length ? <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Hali pack natijalari yo‘q.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-[#fbfbf8] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
