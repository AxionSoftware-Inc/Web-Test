"use client";

import { BarChart3, BookOpenCheck, PackageCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ApiExamPack, ApiProfileSummary, ApiTest } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { PremiumPanel } from "@/shared/ui/premium-shell";

export function StudentHomeClient({ initialSummary, packs, tests }: { initialSummary: ApiProfileSummary; packs: ApiExamPack[]; tests: ApiTest[] }) {
  const [summary, setSummary] = useState(initialSummary);

  useEffect(() => {
    let cancelled = false;
    questApi.profileSummary(getStudentCode()).then((next) => {
      if (!cancelled) setSummary(next);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const recommendedPacks = packs.slice(0, 4);
  const latestTests = tests.slice(0, 5);
  const weakest = useMemo(() => [...summary.topic_progress].sort((a, b) => a.value - b.value).slice(0, 4), [summary.topic_progress]);

  return (
    <div className="grid gap-6">
      <PremiumPanel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Student home</p>
            <h1 className="mt-3 text-4xl font-semibold">Bugungi o&apos;qish paneli</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">
              Test ishlash, pack tanlash va xatolardan keyingi o&apos;rganish tavsiyalari.
            </p>
          </div>
          <Link href="/student/tests" className="rounded-2xl bg-[#151713] px-5 py-3 text-sm font-semibold text-white">Test ishlash</Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric icon={BookOpenCheck} label="Ishlangan testlar" value={summary.tests_taken} />
          <Metric icon={BarChart3} label="O'rtacha natija" value={`${summary.average_score}%`} />
          <Metric icon={BookOpenCheck} label="To'g'ri javoblar" value={summary.correct_answers} />
          <Metric icon={TriangleAlert} label="O'rganish kerak" value={weakest.length} />
        </div>
      </PremiumPanel>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <PremiumPanel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Packlar</p>
              <h2 className="mt-2 text-2xl font-semibold">Tayyor test packlar</h2>
            </div>
            <Link href="/student/tests" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]">Hammasi</Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {recommendedPacks.length ? recommendedPacks.map((pack) => (
              <Link key={pack.id} href={`/exam-packs/${pack.slug}`} className="rounded-3xl border border-black/8 bg-white p-5 hover:bg-[#fbfbf6]">
                <PackageCheck className="size-5 text-[#276a5b]" />
                <h3 className="mt-3 text-lg font-semibold">{pack.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/55">{pack.description || pack.exam_type}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{pack.item_count} test / {pack.visibility === "public" ? "ochiq" : "kod bilan"}</p>
              </Link>
            )) : <Empty copy="Hali student uchun ochiq pack yo'q." />}
          </div>
        </PremiumPanel>

        <PremiumPanel>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Xatolar</p>
          <h2 className="mt-2 text-2xl font-semibold">Nimani o&apos;rganish kerak</h2>
          <div className="mt-5 grid gap-3">
            {weakest.length ? weakest.map((topic) => (
              <Link key={topic.slug} href="/student/mistakes" className="rounded-2xl border border-black/8 bg-white p-4 hover:bg-[#fbfbf6]">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{topic.topic}</p>
                  <p className="text-sm font-semibold text-black/55">{topic.value}%</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#ecece3]">
                  <div className="h-2 rounded-full bg-[#276a5b]" style={{ width: `${topic.value}%` }} />
                </div>
              </Link>
            )) : <Empty copy="Hali analiz uchun ishlangan test yo'q." />}
          </div>
        </PremiumPanel>
      </section>

      <PremiumPanel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#276a5b]">Testlar</p>
            <h2 className="mt-2 text-2xl font-semibold">Oxirgi qo&apos;shilgan testlar</h2>
          </div>
          <Link href="/student/tests" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fbfbf6]">Katalog</Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {latestTests.map((test) => (
            <Link key={test.id} href={`/student/tests/${test.slug}`} className="rounded-2xl border border-black/8 bg-white p-4 hover:bg-[#fbfbf6]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{test.subject_slug} / {test.topic_slug}</p>
              <h3 className="mt-2 font-semibold">{test.title}</h3>
              <p className="mt-2 text-sm text-black/52">{test.difficulty} / {test.estimated_minutes} daqiqa / {test.test_questions.length} savol</p>
            </Link>
          ))}
          {!latestTests.length ? <Empty copy="Hali published test yo'q." /> : null}
        </div>
      </PremiumPanel>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof BookOpenCheck; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <Icon className="size-5 text-[#276a5b]" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Empty({ copy }: { copy: string }) {
  return <p className="rounded-2xl border border-dashed border-black/12 bg-white p-5 text-sm text-black/55">{copy}</p>;
}
