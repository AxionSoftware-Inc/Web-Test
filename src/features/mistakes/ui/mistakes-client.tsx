"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { ApiMistakesSummary } from "@/shared/api/questlab-api";
import { questApi } from "@/shared/api/questlab-api";
import { getStudentCode } from "@/shared/model/local-identity";
import { LatexText } from "@/shared/ui/latex-text";

export function MistakesClient({ initialSummary }: { initialSummary: ApiMistakesSummary }) {
  const [summary, setSummary] = useState(initialSummary);

  useEffect(() => {
    let cancelled = false;
    questApi.mistakesSummary(getStudentCode()).then((next) => {
      if (!cancelled) setSummary(next);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f7ef] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[28px] border border-black/8 bg-white/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">Mistake bank</p>
          <h1 className="mt-2 text-4xl font-semibold">Xatolar va weak skills</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">
            Shu browserdagi student code bo&apos;yicha submitted testlardan noto&apos;g&apos;ri savollar va skill zaifliklari yig&apos;iladi.
          </p>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-[28px] border border-black/8 bg-[#151713] p-5 text-white">
            <h2 className="text-2xl font-semibold">Weak skills</h2>
            <div className="mt-4 grid gap-3">
              {summary.weak_skills.length ? summary.weak_skills.map((skill) => (
                <div key={skill.skill} className="rounded-2xl bg-white/8 p-4">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{skill.skill}</span>
                    <span>{skill.percent}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/12">
                    <div className="h-2 rounded-full bg-[#8fd6bd]" style={{ width: `${skill.percent}%` }} />
                  </div>
                </div>
              )) : <p className="text-sm text-white/65">Hali skill data yo&apos;q.</p>}
            </div>
          </aside>

          <section className="rounded-[28px] border border-black/8 bg-white/70 p-5">
            <h2 className="text-2xl font-semibold">Wrong questions</h2>
            <div className="mt-4 grid gap-3">
              {summary.mistakes.map((mistake) => (
                <Link key={`${mistake.session_id}-${mistake.question_id}`} href={`/results/${mistake.session_id}/questions/${mistake.question_id}`} className="rounded-2xl border border-black/8 bg-white p-4 hover:bg-[#fbfbf8]">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">{mistake.test_title} / {mistake.topic}</p>
                  <div className="mt-2 font-semibold"><LatexText text={mistake.prompt} /></div>
                  <p className="mt-3 text-sm text-black/55">Your answer: {mistake.user_answer || "Skipped"}</p>
                </Link>
              ))}
              {!summary.mistakes.length ? <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Bu student uchun hali mistake yo&apos;q.</p> : null}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
