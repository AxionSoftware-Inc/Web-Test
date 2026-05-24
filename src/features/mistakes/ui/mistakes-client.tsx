"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpenCheck, TriangleAlert } from "lucide-react";

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
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[28px] border border-black/8 bg-white/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/40">Xatolar analizi</p>
          <h1 className="mt-2 text-4xl font-semibold">Qaysi joyni o&apos;rganish kerak?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">
            O&apos;zingiz ishlagan submitted testlardan noto&apos;g&apos;ri javoblar, skill zaifliklari va keyingi o&apos;rganish yo&apos;nalishi hisoblanadi.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Stat icon={TriangleAlert} label="Xatolar" value={summary.mistakes.length} />
            <Stat icon={BookOpenCheck} label="Zaif skilllar" value={summary.weak_skills.length} />
            <Stat icon={BookOpenCheck} label="Eng past skill" value={summary.weak_skills[0]?.percent !== undefined ? `${summary.weak_skills[0].percent}%` : "yo'q"} />
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-[28px] border border-black/8 bg-ink p-5 text-white">
            <h2 className="text-2xl font-semibold">O&apos;rganish kerak bo&apos;lgan skilllar</h2>
            <div className="mt-4 grid gap-3">
              {summary.weak_skills.length ? summary.weak_skills.map((skill) => (
                <div key={skill.skill} className="rounded-2xl bg-white/8 p-4">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{skill.skill}</span>
                    <span>{skill.percent}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/12">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${skill.percent}%` }} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/62">
                    {skill.percent < 50 ? "Avval asosiy tushunchani qayta o'rganing, keyin shu skill bo'yicha oson testdan boshlang." : "Xatolarni ko'rib chiqing va shu skill bo'yicha qayta mashq qiling."}
                  </p>
                </div>
              )) : <p className="text-sm text-white/65">Hali analiz uchun ishlangan test yo&apos;q.</p>}
            </div>
          </aside>

          <section className="rounded-[28px] border border-black/8 bg-white/70 p-5">
            <h2 className="text-2xl font-semibold">Noto&apos;g&apos;ri savollar</h2>
            <div className="mt-4 grid gap-3">
              {summary.mistakes.map((mistake) => (
                <Link key={`${mistake.session_id}-${mistake.question_id}`} href={`/results/${mistake.session_id}/questions/${mistake.question_id}`} className="rounded-2xl border border-black/8 bg-white p-4 hover:bg-surface-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/40">{mistake.test_title} / {mistake.topic}</p>
                  <div className="mt-2 font-semibold"><LatexText text={mistake.prompt} /></div>
                  <div className="mt-3 grid gap-2 text-sm text-black/58">
                    <p><span className="font-semibold text-black/75">Sizning javob:</span> {mistake.user_answer || "Tashlab ketilgan"}</p>
                    <p><span className="font-semibold text-black/75">To&apos;g&apos;ri javob:</span> {mistake.correct_answer}</p>
                    {mistake.skills.length ? <p><span className="font-semibold text-black/75">Skill:</span> {mistake.skills.join(", ")}</p> : null}
                  </div>
                  {mistake.explanation ? <div className="mt-3 rounded-2xl bg-surface-soft p-3 text-sm leading-6 text-black/62"><LatexText text={mistake.explanation} /></div> : null}
                </Link>
              ))}
              {!summary.mistakes.length ? <p className="rounded-2xl bg-white p-5 text-sm text-black/56">Bu student uchun hali xato topilmadi. Avval test ishlab submit qiling.</p> : null}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof BookOpenCheck; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <Icon className="size-5 text-brand" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-black/38">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
