import { ArrowRight, Calculator, GraduationCap, Target } from "lucide-react";
import Link from "next/link";

import {
  mathematicsLevels,
  mathematicsSkills,
  mathematicsTests,
} from "@/features/subjects/mathematics/model/mathematics-content";
import { Container } from "@/shared/ui/container";

export function MathematicsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#151713]">
      <Container className="py-8">
        <header className="border-b border-black/10 pb-8">
          <Link href="/" className="text-sm font-semibold text-[#276a5b]">
            QuestLab
          </Link>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#276a5b]">
                Mathematics module
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight">
                Matematikani daraja, topic va test session orqali o&apos;rganish.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62">
                Bu birinchi to&apos;liq fan vertical slice: landingdan matematika
                moduliga o&apos;tiladi, daraja bo&apos;yicha test tanlanadi, test
                ishlanadi va natija review qilinadi.
              </p>
            </div>
            <div className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 sm:grid-cols-3">
              <Metric label="Tests" value={mathematicsTests.length} />
              <Metric label="Levels" value={mathematicsLevels.length} />
              <Metric label="Skills" value={mathematicsSkills.length} />
            </div>
          </div>
        </header>

        <section className="py-8">
          <div className="mb-5 flex items-center gap-2">
            <GraduationCap className="size-5 text-[#276a5b]" />
            <h2 className="text-2xl font-semibold">Darajani tanlang</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {mathematicsLevels.map((level) => {
              const levelTests = mathematicsTests.filter((test) => test.difficulty === level.difficulty);
              const firstTest = levelTests[0];

              return (
                <article key={level.difficulty} className="rounded-lg border border-black/10 bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#276a5b]">
                    {level.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-black/62">{level.copy}</p>
                  <p className="mt-5 text-sm font-medium">{levelTests.length} ta test</p>
                  {firstTest ? (
                    <Link
                      href={`/subjects/mathematics/tests/${firstTest.id}`}
                      className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#151713] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Start {level.title}
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : (
                    <span className="mt-4 inline-block rounded-md border border-black/10 px-4 py-2 text-sm text-black/45">
                      Coming soon
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 pb-8 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="rounded-lg border border-black/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Target className="size-5 text-[#276a5b]" />
              <h2 className="font-semibold">Skill map</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {mathematicsSkills.map((skill) => (
                <span key={skill} className="rounded-md border border-black/10 bg-[#fbfbf8] px-3 py-2 text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </aside>

          <div className="rounded-lg border border-black/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Calculator className="size-5 text-[#276a5b]" />
              <h2 className="font-semibold">Mavjud matematika testlari</h2>
            </div>
            <div className="grid gap-3">
              {mathematicsTests.map((test) => (
                <Link
                  key={test.id}
                  href={`/subjects/mathematics/tests/${test.id}`}
                  className="flex flex-col justify-between gap-3 rounded-md border border-black/10 bg-[#fbfbf8] p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold">{test.title}</p>
                    <p className="mt-1 text-sm text-black/55">
                      {test.category} / {test.difficulty} / {test.estimatedMinutes} min
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#276a5b]">
                    Open test
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-[#f7f7f2] p-4 text-center">
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-black/45">{label}</p>
    </div>
  );
}
